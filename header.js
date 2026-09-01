// ★ ご自身のGASウェブアプリURLを貼り付けてください ★
window.GAS_API_URL_GLOBAL = "https://script.google.com/macros/s/AKfycbwYhNRKqGiB4aZslbkChTbivspwoe7yUk0w8ikYX_dyG7dC2m6kBKrkyTFg6duDy_vAFg/exec";

// 全ページで共通して使えるパスワード変数
window.appPassword = localStorage.getItem('app_password') || '';

// 全ページで共通して使う移動先の場所リスト（index.htmlのフィルタとform.htmlの選択肢の両方で使用）
window.LOCATIONS = ["回収", "I-REF棟恒温室", "5号館恒温室", "7号館恒温恒湿室", "5号館屋上", "森林総合研究所"];

// 日付文字列を YYYY/MM/DD 形式に整形する共通関数
window.formatDateToYMD = function(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
};

// ログイン必須ページの先頭で呼ぶ共通チェック。未ログインならindex.htmlへ戻す
window.requireLogin = function() {
  if (!window.appPassword) {
    window.showAlert("ログインが必要です。").then(() => {
      window.location.href = "index.html";
    });
    return false;
  }
  return true;
};

// 自作アラート／確認ダイアログ（ブラウザ標準alert/confirmはページのオリジンが
// タイトルに出てしまうため、デザインシステムに合わせた自前モーダルで代替する）
function showCustomDialog(message, showCancel) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('custom-dialog-overlay');
    const messageEl = document.getElementById('custom-dialog-message');
    const okBtn = document.getElementById('custom-dialog-ok');
    const cancelBtn = document.getElementById('custom-dialog-cancel');

    messageEl.textContent = message;
    cancelBtn.classList.toggle('hidden', !showCancel);
    overlay.classList.remove('hidden');

    function cleanup(result) {
      overlay.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      resolve(result);
    }
    function onOk() { cleanup(true); }
    function onCancel() { cleanup(false); }

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

// alert()の代替。OKボタンが押されたら解決するPromiseを返す
window.showAlert = function(message) {
  return showCustomDialog(message, false);
};

// confirm()の代替。OK/キャンセルの選択結果（真偽値）で解決するPromiseを返す
window.showConfirm = function(message) {
  return showCustomDialog(message, true);
};

