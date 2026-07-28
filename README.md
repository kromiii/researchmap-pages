# researchmap-pages

[researchmap](https://researchmap.jp/) のデータから研究者向け個人サイトを生成するテンプレートです。[Astro](https://astro.build/) の SSR を [Cloudflare Workers](https://workers.cloudflare.com/) 上で動かし、researchmap API のデータを Workers KV にキャッシュして配信します。リポジトリに個人データはコミットされません。

デモ: https://kromiii.info

## 仕組み

```
訪問者 → Cloudflare Worker (Astro SSR) → Workers KV (researchmap データのキャッシュ)
```

- ページはリクエスト時に KV のキャッシュから描画される（数ミリ秒）
- キャッシュが6時間より古い場合は、古いデータで即レスポンスを返しつつバックグラウンドで researchmap API から再取得して KV を更新する（stale-while-revalidate）
- 定期ビルドが存在しないため、GitHub Actions の「60日でスケジュール実行が止まる」問題とは無縁
- researchmap API が一時的に落ちていても、KV の古いデータで表示は継続する

主なファイル:

- `src/lib/researchmap.ts` — researchmap API からの取得と KV キャッシュ（stale-while-revalidate）
- `src/lib/view.ts` — 言語ごとの表示用データへの変換ロジック。タブ構成（どのセクションをどのタブに載せるか）や新着抽出（90日・最大6件）もここで定義
- `src/components/Page.astro` — ページ本体のテンプレートとタブ切り替えの小さなスクリプト
- `src/pages/avatar.jpg.ts` — アバター画像も KV にキャッシュして配信（ホットリンク回避）
- `wrangler.jsonc` — Worker の設定（KV バインディング・カスタムドメイン）

## セットアップ

1. このリポジトリの **Use this template** から自分のリポジトリを作成する
2. [Cloudflare アカウント](https://dash.cloudflare.com/sign-up)（無料プランで可）を作成し、ローカルでログインする

   ```sh
   npm install
   npx wrangler login
   ```

3. KV namespace を作成し、表示された `id` を `wrangler.jsonc` の `kv_namespaces[0].id` に貼り付ける

   ```sh
   npx wrangler kv namespace create RESEARCHMAP
   ```

4. `wrangler.jsonc` の残りを自分の環境に合わせる
   - `vars.RESEARCHMAP_PERMALINK` — 自分の researchmap パーマリンク（`https://researchmap.jp/xxxx` の `xxxx`）
   - `name` — Worker 名（好きな名前でよい）
   - `routes` — 独自ドメインを使う場合: ドメインを Cloudflare に追加した上で `routes[0].pattern` を自分のドメインに変更。無料の `*.workers.dev` で試す場合: `routes` を削除し、デプロイ後にダッシュボードで workers.dev サブドメインを有効化
5. `astro.config.mjs` の `site` を公開 URL に変更する
6. デプロイ

   ```sh
   npm run deploy
   ```

デプロイが必要なのはコードを変更したときだけです。サイトのデータ更新はデプロイとは独立に Worker 自身が行うため、CI や定期実行の仕組みは必要ありません。

## 特徴

- サーバーサイドレンダリングで全コンテンツを HTML として返す — SEO・OGP に強い
- タブUI（プロフィール / 論文 / 発表 / 受賞・他）でスクロール量を抑えたレイアウト。全コンテンツがHTMLに含まれるためSEOはそのまま、JS無効環境では全セクション表示にフォールバック
- **新着ハイライト** — 直近90日以内に researchmap へ新規追加された業績をトップに NEW バッジ付きで表示（クリックで該当セクションへ移動）
- フッターに最終更新日を自動表示
- 日本語 (`/`) / 英語 (`/en/`) の2ページ、`hreflang` 対応
- ダークモード対応
- 論文・講演・受賞・経歴など researchmap の全業績セクションをページネーション付きで全件取得
- データ鮮度は最終アクセスから最大6時間遅れ（`src/lib/researchmap.ts` の `MAX_AGE_MS` で調整可能）

## ローカルでの確認

```sh
npm install
npm run dev        # 開発サーバー (http://localhost:4321)
npm run build      # dist/ にビルド
npx wrangler dev   # 本番同等の Workers 実行環境 + ローカル KV で確認
```

`wrangler dev` はローカルにエミュレートされた KV を使うため、初回アクセスだけ researchmap からの全件取得（数秒〜十数秒）が走ります。

## License

[MIT](LICENSE)
