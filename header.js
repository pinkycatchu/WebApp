// ★ ご自身のGASウェブアプリURLを貼り付けてください ★
window.GAS_API_URL_GLOBAL = "https://script.google.com/macros/s/AKfycbwYhNRKqGiB4aZslbkChTbivspwoe7yUk0w8ikYX_dyG7dC2m6kBKrkyTFg6duDy_vAFg/exec";

// 全ページで共通して使えるパスワード変数
window.appPassword = localStorage.getItem('app_password') || '';

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
  <div id="global-login-overlay" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex justify-center items-center z-50 ${window.appPassword ? 'hidden' : ''}">
    <div class="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-stone-200">
      <img src="images/labologo.png" alt="研究室ロゴ" class="w-12 h-12 mx-auto mb-4 rounded-md">
      <p class="text-center text-[11px] tracking-[0.2em] text-amber-700 font-semibold mb-1">WOOD MATERIALS LAB</p>
      <h2 class="text-lg font-bold mb-6 text-center text-slate-900">システムへのログイン</h2>
      <input type="password" id="global-login-password" placeholder="パスワードを入力" class="w-full border border-stone-300 p-2.5 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition">
      <button onclick="globalLogin()" class="w-full bg-amber-700 text-white font-bold py-2.5 rounded-lg hover:bg-amber-800 shadow-sm transition">ログイン</button>
    </div>
  </div>
  `;

  // 2. 共通ヘッダーのHTML
  const headerHtml = `
  <header class="shadow-md relative z-40 mb-6 bg-slate-900">

    <!-- ▼ 1. 背面に敷くスライドショーエリア（絶対配置でヘッダー全体を覆う） ▼ -->
    <div id="header-slideshow" class="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden z-0">
      <div id="slide-bg-1" class="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out opacity-100"></div>
      <div id="slide-bg-2" class="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out opacity-0"></div>
      <!-- 文字を読みやすくするための暗いフィルター（木目調に寄せた濃紺〜琥珀のグラデーション） -->
      <div class="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-950/55 to-slate-950/90 z-10"></div>
    </div>

    <!-- ▼ 2. 前面に重ねるタイトルバー＆メニューエリア ▼ -->
    <div class="relative z-20 h-40 md:h-60 flex flex-col">

      <!-- タイトルバー -->
      <div class="w-full text-white pt-2">
        <div class="container mx-auto px-4 py-3 flex justify-between items-center">
          <div class="flex items-center gap-3 min-w-0">
            <img src="images/labologo.png" alt="研究室ロゴ" class="w-8 h-8 rounded shrink-0 hidden sm:block">
            <div class="min-w-0">
              <p class="text-[10px] tracking-[0.2em] text-amber-400/90 font-semibold leading-none mb-1 hidden sm:block">WOOD MATERIALS LAB</p>
              <h1 class="text-lg md:text-2xl font-bold truncate"><a href="index.html">${headerTitle}</a></h1>
            </div>
          </div>
          <div class="flex items-center gap-3 shrink-0">
            <a href='contact.html' class="hidden sm:block bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-red-500 transition duration-150">
              緊急連絡先
            </a>
            <a href=${currentPage === 'index.html' ? 'form.html' : 'index.html'} class="hidden sm:block bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg shadow hover:bg-amber-500 transition duration-150">
                ${currentPage === 'index.html' ? '＋入力へ' : 'HOME'}
            </a>
            <button onclick="toggleGlobalMenu()" class="text-white hover:bg-white/10 p-2 rounded-lg focus:outline-none transition duration-150">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 共通メニュー（現在のページを自動でハイライト） -->
      <div id="global-mobile-menu" class="hidden absolute right-4 top-14 bg-white text-stone-800 rounded-xl shadow-2xl border border-stone-200 w-56 overflow-hidden z-50">
        <a href="index.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm font-semibold ${currentPage === 'index.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">HOME</a>

        <a href="form.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'form.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">＋ 測定・移動入力</a>

        <a href="photo.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'photo.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">ギャラリー</a>

        <a href="calendar.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'calendar.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">カレンダー</a>

        <a href="materials.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'materials.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">資料ページ</a>

        <a href="howtouse.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'howtouse.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">使い方マニュアル</a>

        <a href="contact.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'contact.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">お問い合わせ</a>

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
          <p class="text-[10px] tracking-[0.2em] text-amber-700 font-semibold mb-1">WOOD MATERIALS LAB</p>
          <p class="font-bold text-stone-800 text-sm leading-snug">東京大学大学院 農学生命科学研究科</p>
          <p class="text-stone-500 text-sm leading-snug">木質材料学研究室 — 暴露試験体管理システム</p>
        </div>
      </div>
      <nav class="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-sm text-stone-600">
        <a href="index.html" class="hover:text-amber-700 transition">HOME</a>
        <a href="form.html" class="hover:text-amber-700 transition">測定・移動入力</a>
        <a href="photo.html" class="hover:text-amber-700 transition">ギャラリー</a>
        <a href="calendar.html" class="hover:text-amber-700 transition">カレンダー</a>
        <a href="materials.html" class="hover:text-amber-700 transition">資料ページ</a>
        <a href="howtouse.html" class="hover:text-amber-700 transition">使い方マニュアル</a>
        <a href="contact.html" class="hover:text-amber-700 transition">お問い合わせ</a>
      </nav>
    </div>
    <div class="border-t border-stone-100 py-4 text-center text-xs text-stone-400">
      &copy; ${new Date().getFullYear()} Wood Materials Lab, The University of Tokyo
    </div>
  </footer>
  `;

  // bodyの先頭にログイン画面とヘッダーを挿入
  document.body.insertAdjacentHTML('afterbegin', loginHtml + headerHtml);

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