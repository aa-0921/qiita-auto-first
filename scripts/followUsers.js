/**
 * 駆け出しエンジニア向けタグの記事著者をフォローする（セーフな頻度で実行）
 * 候補: TAGS_FOR_FOLLOW のタグが付いた新着記事の著者
 * 実行例: node scripts/followUsers.js
 */

import { runWithCore, QiitaAPIClient, followUsersFromTagFeed } from '@aa-0921/qiita-auto-core';
import { MAX_FOLLOW_PER_RUN, FOLLOW_DELAY_SEC, TAGS_FOR_FOLLOW } from '../config/followLike.js';

await runWithCore(async () => {
  const token = process.env.QIITA_ACCESS_TOKEN;
  if (!token) throw new Error('QIITA_ACCESS_TOKEN を設定してください');

  const client = new QiitaAPIClient(token);
  console.log('[followUsers] タグ（駆け出し向け）の記事著者から最大', MAX_FOLLOW_PER_RUN, '件フォローします（1件あたり', FOLLOW_DELAY_SEC, '秒間隔）');
  console.log('[followUsers] 対象タグ:', TAGS_FOR_FOLLOW.join(', '));

  const result = await followUsersFromTagFeed(client, TAGS_FOR_FOLLOW, {
    maxFollow: MAX_FOLLOW_PER_RUN,
    delayMs: FOLLOW_DELAY_SEC * 1000,
    perTag: 20,
  });

  if (result.error) throw new Error(result.error);
  console.log('[followUsers] 完了: フォロー', result.followed.length, '件, スキップ', result.skipped, '件');
});
