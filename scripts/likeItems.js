/**
 * 指定タグの新着記事のうち、自分の記事以外にいいねする（セーフな頻度で実行）
 * 実行例: node scripts/likeItems.js
 */

import { runWithCore, QiitaAPIClient, likeItemsFromTagFeed } from '@aa-0921/qiita-auto-core';
import { MAX_LIKE_PER_RUN, TAGS_FOR_LIKE, LIKE_DELAY_SEC } from '../config/followLike.js';

await runWithCore(async () => {
  const token = process.env.QIITA_ACCESS_TOKEN;
  if (!token) throw new Error('QIITA_ACCESS_TOKEN を設定してください');

  const client = new QiitaAPIClient(token);
  console.log('[likeItems] タグ', TAGS_FOR_LIKE.length, '件から最大', MAX_LIKE_PER_RUN, '件いいねします（1件あたり', LIKE_DELAY_SEC, '秒間隔）');

  const result = await likeItemsFromTagFeed(client, TAGS_FOR_LIKE, {
    maxLike: MAX_LIKE_PER_RUN,
    delayMs: LIKE_DELAY_SEC * 1000,
    perTag: 15,
  });

  if (result.error) throw new Error(result.error);
  console.log('[likeItems] 完了: いいね', result.liked.length, '件, スキップ', result.skipped, '件');
});