(function() {
  // 現在のファイル名を取得（アクティブなリンクを判定するため）
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
// ページごとのタイトルを定義しておく
  const pageTitles = {
    'index.html': '暴露試験体管理システム',
    'form.html': '測定・移動 データ入力',
    'photo.html': 'ギャラリー',
    'calendar.html': '試験予定カレンダー',
    'materials.html': '修論・参考資料',
    'howtouse.html': '使い方マニュアル',
    'contact.html': 'お問い合わせ',
  };
  
  // 現在のページに一致するタイトルを取得（なければデフォルト名）
  const headerTitle = pageTitles[currentPage] || '暴露試験体管理';

  // 1. 共通ログイン画面のHTML（パスワードがなければ表示）
  const loginHtml = `
  <div id="global-login-overlay" class="fixed inset-0 bg-stone-900/70 backdrop-blur-sm flex justify-center items-center z-50 ${window.appPassword ? 'hidden' : ''}">
    <div class="bg-white p-8 rounded-2xl shadow-[0_12px_45px_rgba(17,12,46,0.12)] max-w-sm w-full mx-4 border border-stone-200">
      <img src="images/labologo.png" alt="研究室ロゴ" class="w-12 h-12 mx-auto mb-4 rounded-md">
      <p class="text-center text-[11px] tracking-[0.2em] text-[#3398e1] font-semibold mb-1">WOOD MATERIALS LAB</p>
      <h2 class="font-display text-xl mb-6 text-center text-stone-950">システムへのログイン</h2>
      <input type="password" id="global-login-password" placeholder="パスワードを入力" class="w-full border border-stone-300 p-2.5 rounded-[6px] mb-4 focus:outline-none focus:ring-2 focus:ring-[#3ba6f1] focus:border-[#3ba6f1] transition">
      <button onclick="globalLogin()" class="w-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium py-2.5 rounded-full hover:bg-[#3398e1] shadow-sm transition">ログイン</button>
    </div>
  </div>
  `;

  // 1.5 共通アラート／確認ダイアログのHTML（alert()・confirm()の代替）
  const dialogHtml = `
  <div id="custom-dialog-overlay" class="fixed inset-0 bg-stone-900/70 backdrop-blur-sm flex justify-center items-center z-[60] hidden">
    <div class="bg-white p-6 rounded-[10px] shadow-[0_12px_45px_rgba(17,12,46,0.12)] max-w-sm w-full mx-4 border border-stone-200">
      <p id="custom-dialog-message" class="text-stone-800 text-sm whitespace-pre-line leading-relaxed mb-6"></p>
      <div class="flex justify-end gap-2">
        <button id="custom-dialog-cancel" class="hidden px-4 py-2 rounded-full text-sm font-medium border border-stone-300 text-stone-700 hover:bg-stone-50 transition">キャンセル</button>
        <button id="custom-dialog-ok" class="px-4 py-2 rounded-full text-sm font-medium bg-[#3ba6f1] border border-[#3398e1] text-white hover:bg-[#3398e1] shadow-sm transition">OK</button>
      </div>
    </div>
  </div>
  `;

  // 2. 共通ヘッダーのHTML
  const headerHtml = `
  <header class="shadow-sm relative z-40 mb-6 bg-stone-900">

    <!-- ▼ 1. 背面に敷くスライドショーエリア（絶対配置でヘッダー全体を覆う） ▼ -->
    <div id="header-slideshow" class="absolute inset-0 w-full h-full bg-stone-900 overflow-hidden z-0">
      <div id="slide-bg-1" class="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out opacity-100"></div>
      <div id="slide-bg-2" class="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out opacity-0"></div>
      <!-- 文字を読みやすくするための暗いフィルター（フラットなsoot半透明スクリム） -->
      <div class="absolute inset-0 bg-stone-900/65 z-10"></div>
    </div>

    <!-- ▼ 2. 前面に重ねるタイトルバー＆メニューエリア ▼ -->
    <!-- z-30固定: 同z-indexだと後述の.grain-lineがDOM順で上に来て開いたメニューを横切ってしまうため -->
    <div class="relative z-30 h-40 md:h-60 flex flex-col">

      <!-- タイトルバー -->
      <div class="w-full text-white pt-2">
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
          <div class="flex items-center gap-3 min-w-0">
            <img src="images/labologo.png" alt="研究室ロゴ" class="w-8 h-8 rounded shrink-0 hidden sm:block">
            <div class="min-w-0">
              <p class="text-[10px] tracking-[0.2em] text-[#3ba6f1]/90 font-semibold leading-none mb-1 hidden sm:block">WOOD MATERIALS LAB</p>
              <h1 class="font-display text-lg md:text-2xl truncate"><a href="index.html">${headerTitle}</a></h1>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <a href='contact.html' class="hidden sm:block bg-red-600 text-white font-medium px-4 py-2 rounded-full shadow-sm hover:bg-red-500 transition duration-150">
              緊急連絡先
            </a>
            <a href=${currentPage === 'index.html' ? 'form.html' : 'index.html'} class="hidden sm:block bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-4 py-2 rounded-full shadow-sm hover:bg-[#3398e1] transition duration-150">
                ${currentPage === 'index.html' ? '＋入力へ' : 'HOME'}
            </a>
            <button onclick="toggleGlobalMenu()" class="text-white hover:bg-white/10 p-2 rounded-full focus:outline-none transition duration-150">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 共通メニュー（現在のページを自動でハイライト） -->
      <div id="global-mobile-menu" class="hidden absolute right-4 top-14 bg-white text-stone-800 rounded-[10px] shadow-[0_4px_16px_rgba(0,0,0,0.05)] border border-stone-200 w-56 overflow-hidden z-50">
        <a href="index.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm font-medium ${currentPage === 'index.html' ? 'bg-[#c1e1f7]/40 text-[#3398e1] border-l-4 border-l-[#3ba6f1] font-semibold' : ''}">HOME</a>

        <a href="form.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'form.html' ? 'bg-[#c1e1f7]/40 text-[#3398e1] border-l-4 border-l-[#3ba6f1] font-semibold' : ''}">＋ 測定・移動入力</a>

        <a href="photo.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'photo.html' ? 'bg-[#c1e1f7]/40 text-[#3398e1] border-l-4 border-l-[#3ba6f1] font-semibold' : ''}">ギャラリー</a>

        <a href="calendar.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'calendar.html' ? 'bg-[#c1e1f7]/40 text-[#3398e1] border-l-4 border-l-[#3ba6f1] font-semibold' : ''}">カレンダー</a>

        <a href="materials.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'materials.html' ? 'bg-[#c1e1f7]/40 text-[#3398e1] border-l-4 border-l-[#3ba6f1] font-semibold' : ''}">資料ページ</a>

        <a href="howtouse.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'howtouse.html' ? 'bg-[#c1e1f7]/40 text-[#3398e1] border-l-4 border-l-[#3ba6f1] font-semibold' : ''}">使い方マニュアル</a>

        <a href="contact.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'contact.html' ? 'bg-[#c1e1f7]/40 text-[#3398e1] border-l-4 border-l-[#3ba6f1] font-semibold' : ''}">お問い合わせ</a>

        <button onclick="logout()" class="w-full text-left block px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-medium">ログアウト</button>
      </div>

    </div>
    <div class="grain-line relative z-20"></div>
  </header>
  `;

  // 3. 共通フッターのHTML
  const footerHtml = `
  <footer class="mt-16 border-t border-stone-200 bg-white">
    <div class="container mx-auto px-4 py-10 flex flex-col md:flex-row justify-between gap-8">
      <div class="flex items-start gap-3">
        <img src="images/labologo.png" alt="研究室ロゴ" class="w-10 h-10 rounded shrink-0">
        <div>
          <p class="text-[10px] tracking-[0.2em] text-[#3398e1] font-semibold mb-1">WOOD MATERIALS LAB</p>
          <p class="font-display text-base text-stone-950 leading-snug">東京大学大学院 農学生命科学研究科</p>
          <p class="text-stone-500 text-sm leading-snug">木質材料学研究室 — 暴露試験体管理システム</p>
        </div>
      </div>
      <nav class="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm text-stone-600">
        <a href="index.html" class="hover:text-[#3398e1] transition">HOME</a>
        <a href="form.html" class="hover:text-[#3398e1] transition">測定・移動入力</a>
        <a href="photo.html" class="hover:text-[#3398e1] transition">ギャラリー</a>
        <a href="calendar.html" class="hover:text-[#3398e1] transition">カレンダー</a>
        <a href="materials.html" class="hover:text-[#3398e1] transition">資料ページ</a>
        <a href="howtouse.html" class="hover:text-[#3398e1] transition">使い方マニュアル</a>
        <a href="contact.html" class="hover:text-[#3398e1] transition">お問い合わせ</a>
      </nav>
    </div>
    <div class="border-t border-stone-100 py-4 text-center text-xs text-stone-400">
      &copy; ${new Date().getFullYear()} Wood Materials Lab, The University of Tokyo
    </div>
  </footer>
  `;

  // bodyの先頭にログイン画面・ダイアログ・ヘッダーを挿入
  document.body.insertAdjacentHTML('afterbegin', loginHtml + dialogHtml + headerHtml);

  // パスワードがあればスライドショーを開始
  if (window.appPassword && window.GAS_API_URL_GLOBAL) {
    startSlideshow();
  }

  // ページ本文の描画が終わってからフッターを末尾に追加
  document.addEventListener('DOMContentLoaded', () => {
    document.body.insertAdjacentHTML('beforeend', footerHtml);
  });
})();

