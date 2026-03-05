/**
 * 技術 × キーワードをランダムに組み合わせ、OpenRouter で記事を生成して Qiita に投稿する
 *
 * テーマ（技術・キーワード・プロンプト）は config/articleTheme.js で定義。
 * 必要環境変数: QIITA_ACCESS_TOKEN, OPENROUTER_API_KEY
 *
 * 実行例:
 *   node scripts/autoCreateArticleFromTheme.js
 *   node scripts/autoCreateArticleFromTheme.js --bg
 */

import { runWithCore, QiitaAPIClient, createArticleFromTechKeyword } from '@aa-0921/qiita-auto-core';
import {
  TECHNOLOGIES,
  KEYWORDS,
  SYSTEM_PROMPT,
  PROMPT_TEMPLATE,
} from '../config/articleTheme.js';

await runWithCore(async () => {
  const token = process.env.QIITA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('QIITA_ACCESS_TOKEN を設定してください（.env または環境変数）');
  }
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY を設定してください（.env または環境変数）');
  }

  const article = await createArticleFromTechKeyword({
    technologies: TECHNOLOGIES,
    keywords: KEYWORDS,
    systemPrompt: SYSTEM_PROMPT,
    promptTemplate: PROMPT_TEMPLATE,
  });

  const client = new QiitaAPIClient(token);
  const item = await client.createItem({
    ...article,
    private: false,
  });

  console.log('');
  console.log('投稿しました:', item.url);
  console.log('ID:', item.id);
});
