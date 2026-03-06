/**
 * 駆け出し向けタグの新着記事をストックする（セーフな頻度で実行）
 * 実行例: node scripts/stockItems.js
 */

import { runWithCore, QiitaAPIClient, stockItemsFromTagFeed } from '@aa-0921/qiita-auto-core';
import { MAX_STOCK_PER_RUN, TAGS_FOR_STOCK, STOCK_DELAY_SEC } from '../config/followLike.js';

await runWithCore(async () => {
  const token = process.env.QIITA_ACCESS_TOKEN;
  if (!token) throw new Error('QIITA_ACCESS_TOKEN を設定してください');

  const client = new QiitaAPIClient(token);
  console.log('[stockItems] タグ', TAGS_FOR_STOCK.length, '件から最大', MAX_STOCK_PER_RUN, '件ストックします（1件あたり', STOCK_DELAY_SEC, '秒間隔）');
  console.log('[stockItems] 対象タグ:', TAGS_FOR_STOCK.join(', '));

  const result = await stockItemsFromTagFeed(client, TAGS_FOR_STOCK, {
    maxStock: MAX_STOCK_PER_RUN,
    delayMs: STOCK_DELAY_SEC * 1000,
    perTag: 15,
  });

  if (result.error) throw new Error(result.error);
  console.log('[stockItems] 完了: ストック', result.stocked.length, '件, スキップ', result.skipped, '件');
});
