# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## このリポジトリについて

木質材料学研究室の暴露試験体を管理するための、ビルド不要（`package.json`なし）の静的サイト。各ページはCDN経由でTailwindを読み込み、共通の`header.js`を読み込むだけのプレーンなHTML群。ローカルのバックエンドは存在せず、データはすべてGoogleスプレッドシート＋Googleドライブに保存され、1つのGoogle Apps Script（GAS）ウェブアプリ経由でのみアクセスする。

## ローカルでの動作確認

インストールやビルドのコマンドは無い。プレビューするには：

```
python -m http.server 8000
```

を実行し、`http://localhost:8000/index.html`を開く。**`file://`で直接開かないこと** — GASへの`fetch()`呼び出しや、`form.html`のカメラ許可APIは`http(s)`オリジンを要求する。

`form.html`はページ読み込み時（デフォルトで「QRコード読み取り」が選択されている状態）に自動でカメラを起動する（CDN配信の`html5-qrcode`ライブラリ経由）。このページを開く/テストする際はブラウザ標準のカメラ許可ダイアログが出る点に注意。

このリポジトリにテストスイート・linter・CI設定は存在しない。

## アーキテクチャ

**ページ構成**: `index.html`（ダッシュボード/一覧）、`form.html`（測定・移動の入力）、`photo.html`（ギャラリー＋カメラ撮影）、`calendar.html`（FullCalendar表示）、`materials.html`（参考資料）、`howtouse.html`、`contact.html`。各ページは自己完結しており、マークアップ・ページ固有の`<script>`ロジック・各ページ独自の`GAS_API_URL`定数を持つ（同じURL文字列が全ページに手動で重複している。GASのデプロイURLが変わった場合は、全ページ分＋`header.js`内の`window.GAS_API_URL_GLOBAL`をすべて更新する必要がある）。

**`header.js`** は各ページの`<body>`直後に`<script src="header.js"></script>`として読み込まれ、以下の4つを担う。
1. ログインモーダル＋ヘッダーのHTMLを`insertAdjacentHTML('afterbegin', ...)`で同期的に挿入する。これは`<main>`がパースされる前に実行されるため、body先頭で同期的・無条件に実行する必要がある。
2. `DOMContentLoaded`のリスナーを登録し、共通フッターを`insertAdjacentHTML('beforeend', ...)`で追加する。ページ本体のコンテンツより後に来るようにするための処置。
3. 各ページが依存する共通のグローバル変数・関数を公開する: `window.appPassword`、`window.globalLogin()`、`window.toggleGlobalMenu()`、`window.logout()`。
4. ヘッダー内の背景写真スライドショーを制御する（GASの`?action=get_photos`を取得し、2枚の絶対配置レイヤーをクロスフェードさせる）。

**認証モデル**: 個別のユーザーアカウントは存在しない。共有の合言葉1つを`localStorage['app_password']`に保存し、GASへのすべての呼び出しに`?password=...`（GET）または`password`フィールド（POSTボディ）として付与する。パスワードが誤っている場合サーバーは`{status: "auth_error"}`を返し、各ページはこれを受けて`localStorage.removeItem('app_password')`のうえ`index.html`へリダイレクトする、という規約になっている。新しいページ/呼び出しを追加する際も、別の認証フローを考案せずこのパターンに従うこと。

**GASとの契約**（呼び出し箇所から推測。他に文書化なし）: `action`無しのGETは`{status, data: [...]}`を返し、各要素は`specimen_id, material, status, current_location, effective_days, planned_days, next_measurements, expected_end`を持つ。POSTボディは`action`フィールドを持つJSON: `"measurement"`（weight・note）、`"episode"`（移動: new_location・condition・count_exposure・note）、`"upload_photo"`（filename・base64Data・contentType）。GET `?action=get_photos`は`{status, data: [{id, name, date}, ...]}`を返す（Driveのファイルid。`https://drive.google.com/thumbnail?id=...`で表示）。

**`materials.html`**だけはメインコンテンツをGASから取得していない — 実行時にGitHub Contents API経由でこのリポジトリ自身の`References_list/`フォルダを再帰的に辿って一覧表示している（スクリプト冒頭付近の`GITHUB_USERNAME`/`GITHUB_REPO`定数）。そのため参考PDFを追加する際は`References_list/`配下にコミット＆pushするだけでよい。

## デザインシステム

- `styles.css`は全ページで読み込まれ、Googleフォント「Zen Kaku Gothic New」と、いくつかの小さな自作ユーティリティ（`.grain-line`、選択範囲/スクロールバーの配色）を定義している。それ以外はすべてインラインのTailwindユーティリティクラスで、コンポーネントライブラリや`tailwind.config`は存在しない。
- 配色は意図的にamber/slate/stone系（「木質材料ラボ」らしさを出すため）で、Tailwindのデフォルト（gray系）ではない: `amber-600/700/800` = 主要アクセント/リンク/ボタン、`slate-800/900` = ヘッダーなど暗い面、`stone-*` = `gray-*`の代わりに使う中立の背景/文字/枠線。`blue-*`/`indigo-*`/`gray-*`クラスを再度使わないこと — 過去に全ページ一括で置き換え済み。
- ヘッダー（`header.js`）は固定高さ（`h-40 md:h-60`）の`position: relative`要素で、タイトルバーの背面に絶対配置の写真スライドショーがあり、ドロップダウンメニュー（`#global-mobile-menu`）はその固定高さの下にはみ出す前提で配置されている。**外側の`<header>`要素に`overflow-hidden`を付けないこと** — メニュー下半分がクリップされてクリックできなくなる。何かをクリップする必要がある場合（スライドショー写真など）は、既に`overflow-hidden`を持つ内側の`#header-slideshow`div側に限定すること。
