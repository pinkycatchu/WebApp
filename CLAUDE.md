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

**アラート／確認ダイアログ**: ブラウザ標準の`alert()`/`confirm()`は使わない（オリジン名がタイトルに出てしまうため）。代わりに`header.js`が公開する`window.showAlert(message)` / `window.showConfirm(message)`（いずれもPromiseを返す自作モーダル、デザイントークン準拠）を使う。呼び出し元が非同期関数内でメッセージ表示後に画面遷移やリダイレクトを行う場合は`await`すること（表示直後に遷移してしまうのを防ぐため）。新しいページで確認・通知が必要になっても`alert()`/`confirm()`を直書きしないこと。

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

- `styles.css`は全ページで読み込まれ、Googleフォント「Inter」「Inter Tight」（`DESIGN.md`のSeline系デザインシステムにおけるRoobertの代替、大見出しには`.font-display`クラスを付与）と、いくつかの小さな自作ユーティリティ（`.grain-line`、選択範囲/スクロールバーの配色）を定義している。それ以外はすべてインラインのTailwindユーティリティクラスで、コンポーネントライブラリや`tailwind.config`は存在しない。
- 配色は`DESIGN.md`のトークンに準拠（2026-09-01に全ページ移行済み）: 中立色はTailwindの`stone-*`スケールがそのままトークンと一致する（`stone-50`=Stone Canvas、`stone-300`=Stone Muted、`stone-400`=Ash Gray、`stone-500`=Warm Gray、`stone-900`=Soot、`stone-950`=Ink Black）ためTailwindクラスをそのまま使う。唯一の彩度アクセントはシアン（`bg-[#3ba6f1]`＝Cyan Signal、`text-[#3398e1]`＝Cyan Edge、`bg-[#c1e1f7]`＝Sky Wash）で、旧来のamber/slate系クラスの代わりに使う。ボタンは`rounded-full`のピル型、カードは`rounded-[10px]`、入力欄は`rounded-[6px]`、カード影は`shadow-[0_4px_16px_rgba(0,0,0,0.05)]`、モーダル等の強調影は`shadow-[0_12px_45px_rgba(17,12,46,0.12)]`。ただし状態バッジ・警告文・緊急連絡ボタンなど意味を持つ色（`emerald-*`=正常稼働、`red-*`=警告・危険・緊急）はDESIGN.mdの単色主義の例外として残してある — 新しい装飾用アクセントとしてこれらを増やさないこと。`blue-*`/`indigo-*`/`gray-*`クラス（Tailwindのデフォルト彩度違い）は使わず、シアンは必ず上記の`#3ba6f1`/`#3398e1`のアービトラリ値で指定すること。
- ヘッダー（`header.js`）は固定高さ（`h-40 md:h-60`）の`position: relative`要素で、タイトルバーの背面に絶対配置の写真スライドショーがあり、ドロップダウンメニュー（`#global-mobile-menu`）はその固定高さの下にはみ出す前提で配置されている。**外側の`<header>`要素に`overflow-hidden`を付けないこと** — メニュー下半分がクリップされてクリックできなくなる。何かをクリップする必要がある場合（スライドショー写真など）は、既に`overflow-hidden`を持つ内側の`#header-slideshow`div側に限定すること。タイトルバー＋メニューを内包するラッパーdivは、直後に続く`.grain-line`（ヘッダー下端のシアン区切り線）より必ず高いz-index（`z-30`）を持たせること — 同値だとDOM順で後にある`.grain-line`が（子要素の`z-50`に関わらず）ラッパー全体の上に重なり、開いたメニューを線が横切って見えるバグになる。
- ページ背景（`html, body`、全ページ共通）には方眼紙風の極薄グリッド（`rgba(28,25,23,0.035)`の1pxライン、32px間隔）を敷いている。DESIGN.mdの単色主義・パターンは「グラデーション/グラスモーフィズム/装飾的なカラーウォッシュ禁止」だが、これは無彩色の構造的テクスチャなのでその制約には抵触しない、という判断。新たな装飾（別のグラデーションや彩度のある背景）を足す前にこの制約を思い出すこと。

## 更新履歴

### 2026-09-01: DESIGN.md（Seline系デザインシステム）に基づくUI刷新
- リポジトリ直下に追加された`DESIGN.md`（Selineというアナリティクス系SaaSの配色・タイポグラフィ・コンポーネント仕様）に沿って、全ページ（`index.html`/`form.html`/`photo.html`/`calendar.html`/`materials.html`/`howtouse.html`/`contact.html`）と`header.js`/`styles.css`の配色・角丸・シャドウ・フォントを刷新した。詳細なトークン運用ルールは上の「デザインシステム」節に反映済み。
- 判断: 状態バッジ（暴露期間中=emerald）・警告文・緊急連絡先ボタンなど**意味を持つ色**（emerald/red）はDESIGN.mdの単色主義（シアンのみが彩度アクセント）の例外として維持し、装飾目的のamber/slateアクセントのみシアンに統一した。
- `theme.css`・`variables.css`・`tokens.json`（同時に追加された未追跡ファイル）はDESIGN.mdと同一トークンをTailwind v4/CSS変数/Design Tokens JSON形式でエクスポートしただけの添付ファイルで、どのHTMLからも読み込まれていないことを確認済み（今回リポジトリに追加）。
- パスワード認証後の実画面（一覧テーブル・一括移動バー・重量測定履歴モーダル・ドロップダウンメニュー・form/photo/calendar/materials/contact各ページ）をローカルサーバー＋ブラウザ操作で目視確認済み。
- コミット`cb02714`でpush済み。

### 2026-09-01: 背景テクスチャ追加・ヘッダーメニューのz-index修正・alert/confirmの自作モーダル化
- 「白背景が寂しい」というフィードバックを受け、`styles.css`の`html, body`に方眼紙風の極薄グリッド背景を追加（詳細は「デザインシステム」節）。DESIGN.mdのグラデーション/カラーウォッシュ禁止ルールには抵触しない無彩色テクスチャとして採用。
- ハンバーガーメニューを開いたときにヘッダー下端の`.grain-line`（シアンの区切り線）がメニューの上に重なって見えるバグを修正。原因はタイトルバー＋メニューのラッパーdivと`.grain-line`が同じ`z-20`だったため、DOM順で後にある`.grain-line`側が全体を覆っていたこと。ラッパー側を`z-30`に上げて解消（`header.js`）。
- ブラウザ標準の`alert()`/`confirm()`はページのオリジン名（例:「pinkycatchu.github.io says」）がダイアログタイトルに出てしまい消せないため、`header.js`に自作の`window.showAlert()`/`window.showConfirm()`（Promiseベース、デザイントークン準拠のモーダル）を追加し、全ページの呼び出し箇所を置き換えた。運用ルールは上の「アーキテクチャ」節に追記済み。
- ローカルサーバー＋ブラウザ操作で、背景グリッドの表示・ハンバーガーメニューの重なり解消・自作アラートダイアログの表示（オリジン名タイトルが出ないこと）を目視確認済み。
