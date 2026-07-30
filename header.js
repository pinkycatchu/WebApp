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
  <div id="global-login-overlay" class="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center z-50 ${window.appPassword ? 'hidden' : ''}">
    <div class="bg-white p-6 rounded shadow-lg max-w-sm w-full mx-4">
      <h2 class="text-xl font-bold mb-4 text-center">システムへのログイン</h2>
      <input type="password" id="global-login-password" placeholder="パスワードを入力" class="w-full border p-2.5 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
      <button onclick="globalLogin()" class="w-full bg-blue-600 text-white font-bold py-2.5 rounded hover:bg-blue-700 transition">ログイン</button>
    </div>
  </div>
  `;

  // 2. 共通ヘッダーのHTML
  const headerHtml = `
  <header class="shadow-md relative z-40 mb-6 bg-white">
    
    <!-- ▼ 修正：フェード対応のスライドショーエリア ▼ -->
    <div id="header-slideshow" class="w-full h-32 md:h-48 bg-gray-800 relative overflow-hidden">
      <!-- 2つの画像レイヤーを重ねて透明度を交互に切り替える -->
      <div id="slide-bg-1" class="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out opacity-100"></div>
      <div id="slide-bg-2" class="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms] ease-in-out opacity-0"></div>
      <div class="absolute inset-0 bg-black bg-opacity-30 z-10"></div> <!-- 写真を少し暗くして落ち着かせる -->
    </div>

    <!-- 従来の青いタイトルバー -->
    <div class="bg-blue-600 text-white relative">
      <div class="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 class="text-lg md:text-xl font-bold">${headerTitle}</h1>
        <div class="flex items-center gap-3">
          <a href='contact.html' class="hidden sm:block bg-red-500 text-white font-semibold px-4 py-2 rounded shadow hover:bg-red-600 transition duration-150">
            連絡先
          </a>
          <a href=${currentPage === 'index.html' ? 'form.html' : 'index.html'} class="hidden sm:block bg-white text-blue-600 font-semibold px-4 py-2 rounded shadow hover:bg-blue-50 transition duration-150">
            ${currentPage === 'index.html' ? '＋入力へ' : 'HOME'}
          </a>
          <button onclick="toggleGlobalMenu()" class="text-white hover:bg-blue-700 p-2 rounded focus:outline-none transition duration-150">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 共通メニュー（現在のページを自動でハイライト） -->
    <div id="global-mobile-menu" class="hidden absolute right-4 top-46 bg-white text-gray-800 rounded shadow-xl border border-gray-200 w-56 overflow-hidden z-50">
      <a href="index.html" class="block px-4 py-3 hover:bg-gray-100 border-b text-sm font-semibold ${currentPage === 'index.html' ? 'bg-blue-50 text-blue-700 font-bold' : ''}">HOME</a>

      <a href="form.html" class="block px-4 py-3 hover:bg-gray-100 border-b text-sm ${currentPage === 'form.html' ? 'bg-blue-50 text-blue-700 font-bold' : ''}">＋ 測定・移動入力</a>

      <a href="photo.html" class="block px-4 py-3 hover:bg-gray-100 border-b text-sm ${currentPage === 'photo.html' ? 'bg-blue-50 text-blue-700 font-bold' : ''}">ギャラリー</a>

      <a href="calendar.html" class="block px-4 py-3 hover:bg-gray-100 border-b text-sm ${currentPage === 'calendar.html' ? 'bg-blue-50 text-blue-700 font-bold' : ''}">カレンダー</a>

      <a href="materials.html" class="block px-4 py-3 hover:bg-gray-100 border-b text-sm ${currentPage === 'materials.html' ? 'bg-blue-50 text-blue-700 font-bold' : ''}">資料ページ</a>

      <a href="howtouse.html" class="block px-4 py-3 hover:bg-gray-100 border-b text-sm ${currentPage === 'howtouse.html' ? 'bg-blue-50 text-blue-700 font-bold' : ''}">使い方マニュアル</a>

      <a href="contact.html" class="block px-4 py-3 hover:bg-gray-100 border-b text-sm ${currentPage === 'contact.html' ? 'bg-blue-50 text-blue-700 font-bold' : ''}">お問い合わせ</a>

      <button onclick="logout()" class="w-full text-left block px-4 py-3 hover:bg-red-50 text-red-600 text-sm font-medium">ログアウト</button>
    </div>
  </header>
  `;

  // bodyの先頭にログイン画面とヘッダーを挿入
  document.body.insertAdjacentHTML('afterbegin', loginHtml + headerHtml);

  // パスワードがあればスライドショーを開始
  if (window.appPassword && window.GAS_API_URL_GLOBAL) {
    startSlideshow();
  }
})();

// 3. スライドショー機能のロジック（クロスフェード対応）
async function startSlideshow() {
  try {
    const res = await fetch(`${window.GAS_API_URL_GLOBAL}?password=${encodeURIComponent(window.appPassword)}&action=get_photos`);
    const json = await res.json();
    
    if (json.status === "success" && json.data.length > 0) {
      const photos = json.data;
      let currentIndex = 0;
      let activeLayer = 1;
      const layer1 = document.getElementById('slide-bg-1');
      const layer2 = document.getElementById('slide-bg-2');
      
      // 初回の画像をレイヤー1にセット
      const firstUrl = `https://drive.google.com/thumbnail?id=${photos[0].id}&sz=w1000`;
      layer1.style.backgroundImage = `url('${firstUrl}')`;
      
      // 写真が1枚しかない場合は切り替え処理を行わない
      if (photos.length <= 1) return;

      // 画像を交互にフェードイン・フェードアウトさせる関数
      function updateImage() {
        currentIndex = (currentIndex + 1) % photos.length;
        const nextUrl = `https://drive.google.com/thumbnail?id=${photos[currentIndex].id}&sz=w1000`;
        
        if (activeLayer === 1) {
          // レイヤー2に次の画像をセットして表示、レイヤー1を隠す
          layer2.style.backgroundImage = `url('${nextUrl}')`;
          layer2.classList.replace('opacity-0', 'opacity-100');
          layer1.classList.replace('opacity-100', 'opacity-0');
          activeLayer = 2;
        } else {
          // レイヤー1に次の画像をセットして表示、レイヤー2を隠す
          layer1.style.backgroundImage = `url('${nextUrl}')`;
          layer1.classList.replace('opacity-0', 'opacity-100');
          layer2.classList.replace('opacity-100', 'opacity-0');
          activeLayer = 1;
        }
      }
      
      setInterval(updateImage, 8000); // 10秒ごとに切り替え
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