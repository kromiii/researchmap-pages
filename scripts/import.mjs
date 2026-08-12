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

async function main() {
  const inputArg = process.argv[2];
  let srcFile = inputArg;

  if (!srcFile) {
    if (fs.existsSync(targetJsonl)) {
      srcFile = targetJsonl;
      console.log(`No input file provided. Using existing ${targetJsonl}`);
    } else {
      console.error("Usage: npm run import <path-to-researchmap-export.jsonl>");
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

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const parsed = JSON.parse(line);
      const type = parsed.insert?.type;
      if (type === "researchers") {
        profile = parsed.merge;
      } else if (type) {
        itemCount++;
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

  if (path.resolve(srcFile) !== path.resolve(targetJsonl)) {
    fs.copyFileSync(srcFile, targetJsonl);
    console.log(`Saved JSONL to: ${targetJsonl}`);
  }

  const name =
    `${profile.family_name?.ja ?? ""} ${profile.given_name?.ja ?? ""}`.trim();
  console.log(`Imported profile for ${name} (${itemCount} achievement items)`);

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
