/**
 * 設定したタグを Qiita でフォローする（core の followTags を利用）
 * 実行例: node scripts/followTags.js
 */

import { runWithCore, QiitaAPIClient, followTags } from '@aa-0921/qiita-auto-core';
import { TAGS_TO_FOLLOW } from '../config/tagsToFollow.js';

await runWithCore(async () => {
  const token = process.env.QIITA_ACCESS_TOKEN;
  if (!token) throw new Error('QIITA_ACCESS_TOKEN を設定してください');

  const client = new QiitaAPIClient(token);
  console.log('[followTags] タグをフォローします:', TAGS_TO_FOLLOW.length, '件');
  await followTags(client, TAGS_TO_FOLLOW);
  console.log('[followTags] 完了');
});
