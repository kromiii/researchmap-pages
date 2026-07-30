import { env } from "cloudflare:workers";

const API_BASE = "https://api.researchmap.jp";
// researchmap API の limit パラメータの最大値。プロフィール取得時にこれを
// 指定すると、業績数が 1000 件以下(通常はこれで十分)のセクションは
// この 1 回のリクエストだけで全件揃う。
const PAGE_LIMIT = 1000;

// KV のデータがこれより古いと、キャッシュを返しつつバックグラウンドで再取得する
// (stale-while-revalidate)。researchmap API が落ちていても古いデータで表示は継続する。
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

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "researchmap-pages worker" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`researchmap API ${res.status}: ${url}`);
  return res.json();
}

/** Fetch the full researcher profile from the researchmap API, in a single request. */
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

/** Re-fetch everything from researchmap and store it in KV. */
async function refresh(kv: KVNamespace, permalink: string): Promise<Researcher> {
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

/** Download the avatar into KV so the site does not hotlink researchmap. */
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
 * Researcher data for one request. Served from KV; when the cached copy is
 * older than MAX_AGE_MS the stale copy is returned immediately and a refresh
 * runs in the background via waitUntil. Only the very first request after
 * the KV namespace is created pays the full fetch latency.
 */
export async function getResearcher(ctx: ExecutionContext): Promise<Researcher> {
  const kv = env.RESEARCHMAP;
  const permalink = env.RESEARCHMAP_PERMALINK;
  const cached = await kv.get<CachedResearcher>(KV_KEY, "json");
  if (cached) {
    if (Date.now() - cached.fetchedAt > MAX_AGE_MS) {
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

/** Avatar bytes cached in KV, or null if not (yet) available. */
export async function getAvatar(): Promise<{ bytes: ArrayBuffer; contentType: string } | null> {
  const kv = env.RESEARCHMAP;
  const { value, metadata } = await kv.getWithMetadata<{
    contentType: string;
  }>(AVATAR_KEY, "arrayBuffer");
  if (!value) return null;
  return { bytes: value, contentType: metadata?.contentType ?? "image/jpeg" };
}
