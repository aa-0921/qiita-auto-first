/**
 * フォロー・いいねの自動実行用設定（セーフな頻度に従う）
 * フォロー: 1日10〜20件・1件あたり1〜2分 / いいね: 1日20〜30件
 */

/** 1 回の実行でフォローする最大人数（目安: 10〜20） */
export const MAX_FOLLOW_PER_RUN = 10;

/** フォロー候補を取得するタグ（駆け出しエンジニア向け記事を書いている著者をフォロー） */
export const TAGS_FOR_FOLLOW = [
  '初心者',
  '入門',
  '未経験',
  'プログラミング',
  'エンジニア',
];

/** 1 回の実行でいいねする最大件数（目安: 20〜30） */
export const MAX_LIKE_PER_RUN = 20;

/** いいね候補を取得するタグ ID 一覧（タグの新着記事から取得） */
export const TAGS_FOR_LIKE = [
  'react',
  'next.js',
  'javascript',
  'typescript',
  'ruby',
  'rails',
];

/** フォロー 1 件あたりの待機秒数（1〜2分推奨） */
export const FOLLOW_DELAY_SEC = 90;

/** いいね 1 件あたりの待機秒数 */
export const LIKE_DELAY_SEC = 120;
