/**
 * RSS からネタを 1 件取得し、OpenRouter で記事を生成して Qiita に投稿する
 *
 * 必要環境変数: QIITA_ACCESS_TOKEN, OPENROUTER_API_KEY
 *
 * 実行例:
 *   node scripts/autoCreateArticleFromRss.js
 *   node scripts/autoCreateArticleFromRss.js --bg
 */

import { runWithCore, QiitaAPIClient, createArticleFromRss } from '@aa-0921/qiita-auto-core';

await runWithCore(async () => {
  const token = process.env.QIITA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('QIITA_ACCESS_TOKEN を設定してください（.env または環境変数）');
  }
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY を設定してください（.env または環境変数）');
  }

  const article = await createArticleFromRss();
  const client = new QiitaAPIClient(token);

  const item = await client.createItem({
    ...article,
    private: false,
  });

  console.log('投稿しました:', item.url);
  console.log('ID:', item.id);
});
