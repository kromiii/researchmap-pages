# researchmap-pages

[researchmap](https://researchmap.jp/) のエクスポートデータ (JSONL) から研究者向け個人サイトを生成する [Astro](https://astro.build/) テンプレートです。Cloudflare Pages、GitHub Pages、Vercel などお好みの静的ホスティングで配信できます。

デモ: https://kromiii.info

## セットアップとデプロイ

1. **Use this template** から自分のリポジトリを作成し、ローカルにクローンします。

   ```sh
   npm install
   ```

   > [!NOTE]
   > 取り込んだデータ (`data/researchmap.jsonl`, `public/avatar.jpg`) は `.gitignore` により Git リポジトリにはコミットされません。そのため、リポジトリ自体は Public / Private どちらでも問題なく管理できます。

2. **researchmap からデータをエクスポートする**
   - researchmap にログインし、「データ管理・エクスポート」から業績データを JSONL 形式でダウンロードします。

3. **データをプロジェクトに取り込む**

   ```sh
   npm run import /path/to/rm_researchers2026XXXX.jsonl
   ```

   このコマンドにより、エクスポートデータから非公開・限定公開（`display !== "disclosed"`）の項目および非公開プロフィール情報が自動的に除去され、**公開データのみにサニタイズされた `data/researchmap.jsonl`** の保存とアバター画像 (`public/avatar.jpg`) の自動取得が行われます。

4. **`astro.config.mjs` の `site` を公開 URL に変更する**

   `astro.config.mjs` を開き、`site` をご自身の公開 URL（例: `https://your-site.pages.dev`）に変更します。

5. **ローカルで確認する**

   ```sh
   npm run dev
   ```

   `http://localhost:4321` を開き、サイトの表示を確認します。

6. **ビルドしてデプロイする**

   手元で静的ビルドを行い、生成された `dist/` をローカルから直接ホスティングサービスにアップロードしてデプロイします。

   #### Cloudflare Pages を使う場合（推奨）

   ```sh
   npm run build
   npm run deploy
   ```

   _(※ `npm run deploy` は内部で `wrangler pages deploy dist` を実行します)_

   - 初回実行時は Cloudflare へのログイン認証とプロジェクト名の指定が案内されます（事前に `npx wrangler pages project create <プロジェクト名>` で作成しておくことも可能です）。
   - Cloudflare のダッシュボードにある「Pages」>「Direct Upload（直接アップロード）」から `dist/` フォルダをドラッグ＆ドロップしてデプロイすることもできます。

   #### その他のホスティングサービスを使う場合

   手元で `npm run build` を実行後、生成された `dist/` ディレクトリを各サービスの CLI または管理画面からアップロードします。

   - **Netlify**: `npx netlify deploy --prod --dir=dist`（または管理画面で `dist` をドラッグ＆ドロップ）
   - **Vercel**: `npx vercel --prod`
   - **AWS S3 / 各種静的ホスティング**: `dist/` 配下の静的ファイルを同期・アップロード

---

### 独自ドメイン（カスタムドメイン）の設定方法

1. **`astro.config.mjs` の `site` を独自ドメインに変更する**

   ```js
   export default defineConfig({
     site: "https://your-domain.com", // 独自ドメインを指定
     output: "static",
   });
   ```

2. **Cloudflare Pages でドメインを設定する**
   - Cloudflare ダッシュボードで対象の Pages プロジェクトを開きます。
   - **「Custom domains（カスタムドメイン）」** タブ > **「Set up a custom domain（カスタムドメインを設定）」** をクリックします。
   - 設定したいドメイン名（例: `your-domain.com` や `sub.your-domain.com`）を入力します。
   - **DNS 設定**:
     - Cloudflare でドメインを管理している場合は、DNS レコードが自動追加されます。
     - 他社（お名前.com, Route 53 等）で管理している場合は、指示に従って `xxx.pages.dev` への CNAME レコードを DNS に登録します。
   - SSL 証明書は Cloudflare により自動で即時発行されます。

3. **再ビルドしてデプロイする**
   ```sh
   npm run build
   npm run deploy
   ```

---

### 業績データの更新方法

researchmap で業績を更新した際は、エクスポートした新しい JSONL ファイルを使って再度取り込みとデプロイを行うだけでサイトが更新されます。

```sh
npm run import /path/to/rm_researchers2026XXXX.jsonl
npm run build
npm run deploy
```

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

## License

[MIT](LICENSE)
