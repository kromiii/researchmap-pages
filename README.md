# researchmap-pages

[researchmap](https://researchmap.jp/) のエクスポートデータ (JSONL) から研究者向け個人サイトを生成する [Astro](https://astro.build/) テンプレートです。Cloudflare Pages、GitHub Pages、Vercel などお好みの静的ホスティングで配信できます。

デモ: https://kromiii.info

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

   このコマンドにより、エクスポートデータから非公開・限定公開（`display !== "disclosed"`）の項目および非公開プロフィール情報が自動的に除去され、**公開データのみにサニタイズされた `data/researchmap.jsonl`** の保存とアバター画像 (`public/avatar.jpg`) の自動取得が行われます。

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

7. **デプロイ**

   お好みのホスティングサービスに合わせてデプロイします。

   #### Cloudflare Pages / Vercel を使う場合
   Cloudflare Pages や Vercel のダッシュボードから、対象の GitHub リポジトリを選択して接続します。
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - 以降は `git push` するだけで自動でビルド・デプロイされます。

   #### GitHub Pages を使う場合
   > [!NOTE]
   > **プライベートリポジトリと GitHub Pages の制限**  
   > GitHub Free（無料プラン）の場合、Private リポジトリでの GitHub Pages 配信は行えません（Public リポジトリにするか、GitHub Pro 等が必要です）。なお、`npm run import` により非公開情報は自動的に除去されるため Public リポジトリでも安全に利用できます。

   1. リポジトリの **Settings** > **Pages** > **Build and deployment** に移動し、**Source** を `GitHub Actions` に変更します。
   2. `.github/workflows/deploy.yml` などのワークフローファイルを作成し、GitHub Actions で自動デプロイを構成します（詳細は [Astro 公式 GitHub Pages デプロイガイド](https://docs.astro.build/ja/guides/deploy/github/) を参照してください）。

## テンプレートの更新を取り込む方法

本テンプレートリポジトリ（親リポジトリ）に新機能や修正が追加された場合、作成した自分のリポジトリに以下の手順で最新の変更を取り込むことができます。

1. **親リポジトリを `upstream` リモートとして追加する (初回のみ)**

   ```sh
   git remote add upstream https://github.com/kromiii/researchmap-pages.git
   ```

2. **親リポジトリの最新変更を取得してマージする**

   ```sh
   git fetch upstream
   git merge upstream/main --allow-unrelated-histories
   ```

   _(※ 2回目以降のマージは `--allow-unrelated-histories` オプションなしの `git merge upstream/main` のみでマージ可能です。)_

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
