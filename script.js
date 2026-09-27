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

// ========== جلب المنتجات عبر Vercel Proxy ==========
async function loadProducts() {
  try {
    const response = await fetch('/api/products?action=getProducts');
    const data = await response.json();
    
    if (data.success) {
      products = data.products;
      renderProducts();
    } else {
      productsGrid.innerHTML = '<div class="loading">حدث خطأ في تحميل المنتجات</div>';
    }
  } catch (error) {
    console.error('Error loading products:', error);
    productsGrid.innerHTML = '<div class="loading">تعذّر الاتصال بالخادم</div>';
  }
}

// ========== جلب الإعدادات عبر Vercel Proxy ==========
async function loadSettings() {
  try {
    const response = await fetch('/api/products?action=getSettings');
    const data = await response.json();
    
    if (data.success) {
      settings = data.settings;
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
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
  updateOrderButton();
}

function closeOrderModal() {
  orderModal.classList.remove('active');
  document.body.style.overflow = '';
}

// ========== تحديث حالة زر الطلب ==========
function updateOrderButton() {
  const submitBtn = document.querySelector('.btn-submit');
  if (!submitBtn) return;
  
  const name = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const address = document.getElementById('customerAddress').value.trim();
  
  if (name && phone && address) {
    submitBtn.disabled = false;
    submitBtn.classList.add('active');
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.remove('active');
  }
}

// ========== إرسال الطلب ==========
async function submitOrder(e) {
  e.preventDefault();

  const customerName = document.getElementById('customerName').value.trim();
  const customerPhone = document.getElementById('customerPhone').value.trim();
  const customerAddress = document.getElementById('customerAddress').value.trim();
  const customerNote = document.getElementById('customerNote').value.trim();

  if (!customerName || !customerPhone || !customerAddress) {
    showToast('الرجاء تعبئة الاسم والهاتف والعنوان');
    return;
  }

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const storeName = settings.store_name || 'سطر';

  // 1) نرسل الطلب للـ Sheet
  try {
    await fetch('/api/products', {
      method: 'POST',
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
  
  let message = `🌸 *${storeName}* 🌸\nبراويز فنية\n\n`;
  message += `━━━━━━━━━━━━━━━━\n\n`;
  message += `📦 *تفاصيل الطلب:*\n\n`;
  
  cart.forEach((item, index) => {
    message += `${index + 1}️⃣ ${item.name}\n`;
    if (item.size) message += `    المقاس: ${item.size}\n`;
    message += `    الكمية: ${item.quantity}\n`;
    message += `    السعر: ${item.price * item.quantity} د.أ\n\n`;
  });
  
  message += `━━━━━━━━━━━━━━━━\n\n`;
  message += `💰 *المجموع:* ${total} د.أ\n\n`;
  message += `━━━━━━━━━━━━━━━━\n\n`;
  message += `👤 *بياناتك:*\n`;
  message += `• الاسم: ${customerName}\n`;
  message += `• الهاتف: ${customerPhone}\n`;
  message += `• العنوان: ${customerAddress}\n`;
  if (customerNote) message += `• ملاحظات: ${customerNote}\n`;
  
  message += `\n━━━━━━━━━━━━━━━━\n\n`;
  message += `📌 *الخطوات القادمة:*\n\n`;
  message += `1. رح نتواصل معك خلال ساعات قليلة\n`;
  message += `2. نأكد تفاصيل الطلب والتوصيل\n`;
  message += `3. نتفق على طريقة الدفع والتسليم\n\n`;
  message += `⏱ ساعات العمل: 10 صباحاً - 10 مساءً\n\n`;
  message += `━━━━━━━━━━━━━━━━\n\n`;
  message += `شكراً لثقتك بـ *${storeName}* 🌸\n`;
  message += `نتمنى تعجبك اختياراتك 🤎`;

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

// ========== متابعة تغييرات الحقول ==========
['customerName', 'customerPhone', 'customerAddress'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', updateOrderButton);
});

// ========== تشغيل ==========
loadSettings();
loadProducts();
renderCart();
