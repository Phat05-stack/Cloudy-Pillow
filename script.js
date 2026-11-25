// เชื่อมต่อระบบหลังบ้าน Google Sheets ของร้าน Cloudy Pillow
window.CLOUDY_API_URL = 'https://script.google.com/macros/s/AKfycbxPTDSeVNgqaK2kkCJDMgkQonC00ZMnXPKdJn1uhGWOVlqE88ZuuBUnf7vcps9vWyDtqQ/exec';
window.CLOUDY_LIVE_STOCK = null;

(function () {
  const path = window.location.pathname.toLowerCase();
  const isHomePage =
    path === '/' ||
    path.endsWith('/index.html') ||
    path === '/index.html';

  function getSavedCart() {
    try {
      const raw = localStorage.getItem('cloudy_cart');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function setSavedCart(items) {
    try {
      localStorage.setItem('cloudy_cart', JSON.stringify(items));
    } catch (e) {}
  }

  function updateAllCartBadges() {
    const count = getSavedCart().length;
    const badgeById = document.getElementById('cart-badge');
    if (badgeById) badgeById.textContent = count;
    document.querySelectorAll('a[href^="cart.html"] span.rounded-full').forEach((el) => {
      el.textContent = count;
    });
  }

  // ดึงสต็อกล่าสุดจากแท็บ "คลังสินค้า" ใน Google Sheets
  window.fetchLiveStock = async function () {
    if (!window.CLOUDY_API_URL || window.CLOUDY_API_URL.includes('วาง_URL')) return null;
    try {
      const res = await fetch(window.CLOUDY_API_URL);
      const data = await res.json();
      if (data.status === 'success' && data.stock) {
        window.CLOUDY_LIVE_STOCK = data.stock;
        applyStockBadgesToButtons();
        return data.stock;
      }
    } catch (e) {
      console.warn('ไม่สามารถดึงข้อมูลสต็อกจาก Google Sheets ได้:', e);
    }
    return null;
  };

  // แสดงป้ายจำนวนคงเหลือบนการ์ดสินค้าแต่ละใบ และปิดปุ่มเมื่อสินค้าหมด
  function applyStockBadgesToButtons() {
    const stockMap = window.CLOUDY_LIVE_STOCK;
    if (!stockMap) return;

    document.querySelectorAll('button[onclick*="addToCart("]').forEach((btn) => {
      const onclickAttr = btn.getAttribute('onclick') || '';
      const match = onclickAttr.match(/addToCart\(\s*'([^']+)'/);
      if (!match) return;

      const productId = match[1];
      const info = stockMap[productId];
      if (!info) return;

      const stockCount = Number(info.stock) || 0;
      const priceBox = btn.parentElement ? btn.parentElement.querySelector('div') : null;

      if (priceBox) {
        let stockBadge = priceBox.querySelector('.live-stock-badge');
        if (!stockBadge) {
          stockBadge = document.createElement('p');
          stockBadge.className = 'live-stock-badge text-[11px] font-semibold mt-0.5';
          priceBox.appendChild(stockBadge);
        }

        if (stockCount <= 0) {
          stockBadge.textContent = '❌ สินค้าหมด';
          stockBadge.className = 'live-stock-badge text-[11px] font-semibold mt-0.5 text-rose-500';
        } else if (stockCount <= 5) {
          stockBadge.textContent = `🔥 เหลือเพียง ${stockCount} ชิ้น`;
          stockBadge.className = 'live-stock-badge text-[11px] font-semibold mt-0.5 text-amber-600';
        } else {
          stockBadge.textContent = `📦 คงเหลือ ${stockCount} ชิ้น`;
          stockBadge.className = 'live-stock-badge text-[11px] font-semibold mt-0.5 text-emerald-600';
        }
      }

      if (stockCount <= 0) {
        btn.disabled = true;
        btn.textContent = 'สินค้าหมด';
        btn.className = 'px-4 py-2.5 rounded-xl bg-slate-200 text-slate-400 text-xs sm:text-sm font-semibold cursor-not-allowed';
      }
    });
  }

  function setupMainAnchor() {
    const header = document.querySelector('header');
    if (header && !header.id) header.id = 'main-content';

    const subPages = ['products.html', 'reviews.html', 'contact.html', 'cart.html', 'login.html'];
    document.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      const [base, queryAndHash] = href.split('?');
      if (subPages.includes(base) && !href.includes('#')) {
        link.setAttribute('href', queryAndHash ? `${base}?${queryAndHash}#main-content` : `${base}#main-content`);
      }
    });
  }

  function jumpToContent() {
    if (isHomePage) return;
    const header = document.querySelector('header');
    if (!header) return;
    const targetTop = header.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: targetTop, behavior: 'instant' });
  }

  let userScrolled = false;
  window.addEventListener('wheel', () => { userScrolled = true; }, { passive: true, once: true });
  window.addEventListener('touchmove', () => { userScrolled = true; }, { passive: true, once: true });

  document.addEventListener('DOMContentLoaded', () => {
    setupMainAnchor();
    updateAllCartBadges();
    window.fetchLiveStock();

    // อัปเดตป้ายสต็อกทุกครั้งที่เปลี่ยนหมวดหมู่ในหน้า products.html
    if (typeof window.selectCategory === 'function') {
      const originalSelectCategory = window.selectCategory;
      window.selectCategory = function (catKey) {
        originalSelectCategory(catKey);
        applyStockBadgesToButtons();
      };
    }

    // ตรวจสอบสต็อกจริงก่อนเพิ่มลงตะกร้า และบันทึกข้ามหน้า
    if (typeof window.addToCart === 'function') {
      const originalAddToCart = window.addToCart;
      window.addToCart = function (id, name, price) {
        const current = getSavedCart();
        const inCartQty = current.filter((itemId) => itemId === id).length;

        if (window.CLOUDY_LIVE_STOCK && window.CLOUDY_LIVE_STOCK[id]) {
          const available = Number(window.CLOUDY_LIVE_STOCK[id].stock) || 0;
          if (inCartQty >= available) {
            const toast = document.getElementById('toast-box');
            const toastText = document.getElementById('toast-text');
            if (toast && toastText) {
              toastText.textContent = `⚠️ "${name}" มีในสต็อกสูงสุด ${available} ชิ้น`;
              toast.classList.remove('hidden');
              setTimeout(() => toast.classList.add('hidden'), 3500);
            }
            return;
          }
        }

        originalAddToCart(id, name, price);
        current.push(id);
        setSavedCart(current);
        updateAllCartBadges();
      };
    }

    if (!isHomePage && !userScrolled) {
      jumpToContent();
      const bannerImg = document.querySelector('img[src*="banner"]');
      if (bannerImg && !bannerImg.complete) {
        bannerImg.addEventListener('load', () => {
          if (!userScrolled) jumpToContent();
        }, { once: true });
      }
    }
  });

  window.addEventListener('load', () => {
    updateAllCartBadges();
    if (!isHomePage && !userScrolled) jumpToContent();
  });
})();