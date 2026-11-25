/**
 * 木口撮影（crack.html?mode=koguchi）のための GAS 側の追加分（2026-11-25）。
 * GAS 本体はこのリポジトリにないので、Apps Script のエディタで sheet2API.gs に手で貼る。
 *
 * 1. この3つの関数を sheet2API.gs の末尾に貼る。
 * 2. doPost の upload_photo の処理で、_crack_ を振り分けている if の「前」に次の3行を足す
 *    （ファイル名に _crack_ と _koguchi_ が両方入ることはないので、順番はどちらでもよい）:
 *
 *      if (filename.indexOf("_koguchi_") !== -1) {
 *        return saveKoguchiPhoto_(filename, base64Data, contentType);
 *      }
 *
 *    （変数名 filename / base64Data / contentType は、今のコードで使っている名前に合わせる。
 *      戻り値は今の upload_photo の成功時と同じ形の ContentService の JSON にしてある）
 * 3. doGet の action の分岐に次を足す（get_crack_photos の隣）:
 *
 *      if (action === "get_koguchi_photos") return getKoguchiPhotos_();
 *
 * 4. 「デプロイを管理」→ 既存のデプロイを編集 → 新しいバージョン（URL は変わらない）。
 */

// 保存先：大学アカウントのドライブの Master_Thesis/data/Strength_Test/photos_koguchi/パネルID/
// Strength_Test フォルダの ID（URL の /folders/ の後ろ）。割れの Crack_Photos と同じく、
// GAS を動かす Gmail アカウントに編集者として共有されている必要がある。
const STRENGTH_TEST_FOLDER_ID = "ここに Strength_Test フォルダのIDを入れる";
const KOGUCHI_FOLDER_NAME = "photos_koguchi";  // 節・破壊形態の写真（photos/）とは分ける

function getKoguchiRoot_() {
  const strengthTest = DriveApp.getFolderById(STRENGTH_TEST_FOLDER_ID);
  const found = strengthTest.getFoldersByName(KOGUCHI_FOLDER_NAME);
  return found.hasNext() ? found.next() : strengthTest.createFolder(KOGUCHI_FOLDER_NAME);
}

// ファイル名は「試験片ID_koguchi_面コード_日時.jpg」（例 CC-CLT-03-01-S4_koguchi_bearing_20261125_153000.jpg）。
// パネルID は試験片IDの最後の「-S4」などを除いたもの
function saveKoguchiPhoto_(filename, base64Data, contentType) {
  const pieceId = filename.split("_koguchi_")[0];
  const panelId = pieceId.replace(/-[SW]\d+$/, "");
  const root = getKoguchiRoot_();
  const found = root.getFoldersByName(panelId);
  const folder = found.hasNext() ? found.next() : root.createFolder(panelId);
  // 割れと同じく、縮小・再圧縮せずにそのまま保存する（"data:image/jpeg;base64," の前置きを外す）
  const data = Utilities.base64Decode(String(base64Data).replace(/^data:[^,]*,/, ""));
  const file = folder.createFile(Utilities.newBlob(data, contentType || "image/jpeg", filename));
  return ContentService.createTextOutput(JSON.stringify({ status: "success", id: file.getId(), name: filename }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 撮影済みの表示用。パネルごとのフォルダをまとめて、ファイル名の一覧を返す（get_crack_photos と同じ形）
function getKoguchiPhotos_() {
  const photos = [];
  const panels = getKoguchiRoot_().getFolders();
  while (panels.hasNext()) {
    const files = panels.next().getFiles();
    while (files.hasNext()) {
      const file = files.next();
      photos.push({ id: file.getId(), name: file.getName(), date: file.getDateCreated() });
    }
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success", data: photos }))
    .setMimeType(ContentService.MimeType.JSON);
}
