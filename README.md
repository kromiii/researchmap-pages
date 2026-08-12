# researchmap-pages

[researchmap](https://researchmap.jp/) のエクスポートデータ (JSONL) から研究者向け個人サイトを生成する [Astro](https://astro.build/) テンプレートです。Cloudflare Pages、GitHub Pages、Vercel などお好みの静的ホスティングで配信できます。

デモ: https://kromiii.info

## 特徴

- **researchmap が Single Source of Truth** — エクスポートした JSONL ファイルを取り込むだけで美しい研究者サイトを自動生成
- **高速な静的サイト (SSG)** — プリレンダリングされた HTML を返すため高速で SEO・OGP に強い
- **マルチ言語・レスポンシブ** — 日本語 / 英語の2ページ、直近90日の新着ハイライト、タブ UI、ダークモード対応
- **非公開データの自動保護** — 非公開・限定公開データを除外して静的 HTML を生成
- **簡単取り込み** — `npm run import <jsonl>` 1コマンドで業績データとアバター画像を自動でセットアップ

## セットアップとデプロイ

1. **Use this template** から自分のリポジトリを作成し、ローカルにクローンします。

   > [!IMPORTANT]
   > researchmap のエクスポート JSONL には連絡先等の非公開情報が含まれる場合があるため、リポジトリは **Private (非公開)** で作成してください。

   ```sh
   npm install
   ```

2. **researchmap からデータをエクスポートする**
   - researchmap にログインし、「データ管理・エクスポート」から業績データを JSONL 形式でダウンロードします。

3. **データをプロジェクトに取り込む**

   ```sh
   npm run import /path/to/rm_researchers2026XXXX.jsonl
   ```

   このコマンドにより、`data/researchmap.jsonl` への保存およびアバター画像 (`public/avatar.jpg`) の自動取得が行われます。

4. **ローカルで確認する**

   ```sh
   npm run dev
   ```

   `http://localhost:4321` を開き、サイトを確認します。

5. **`astro.config.mjs` の `site` を公開 URL に変更する**

6. **データをコミットして push する**

   ```sh
   git add -f data/researchmap.jsonl public/avatar.jpg
   git commit -m "Add researchmap data"
   git push
   ```

7. **デプロイ (Cloudflare Pages 等の Git 連携)**
   Cloudflare Pages や Vercel などのダッシュボードから、対象の GitHub リポジトリを選択して接続します。
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - 以降は `git push` するだけで自動でビルド・デプロイされます。

## 主なファイル

| ファイル                        | 役割                                               |
| ------------------------------- | -------------------------------------------------- |
| `scripts/import.mjs`            | JSONL エクスポートファイルの取り込み・アバター取得 |
| `data/researchmap.jsonl`        | 取り込まれた研究者データ (JSONL・Git非追跡)        |
| `data/researchmap.sample.jsonl` | テンプレート動作確認用サンプルデータ               |
| `src/lib/researchmap.ts`        | JSONL パースおよび研究者データのロード             |
| `src/lib/view.ts`               | 表示用データへの変換・タブ構成・新着抽出           |
| `src/components/Page.astro`     | ページ本体のテンプレートとタブ切り替え             |

## License

[MIT](LICENSE)
