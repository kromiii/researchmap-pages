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
   （GitHub Pages の有効化はワークフローが自動で行います）

以降は毎日 6:00 JST に自動で最新データを取得して再デプロイします（スケジュールは `.github/workflows/deploy.yml` の cron で変更可能）。

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
