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

**ページ構成**: `index.html`（ダッシュボード/一覧）、`form.html`（測定・移動の入力）、`photo.html`（ギャラリー＋カメラ撮影）、`calendar.html`（FullCalendar表示）、`materials.html`（参考資料）、`howtouse.html`、`contact.html`。各ページは自己完結しており、マークアップとページ固有の`<script>`ロジックを持つ。`GAS_API_URL`は各ページで`const GAS_API_URL = window.GAS_API_URL_GLOBAL;`として`header.js`の値をそのまま使う共通化がされているので、GASのデプロイURLが変わった場合は`header.js`の`window.GAS_API_URL_GLOBAL`だけを更新すればよい。

**`header.js`** は各ページの`<body>`直後に`<script src="header.js"></script>`として読み込まれ、以下を担う。
1. ログインモーダル＋ヘッダーのHTMLを`insertAdjacentHTML('afterbegin', ...)`で同期的に挿入する。これは`<main>`がパースされる前に実行されるため、body先頭で同期的・無条件に実行する必要がある。
2. `DOMContentLoaded`のリスナーを登録し、共通フッターを`insertAdjacentHTML('beforeend', ...)`で追加する。ページ本体のコンテンツより後に来るようにするための処置。
3. 各ページが依存する共通のグローバル変数・関数を公開する: `window.appPassword`、`window.GAS_API_URL_GLOBAL`、`window.LOCATIONS`（移動先の場所一覧。`index.html`のフィルタと`form.html`の選択肢が両方ともここから生成される）、`window.formatDateToYMD()`、`window.requireLogin()`（未ログインならアラート＋`index.html`へリダイレクトし`false`を返す。`index.html`以外のログイン必須ページはDOMContentLoadedの先頭で`if (!window.requireLogin()) return;`を呼ぶ規約）、`window.globalLogin()`、`window.toggleGlobalMenu()`、`window.logout()`。新しい場所や日付整形処理を増やす際はページ側に書かず、ここに足すこと。
4. ヘッダー内の背景写真スライドショーを制御する（GASの`?action=get_photos`を取得し、2枚の絶対配置レイヤーをクロスフェードさせる）。

**認証モデル**: 個別のユーザーアカウントは存在しない。共有の合言葉1つを`localStorage['app_password']`に保存し、GASへのすべての呼び出しに`?password=...`（GET）または`password`フィールド（POSTボディ）として付与する。パスワードが誤っている場合サーバーは`{status: "auth_error"}`を返し、各ページはこれを受けて`localStorage.removeItem('app_password')`のうえ`index.html`へリダイレクトする、という規約になっている。新しいページ/呼び出しを追加する際も、別の認証フローを考案せずこのパターンに従うこと。

**GASとの契約**（呼び出し箇所とスプレッドシート実物から確認済み）: バックエンドのスプレッドシート「ExposureTest」には`Specimens`・`Episodes`・`Measurements`・`Embedment Test`・`Block-shear Test`・`Compression Test`のシートがあるが、GAS API（`doGet`/`doPost`、`sheet2API.gs`）が今のところ読み書きしているのは`Specimens`と`Measurements`のみ。他のシートはまだAPI/フロントエンドに繋がっていない。

- GET（`action`無し）: `{status, data: [...]}`。各要素は`Specimens`シートの列そのまま＝`specimen_id, material, status, current_location, effective_days, planned_days, next_measurements, expected_end`など。
- GET `?action=get_photos`: `{status, data: [{id, name, date}, ...]}`（Driveのファイルid。`https://drive.google.com/thumbnail?id=...`で表示）。
- GET `?action=get_measurements`: `{status, data: [{specimen_id, 測定日時, "重量(g)", 備考}, ...]}`。`Measurements`シートを丸ごと返す（specimen_id等の絞り込みはフロント側で行う）。index.htmlの重量推移グラフ（`showHistory()`）用に2026-09-01に追加。
- POST（`action`フィールドを持つJSON）: `"measurement"`（weight・note。`Measurements`シートに1行追記し、`Specimens`の`next_measurements`を1週間後に更新）、`"episode"`（移動: new_location・condition・count_exposure・note）、`"upload_photo"`（filename・base64Data・contentType）。

