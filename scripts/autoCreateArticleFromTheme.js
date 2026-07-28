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
  LISTICLE_TOPICS,
  LISTICLE_SYSTEM_PROMPT,
  LISTICLE_PROMPT_TEMPLATE,
} from '../config/articleTheme.js';

/**
 * 記事タイプの出現比率
 * 「〇〇10選」系（リスト記事）が最も伸びた実績があるため主力にし、残りを他タイプに割り振る
 */
const LISTICLE_RATE = 0.7;   // 〇〇10選（リスト記事）
const MOTIVATION_RATE = 0.15; // マインド・キャリア系（残り 0.15 が技術 × キーワード）

// 本文の2つ目の見出し直前などに挿入するプロモーション文（見出しが足りない場合は末尾に付与）
const ARTICLE_PROMOTION_BLOCK = `

✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨

https://www.youtube.com/@tech-trend-zunda-metan/featured

最新ツール・トレンド情報をずんだもん×めたんが解説するYouTubeチャンネルを運営しています！
いいね、チャンネル登録してもらえると嬉しいです🙇‍♂️

---

ハジメル.dev: https://hajimeru-dev.vercel.app/

「ひとりで続けるのは難しい」「何から学べばいいか分からない」という方向けに、
プログラミングのマンツーマンレッスンサービス「ハジメル.dev」も運営しています。
未経験OK・オンライン完結・月額制/違約金なしなので、気軽に無料相談してみてください🙇‍♂️


---

海外テックニュースを追いたいけど、英語や情報量の多さで大変…という方向けに、
Hacker News の話題を日本語でサクッと追える「HackerNews 日本語まとめ & AI要約」
を個人開発しました！
技術トレンド収集に使ってもらえると嬉しいです🔥🙇‍♂️
→ HackerNews 日本語まとめ & AI要約: https://hn-matome-2ht.pages.dev/



---

https://unityroom.com/games/nyampire_survivors

「ニャンパイアサバイバー」というヴァンパイアサバイバーリスペクトのゲームを作成しました！
もしよろしければ遊んで頂けると嬉しいです😭

---

習い事教室の先生向けに、SNS 投稿・生徒募集・保護者通知の文章を AI で生成する Web サービス「おしらせAI」を個人開発しました。Next.js + Supabase + LLM で構成しており、無料で月 10 回まで試用できます。よければ触ってみてください。

→ おしらせAI: https://oshirase-ai.vercel.app/

✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨✨
`.trim();

function insertFooterBeforeSecondHeading(body, footer) {
  const lines = body.split('\n');
  let headingCount = 0;
  let insertAt = -1;

  for (let i = 0; i < lines.length; i += 1) {
    if (/^\s*#{1,6}\s+/.test(lines[i])) {
      headingCount += 1;
      if (headingCount === 2) {
        insertAt = i;
        break;
      }
    }
  }

  if (insertAt === -1) {
    // 見出しが2つ未満の場合は従来どおり末尾に追加
    return body.trimEnd() + '\n\n' + footer;
  }

  const before = lines.slice(0, insertAt).join('\n').trimEnd();
  const after = lines.slice(insertAt).join('\n').trimStart();
  return `${before}\n\n${footer}\n\n${after}`.trimEnd();
}

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

  // 70%「〇〇10選」系、15%「マインド・キャリア系」、15%「技術 × キーワード」で記事タイプを決める
  const rand = Math.random();
  const articleType = rand < LISTICLE_RATE
    ? 'listicle'
    : rand < LISTICLE_RATE + MOTIVATION_RATE
      ? 'motivation'
      : 'techKeyword';
  const ARTICLE_TYPE_LABELS = {
    listicle: '〇〇10選（リスト記事）',
    motivation: 'マインド・キャリア系（駆け出しエンジニア向けトピック）',
    techKeyword: '技術 × キーワード',
  };
  console.log('');
  console.log('--- 記事タイプ選択 ---');
  console.log('選択されたタイプ:', ARTICLE_TYPE_LABELS[articleType]);

  // リスト記事もトピック 1 つから生成するため、core の createArticleFromMotivationTopic（{{topic}} 置換）を流用する
  let article;
  if (articleType === 'listicle') {
    article = await createArticleFromMotivationTopic({
      topics: LISTICLE_TOPICS,
      systemPrompt: LISTICLE_SYSTEM_PROMPT,
      promptTemplate: LISTICLE_PROMPT_TEMPLATE,
    });
  } else if (articleType === 'motivation') {
    article = await createArticleFromMotivationTopic({
      topics: MOTIVATION_TOPICS,
      systemPrompt: SYSTEM_PROMPT,
      promptTemplate: MOTIVATION_PROMPT_TEMPLATE,
    });
  } else {
    article = await createArticleFromTechKeyword({
      technologies: TECHNOLOGIES,
      keywords: KEYWORDS,
      systemPrompt: SYSTEM_PROMPT,
      promptTemplate: PROMPT_TEMPLATE,
    });
  }

  // 本文の2つ目の見出し直前にプロモーション文を追加（見出し不足時は末尾）
  article.body = insertFooterBeforeSecondHeading(article.body, ARTICLE_PROMOTION_BLOCK);

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
