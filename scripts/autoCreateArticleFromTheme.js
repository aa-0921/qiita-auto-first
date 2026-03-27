/**
 * 技術 × キーワード or マインド・キャリア系トピックをランダムに選び、
 * OpenRouter で記事を生成して Qiita に投稿するスクリプト
 *
 * テーマ（技術・キーワード・マインド系トピック・プロンプト）は config/articleTheme.js で定義。
 * 必要環境変数: QIITA_ACCESS_TOKEN, OPENROUTER_API_KEY
 *
 * 実行例:
 *   node scripts/autoCreateArticleFromTheme.js
 *   node scripts/autoCreateArticleFromTheme.js --bg
 */

import {
  runWithCore,
  QiitaAPIClient,
  createArticleFromTechKeyword,
  createArticleFromMotivationTopic,
} from '@aa-0921/qiita-auto-core';
import {
  TECHNOLOGIES,
  KEYWORDS,
  SYSTEM_PROMPT,
  PROMPT_TEMPLATE,
  MOTIVATION_TOPICS,
  MOTIVATION_PROMPT_TEMPLATE,
} from '../config/articleTheme.js';

// 投稿本文の末尾に自動で付与するプロモーション文（区切りは絵文字のみで横長に）
const ARTICLE_FOOTER = `
✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨

海外テックニュースを追いたいけど、英語や情報量の多さで大変…という方向けに、
Hacker News の話題を日本語でサクッと追える「HackerNews 日本語まとめ & AI要約」 
を個人開発しました！
技術トレンド収集に使ってもらえると嬉しいです🔥🙇‍♂️
→ HackerNews 日本語まとめ & AI要約: https://hn-matome-2ht.pages.dev/

✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨

https://unityroom.com/games/nyampire_survivors

「ニャンパイアサバイバー」というヴァンパイアサバイバーリスペクトのゲームを作成しました！
もしよろしければ遊んで頂けると嬉しいです😭

✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨

習い事教室の先生向けに、SNS 投稿・生徒募集・保護者通知の文章を AI で生成する Web サービス「おしらせAI」を個人開発しました。Next.js + Supabase + LLM で構成しており、無料で月 10 回まで試用できます。よければ触ってみてください。

→ おしらせAI: https://oshirase-ai.vercel.app/

✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨
`.trim();

await runWithCore(async () => {
  let apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY を設定してください（.env または環境変数）');
  }
  // 前後の空白・改行を除去してから渡す（.env のコピペミスで 401 になることがある）
  process.env.OPENROUTER_API_KEY = apiKey;
  const keyPreview = apiKey.length >= 4 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-2)}` : '(短すぎ)';
  console.log('[DEBUG] OPENROUTER_API_KEY: 設定済み 長さ=' + apiKey.length + ' プレビュー=' + keyPreview);

  const token = process.env.QIITA_ACCESS_TOKEN;
  if (!token) {
    throw new Error('QIITA_ACCESS_TOKEN を設定してください（.env または環境変数）');
  }

  // 50% の確率で「技術 × キーワード」記事、50% で「マインド・キャリア系」記事を書く
  const useMotivation = Math.random() < 0.5;
  console.log('');
  console.log('--- 記事タイプ選択 ---');
  console.log('選択されたタイプ:', useMotivation ? 'マインド・キャリア系（駆け出しエンジニア向けトピック）' : '技術 × キーワード');

  const article = useMotivation
    ? await createArticleFromMotivationTopic({
        topics: MOTIVATION_TOPICS,
        systemPrompt: SYSTEM_PROMPT,
        promptTemplate: MOTIVATION_PROMPT_TEMPLATE,
      })
    : await createArticleFromTechKeyword({
        technologies: TECHNOLOGIES,
        keywords: KEYWORDS,
        systemPrompt: SYSTEM_PROMPT,
        promptTemplate: PROMPT_TEMPLATE,
      });

  // 投稿末尾にプロモーション文を追加
  article.body = article.body.trimEnd() + '\n\n' + ARTICLE_FOOTER;

  // --- 生成記事の内容をログ出力（確認・改善用） ---
  console.log('');
  console.log('========== 生成された記事（投稿内容） ==========');
  console.log('');
  console.log('【タイトル】');
  console.log(article.title);
  console.log('');
  console.log('【タグ】');
  console.log(article.tags.map((t) => t.name).join(', '));
  console.log('');
  console.log('【本文】');
  console.log('---');
  console.log(article.body);
  console.log('---');
  console.log('');
  console.log('========== 以上 ==========');

  const client = new QiitaAPIClient(token);
  const item = await client.createItem({
    ...article,
    private: false,
  });
  console.log('');
  console.log('投稿しました:', item.url);
  console.log('ID:', item.id);
});
