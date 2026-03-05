# qiita-auto-first

Qiita 自動投稿用の first アカウントリポジトリです。`@aa-0921/qiita-auto-core` を利用して記事を投稿します。

## セットアップ

1. リポジトリ直下に `.env` を作成し、Qiita のアクセストークンを設定する。

   ```bash
   cp .env.example .env
   # .env を編集して QIITA_ACCESS_TOKEN を設定
   ```

2. 依存関係のインストール（`qiita-automation` 直下に `qiita-auto-core` と本リポジトリが並んでいる前提）

   ```bash
   npm install
   ```

## 簡単な投稿テスト

**実行は「ファイル名」で行う（npm スクリプト名を別に覚えなくてよい）:**

```bash
node scripts/simplePost.js
node scripts/simplePost.js --bg   # バックグラウンド実行オプション
```

- Qiita API で 1 件のテスト記事を投稿します。
- トークンは [Qiita の設定](https://qiita.com/settings/tokens) で発行し、**write_qiita** スコープを付与してください。
- `--bg` は将来の headless 等で利用するフラグで、現状はログ表示の違いのみです。

## 技術×キーワードで記事を自動生成して投稿（推奨）

技術の配列とキーワードの配列をランダムに 1 つずつ組み合わせ、そのテーマで AI に記事を書かせて Qiita に投稿します。元記事に依存しないため、ネタ元がバレる心配がありません。

**設定**: `config/articleTheme.js` で以下を編集できます。

- **TECHNOLOGIES** … 技術名の配列（例: React, Rails, Next.js, TypeScript）
- **KEYWORDS** … 切り口の配列（例: よくあるエラー, ベストプラクティス, 入門）
- **SYSTEM_PROMPT** … AI への役割・出力形式の指示
- **PROMPT_TEMPLATE** … ユーザーメッセージのテンプレート（`{{technology}}` と `{{keyword}}` が置換される）

**必要な環境変数**: `QIITA_ACCESS_TOKEN`, `OPENROUTER_API_KEY`

```bash
node scripts/autoCreateArticleFromTheme.js
node scripts/autoCreateArticleFromTheme.js --bg
```

### GitHub Actions で 8 時間毎に自動投稿

ワークフロー `Auto Create Article From Theme` が **8 時間ごと**（cron: JST 9:00, 17:00, 翌1:00 頃）に記事を生成・投稿します。手動実行は Actions タブから「Run workflow」で可能です。

**リポジトリの Settings → Secrets and variables → Actions で以下を設定してください。**

| Secret 名 | 説明 |
|-----------|------|
| `QIITA_ACCESS_TOKEN` | Qiita の Personal Access Token（write_qiita スコープ） |
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/) の API キー |
| `CORE_REPO_TOKEN` | 非公開の `qiita-auto-core` をチェックアウトするための PAT（repo スコープ） |

## RSS から記事を自動生成して投稿

複数の RSS フィードからネタを 1 件ランダムに取得し、OpenRouter の無料モデルで記事を生成して Qiita に投稿します。

**必要な環境変数**: `QIITA_ACCESS_TOKEN`, `OPENROUTER_API_KEY`（[OpenRouter](https://openrouter.ai/) で取得）

```bash
node scripts/autoCreateArticleFromRss.js
node scripts/autoCreateArticleFromRss.js --bg
```

- ネタ元は Publickey, CodeZine, Zenn, Qiita タグ、Node.js 公式ブログなど 20 本以上のフィードからランダムに選ばれ、毎回異なるソースになります。
- 生成された記事は「駆け出しエンジニア向け」の要約・解説文として出力されます。

## レート制限（429）について

- Qiita API は **認証ありで 1 時間あたり 1000 リクエスト** まで。**全エンドポイントで共通カウント**のため、ブラウザでの閲覧・他ツールの利用も同じ枠を消費します。
- **429 でも rate-remaining が大きい（例: 996）場合**: Qiita の 1 時間枠ではなく、**手前の CloudFront（CDN）の短い制限**（バースト制限など）の可能性が高いです。レスポンスヘッダに `x-cache: Error from cloudfront` が出ます。このときは **30 秒待機してからリトライ**するようにしています（5 分待つ必要はありません）。
- **rate-remaining が小さい場合**: Qiita の 1 時間制限に達しているので、`Rate-Reset` に従い最大 5 分まで待ってからリトライします。
- **対策**: `QiitaAPIClient` は 429 を最大 3 回まで自動リトライします。待機時間は上記のとおりです。

---

## 429 の原因と対策（Web 調査まとめ）

同様の事象で困っている人が多いため、Web 上の情報をまとめました。

### 原因の整理

| 種類 | 説明 | 本リポジトリでの状況 |
|------|------|----------------------|
| **Qiita の 1 時間制限** | 認証あり 1000 回/時。`rate-remaining` が 0 に近づくと 429。 | あなたのレスポンスでは `rate-remaining: 996` のため、**ここが原因ではない**。 |
| **CDN（CloudFront）の制限** | Qiita の手前にある CDN が、**短時間あたりのリクエスト数（バースト）** や **同一 IP からの連続アクセス** で 429 を返すことがある。`x-cache: Error from cloudfront` が出る。 | **今回の 429 はここが原因**と考えられる。 |
| **レートとバーストの違い** | 「1 時間 1000 回」は**平均レート**。CDN 側には別に **バースト制限**（瞬間的なスパイクの上限）があり、短時間に集中すると 429 になる。AWS 系ではトークンバケットで説明されることが多い。 | 1 回だけの投稿でも、同じ IP で他リクエストが多かったり、CDN のバースト枠が空いていなければ 429 になりうる。 |

### 一般的に紹介されている対策

1. **リクエスト間隔を空ける**  
   連続で API を叩く場合は、**0.8〜1.2 秒以上**の間隔を入れる（例: [Qiita - レートリミットを超えずに効率的にリクエストを送る方法](https://qiita.com/Book-Ma/items/788b702287e254ee2c36)）。
2. **429 時に Retry-After / 指数バックオフ**  
   `Retry-After` があればその秒数待つ。なければ 1 秒→2 秒→4 秒…のように増やしてリトライ（[MDN 429](https://developer.mozilla.org/ja/docs/Web/HTTP/Reference/Status/429)、[microCMS の 429 対処](https://help.microcms.io/ja/knowledge/handling-429-errors)）。
3. **キューで一定間隔に抑える**  
   複数リクエストをキューに入れ、1.2 秒間隔などで順に送る（[Book-Ma 氏の記事](https://qiita.com/Book-Ma/items/788b702287e254ee2c36)）。
4. **認証付きで 1 時間枠を広げる**  
   認証なしは 60 回/時。トークン付きなら 1000 回/時（[Qiita API のレート制限 - ekzemplaro](https://qiita.com/ekzemplaro/items/88a29cf945c314183140)）。

### 本リポジトリでの実装

- **rate-remaining が 100 以上** → CloudFront 等の短い制限と判断し **30 秒待ってからリトライ**（5 分待たない）。
- **rate-remaining が少ない** → Qiita の 1 時間制限と判断し、`Rate-Reset` に従い **最大 5 分**待ってからリトライ。
- いずれも **最大 3 回**まで自動リトライ。
- 複数記事を連続で投稿する機能を入れる場合は、**リクエスト間に 1 秒以上の遅延**を入れることを推奨（上記の一般的な対策に沿う）。
