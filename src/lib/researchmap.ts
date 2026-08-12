/* eslint-disable @typescript-eslint/no-explicit-any --
   researchmap's JSON-LD shape differs per section and changes without notice;
   we deliberately don't model it and treat it as untyped at this boundary. */

import fs from "node:fs";
import path from "node:path";

export interface Researcher {
  profile: Record<string, any>;
  sections: Record<string, any[]>;
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

/**
 * Researcher data for site generation.
 * Loads from `data/researchmap.jsonl` or fallback `data/researchmap.sample.jsonl`.
 */
export async function getResearcher(): Promise<Researcher> {
  const jsonlData = getResearcherFromJsonl();
  if (jsonlData) {
    return jsonlData;
  }

  throw new Error(
    "No researchmap data found. Please run 'npm run import <path-to-jsonl>' or place your export file at 'data/researchmap.jsonl'.",
  );
}
