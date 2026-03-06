/**
 * 自分の Qiita 記事のいいね・ストック数を取得しレポート出力（core の fetchAllMyItems / formatMyItemsReport を利用）
 * 実行例: node scripts/analyzeMyItems.js
 */

import { runWithCore, QiitaAPIClient, fetchAllMyItems, formatMyItemsReport } from '@aa-0921/qiita-auto-core';

await runWithCore(async () => {
  const token = process.env.QIITA_ACCESS_TOKEN;
  if (!token) throw new Error('QIITA_ACCESS_TOKEN を設定してください');

  const client = new QiitaAPIClient(token);
  const items = await fetchAllMyItems(client);
  console.log(formatMyItemsReport(items));
});
