# researchmap-pages

[researchmap](https://researchmap.jp/) のデータから静的サイトを生成する研究者向け個人サイトのテンプレートです。ビルド時（[Astro](https://astro.build/)）に researchmap API から最新データを取得して完全な静的HTMLを出力するため、SEOに強く、リポジトリに個人データはコミットされません。GitHub Actions が毎日再ビルドして GitHub Pages にデプロイします。

デモ: https://kromiii.github.io

## 使い方（researchmap ユーザーなら誰でも使えます）

1. このリポジトリの **Use this template** から自分のリポジトリを作成する
   （`<ユーザー名>.github.io` にすればユーザーサイト、それ以外の名前でもプロジェクトサイトとして動きます — base パスは自動判定）
2. `config.json` の `permalink` を自分の researchmap パーマリンクに変更する
   （`https://researchmap.jp/xxxx` の `xxxx` の部分）

   ```json
   {
     "permalink": "your_permalink"
   }
   ```

3. main に push するか、Actions タブから **Deploy to GitHub Pages** を手動実行する
   （GitHub Pages が未設定の場合はワークフローが自動で有効化します）

以降は毎日 6:00 JST に自動で最新データを取得して再デプロイします（スケジュールは `.github/workflows/deploy.yml` の cron で変更可能）。

### ⚠️ 定期実行は60日で自動停止します

GitHub Actions の仕様により、リポジトリに60日間コミットがないと `schedule` トリガーが自動で無効化され、毎日の再ビルドが止まります（サイト自体は最後にデプロイした状態のまま残ります）。無効化される前には GitHub からメール通知が届きます。

止まってしまった場合の再開方法：

- Web UI: リポジトリの **Actions** タブ → 左のワークフロー一覧から **Deploy to GitHub Pages** を選択 → 上部に表示される「This scheduled workflow is disabled…」バナーの **Enable workflow** をクリック
- または [gh CLI](https://cli.github.com/) で:

  ```sh
  gh workflow enable deploy.yml
  ```

なお、何かコミットして push すれば60日のカウントはリセットされます（push 時にもデプロイが走ります）。

### Pages のソースが「Deploy from a branch」になっている場合

`<ユーザー名>.github.io` リポジトリなどでは、GitHub Pages が最初から「Deploy from a branch」（Jekyll ビルド）で有効になっていることがあります。この状態だと、デプロイ本体は成功する一方で、GitHub が追加で実行する Jekyll ビルド（`pages build and deployment` ワークフロー）が Astro のソースを解釈できず失敗し続けます。

その場合は Pages のビルドソースを **GitHub Actions** に切り替えてください：

- Web UI: リポジトリの **Settings → Pages → Build and deployment → Source** を「GitHub Actions」に変更
- または [gh CLI](https://cli.github.com/) で:

  ```sh
  gh api -X PUT repos/<ユーザー名>/<リポジトリ名>/pages -f build_type=workflow
  ```

## 特徴

- 完全静的HTML出力 — SEO・OGP・軽量表示に強い
- タブUI（プロフィール / 論文 / 発表 / 受賞・他）でスクロール量を抑えたレイアウト。全コンテンツがHTMLに含まれるためSEOはそのまま、JS無効環境では全セクション表示にフォールバック
- **新着ハイライト** — 直近90日以内に researchmap へ新規追加された業績をトップに NEW バッジ付きで表示（クリックで該当セクションへ移動）
- フッターに最終更新日を自動表示
- 日本語 (`/`) / 英語 (`/en/`) の2ページ生成、`hreflang` 対応
- ダークモード対応
- 論文・講演・受賞・経歴など researchmap の全業績セクションをページネーション付きで全件取得

## 仕組み

- `src/lib/researchmap.ts` — ビルド時に researchmap API からプロフィールと全業績を取得（1ビルドにつき1回、メモ化）
- `src/lib/view.ts` — 言語ごとの表示用データへの変換ロジック。タブ構成（どのセクションをどのタブに載せるか）や新着抽出（90日・最大6件）もここで定義
- `src/components/Page.astro` — ページ本体のテンプレートとタブ切り替えの小さなスクリプト
- `src/pages/avatar.jpg.ts` — アバター画像もビルド時に取得して同梱（ホットリンク回避）
- `.github/workflows/deploy.yml` — push 時・毎日の定期実行・手動実行でビルド → Pages デプロイ

タブの構成やセクションの並び順は `src/lib/view.ts` の `TABS` を編集するだけで変更できます。

## ローカルでの確認

```sh
npm install
npm run dev      # 開発サーバー (http://localhost:4321)
npm run build    # dist/ に静的サイトを出力
```

環境変数でパーマリンクを上書きすることもできます: `RESEARCHMAP_PERMALINK=xxxx npm run build`

## License

[MIT](LICENSE)
