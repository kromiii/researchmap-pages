/* global console, fetch */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { Buffer } from "node:buffer";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const targetJsonl = path.join(dataDir, "researchmap.jsonl");
const publicDir = path.join(rootDir, "public");
const targetAvatar = path.join(publicDir, "avatar.jpg");

function sanitizeValue(value) {
  if (!value || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value
      .filter((item) => {
        if (
          item &&
          typeof item === "object" &&
          item.display &&
          item.display !== "disclosed"
        ) {
          return false;
        }
        return true;
      })
      .map((item) => sanitizeValue(item));
  }

  if (value.display && value.display !== "disclosed") {
    return undefined;
  }

  const cleaned = {};
  for (const [key, val] of Object.entries(value)) {
    const sanitizedVal = sanitizeValue(val);
    if (sanitizedVal !== undefined) {
      cleaned[key] = sanitizedVal;
    }
  }
  return cleaned;
}

async function main() {
  const inputArg = process.argv[2];
  let srcFile = inputArg;

  if (!srcFile) {
    if (fs.existsSync(targetJsonl)) {
      srcFile = targetJsonl;
      console.log(`No input file provided. Using existing ${targetJsonl}`);
    } else {
      console.error(
        "Usage: npm run import <path-to-researchmap-export.jsonl>",
      );
      process.exit(1);
    }
  }

  if (!fs.existsSync(srcFile)) {
    console.error(`File not found: ${srcFile}`);
    process.exit(1);
  }

  console.log(`Reading researchmap JSONL from: ${srcFile}`);
  const content = fs.readFileSync(srcFile, "utf-8");
  const lines = content.trim().split("\n");

  let profile = null;
  let itemCount = 0;
  let filteredCount = 0;
  const filteredLines = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      const type = parsed.insert?.type;
      const merge = parsed.merge;

      if (type === "researchers") {
        if (merge?.display && merge.display !== "disclosed") {
          console.error("Profile is not marked as disclosed.");
          process.exit(1);
        }
        const cleanedMerge = sanitizeValue(merge);
        profile = cleanedMerge;
        filteredLines.push(JSON.stringify({ ...parsed, merge: cleanedMerge }));
      } else if (type) {
        if (merge?.display && merge.display !== "disclosed") {
          filteredCount++;
          continue;
        }
        const cleanedMerge = sanitizeValue(merge);
        itemCount++;
        filteredLines.push(JSON.stringify({ ...parsed, merge: cleanedMerge }));
      }
    } catch {
      // skip invalid lines
    }
  }

  if (!profile) {
    console.error(
      "Invalid researchmap JSONL file: 'researchers' profile record not found.",
    );
    process.exit(1);
  }

  fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(targetJsonl, filteredLines.join("\n") + "\n", "utf-8");
  console.log(`Saved sanitized disclosed data to: ${targetJsonl}`);
  if (filteredCount > 0) {
    console.log(
      `Filtered out ${filteredCount} non-disclosed item(s) for privacy.`,
    );
  }

  const name =
    `${profile.family_name?.ja ?? ""} ${profile.given_name?.ja ?? ""}`.trim();
  console.log(
    `Imported profile for ${name} (${itemCount} disclosed achievement items)`,
  );

  if (profile.image) {
    console.log(`Downloading avatar image from ${profile.image}...`);
    try {
      const res = await fetch(profile.image, {
        headers: { "User-Agent": "researchmap-pages import script" },
      });
      if (res.ok) {
        fs.mkdirSync(publicDir, { recursive: true });
        const arrayBuffer = await res.arrayBuffer();
        fs.writeFileSync(targetAvatar, Buffer.from(arrayBuffer));
        console.log(`Saved avatar image to: ${targetAvatar}`);
      } else {
        console.warn(
          `Failed to fetch avatar image (${res.status} ${res.statusText})`,
        );
      }
    } catch (e) {
      console.warn(`Failed to download avatar image: ${e.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

