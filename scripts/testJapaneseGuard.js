/**
 * 日本語ガード（簡体字・繁体字などの検出）をコンソールから試すスクリプト
 *
 * 実行例:
 *   node scripts/testJapaneseGuard.js
 */

import { findNonJapaneseKanji, guardJapaneseKanji } from '@aa-0921/qiita-auto-core';

// 試したい文字列（ここを編集して試せます）
const SAMPLES = [
  '应用',           // 簡体字（応用）
  '闭环',           // 簡体字（閉環）
  '応用',           // 日本語
  '学習の闭环',     // 混在
  'Reactのベストプラクティス', // 日本語＋英語
];

console.log('--- findNonJapaneseKanji(文字列) ---');
for (const text of SAMPLES) {
  const chars = findNonJapaneseKanji(text);
  console.log(`"${text}" → 検出: [${chars.join(', ')}] ${chars.length ? '⚠️ NG' : '✓ OK'}`);
}

console.log('');
console.log('--- guardJapaneseKanji({ title, body }) ---');
const result = guardJapaneseKanji({
  title: '应用と闭环の話',
  body: '日本語の記事です。応用はOK。应用はNG。',
});
console.log('hasError:', result.hasError);
console.log('chars:', result.chars);
console.log('detail:', result.detail || '(なし)');
