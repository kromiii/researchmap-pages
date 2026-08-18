# researchmap-pages

[researchmap](https://researchmap.jp/) のエクスポートデータ (JSONL) から研究者向け個人サイトを生成する [Astro](https://astro.build/) テンプレートです。Cloudflare Pages、GitHub Pages、Vercel 等で配信できます。

- **デモサイト**: https://kromiii.info

---

## クイックスタート

### 1. リポジトリの作成とインストール

1. GitHub 右上の **「Use this template」** から、ご自身のアカウントに新しいリポジトリを作成します。
2. 作成したリポジトリをローカルにクローンし、依存パッケージをインストールします。

```sh
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
npm install
```

### 2. データのエクスポートと取り込み

1. [researchmap](https://researchmap.jp/) の「データ管理・エクスポート」から **JSONL 形式** でエクスポートし、ダウンロードされた zip ファイルを展開（解凍）します。
2. 展開された JSONL ファイルを指定してインポートを実行します（非公開項目の自動除外・アバター画像の自動取得が行われます）。

```sh
npm run import /path/to/rm_researchersYYYYMMDD_XXXXXX.jsonl
```

> [!NOTE]
> 取り込んだデータ (`data/researchmap.jsonl`, `public/avatar.jpg`) は `.gitignore` されているため、Public リポジトリでも安全に管理できます。

### 3. 設定ファイルの編集

- **`wrangler.json`**: `name` を任意のプロジェクト名に変更
- **`astro.config.mjs`**: `site` を公開 URL に変更

### 4. 確認とデプロイ

```sh
# ローカル確認 (http://localhost:4321)
npm run dev

# Cloudflare Pages へデプロイ
npm run deploy
```

※ `npm run build` で生成される `dist/` ディレクトリを手動で GitHub Pages や Vercel 等にデプロイすることも可能です。

---

## 主なカスタマイズ

- **業績データの更新**: 新しい JSONL ファイルで `npm run import` を実行して再デプロイします。
- **画像・アイコンの変更**: `public/avatar.jpg`（アバター）や `public/favicon.svg`（ファビコン）を任意のファイルに置き換えられます。
- **英語版（`/en/`）の有効化**: `ENABLE_EN=true` を指定してデプロイします（英語表記がある項目のみ抽出されます）。
  ```sh
  ENABLE_EN=true npm run deploy
  ```
- **テンプレートの最新更新を取り込む**:
  ```sh
  git remote add upstream https://github.com/kromiii/researchmap-pages.git
  git fetch upstream
  git merge upstream/main
  ```

---

## コマンド一覧

| コマンド                          | 説明                                               |
| :-------------------------------- | :------------------------------------------------- |
| `npm run dev`                     | ローカル開発サーバー起動 (`http://localhost:4321`) |
| `npm run import <file>`           | researchmap データの取り込み・サニタイズ           |
| `npm run build`                   | 本番用ビルド (`dist/` に出力)                      |
| `npm run preview`                 | ビルド成果物のローカル確認                         |
| `npm run deploy`                  | ビルドおよび Cloudflare Pages へのデプロイ         |
| `npm run lint` / `npm run format` | コードのチェック・フォーマット                     |

---

## License

[MIT](LICENSE)