// 3. スライドショー機能のロジック（ランダム表示＆クロスフェード対応）
async function startSlideshow() {
  try {
    const res = await fetch(`${window.GAS_API_URL_GLOBAL}?password=${encodeURIComponent(window.appPassword)}&action=get_photos`);
    const json = await res.json();
    
    if (json.status === "success" && json.data.length > 0) {
      let photos = json.data;
      
      // 配列をランダムにシャッフルする処理
      for (let i = photos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [photos[i], photos[j]] = [photos[j], photos[i]];
      }

      let currentIndex = 0;
      let activeLayer = 1;
      
      const layer1 = document.getElementById('slide-bg-1');
      const layer2 = document.getElementById('slide-bg-2');
      
      // 初回の画像をレイヤー1にセット
      const firstUrl = `https://drive.google.com/thumbnail?id=${photos[0].id}&sz=w1000`;
      layer1.style.backgroundImage = `url('${firstUrl}')`;
      
      if (photos.length <= 1) return;

      // 画像を交互にフェードさせる関数
      function updateImage() {
        currentIndex = (currentIndex + 1) % photos.length;
        const nextPhoto = photos[currentIndex]; 
        const nextUrl = `https://drive.google.com/thumbnail?id=${nextPhoto.id}&sz=w1000`;
        
        if (activeLayer === 1) {
          // レイヤー2に次の画像をセットして表示
          layer2.style.backgroundImage = `url('${nextUrl}')`;
          
          layer2.classList.replace('opacity-0', 'opacity-100');
          layer1.classList.replace('opacity-100', 'opacity-0');
          activeLayer = 2;
        } else {
          // レイヤー1に次の画像をセットして表示
          layer1.style.backgroundImage = `url('${nextUrl}')`;
          
          layer1.classList.replace('opacity-0', 'opacity-100');
          layer2.classList.replace('opacity-100', 'opacity-0');
          activeLayer = 1;
        }
      }
      
      setInterval(updateImage, 8000); // 8秒ごとに切り替え
    }
  } catch (e) {
    console.error("スライドショーの読み込みをスキップしました", e);
  }
}

// 共通ログイン関数（入力後にページを再読み込みしてデータを取得する）
window.globalLogin = function() {
  const input = document.getElementById('global-login-password').value;
  if (input) {
    localStorage.setItem('app_password', input);
    window.location.reload();
  }
};

window.toggleGlobalMenu = function() {
  const menu = document.getElementById('global-mobile-menu');
  if (menu) menu.classList.toggle('hidden');
};

document.addEventListener('click', function(event) {
  const menu = document.getElementById('global-mobile-menu');
  if (!menu) return;
  const button = event.target.closest('button[onclick="toggleGlobalMenu()"]');
  if (!menu.classList.contains('hidden') && !button && !menu.contains(event.target)) {
    menu.classList.add('hidden');
  }
});

window.logout = function() {
  localStorage.removeItem('app_password');
  window.location.href = 'index.html';
};