// =========================================================================
// สคริปต์ส่วนกลางของร้าน Cloudy Pillow (เชื่อมสถานะสมาชิกและตะกร้าทุกหน้า)
// =========================================================================
(function () {
  const CURRENT_USER_KEY = 'cloudy_pillow_current_user';
  const CART_STORAGE_KEY = 'cloudy_pillow_cart';

  // สร้างรูปโปรไฟล์ SVG ใบหน้าผู้ชายหรือผู้หญิงสไตล์มินิมอลพาสเทล
  function createGlobalGenderAvatar(gender) {
    if (gender === 'male') {
      return `
        <svg class="w-6 h-6 rounded-full shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#E0F2FE"/>
          <path d="M22 94C24 76 36 68 50 68C64 68 76 76 78 94" fill="#60A5FA"/>
          <rect x="43" y="56" width="14" height="15" rx="6" fill="#FDE2CE"/>
          <circle cx="50" cy="44" r="19" fill="#FFE8D6"/>
          <path d="M31 42C30 27 39 20 51 20C63 20 70 28 69 42C66 34 61 31 53 31C44 31 36 34 31 42Z" fill="#3B2F4A"/>
          <circle cx="43" cy="44" r="2.3" fill="#2D2438"/>
          <circle cx="57" cy="44" r="2.3" fill="#2D2438"/>
          <path d="M45 51.5C47.5 54 52.5 54 55 51.5" stroke="#2D2438" stroke-width="2.2" stroke-linecap="round"/>
        </svg>
      `;
    }
    return `
      <svg class="w-6 h-6 rounded-full shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="50" fill="#FCE7F3"/>
        <path d="M26 46C26 26 37 18 50 18C63 18 74 26 74 46L77 74C70 78 30 78 23 74L26 46Z" fill="#4A355C"/>
        <path d="M22 94C24 76 36 68 50 68C64 68 76 76 78 94" fill="#F472B6"/>
        <rect x="43" y="56" width="14" height="15" rx="6" fill="#FDE2CE"/>
        <circle cx="50" cy="44" r="18.5" fill="#FFE8D6"/>
        <path d="M31.5 41C32 27 40 21 50 21C60 21 68 27 68.5 41C63 34 57 32 50 35C43 32 37 34 31.5 41Z" fill="#4A355C"/>
        <circle cx="43" cy="45" r="2.3" fill="#2D2438"/>
        <circle cx="57" cy="45" r="2.3" fill="#2D2438"/>
        <path d="M45.5 52C47.8 54.3 52.2 54.3 54.5 52" stroke="#2D2438" stroke-width="2.2" stroke-linecap="round"/>
      </svg>
    `;
  }

  // อัปเดตตัวเลขตะกร้าและแนบรหัสสินค้าไปกับลิงก์ cart.html ทุกปุ่มบนหน้าเว็บ
  window.syncGlobalCartLinks = function () {
    try {
      const savedCart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
      if (!Array.isArray(savedCart)) return;

      const totalQty = savedCart.reduce((sum, item) => sum + (item.qty || 1), 0);
      const badge = document.getElementById('cart-badge');
      if (badge) {
        badge.textContent = totalQty;
      }

      const allIds = [];
      savedCart.forEach((it) => {
        for (let i = 0; i < (it.qty || 1); i++) {
          allIds.push(it.id);
        }
      });

      const cartUrl = allIds.length > 0
        ? 'cart.html?items=' + encodeURIComponent(allIds.join(','))
        : 'cart.html';

      document.querySelectorAll('a[href*="cart.html"]').forEach((link) => {
        link.href = cartUrl;
      });
    } catch (e) {}
  };

  // อัปเดตแถบเมนูด้านบนทุกหน้าให้แสดงชื่อสมาชิก รูปโปรไฟล์ และซิงค์ตะกร้าสินค้า
  function syncGlobalNavbarState() {
    let currentUser = null;
    try {
      currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
    } catch (e) {}

    if (currentUser && currentUser.email) {
      const displayName = currentUser.name || currentUser.email.split('@')[0];
      const avatarSvg = createGlobalGenderAvatar(currentUser.gender || 'female');

      document.querySelectorAll('header a[href*="login.html"], #mobile-menu a[href*="login.html"]').forEach((link) => {
        link.innerHTML = `${avatarSvg}<span class="truncate max-w-[120px]">${displayName}</span>`;
        link.title = `บัญชีของ ${displayName} (คลิกเพื่อดูข้อมูลสมาชิก)`;
        link.classList.remove('bg-slate-50', 'text-slate-700');
        link.classList.add('bg-purple-100', 'text-purple-700', 'border-purple-200', 'font-semibold');
      });
    }

    window.syncGlobalCartLinks();
  }

  // ดักจับการคลิกลิงก์ไปหน้า cart.html ทุกปุ่มเพื่อแนบข้อมูลตะกร้าล่าสุดเสมอ
  document.addEventListener('click', function (e) {
    const link = e.target.closest('a[href*="cart.html"]');
    if (link) {
      window.syncGlobalCartLinks();
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncGlobalNavbarState);
  } else {
    syncGlobalNavbarState();
  }
})();