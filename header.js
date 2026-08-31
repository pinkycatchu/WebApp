// 全ページで共通して使えるパスワード変数
window.appPassword = localStorage.getItem('app_password') || '';

(function() {
  // 現在のファイル名を取得（アクティブなリンクを判定するため）
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
// ページごとのタイトルを定義しておく
  const pageTitles = {
    'index.html': '暴露試験体管理',
    'form.html': '測定・移動 データ入力',
    'photo.html': 'ギャラリー',
    'calendar.html': '試験予定カレンダー',
    'materials.html': '修論・参考資料'
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
  <header class="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md relative z-40 mb-6">
    <div class="container mx-auto px-4 py-3 flex justify-between items-center">
      <div class="flex items-center gap-3 min-w-0">
        <img src="images/labologo.png" alt="研究室ロゴ" class="w-8 h-8 rounded shrink-0 hidden sm:block">
        <div class="min-w-0">
          <p class="text-[10px] tracking-[0.2em] text-amber-400/90 font-semibold leading-none mb-1 hidden sm:block">WOOD MATERIALS LAB</p>
          <h1 class="text-lg md:text-xl font-bold truncate">${headerTitle}</h1>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
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
    <div class="grain-line"></div>

    <!-- 共通メニュー（現在のページを自動でハイライト） -->
    <div id="global-mobile-menu" class="hidden absolute right-4 top-16 bg-white text-stone-800 rounded-xl shadow-2xl border border-stone-200 w-56 overflow-hidden z-50">
      <a href="index.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm font-semibold ${currentPage === 'index.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">HOME</a>

      <a href="form.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'form.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">＋ 測定・移動入力</a>

      <a href="photo.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'photo.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">ギャラリー</a>

      <a href="calendar.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'calendar.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">カレンダー</a>

      <a href="materials.html" class="block px-4 py-3 hover:bg-stone-50 border-b border-stone-100 text-sm ${currentPage === 'materials.html' ? 'bg-amber-50 text-amber-800 border-l-4 border-l-amber-600 font-bold' : ''}">資料ページ</a>

      <button onclick="logout()" class="w-full text-left block px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-medium">ログアウト</button>
    </div>
  </header>
  `;

// bodyの先頭にログイン画面とヘッダーを挿入
  document.body.insertAdjacentHTML('afterbegin', loginHtml + headerHtml);
})();

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