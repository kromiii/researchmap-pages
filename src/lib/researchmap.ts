import { env } from "cloudflare:workers";

const API_BASE = "https://api.researchmap.jp";
const PAGE_LIMIT = 100;
const REQUEST_INTERVAL_MS = 300;

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "researchmap-pages worker" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`researchmap API ${res.status}: ${url}`);
  return res.json();
}

/** Fetch every item of one achievement type, following pagination. */
async function fetchAllItems(permalink: string, type: string): Promise<any[]> {
  const items: any[] = [];
  let start = 1;
  for (;;) {
    const page = await getJson(
      `${API_BASE}/${permalink}/${type}?format=json&limit=${PAGE_LIMIT}&start=${start}`,
    );
    const pageItems: any[] = page.items ?? [];
    items.push(...pageItems);
    const total: number = page.total_items ?? items.length;
    if (!pageItems.length || items.length >= total) return items;
    start += pageItems.length;
    await sleep(REQUEST_INTERVAL_MS);
  }
}

/** Fetch the full researcher profile from the researchmap API. */
async function fetchResearcher(permalink: string): Promise<Researcher> {
  const profile = await getJson(`${API_BASE}/${permalink}?format=json`);
  const graph: any[] = profile["@graph"] ?? [];
  delete profile["@graph"];
  const sections: Record<string, any[]> = {};
  for (const g of graph) {
    const type: string = g["@type"];
    const embedded: any[] = g.items ?? [];
    if (embedded.length >= (g.total_items ?? embedded.length)) {
      // The profile response already has every item for this section.
      sections[type] = embedded;
    } else {
      // Long sections are truncated in the profile response; re-fetch in full.
      await sleep(REQUEST_INTERVAL_MS);
      sections[type] = await fetchAllItems(permalink, type);
    }
    console.log(`  researchmap: ${type} — ${sections[type].length} items`);
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
