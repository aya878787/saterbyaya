// ========== إعدادات ==========
// ⚠️ بدّل هذا الرابط بالرابط الجديد من Apps Script
const API_URL = 'https://script.google.com/macros/s/AKfycbxBwEZ985hzJGXUvewptERFSaWeLb33VI9r8brXyqjf999872X5f83dg6BrTwCx4Esv/exec';

// ========== الحالة ==========
let products = [];
let cart = JSON.parse(localStorage.getItem('saterCart')) || [];
let settings = {};

// ========== العناصر ==========
const productsGrid = document.getElementById('productsGrid');
const cartBtn = document.getElementById('cartBtn');
const cartSidebar = document.getElementById('cartSidebar');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');
const overlay = document.getElementById('overlay');
const orderModal = document.getElementById('orderModal');
const closeOrder = document.getElementById('closeOrder');
const orderForm = document.getElementById('orderForm');
const toast = document.getElementById('toast');

// ========== جلب المنتجات عبر JSONP ==========
function loadProducts() {
  const callbackName = 'handleProducts_' + Date.now();
  
  window[callbackName] = function(data) {
    if (data.success) {
      products = data.products;
      renderProducts();
    } else {
      productsGrid.innerHTML = '<div class="loading">حدث خطأ في تحميل المنتجات</div>';
    }
    delete window[callbackName];
    if (script.parentNode) document.body.removeChild(script);
  };
  
  const script = document.createElement('script');
  script.src = `${API_URL}?action=getProducts&callback=${callbackName}`;
  script.onerror = function() {
    productsGrid.innerHTML = '<div class="loading">تعذّر الاتصال بالخادم</div>';
    delete window[callbackName];
    if (script.parentNode) document.body.removeChild(script);
  };
  document.body.appendChild(script);
}

// ========== جلب الإعدادات عبر JSONP ==========
function loadSettings() {
  const callbackName = 'handleSettings_' + Date.now();
  
  window[callbackName] = function(data) {
    if (data.success) {
      settings = data.settings;
    }
    delete window[callbackName];
    if (script.parentNode) document.body.removeChild(script);
  };
  
  const script = document.createElement('script');
  script.src = `${API_URL}?action=getSettings&callback=${callbackName}`;
  document.body.appendChild(script);
}

// ========== عرض المنتجات ==========
function renderProducts() {
  if (products.length === 0) {
    productsGrid.innerHTML = '<div class="loading">لا توجد منتجات حالياً</div>';
    return;
  }

  productsGrid.innerHTML = products.map(product => {
    const outOfStock = !product.in_stock;
    const badge = outOfStock 
      ? '<div class="product-badge out">غير متوفر</div>'
      : (product.featured ? '<div class="product-badge">مميز</div>' : '');

    return `
      <div class="product-card">
        ${badge}
        <img 
          src="${product.image_url}" 
          alt="${product.name}" 
          class="product-image"
          onerror="this.src='https://via.placeholder.com/400x500?text=No+Image'"
        >
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <div class="product-details">
            ${product.size ? `<span>${product.size}</span>` : ''}
            ${product.color ? `<span>${product.color}</span>` : ''}
            ${product.material ? `<span>${product.material}</span>` : ''}
          </div>
          <div class="product-price">${product.price} د.أ</div>
          <button 
            class="add-to-cart-btn" 
            onclick="addToCart(${product.id})"
            ${outOfStock ? 'disabled' : ''}
          >
            ${outOfStock ? 'غير متوفر' : 'أضف للسلة'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ========== إضافة للسلة ==========
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existing = cart.find(item => item.id === productId);
  
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      size: product.size,
      price: product.price,
      image_url: product.image_url,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
  showToast('تمت الإضافة إلى السلة ✓');
}

// ========== حفظ السلة ==========
function saveCart() {
  localStorage.setItem('saterCart', JSON.stringify(cart));
}

// ========== عرض السلة ==========
function renderCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  cartCount.textContent = totalItems;
  cartTotal.textContent = `${totalPrice} د.أ`;

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart">🛒 السلة فارغة</div>';
    checkoutBtn.disabled = true;
    return;
  }

  checkoutBtn.disabled = false;

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image_url}" alt="${item.name}" class="cart-item-image" onerror="this.src='https://via.placeholder.com/70x80?text=?'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${item.price} د.أ</div>
        <div class="cart-item-controls">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
          <span class="qty-value">${item.quantity}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
          <button class="remove-item" onclick="removeFromCart(${item.id})" title="حذف">🗑</button>
        </div>
      </div>
    </div>
  `).join('');
}

// ========== تغيير الكمية ==========
function changeQty(productId, delta) {
  const item = cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  renderCart();
}

// ========== إزالة من السلة ==========
function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  saveCart();
  renderCart();
}

// ========== فتح وإغلاق السلة ==========
function openCart() {
  cartSidebar.classList.add('open');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCartSidebar() {
  cartSidebar.classList.remove('open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// ========== نموذج الطلب ==========
function openOrderModal() {
  if (cart.length === 0) {
    showToast('السلة فارغة!');
    return;
  }
  closeCartSidebar();
  orderModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeOrderModal() {
  orderModal.classList.remove('active');
  document.body.style.overflow = '';
}

// ========== إرسال الطلب ==========
async function submitOrder(e) {
  e.preventDefault();

  const customerName = document.getElementById('customerName').value.trim();
  const customerPhone = document.getElementById('customerPhone').value.trim();
  const customerAddress = document.getElementById('customerAddress').value.trim();
  const customerNote = document.getElementById('customerNote').value.trim();

  if (!customerName || !customerPhone) {
    showToast('الرجاء إدخال الاسم ورقم الهاتف');
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // 1) نرسل الطلب للـ Sheet
  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'createOrder',
        order: {
          customer_name: customerName,
          phone: customerPhone,
          address: customerAddress,
          note: customerNote,
          items: cart
        }
      })
    });
  } catch (error) {
    console.error('Error saving order:', error);
  }

  // 2) نجهز رسالة الواتساب
  const whatsappNumber = settings.whatsapp_number || '962791234567';
  
  let message = `مرحباً، بدي أطلب من ${settings.store_name || 'Sater ByAya'}:\n\n`;
  
  cart.forEach(item => {
    message += `🔹 ${item.name}`;
    if (item.size) message += ` (${item.size})`;
    message += ` × ${item.quantity} = ${item.price * item.quantity} د.أ\n`;
  });

  message += `\n💰 المجموع: ${total} د.أ\n`;
  message += `\n👤 الاسم: ${customerName}`;
  message += `\n📞 الهاتف: ${customerPhone}`;
  if (customerAddress) message += `\n📍 العنوان: ${customerAddress}`;
  if (customerNote) message += `\n📝 ملاحظات: ${customerNote}`;

  const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  
  window.open(whatsappURL, '_blank');

  cart = [];
  saveCart();
  renderCart();
  closeOrderModal();
  orderForm.reset();
  
  showToast('تم إرسال طلبك ✓');
}

// ========== الإشعار ==========
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ========== ربط الأحداث ==========
cartBtn.addEventListener('click', openCart);
closeCart.addEventListener('click', closeCartSidebar);
overlay.addEventListener('click', closeCartSidebar);
checkoutBtn.addEventListener('click', openOrderModal);
closeOrder.addEventListener('click', closeOrderModal);
orderForm.addEventListener('submit', submitOrder);

orderModal.addEventListener('click', (e) => {
  if (e.target === orderModal) closeOrderModal();
});

// ========== تشغيل ==========
loadSettings();
loadProducts();
renderCart();
