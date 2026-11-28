# コードブロック内に入り込んだ紹介ゾーン（✨行〜✨行）を外に出し、次の本物の見出しの直前へ移す
import re

FENCE = re.compile(r'\s*(```|~~~)')
HEADING = re.compile(r'#{1,6}\s+')
SPARK = '✨✨✨'


def promo_in_fence(body):
    inf = False
    for l in body.split('\n'):
        if FENCE.match(l):
            inf = not inf
            continue
        if inf and SPARK in l:
            return True
    return False


def fix(body):
    lines = body.split('\n')
    inf = False
    start = end = None
    for i, l in enumerate(lines):
        if FENCE.match(l):
            inf = not inf
            continue
        if inf and SPARK in l:
            if start is None:
                start = i
            else:
                end = i
                break
    if start is None or end is None:
        raise ValueError('紹介ゾーンの✨行が2本見つからない')
    promo = lines[start:end + 1]
    # 差し込み時に前後へ足された空行を1行ずつ取り除く
    s, e = start, end + 1
    if s > 0 and lines[s - 1].strip() == '':
        s -= 1
    if e < len(lines) and lines[e].strip() == '':
        e += 1
    rest = lines[:s] + lines[e:]
    # 取り除いた位置より後ろで、コードブロック外にある最初の見出しを探す
    inf = False
    target = None
    for i, l in enumerate(rest):
        if FENCE.match(l):
            inf = not inf
            continue
        if not inf and i >= s and HEADING.match(l):
            target = i
            break
    block = '\n'.join(promo)
    if target is None:
        return '\n'.join(rest).rstrip() + '\n\n' + block + '\n'
    before = '\n'.join(rest[:target]).rstrip()
    after = '\n'.join(rest[target:]).lstrip()
    return before + '\n\n' + block + '\n\n' + after


# ---- ここから一回限りの実行部（公開済み記事の紹介ゾーンを直す。実行後にファイルごと削除する）----
import json, os, time, urllib.request

IDS = ["d90cd6933af55ad76416", "be51e74e197bdf7d3d7e", "d602e291d13bd77dae94", "eb65bc2a1f48f3a2472a", "b0e8b7826ede3b6a32f1", "6dfc765f8e8a1867c61a", "0e0a45d4cf0aceceb441", "79d93f6a9e55344b9df3", "a7a933bfd6c79f80331d", "3376d24899bbc3b4b28c", "dfa0dbeff52212e6a07c", "fd0df69703a338d6f305", "74e5e2659f0a59470c2c", "d270a6a7e466b5961600", "4bbfd57023ec2683f99a", "1be7ac8d4940ebe30491", "5d773866fcfffe4649e6", "358248ad994e2f80d138", "6924086a85d3553ab60b", "a7bc9909200fa70855b9", "622ad5703a13149026df", "aeef8434425bafb91ae5", "2b0b119a8d18686600c8", "591a7133c708de045bf3", "f2592d345554237704f0", "a90376b9b1042bff265f", "efa81aaa8a61d3478568", "aea0e76657cd90fd2343", "af3c23f4dc89ae0efdcc", "770168efcc7056a34203", "bbf8f3e7ea842dd3d8aa", "a5ba60bfb9e00cd6f6c0", "2b06a8b69eaa9ca1f19f", "37a205d8220648957646", "2f818fc48a515da5f5e3", "210999cc851ffc1c9455", "ff3c560756979000b12e"]
TOKEN = os.environ['QIITA_ACCESS_TOKEN']


def call(method, path, data=None):
    req = urllib.request.Request('https://qiita.com/api/v2' + path, method=method,
                                 data=None if data is None else json.dumps(data).encode(),
                                 headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        return json.load(r)


fail = 0
for item_id in IDS:
    try:
        a = call('GET', '/items/' + item_id)
        if not promo_in_fence(a['body']):
            print(item_id, 'skip（既に直っている）')
            continue
        body = fix(a['body'])
        call('PATCH', '/items/' + item_id, {
            'title': a['title'], 'body': body, 'private': a['private'],
            'tags': [{'name': t['name'], 'versions': t.get('versions', [])} for t in a['tags']]})
        after = call('GET', '/items/' + item_id)
        ok = not promo_in_fence(after['body'])
        print(item_id, 'OK' if ok else 'NG（更新後もコードブロック内に残る）')
        fail += 0 if ok else 1
    except Exception as ex:
        print(item_id, 'ERROR', ex)
        fail += 1
    time.sleep(1)
print('fail', fail, '/', len(IDS))
raise SystemExit(1 if fail else 0)