**`materials.html`**だけはメインコンテンツをGASから取得していない — 実行時にGitHub Contents API経由でこのリポジトリ自身の`References_list/`フォルダを再帰的に辿って一覧表示している（スクリプト冒頭付近の`GITHUB_USERNAME`/`GITHUB_REPO`定数）。そのため参考PDFを追加する際は`References_list/`配下にコミット＆pushするだけでよい。

**index.htmlの一括操作**: 一覧テーブルの各行にチェックボックスがあり、複数選択すると`#bulk-action-bar`が表示される。「一括移動」は新しいGASアクションを追加しているわけではなく、既存の`episode`アクションを選択件数ぶん順番にPOSTしているだけ（`executeBulkMove()`）。バックエンド改修なしで複数件の移動をまとめて行える。

**写真と試験体IDの紐付け**: `photo.html`は撮影前に試験体IDの選択を必須にし（`#photo-specimen`）、アップロード時のファイル名を`${specimenId}_${timestamp}.jpg`にしている（バックエンド側は任意のファイル名を受け付けるので変更不要）。ギャラリー表示側はファイル名の`_`より前を試験体IDとみなしてバッジ表示する（`Photo`始まりの古いファイルには表示しない）。

**通信エラー時の送信待ちキュー**: `form.html`の`submitData()`がネットワークエラーで失敗すると、送信内容を`localStorage['pending_submissions']`に退避し（`queuePendingSubmission()`）、次回のページ読み込み時や`online`イベント発火時に自動で再送信を試みる（`flushPendingQueue()`）。屋外の電波が弱い場所での入力を想定した仕組み。

**重量推移グラフ**: index.htmlの各行にある「📈 履歴」ボタン（`showHistory(specimenId)`）から、Chart.js（CDN）で試験体ごとの重量推移を線グラフ表示する。データはGET `?action=get_measurements`で取得し、`let allMeasurements`にページ内キャッシュ（初回クリック時に1回だけ取得、「データを更新」ボタンでクリアされ次回取得し直す）。GAS側のこのアクションは2026-09-01にユーザー自身がスプレッドシートの実データを見ながら追加・デプロイした。

**GAS本体のソースはこのリポジトリに含まれない**: バックエンドはGoogle Apps Scriptプロジェクト側で管理されており、`git clone`しても見えない。中身を確認・変更する必要がある場合はユーザーに共有してもらうこと。**Apps Scriptのウェブエディタをブラウザ自動操作で直接編集するのは避けること** — 過去に特殊キー名（例:「Page_Down」）がキー入力として認識されず、コード編集領域にリテラル文字列として挿入されてしまい、本番スクリプトを一時的に壊しかけた事故がある（`Ctrl+Z`で復旧済み）。閲覧のみ（`get_page_text`やスクリーンショット）に留め、スクロールはページ内リンクや`PageDown`ではなく安全な手段（クリック＋矢印キーなど動作確認済みの方法）を使うこと。

## デザインシステム

- `styles.css`は全ページで読み込まれ、Googleフォント「Zen Kaku Gothic New」と、いくつかの小さな自作ユーティリティ（`.grain-line`、選択範囲/スクロールバーの配色）を定義している。それ以外はすべてインラインのTailwindユーティリティクラスで、コンポーネントライブラリや`tailwind.config`は存在しない。
- 配色は意図的にamber/slate/stone系（「木質材料ラボ」らしさを出すため）で、Tailwindのデフォルト（gray系）ではない: `amber-600/700/800` = 主要アクセント/リンク/ボタン、`slate-800/900` = ヘッダーなど暗い面、`stone-*` = `gray-*`の代わりに使う中立の背景/文字/枠線。`blue-*`/`indigo-*`/`gray-*`クラスを再度使わないこと — 過去に全ページ一括で置き換え済み。
- ヘッダー（`header.js`）は固定高さ（`h-40 md:h-60`）の`position: relative`要素で、タイトルバーの背面に絶対配置の写真スライドショーがあり、ドロップダウンメニュー（`#global-mobile-menu`）はその固定高さの下にはみ出す前提で配置されている。**外側の`<header>`要素に`overflow-hidden`を付けないこと** — メニュー下半分がクリップされてクリックできなくなる。何かをクリップする必要がある場合（スライドショー写真など）は、既に`overflow-hidden`を持つ内側の`#header-slideshow`div側に限定すること。
