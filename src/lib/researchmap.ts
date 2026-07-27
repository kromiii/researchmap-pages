import config from "../../config.json";

const API_BASE = "https://api.researchmap.jp";
const PAGE_LIMIT = 100;
const REQUEST_INTERVAL_MS = 300;

export const permalink: string =
  process.env.RESEARCHMAP_PERMALINK || config.permalink;

export interface Researcher {
  profile: Record<string, any>;
  sections: Record<string, any[]>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { "User-Agent": "researchmap-pages builder" },
  });
  if (!res.ok) throw new Error(`researchmap API ${res.status}: ${url}`);
  return res.json();
}

/** Fetch every item of one achievement type, following pagination. */
async function fetchAllItems(type: string): Promise<any[]> {
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

let cache: Promise<Researcher> | undefined;

/** Fetch the full researcher profile once per build (memoized). */
export function getResearcher(): Promise<Researcher> {
  cache ??= (async () => {
    const profile = await getJson(`${API_BASE}/${permalink}?format=json`);
    // The embedded @graph truncates long sections, so re-fetch each type in full.
    const types: string[] = (profile["@graph"] ?? []).map(
      (g: any) => g["@type"],
    );
    delete profile["@graph"];
    const sections: Record<string, any[]> = {};
    for (const type of types) {
      await sleep(REQUEST_INTERVAL_MS);
      sections[type] = await fetchAllItems(type);
      console.log(`  researchmap: ${type} — ${sections[type].length} items`);
    }
    return { profile, sections };
  })();
  return cache;
}
