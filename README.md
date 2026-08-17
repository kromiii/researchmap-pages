# researchmap-pages

[researchmap](https://researchmap.jp/) のエクスポートデータ (JSONL) から研究者向け個人サイトを生成する [Astro](https://astro.build/) テンプレートです。Cloudflare Pages、GitHub Pages、Vercel などお好みの静的ホスティングで配信できます。

デモサイト: https://kromiii.info

---

## セットアップとデプロイ手順

### 1. リポジトリの作成とインストール

1. GitHub 右上の **「Use this template」**（または「Create a new repository」）をクリックして、ご自身のアカウントに新しいリポジトリを作成します。
2. 作成したリポジトリをローカルにクローンし、依存パッケージをインストールします。

```sh
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
npm install
```

> [!TIP]
> リポジトリには初期状態でサンプルデータが含まれているため、この時点で `npm run dev` を実行するとブラウザ（`http://localhost:4321`）でデモ表示を確認できます。

> [!NOTE]
> 取り込んだデータ (`data/researchmap.jsonl`, `public/avatar.jpg`) は `.gitignore` により Git リポジトリにはコミットされません。そのため、リポジトリ自体は Public / Private どちらでも安全に管理できます。

---

### 2. researchmap からデータをエクスポートする

1. [researchmap](https://researchmap.jp/) にログインします。
2. 右上の設定・管理メニューから **「データ管理・エクスポート」** を開きます。
3. **「エクスポート」** タブを開き、データ形式として **JSONL** を選択してダウンロードします（`rm_researchersYYYYMMDD_XXXXXX.jsonl` のようなファイルが保存されます）。

---

### 3. データをプロジェクトに取り込む

ダウンロードした JSONL ファイルのパスを指定してインポートコマンドを実行します。

```sh
npm run import /path/to/rm_researchersYYYYMMDD_XXXXXX.jsonl
```

- **自動サニタイズ**: 非公開・限定公開（`display !== "disclosed"`）の項目および非公開プロフィール情報を自動で除外した公開専用データ `data/researchmap.jsonl` を生成・保存します。
- **アバター画像の自動取得**: researchmap にプロフィール画像が登録されている場合、自動で `public/avatar.jpg` にダウンロードされます。（※未登録の場合や別の画像を使いたい場合は、正方形の画像ファイルを `public/avatar.jpg` に手動配置してください）

---

### 4. 設定ファイルを変更する

ご自身の公開環境に合わせて以下の設定ファイルを編集します。

#### ① `wrangler.json` (Cloudflare Pages プロジェクト名)

Cloudflare Pages を利用する場合、プロジェクト名を任意の名前に変更します（英数字とハイフン）。
※ この名前が初期の公開 URL（`https://<name>.pages.dev`）になります。

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "your-project-name",
  "pages_build_output_dir": "dist",
  "compatibility_date": "2026-08-14"
}
```

#### ② `astro.config.mjs` (サイト公開 URL)

OGP画像や正規化URL（`canonical`）、サイトマップ生成に使用される `site` URL を、ご自身の公開 URL に変更します。

```js
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://your-project-name.pages.dev", // または独自ドメイン
  output: "static",
  integrations: [sitemap()],
});
```

---

### 5. ローカルで確認する

```sh
npm run dev
```

ブラウザで `http://localhost:4321` を開き、自身のプロフィールや業績データが正しく反映されているか確認します。

---

### 6. ビルドしてデプロイする

ローカルで静的ビルドを行い、生成された `dist/` ディレクトリをホスティングサービスにデプロイします。

#### Cloudflare Pages を使う場合（推奨）

```sh
npm run build
npm run deploy
```

_(※ `npm run deploy` は内部で `wrangler pages deploy dist` を実行します)_

- **初回実行時**: ブラウザで Cloudflare へのログイン認証画面が開きます。認証完了後、`wrangler.json` で指定したプロジェクト宛にデプロイ・公開されます。
- 事前に CLI でプロジェクトを作成しておく場合は `npx wrangler pages project create <プロジェクト名>` を実行できます。
- Cloudflare ダッシュボードの「Pages」>「Direct Upload（直接アップロード）」から `dist/` フォルダをドラッグ＆ドロップしてデプロイすることも可能です。

#### その他のホスティングサービスを使う場合

手元で `npm run build` を実行後、生成された `dist/` ディレクトリを各サービスの CLI または管理画面からアップロードします。

- **Netlify**: `npx netlify deploy --prod --dir=dist`（または管理画面で `dist` をドラッグ＆ドロップ）
- **Vercel**: `npx vercel --prod`
- **GitHub Pages**: `dist` の内容を `gh-pages` ブランチ等にデプロイ
  _(※ サブディレクトリ `https://<user>.github.io/<repo>/` で公開する場合は、`astro.config.mjs` に `base: "/<repo>"` を設定してください)_

---

## 応用・カスタマイズ

### 独自ドメイン（カスタムドメイン）の設定方法

1. **`astro.config.mjs` の `site` を独自ドメインに変更する**

   ```js
   import { defineConfig } from "astro/config";
   import sitemap from "@astrojs/sitemap";

   export default defineConfig({
     site: "https://your-domain.com", // 独自ドメインを指定
     output: "static",
     integrations: [sitemap()],
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
npm run import /path/to/rm_researchersYYYYMMDD_XXXXXX.jsonl
npm run build
npm run deploy
```

---

### アバター画像・ファビコン（アイコン）の変更

- **アバター画像**: researchmap に写真が登録されていない場合や、別の写真・イラストを使用したい場合は、正方形の画像ファイルを `public/avatar.jpg` に配置してビルド・デプロイしてください。
- **ファビコン（アイコン）**: デフォルトで学術・書籍をモチーフにしたダークモード対応の汎用 SVG アイコン（`public/favicon.svg`）が設定されています。オリジナルのアイコンに変更したい場合は、`public/favicon.svg` をお好みの画像・SVG ファイルに置き換えてください。

---

### 英語版（英語ページ）の有効化

デフォルトでは日本語単一ページとしてビルドされ、ヘッダーの言語切り替えボタンも非表示になります。

英語版（`/en/`）を有効にしたい場合は、環境変数 `ENABLE_EN=true` を指定してビルド・デプロイします。

```sh
ENABLE_EN=true npm run build
npm run deploy
```

ローカルで確認する場合は以下を実行します。

```sh
ENABLE_EN=true npm run dev
```

> [!NOTE]
> 英語版では、researchmap 上で**英語表記が登録されている項目（論文タイトル、発表タイトル、所属など）のみが抽出されて掲載**されます。

---

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

---

## 主な npm コマンド一覧

| コマンド                          | 説明                                                 |
| :-------------------------------- | :--------------------------------------------------- |
| `npm run dev`                     | ローカル開発サーバーを起動 (`http://localhost:4321`) |
| `npm run import <file>`           | researchmap の JSONL データをサニタイズして取り込み  |
| `npm run build`                   | 本番用静的ファイルを `dist/` にビルド                |
| `npm run preview`                 | ビルド成果物 (`dist/`) をローカルでプレビュー        |
| `npm run deploy`                  | Cloudflare Pages に `dist/` をデプロイ (`wrangler`)  |
| `npm run lint` / `npm run format` | コードの Lint / フォーマットチェック・整形           |

---

## License

[MIT](LICENSE)
