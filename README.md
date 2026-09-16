# IMAGE FORGE MOBILE v0.4

スマホ中心の無料優先画像生成フロントエンドです。

現在は AI Horde の匿名無料GPUキューを利用して、登録・カード・APIキーなしで実画像生成できます。

- Prompt入力
- 1:1 / 2:3 / 9:16
- 非同期画像生成
- 無料キュー待機状況表示
- 生成画像表示
- 保存リンク
- PWA manifest / service worker
- `/api/health`

## Provider

標準では AI Horde 匿名キー `0000000000` を利用します。
匿名利用は完全無料ですが、混雑時は登録ユーザーより生成優先度が低くなります。

環境変数は不要です。
将来、登録済みAI Hordeキーを使う場合だけ `AI_HORDE_API_KEY` を設定してください。
