/**
 * Qiita に簡単な記事を 1 件投稿するスクリプト
 * 環境変数 QIITA_ACCESS_TOKEN が必要です。
 *
 * 実行例:
 *   node scripts/simplePost.js
 *   node scripts/simplePost.js --bg
 */

import { runWithCore, QiitaAPIClient } from '@aa-0921/qiita-auto-core';

await runWithCore(async ({ wantsBackground }) => {
  const token = process.env.QIITA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('QIITA_ACCESS_TOKEN を設定してください（.env または環境変数）');
  }

  const client = new QiitaAPIClient(token);
  const article = {
    title: `テスト投稿（自動） ${new Date().toISOString().slice(0, 10)}`,
    body: `これは qiita-auto-first からの自動投稿テストです。

## 内容

- Qiita API v2 で投稿
- qiita-auto-core の QiitaAPIClient を使用
- 動作確認用の記事です
`,
    tags: [{ name: 'Qiita' }, { name: 'API' }],
    private: false, // true にすると下書き（限定公開）になる
  };

  const item = await client.createItem(article);
  console.log('投稿しました:', item.url);
  console.log('ID:', item.id);
});
