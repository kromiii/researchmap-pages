/* eslint-disable @typescript-eslint/no-explicit-any --
   researchmap's JSON-LD shape differs per section and changes without notice;
   we deliberately don't model it and treat it as untyped at this boundary. */

import fs from "node:fs";
import path from "node:path";
import { env } from "cloudflare:workers";

const API_BASE = "https://api.researchmap.jp";
const PAGE_LIMIT = 1000;
const MAX_AGE_MS = 1 * 60 * 60 * 1000;

const KV_KEY = "researcher:v1";
const AVATAR_KEY = "avatar:v1";

export interface Researcher {
  profile: Record<string, any>;
  sections: Record<string, any[]>;
}

interface CachedResearcher {
  fetchedAt: number;
  data: Researcher;
}

export function parseJsonl(content: string): Researcher {
  let profile: Record<string, any> = {};
  const sections: Record<string, any[]> = {};
  const lines = content.trim().split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      const type = parsed.insert?.type;
      const merge = parsed.merge || {};
      if (type === "researchers") {
        profile = merge;
      } else if (type) {
        if (merge.display && merge.display !== "disclosed") {
          continue;
        }
        if (!sections[type]) sections[type] = [];
        sections[type].push(merge);
      }
    } catch {
      // Ignore invalid JSON lines
    }
  }

  return { profile, sections };
}

export function getResearcherFromJsonl(): Researcher | null {
  const jsonlPath = path.join(process.cwd(), "data", "researchmap.jsonl");
  const samplePath = path.join(
    process.cwd(),
    "data",
    "researchmap.sample.jsonl",
  );

  let targetPath: string | null = null;
  if (fs.existsSync(jsonlPath)) {
    targetPath = jsonlPath;
  } else if (fs.existsSync(samplePath)) {
    targetPath = samplePath;
  }

  if (!targetPath) return null;
  const content = fs.readFileSync(targetPath, "utf-8");
  return parseJsonl(content);
}

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "researchmap-pages worker" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`researchmap API ${res.status}: ${url}`);
  return res.json();
}

async function fetchResearcher(permalink: string): Promise<Researcher> {
  const profile = await getJson(
    `${API_BASE}/${permalink}?format=json&limit=${PAGE_LIMIT}`,
  );
  const graph: any[] = profile["@graph"] ?? [];
  delete profile["@graph"];
  const sections: Record<string, any[]> = {};
  for (const g of graph) {
    sections[g["@type"]] = g.items ?? [];
  }
  return { profile, sections };
}

async function refresh(
  kv: KVNamespace,
  permalink: string,
): Promise<Researcher> {
  const data = await fetchResearcher(permalink);
  const cached: CachedResearcher = { fetchedAt: Date.now(), data };
  await kv.put(KV_KEY, JSON.stringify(cached));
  try {
    await refreshAvatar(kv, data.profile.image);
  } catch (e) {
    console.error("avatar refresh failed:", e);
  }
  return data;
}

async function refreshAvatar(kv: KVNamespace, imageUrl?: string) {
  if (!imageUrl) {
    await kv.delete(AVATAR_KEY);
    return;
  }
  const res = await fetch(imageUrl, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) return;
  await kv.put(AVATAR_KEY, await res.arrayBuffer(), {
    metadata: {
      contentType: res.headers.get("content-type") ?? "image/jpeg",
    },
  });
}

/**
 * Researcher data for one request.
 * Prioritizes local `data/researchmap.jsonl` export file if present.
 * Falls back to KV caching / API fetch if KV binding is available.
 */
export async function getResearcher(
  ctx?: ExecutionContext,
): Promise<Researcher> {
  const jsonlData = getResearcherFromJsonl();
  if (jsonlData) {
    return jsonlData;
  }

  try {
    const kv = env.RESEARCHMAP;
    const permalink = env.RESEARCHMAP_PERMALINK;
    if (kv && permalink) {
      const cached = await kv.get<CachedResearcher>(KV_KEY, "json");
      if (cached) {
        if (Date.now() - cached.fetchedAt > MAX_AGE_MS && ctx) {
          ctx.waitUntil(
            refresh(kv, permalink).catch((e) =>
              console.error("researchmap refresh failed:", e),
            ),
          );
        }
        return cached.data;
      }
      return refresh(kv, permalink);
    }
  } catch {
    // KV environment variable not present or not running in Worker
  }

  throw new Error(
    "No researchmap data found. Please run 'npm run import <path-to-jsonl>' or place your export file at 'data/researchmap.jsonl'.",
  );
}

/** Avatar bytes cached in public/ or KV, or null if not available. */
export async function getAvatar(): Promise<{
  bytes: ArrayBuffer;
  contentType: string;
} | null> {
  const localAvatar = path.join(process.cwd(), "public", "avatar.jpg");
  if (fs.existsSync(localAvatar)) {
    const buffer = fs.readFileSync(localAvatar);
    return {
      bytes: buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength,
      ) as ArrayBuffer,
      contentType: "image/jpeg",
    };
  }

  try {
    const kv = env.RESEARCHMAP;
    if (kv) {
      const { value, metadata } = await kv.getWithMetadata<{
        contentType: string;
      }>(AVATAR_KEY, "arrayBuffer");
      if (value) {
        return {
          bytes: value,
          contentType: metadata?.contentType ?? "image/jpeg",
        };
      }
    }
  } catch {
    // ignore
  }

  return null;
}
