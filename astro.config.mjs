import { defineConfig } from "astro/config";

// GitHub Actions 上では site / base をリポジトリ名から自動決定する。
// <owner>.github.io ならユーザーサイト（base: /）、それ以外はプロジェクトサイト（base: /<repo>）。
const repo = process.env.GITHUB_REPOSITORY;
let site;
let base = "/";
if (repo) {
  const [owner, name] = repo.split("/");
  if (name.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
    site = `https://${name}`;
  } else {
    site = `https://${owner}.github.io`;
    base = `/${name}`;
  }
}

export default defineConfig({ site, base });
