/* =========================================================
   SmartStock AI — app.js
   ========================================================= */

   /* ============================================
   CENTRAL DATA STORE (Single Source of Truth)
   ============================================ */
let PRODUCTS = [
  { id: 1, name: "Susu Ultra Milk 1L", category: "Minuman", emoji: "🥛", 
    stock: 142, minStock: 50, price: 18000, cost: 14000, 
    exp: "2024-05-28", image: null },
  { id: 2, name: "Yogurt Strawberry", category: "Dairy", emoji: "🍓", 
    stock: 38, minStock: 30, price: 12000, cost: 8500, 
    exp: "2024-06-02", image: null },
  { id: 3, name: "Daging Sapi 500g", category: "Protein", emoji: "🥩", 
    stock: 25, minStock: 20, price: 65000, cost: 50000, 
    exp: "2024-06-05", image: null },
  { id: 4, name: "Roti Tawar", category: "Bakery", emoji: "🍞", 
    stock: 60, minStock: 40, price: 15000, cost: 10000, 
    exp: "2024-06-10", image: null },
  { id: 5, name: "Ayam Fillet 500g", category: "Protein", emoji: "🍗", 
    stock: 18, minStock: 25, price: 45000, cost: 35000, 
    exp: "2024-06-15", image: null },
  { id: 6, name: "Telur Ayam Negeri", category: "Protein", emoji: "🥚", 
    stock: 200, minStock: 50, price: 28000, cost: 22000, 
    exp: "2024-07-01", image: null },
  { id: 7, name: "Minuman Kaleng 330ml", category: "Minuman", emoji: "🥤", 
    stock: 0, minStock: 30, price: 8000, cost: 5000, 
    exp: "2024-12-01", image: null },
  { id: 8, name: "Keju Slice", category: "Dairy", emoji: "🧀", 
    stock: 12, minStock: 20, price: 35000, cost: 25000, 
    exp: "2024-06-20", image: null },
];

// Purchase Orders store
let PURCHASE_ORDERS = [];
let PO_COUNTER = 1;

// Load dari localStorage kalau ada
function loadData() {
  const savedProducts = localStorage.getItem('smartstock_products');
  const savedPO = localStorage.getItem('smartstock_po');
  if (savedProducts) PRODUCTS = JSON.parse(savedProducts);
  if (savedPO) {
    PURCHASE_ORDERS = JSON.parse(savedPO);
    PO_COUNTER = PURCHASE_ORDERS.length + 1;
  }
}

// Save ke localStorage
function saveData() {
  localStorage.setItem('smartstock_products', JSON.stringify(PRODUCTS));
  localStorage.setItem('smartstock_po', JSON.stringify(PURCHASE_ORDERS));
}

// Helper: dapatkan status stok
function getStockStatus(product) {
  if (product.stock === 0) return { label: 'Out of Stock', class: 'status-red' };
  if (product.stock < product.minStock) return { label: 'Low Stock', class: 'status-amber' };
  return { label: 'In Stock', class: 'status-green' };
}

// Helper: format rupiah
function formatRp(num) {
  return 'Rp ' + num.toLocaleString('id-ID');
}

/* ============================================
   STOCK MANAGEMENT LOGIC
   ============================================ */

/**
 * Update stock produk (tambah/kurang/set)
 * @param {number} productId - ID produk
 * @param {number} amount - jumlah perubahan
 * @param {string} type - 'add' | 'subtract' | 'set'
 * @param {string} reason - alasan perubahan (untuk history)
 */
function updateStock(productId, amount, type = 'add', reason = '') {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) {
    toast('❌ Produk tidak ditemukan', 'error');
    return false;
  }

  const oldStock = product.stock;
  
  switch (type) {
    case 'add':
      product.stock += parseInt(amount);
      break;
    case 'subtract':
      if (product.stock < amount) {
        toast(`⚠️ Stok tidak cukup! Tersedia: ${product.stock}`, 'error');
        return false;
      }
      product.stock -= parseInt(amount);
      break;
    case 'set':
      product.stock = parseInt(amount);
      break;
  }

  // Simpan ke localStorage
  saveData();

  // Log perubahan (untuk debug)
  console.log(`📦 Stock Update: ${product.name}`, {
    from: oldStock,
    to: product.stock,
    change: type,
    reason: reason
  });

  // 🔥 KEY: Re-render SEMUA halaman yang menampilkan stok
  refreshAllStockViews();

  // Toast notifikasi
  const diff = product.stock - oldStock;
  const sign = diff > 0 ? '+' : '';
  toast(`✅ ${product.name}: ${sign}${diff} (stok: ${product.stock})`, 'success');

  return true;
}

/* ============================================
   PURCHASE ORDER LOGIC
   ============================================ */

function renderPO() {
  const tbody = document.getElementById('po-tbody');
  if (!tbody) return;
  
  if (PURCHASE_ORDERS.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">
          <i data-lucide="inbox" style="width:48px;height:48px;opacity:0.3"></i>
          <p style="margin-top:12px">Belum ada Purchase Order</p>
          <button class="btn-primary" onclick="openCreatePOModal()" style="margin-top:12px">
            <i data-lucide="plus" class="btn-ico"></i>
            Buat PO Pertama
          </button>
        </td>
      </tr>
    `;
    refreshIcons();
    return;
  }
  
  tbody.innerHTML = PURCHASE_ORDERS.map(po => {
    const statusClass = {
      pending: 'status-amber',
      approved: 'status-blue',
      received: 'status-green',
      cancelled: 'status-red'
    }[po.status] || 'status-gray';
    
    const statusLabel = {
      pending: 'Pending',
      approved: 'Approved',
      received: 'Received',
      cancelled: 'Cancelled'
    }[po.status];
    
    return `
      <tr>
        <td><strong>${po.poNumber}</strong></td>
        <td>${po.date}</td>
        <td>${po.productEmoji} ${po.productName}</td>
        <td>${po.qty}</td>
        <td>${formatRp(po.total)}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>
          ${po.status === 'pending' ? `
            <button class="btn-primary btn-sm" onclick="approvePO(${po.id})">
              <i data-lucide="check" class="btn-ico"></i> Approve
            </button>
          ` : ''}
          ${po.status === 'approved' ? `
            <button class="btn-primary btn-sm" onclick="receivePO(${po.id})">
              <i data-lucide="package-check" class="btn-ico"></i> Receive
            </button>
          ` : ''}
          ${(po.status === 'pending' || po.status === 'approved') ? `
            <button class="btn-outline btn-sm" onclick="cancelPO(${po.id})">
              <i data-lucide="x" class="btn-ico"></i>
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }).join('');
  
  refreshIcons();
}

function openCreatePOModal() {
  // Populate product dropdown
  const select = document.getElementById('po-product');
  select.innerHTML = '<option value="">-- Pilih Produk --</option>' +
    PRODUCTS.map(p => `
      <option value="${p.id}">${p.emoji} ${p.name} (Stok: ${p.stock})</option>
    `).join('');
  
  // Reset form
  document.getElementById('po-qty').value = '';
  document.getElementById('po-supplier').value = '';
  document.getElementById('po-note').value = '';
  document.getElementById('po-preview').innerHTML = '';
  
  document.getElementById('modal-create-po').style.display = 'flex';
  refreshIcons();
}

function updatePOPreview() {
  const productId = parseInt(document.getElementById('po-product').value);
  const qty = parseInt(document.getElementById('po-qty').value) || 0;
  
  if (!productId || !qty) {
    document.getElementById('po-preview').innerHTML = '';
    return;
  }
  
  const product = PRODUCTS.find(p => p.id === productId);
  const total = product.cost * qty;
  
  document.getElementById('po-preview').innerHTML = `
    <div class="preview-po">
      <div class="preview-po-row">
        <span>Produk:</span>
        <strong>${product.emoji} ${product.name}</strong>
      </div>
      <div class="preview-po-row">
        <span>Harga Beli:</span>
        <strong>${formatRp(product.cost)}</strong>
      </div>
      <div class="preview-po-row">
        <span>Quantity:</span>
        <strong>${qty}</strong>
      </div>
      <div class="preview-po-row preview-po-total">
        <span>Total:</span>
        <strong>${formatRp(total)}</strong>
      </div>
      <div class="preview-po-info">
        <i data-lucide="info"></i>
        Stok akan bertambah dari <strong>${product.stock}</strong> menjadi <strong>${product.stock + qty}</strong> saat PO di-receive
      </div>
    </div>
  `;
  refreshIcons();
}

function createPO() {
  const productId = parseInt(document.getElementById('po-product').value);
  const qty = parseInt(document.getElementById('po-qty').value);
  const supplier = document.getElementById('po-supplier').value.trim();
  const note = document.getElementById('po-note').value.trim();
  
  if (!productId) return toast('⚠️ Pilih produk dulu', 'error');
  if (!qty || qty <= 0) return toast('⚠️ Masukkan quantity yang valid', 'error');
  if (!supplier) return toast('⚠️ Isi nama supplier', 'error');
  
  const product = PRODUCTS.find(p => p.id === productId);
  const poNumber = `PO-${String(PO_COUNTER).padStart(4, '0')}`;
  
  const newPO = {
    id: Date.now(),
    poNumber: poNumber,
    date: new Date().toLocaleDateString('id-ID'),
    productId: productId,
    productName: product.name,
    productEmoji: product.emoji,
    qty: qty,
    cost: product.cost,
    total: product.cost * qty,
    supplier: supplier,
    note: note,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  PURCHASE_ORDERS.unshift(newPO);
  PO_COUNTER++;
  saveData();
  
  closeModal('modal-create-po');
  renderPO();
  toast(`✅ PO ${poNumber} berhasil dibuat`, 'success');
}

function approvePO(poId) {
  const po = PURCHASE_ORDERS.find(p => p.id === poId);
  if (!po) return;
  
  po.status = 'approved';
  saveData();
  renderPO();
  toast(`✅ ${po.poNumber} di-approve`, 'success');
}

function receivePO(poId) {
  const po = PURCHASE_ORDERS.find(p => p.id === poId);
  if (!po) return;
  
  // 🔥 INI INTI: Update stok produk saat PO diterima
  const success = updateStock(po.productId, po.qty, 'add', `Received ${po.poNumber}`);
  
  if (success) {
    po.status = 'received';
    po.receivedAt = new Date().toISOString();
    saveData();
    renderPO();
    toast(`✅ ${po.poNumber} diterima. Stok bertambah +${po.qty}`, 'success');
  }
}

function cancelPO(poId) {
  if (!confirm('Yakin ingin membatalkan PO ini?')) return;
  
  const po = PURCHASE_ORDERS.find(p => p.id === poId);
  if (!po) return;
  
  po.status = 'cancelled';
  saveData();
  renderPO();
  toast(`❌ ${po.poNumber} dibatalkan`, 'info');
}

/**
 * Re-render semua halaman yang menampilkan stok
 * Dipanggil setiap kali stok berubah
 */
function refreshAllStockViews() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;

  const pageId = activePage.id;

  // Re-render halaman yang sedang aktif
  switch (pageId) {
    case 'page-produk':
      renderProduk();
      break;
    case 'page-stok':
      function renderStok() {
  const tbody = document.getElementById('stok-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = PRODUCTS.map(p => {
    const status = getStockStatus(p);
    return `
      <tr>
        <td>
          <div class="product-cell">
            <div class="product-emoji">${p.emoji}</div>
            <span>${p.name}</span>
          </div>
        </td>
        <td>${p.category}</td>
        <td class="stock-cell ${status.class}">${p.stock}</td>
        <td>${p.minStock}</td>
        <td>${p.exp}</td>
        <td><span class="status-badge ${status.class}">${status.label}</span></td>
        <td>
          <button class="btn-primary btn-sm" onclick="openUpdateStockModal(${p.id})">
            <i data-lucide="refresh-cw" class="btn-ico"></i>
            Update Stok
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  refreshIcons();
}
      break;
    case 'page-penjualan':
      renderTokoOnline();
      break;
    case 'page-dashboard':
      renderDashboardStats();
      break;
  }
  
  // Refresh icon Lucide setelah re-render
  if (typeof refreshIcons === 'function') refreshIcons();
}

/**
 * Reduce stock saat penjualan (untuk payment gateway)
 */
function reduceStockFromSale(productId, qty) {
  return updateStock(productId, qty, 'subtract', 'Penjualan');
}

/* ============================================
   UPDATE STOCK MODAL
   ============================================ */
let currentUpdateProductId = null;
let currentUpdateType = 'add';

function openUpdateStockModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  currentUpdateProductId = productId;
  currentUpdateType = 'add';
  
  // Tampilkan info produk
  const status = getStockStatus(product);
  document.getElementById('update-stock-info').innerHTML = `
    <div class="product-info-flex">
      <div class="product-emoji-big">${product.emoji}</div>
      <div>
        <div class="product-info-name">${product.name}</div>
        <div class="product-info-meta">${product.category} · Stok saat ini: <strong>${product.stock}</strong></div>
        <span class="status-badge ${status.class}">${status.label}</span>
      </div>
    </div>
  `;
  
  // Reset form
  document.getElementById('stock-amount').value = '';
  document.getElementById('stock-reason').value = '';
  document.getElementById('stock-preview').innerHTML = '';
  
  // Reset radio buttons
  document.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-type="add"]').classList.add('active');
  
  // Event listener untuk preview real-time
  document.getElementById('stock-amount').oninput = updateStockPreview;
  
  // Tampilkan modal
  document.getElementById('modal-update-stock').style.display = 'flex';
  refreshIcons();
}

function selectUpdateType(type) {
  currentUpdateType = type;
  document.querySelectorAll('.radio-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-type="${type}"]`).classList.add('active');
  updateStockPreview();
}

function updateStockPreview() {
  const amount = parseInt(document.getElementById('stock-amount').value) || 0;
  const product = PRODUCTS.find(p => p.id === currentUpdateProductId);
  if (!product) return;
  
  let newStock;
  switch (currentUpdateType) {
    case 'add': newStock = product.stock + amount; break;
    case 'subtract': newStock = Math.max(0, product.stock - amount); break;
    case 'set': newStock = amount; break;
  }
  
  const diff = newStock - product.stock;
  const sign = diff >= 0 ? '+' : '';
  const color = diff >= 0 ? 'var(--green)' : 'var(--red)';
  
  document.getElementById('stock-preview').innerHTML = `
    <div class="preview-flex">
      <div>
        <div class="preview-label">Stok Sekarang</div>
        <div class="preview-value">${product.stock}</div>
      </div>
      <i data-lucide="arrow-right" class="preview-arrow"></i>
      <div>
        <div class="preview-label">Stok Baru</div>
        <div class="preview-value" style="color:${color}">${newStock} <small>(${sign}${diff})</small></div>
      </div>
    </div>
  `;
  refreshIcons();
}

function confirmUpdateStock() {
  const amount = parseInt(document.getElementById('stock-amount').value);
  const reason = document.getElementById('stock-reason').value;
  
  if (!amount || amount <= 0) {
    toast('⚠️ Masukkan jumlah yang valid', 'error');
    return;
  }
  
  const success = updateStock(currentUpdateProductId, amount, currentUpdateType, reason);
  
  if (success) {
    closeModal('modal-update-stock');
  }
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}

/* ── DATA ── */
const PRODUCTS = [
  { id:1, name:"Susu Ultra Milk 1L",    cat:"Minuman", stock:142, min:50,  price:18500,  cost:13000, exp:"2024-05-28", em:"🥛" },
  { id:2, name:"Yogurt Strawberry",     cat:"Dairy",   stock:38,  min:30,  price:12000,  cost:7500,  exp:"2024-06-02", em:"🍓" },
  { id:3, name:"Daging Sapi 500g",      cat:"Protein", stock:25,  min:20,  price:85000,  cost:70000, exp:"2024-06-05", em:"🥩" },
  { id:4, name:"Roti Tawar",            cat:"Bakery",  stock:60,  min:40,  price:12000,  cost:7200,  exp:"2024-06-10", em:"🍞" },
  { id:5, name:"Ayam Fillet 500g",      cat:"Protein", stock:18,  min:25,  price:55000,  cost:42000, exp:"2024-06-15", em:"🍗" },
  { id:6, name:"Telur Ayam Negeri",     cat:"Protein", stock:200, min:50,  price:27000,  cost:22000, exp:"2024-07-01", em:"🥚" },
  { id:7, name:"Minuman Kaleng 330ml",  cat:"Minuman", stock:0,   min:30,  price:8500,   cost:6000,  exp:"2024-12-01", em:"🥤" },
  { id:8, name:"Keju Slice",            cat:"Dairy",   stock:12,  min:20,  price:35000,  cost:28000, exp:"2024-06-20", em:"🧀" },
];

const PNL_DATA = [
  { name:"Susu Ultra Milk 1L",   sell:8550000, cost:5100000, margin:40.35, status:"Profit"     },
  { name:"Roti Tawar",           sell:3600000, cost:2160000, margin:40.00, status:"Profit"     },
  { name:"Yogurt Strawberry",    sell:2875000, cost:1800000, margin:37.39, status:"Profit"     },
  { name:"Daging Sapi",          sell:6200000, cost:5890000, margin:5.00,  status:"Low Margin" },
  { name:"Ayam Fillet",          sell:4100000, cost:4350000, margin:-6.10, status:"Loss"       },
  { name:"Minuman Kaleng",       sell:2050000, cost:2200000, margin:-7.32, status:"Loss"       },
];

const SALES_DATA = [
  { m:"Jan", s:32000000, c:21000000 },
  { m:"Feb", s:38000000, c:25000000 },
  { m:"Mar", s:41000000, c:27000000 },
  { m:"Apr", s:36000000, c:24000000 },
  { m:"Mei", s:45680000, c:28250000 },
];

/* ── STATE ── */
let cart        = [];
let selProduct  = null;
let payMethod   = "qris";
let cdSec       = 899;
let cdTimer     = null;
let qtyMap      = {};
let charts      = {};

/* =========================================================
   UTILS
   ========================================================= */
const rp  = v  => "Rp " + Number(v).toLocaleString("id-ID");
const daysUntil = d => Math.ceil((new Date(d) - new Date()) / 86400000);

function toast(msg, type = "default") {
  const el  = document.getElementById("toast");
  const msg_el = document.getElementById("toast-msg");
  msg_el.textContent = msg;
  el.className = "show";
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 3000);
}

/* ── AI HELPER (Groq via Proxy) ── */
async function callAI(prompt, maxTokens = 800) {
  const res = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) throw new Error('AI request gagal');
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

/* =========================================================
   NAVIGATION
   ========================================================= */
const PAGE_INIT = {
  dashboard: () => initDashboard(),
  penjualan: () => { renderProducts(); if (selProduct) renderAside(); },
  payment:   () => initPayment(),
  produk:    () => initProdukPage(),
  stok:      () => initStokPage(),
  expdate:   () => initExpDate(),
  laporan:   () => setTimeout(initLaporan, 80),
  pnl:       () => setTimeout(initPnL, 80),
  aiinsight: () => {},
  pembelian: () => {},
  settings:  () => {},
};

function navigate(page) {
  // Hide semua page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Show yang dipilih
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');
  
  // Update active nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  
  // 🔥 Render content sesuai page
  switch (page) {
    case 'produk': renderProduk(); break;
    case 'stok': renderStok(); break;
    case 'pembelian': renderPO(); break;
    case 'penjualan': renderTokoOnline(); break;
    case 'dashboard': renderDashboardStats(); break;
  }
  
  refreshIcons();
}
/* =========================================================
   DASHBOARD
   ========================================================= */
function initDashboard() {
  const dateEl = document.getElementById("dash-date");
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString("id-ID", {
    weekday:"long", day:"2-digit", month:"long", year:"numeric"
  });

  /* Donut chart */
  const ctx1 = document.getElementById("dash-pie");
  if (!ctx1) return;
  if (charts.dashPie) charts.dashPie.destroy();
  charts.dashPie = new Chart(ctx1.getContext("2d"), {
    type: "doughnut",
    data: {
      labels: ["In Stock", "Low Stock", "Out of Stock"],
      datasets: [{
        data: [892, 300, 64],
        backgroundColor: ["#16a34a", "#d97706", "#dc2626"],
        borderWidth: 3,
        borderColor: "#fff",
        hoverOffset: 6,
      }]
    },
    options: {
      cutout: "68%",
      plugins: { legend: { display: false } },
      animation: { animateRotate: true, duration: 800 },
    }
  });

  /* Bar chart */
  const ctx2 = document.getElementById("dash-bar");
  if (charts.dashBar) charts.dashBar.destroy();
  charts.dashBar = new Chart(ctx2.getContext("2d"), {
    type: "bar",
    data: {
      labels: SALES_DATA.map(s => s.m),
      datasets: [
        { label:"Penjualan", data: SALES_DATA.map(s => s.s), backgroundColor:"#16a34a", borderRadius:6, borderSkipped:false },
        { label:"Modal",     data: SALES_DATA.map(s => s.c), backgroundColor:"#bfdbfe", borderRadius:6, borderSkipped:false },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid:{ display:false }, ticks:{ color:"#9ca3af", font:{size:11} } },
        y: { grid:{ color:"#f3f4f6" }, ticks:{ color:"#9ca3af", font:{size:11}, callback: v => (v/1e6).toFixed(0)+"Jt" } },
      }
    }
  });

  /* Expiry list */
  const expItems = PRODUCTS
    .filter(p => p.stock > 0 && daysUntil(p.exp) <= 30)
    .sort((a, b) => daysUntil(a.exp) - daysUntil(b.exp));

  const el = document.getElementById("exp-list");
  if (!el) return;
  el.innerHTML = expItems.map(p => {
    const d   = daysUntil(p.exp);
    const cls = d <= 7 ? "b-red" : d <= 14 ? "b-amber" : "b-blue";
    const rec = d <= 7 ? "Flash Sale" : d <= 14 ? "Bundling" : "Promo";
    return `
      <div class="exp-item">
        <div>
          <div class="exp-prod-name">${p.em} ${p.name}</div>
          <div class="exp-prod-date">${p.exp}</div>
        </div>
        <div style="text-align:right">
          <div class="exp-days-chip badge ${cls}">${d} hari</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">${rec}</div>
        </div>
      </div>`;
  }).join("");
}

/* =========================================================
   STORE
   ========================================================= */
let currentCat = "all";

function filterCat(btn, cat) {
  document.querySelectorAll(".cat-pill").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentCat = cat;
  renderProducts();
}

function renderProducts() {
  const list = currentCat === "all"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.cat === currentCat);

  const grid = document.getElementById("prod-grid");
  if (!grid) return;

  grid.innerHTML = list.map(p => `
    <div class="prod-card ${selProduct?.id === p.id ? "selected" : ""}" onclick="selectProduct(${p.id})">
      <span class="prod-emoji">${p.em}</span>
      <div class="prod-name">${p.name}</div>
      <div class="prod-cat-tag">${p.cat}</div>
      <div class="prod-footer">
        <span class="prod-price">${rp(p.price)}</span>
        <span class="badge ${p.stock > p.min ? "b-green" : p.stock > 0 ? "b-amber" : "b-red"}">
          ${p.stock > 0 ? "Stok: " + p.stock : "Habis"}
        </span>
      </div>
      ${p.stock > 0
        ? `<button class="btn btn-primary btn-sm" style="width:100%;margin-top:12px" onclick="event.stopPropagation();addToCart(${p.id})">+ Keranjang</button>`
        : `<button class="btn btn-outline btn-sm" style="width:100%;margin-top:12px" disabled>Stok Habis</button>`}
    </div>`).join("");
}

function selectProduct(id) {
  selProduct = PRODUCTS.find(p => p.id === id);
  renderProducts();
  renderAside();
}

function renderAside() {
  const aside = document.getElementById("aside-content");
  if (!aside || !selProduct) return;
  const p = selProduct;

  aside.innerHTML = `
    <div class="aside-inner">
      <span class="aside-emoji">${p.em}</span>
      <div class="aside-name">${p.name}</div>
      <div class="aside-price">${rp(p.price)}</div>
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:14px">
        <span class="aside-stock-dot" style="background:${p.stock > 0 ? "#16a34a" : "#dc2626"}"></span>
        <span style="font-size:12px;font-weight:600;color:${p.stock > 0 ? "var(--green)" : "var(--red)"}">
          ${p.stock > 0 ? "Stok tersedia (" + p.stock + ")" : "Stok habis"}
        </span>
      </div>
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px;line-height:1.55">
        Produk berkualitas dari SmartStock. Exp Date: <strong style="color:var(--amber)">${p.exp}</strong>
      </p>

      <div class="pickup-box">
        <div class="pickup-title">
          <span>📦 Metode Pengambilan</span>
          <span class="badge b-blue">Pickup Only (Beta)</span>
        </div>
        <p style="font-size:11px;color:var(--blue);opacity:.8">Hanya tersedia di lokasi toko kami.</p>
      </div>

      <p style="font-size:12px;font-weight:700;margin-bottom:8px;color:var(--text)">📍 Lokasi Pickup</p>
      <div class="fake-map">
        <svg width="100%" height="100%" style="position:absolute;inset:0;opacity:.35">
          <line x1="0" y1="46" x2="100%" y2="46" stroke="#0891b2" stroke-width="2"/>
          <line x1="0" y1="90" x2="100%" y2="90" stroke="#0891b2" stroke-width="2"/>
          <line x1="115" y1="0" x2="115" y2="100%" stroke="#0891b2" stroke-width="2"/>
          <line x1="205" y1="0" x2="205" y2="100%" stroke="#0891b2" stroke-width="2"/>
          <rect x="12" y="10" width="88" height="30" rx="5" fill="#cffafe"/>
          <rect x="123" y="10" width="72" height="30" rx="5" fill="#cffafe"/>
          <rect x="213" y="10" width="80" height="30" rx="5" fill="#cffafe"/>
          <rect x="12" y="54" width="88" height="28" rx="5" fill="#cffafe"/>
          <rect x="213" y="54" width="80" height="28" rx="5" fill="#cffafe"/>
          <rect x="12" y="96" width="88" height="34" rx="5" fill="#cffafe"/>
          <rect x="123" y="96" width="72" height="34" rx="5" fill="#cffafe"/>
          <rect x="213" y="96" width="80" height="34" rx="5" fill="#cffafe"/>
        </svg>
        <div class="map-pin-outer">
          <div class="map-pin-inner">
            <span style="transform:rotate(45deg);display:block;font-size:13px">📍</span>
          </div>
        </div>
        <div class="map-label">
          <div class="map-label-name">Toko SmartStock</div>
          <div class="map-label-addr">Jl. Merdeka No. 123</div>
          <div class="map-label-open">● Buka 08.00–21.00</div>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <div class="qty-wrap">
          <button class="qty-btn" onclick="chgQty(${p.id},-1)">−</button>
          <span class="qty-val" id="qty-${p.id}">${qtyMap[p.id] || 1}</span>
          <button class="qty-btn" onclick="chgQty(${p.id},1)">+</button>
        </div>
        ${p.stock > 0
          ? `<button class="btn btn-primary" style="flex:1" onclick="addToCart(${p.id})">Tambah ke Keranjang</button>`
          : `<button class="btn btn-outline" style="flex:1" disabled>Stok Habis</button>`}
      </div>

      ${cart.length > 0 ? `
      <div class="cart-mini">
        <div style="font-size:12px;font-weight:700;margin-bottom:10px;color:var(--text)">
          🛒 Keranjang (${cart.reduce((a,c) => a+c.qty, 0)} item)
        </div>
        ${cart.map(c => `
          <div class="cart-row">
            <span style="color:var(--text-muted)">${c.em} ${c.name} ×${c.qty}</span>
            <span style="font-weight:700;color:var(--text)">${rp(c.price * c.qty)}</span>
          </div>`).join("")}
        <div class="cart-total-row">
          <span style="font-size:13px;font-weight:700">Total</span>
          <span style="font-size:15px;font-weight:800;color:var(--green)">${rp(cart.reduce((a,c) => a+c.price*c.qty,0) + 2000)}</span>
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%;margin-top:10px" onclick="navigate('payment')">
          Checkout & Pickup →
        </button>
      </div>` : ""}
    </div>`;
}

function chgQty(id, delta) {
  if (!qtyMap[id]) qtyMap[id] = 1;
  qtyMap[id] = Math.max(1, qtyMap[id] + delta);
  const el = document.getElementById("qty-" + id);
  if (el) el.textContent = qtyMap[id];
}

function addToCart(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p || p.stock === 0) return;
  const qty = qtyMap[id] || 1;
  const ex = cart.find(c => c.id === id);
  if (ex) ex.qty += qty; else cart.push({ ...p, qty });
  updateCartBadge();
  renderAside();
  toast("✓ " + p.name + " ditambahkan ke keranjang");
}

function updateCartBadge() {
  const total = cart.reduce((a, c) => a + c.qty, 0);
  const el = document.getElementById("cart-badge");
  if (!el) return;
  el.textContent = total;
  el.style.display = total > 0 ? "inline-flex" : "none";
}

/* =========================================================
   PAYMENT
   ========================================================= */
const PAY_METHODS = [
  { id:"qris", ico:"▦",  name:"QRIS",                  sub:"Bayar dengan QR Code" },
  { id:"va",   ico:"🏦", name:"Virtual Account",        sub:"BCA, Mandiri, BNI, BRI, dll" },
  { id:"ew",   ico:"📱", name:"E-Wallet",               sub:"OVO, GoPay, DANA, ShopeePay" },
  { id:"cc",   ico:"💳", name:"Kartu Kredit / Debit",   sub:"Visa, Mastercard, JCB" },
  { id:"alf",  ico:"🏪", name:"Alfamart / Indomaret",   sub:"Bayar di minimarket terdekat" },
];

function initPayment() {
  renderMethods();
  renderPayDetail();
  renderPaySummary();
  startCountdown();
}

function renderMethods() {
  const el = document.getElementById("methods-list");
  if (!el) return;
  el.innerHTML = PAY_METHODS.map(m => `
    <button class="method-btn ${m.id === payMethod ? "active" : ""}" onclick="selectMethod('${m.id}')">
      <span class="method-ico">${m.ico}</span>
      <div style="flex:1">
        <div class="method-name">${m.name}</div>
        <div class="method-sub">${m.sub}</div>
      </div>
      <div class="method-radio"></div>
    </button>`).join("");
}

function selectMethod(id) {
  payMethod = id;
  renderMethods();
  renderPayDetail();
}

function buildQRSVG() {
  const bits = [1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1,0,1,0,0,1];
  let svg = `<svg width="148" height="148" xmlns="http://www.w3.org/2000/svg"><rect width="148" height="148" fill="white"/>`;
  // Corner squares
  for (const [ox, oy] of [[8,8],[96,8],[8,96]]) {
    svg += `<rect x="${ox}" y="${oy}" width="44" height="44" rx="4" fill="#111"/>`;
    svg += `<rect x="${ox+6}" y="${oy+6}" width="32" height="32" rx="2" fill="white"/>`;
    svg += `<rect x="${ox+12}" y="${oy+12}" width="20" height="20" rx="1" fill="#111"/>`;
  }
  let i = 0;
  for (let r = 2; r < 12; r++) {
    for (let c = 2; c < 12; c++) {
      if ((r<6&&c<6)||(r<6&&c>9)||(r>9&&c<6)) continue;
      if (bits[i++ % bits.length]) svg += `<rect x="${c*12}" y="${r*12}" width="10" height="10" rx="1" fill="#111"/>`;
    }
  }
  return svg + "</svg>";
}

function renderPayDetail() {
  const m = PAY_METHODS.find(x => x.id === payMethod);
  const titleEl = document.getElementById("pay-method-title");
  const bodyEl  = document.getElementById("pay-method-body");
  if (!titleEl || !bodyEl) return;
  titleEl.textContent = m.name;

  if (payMethod === "qris") {
    bodyEl.innerHTML = `
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Scan QR Code berikut dengan aplikasi pembayaran pilihanmu</p>
      <div style="text-align:center;margin-bottom:16px">
        <div class="qr-wrapper">${buildQRSVG()}</div>
      </div>
      <div class="pay-order-box">
        <div style="display:flex;justify-content:space-between;font-size:11.5px;margin-bottom:7px">
          <span style="color:var(--text-muted)">Order ID</span>
          <span class="mono" style="color:var(--green);font-weight:600">#SE202405241030</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;margin-bottom:14px">
          <span style="color:var(--text-muted)">Status</span>
          <span class="badge b-amber">Menunggu Pembayaran</span>
        </div>
        <p style="font-size:10.5px;color:var(--text-muted);text-align:center;margin-bottom:4px">Sisa waktu pembayaran</p>
        <div class="countdown" id="countdown-el">14:59</div>
      </div>
      <button class="btn btn-primary btn-xl" style="width:100%;margin-top:16px" onclick="simulatePay()">
        ✓ Simulasi Bayar Berhasil
      </button>`;
  } else {
    bodyEl.innerHTML = `
      <div style="text-align:center;padding:36px 20px">
        <div style="font-size:52px;margin-bottom:14px">${m.ico}</div>
        <p style="font-size:15px;font-weight:700;margin-bottom:8px;color:var(--text)">${m.name}</p>
        <p style="font-size:12.5px;color:var(--text-muted);margin-bottom:24px;line-height:1.5">
          Klik konfirmasi untuk melanjutkan<br>ke portal pembayaran ${m.name}
        </p>
        <button class="btn btn-primary btn-xl" onclick="simulatePay()">Konfirmasi Pembayaran</button>
      </div>`;
  }
}

function startCountdown() {
  if (cdTimer) clearInterval(cdTimer);
  cdSec = 899;
  cdTimer = setInterval(() => {
    cdSec--;
    const el = document.getElementById("countdown-el");
    if (el) {
      const mm = String(Math.floor(cdSec / 60)).padStart(2, "0");
      const ss = String(cdSec % 60).padStart(2, "0");
      el.textContent = mm + ":" + ss;
      if (cdSec < 60) el.classList.add("urgent");
    }
    if (cdSec <= 0) clearInterval(cdTimer);
  }, 1000);
}

function renderPaySummary() {
  const sub = cart.reduce((a, c) => a + c.price * c.qty, 0);
  const svc = 2000;
  const tot = sub + svc;
  const el  = document.getElementById("pay-summary");
  if (!el) return;

  if (cart.length === 0) {
    el.innerHTML = `
      <div style="text-align:center;padding:32px;color:var(--text-muted)">
        <div style="font-size:40px;margin-bottom:10px">🛒</div>
        <p style="font-size:12.5px;margin-bottom:14px">Keranjang masih kosong</p>
        <button class="btn btn-outline btn-sm" onclick="navigate('penjualan')">← Tambah Produk</button>
      </div>`;
    return;
  }

  el.innerHTML = `
    ${cart.map(c => `
      <div class="summary-item">
        <span style="font-size:26px">${c.em}</span>
        <div class="summary-item-info">
          <div class="summary-item-name">${c.name}</div>
          <div class="summary-item-sub">${c.qty} × ${rp(c.price)}</div>
        </div>
        <div style="font-size:13px;font-weight:700;color:var(--text)">${rp(c.price * c.qty)}</div>
      </div>`).join("")}
    <div class="divider"></div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
      <span style="color:var(--text-muted)">Subtotal</span><span>${rp(sub)}</span>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:10px">
      <span style="color:var(--text-muted)">Biaya Layanan</span><span>${rp(svc)}</span>
    </div>
    <div class="summary-total-row">
      <span style="font-size:14px;font-weight:700">Total</span>
      <span style="font-size:18px;font-weight:800;color:var(--green)">${rp(tot)}</span>
    </div>
    <div style="background:var(--blue-lt);border:1px solid #bfdbfe;border-radius:9px;padding:10px 13px;margin-top:14px">
      <p style="font-size:12px;font-weight:700;color:var(--blue)">📍 Info Pickup</p>
      <p style="font-size:11px;color:var(--text-muted);margin-top:2px">Toko SmartStock – Jl. Merdeka No. 123, Jakarta Pusat</p>
      <p style="font-size:11px;color:var(--green);font-weight:600;margin-top:2px">Estimasi siap: 30–60 menit</p>
    </div>`;
}

function simulatePay() {
  clearInterval(cdTimer);
  document.getElementById("pay-success").style.display = "block";
  cart = [];
  updateCartBadge();
  toast("🎉 Pembayaran berhasil! Terima kasih.");
}

/* =========================================================
   EXP DATE
   ========================================================= */
function initExpDate() {
  const items = PRODUCTS.map(p => ({ ...p, days: daysUntil(p.exp) })).sort((a, b) => a.days - b.days);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("exp-kritis",  items.filter(i => i.days <= 7).length);
  set("exp-warning", items.filter(i => i.days > 7 && i.days <= 30).length);
  set("exp-safe",    items.filter(i => i.days > 30).length);

  const tbody = document.getElementById("exp-tbody");
  if (!tbody) return;
  tbody.innerHTML = items.map(p => {
    const d   = p.days;
    const cls = d <= 7 ? "b-red" : d <= 30 ? "b-amber" : "b-green";
    const vc  = d <= 7 ? "var(--red)" : d <= 30 ? "var(--amber)" : "var(--green)";
    const rec = d <= 7 ? "🔥 Flash Sale 20%" : d <= 14 ? "📦 Bundling" : d <= 30 ? "🎯 Promo Aktif" : "✅ Normal";
    return `<tr>
      <td><div class="td-name"><span>${p.em}</span>${p.name}</div></td>
      <td>${p.cat}</td>
      <td><strong>${p.stock}</strong></td>
      <td>${p.exp}</td>
      <td><span class="badge ${cls}">${d} hari</span></td>
      <td style="font-weight:700;color:${vc}">${rec}</td>
      <td><button class="btn btn-outline btn-sm" onclick="toast('✓ Promo diaktifkan untuk ${p.name}')">Aktifkan</button></td>
    </tr>`;
  }).join("");
}

/* =========================================================
   P&L
   ========================================================= */
function initPnL() {
  const tbody = document.getElementById("pnl-tbody");
  if (tbody) {
    tbody.innerHTML = PNL_DATA.map(d => {
      const profit = d.sell - d.cost;
      const bdg = d.status === "Profit" ? "b-green" : d.status === "Loss" ? "b-red" : "b-amber";
      return `<tr>
        <td><strong style="color:var(--text)">${d.name}</strong></td>
        <td>${rp(d.sell)}</td>
        <td>${rp(d.cost)}</td>
        <td class="${profit >= 0 ? "val-profit" : "val-loss"}">${rp(profit)}</td>
        <td class="${d.margin >= 20 ? "val-profit" : d.margin >= 0 ? "val-low" : "val-loss"}">${d.margin}%</td>
        <td><span class="badge ${bdg}">${d.status}</span></td>
      </tr>`;
    }).join("");
  }

  /* Horizontal bar chart */
  const ctx = document.getElementById("pnl-chart");
  if (!ctx) return;
  if (charts.pnl) charts.pnl.destroy();
  charts.pnl = new Chart(ctx.getContext("2d"), {
    type: "bar",
    data: {
      labels: PNL_DATA.map(d => d.name.split(" ").slice(0, 2).join(" ")),
      datasets: [{
        label: "Margin %",
        data: PNL_DATA.map(d => d.margin),
        backgroundColor: PNL_DATA.map(d => d.margin >= 20 ? "#16a34a" : d.margin >= 0 ? "#d97706" : "#dc2626"),
        borderRadius: 5, borderSkipped: false,
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "#f3f4f6" }, ticks: { color: "#9ca3af", font:{ size:11 }, callback: v => v + "%" } },
        y: { grid: { display: false }, ticks: { color: "#6b7280", font:{ size:11 } } },
      }
    }
  });
}

function calcMargin() {
  const sell = parseFloat(document.getElementById("calc-sell").value);
  const cost = parseFloat(document.getElementById("calc-cost").value);
  const qty  = parseFloat(document.getElementById("calc-qty").value)  || 1;
  if (!sell || !cost) { toast("⚠ Isi harga jual dan modal terlebih dahulu"); return; }
  const profit = (sell - cost) * qty;
  const margin = ((sell - cost) / sell) * 100;
  const bep    = Math.ceil(cost / (sell - cost));

  const el = document.getElementById("calc-result");
  if (el) el.style.display = "grid";
  const mc = margin >= 20 ? "var(--green)" : margin >= 0 ? "var(--amber)" : "var(--red)";
  const pc = profit >= 0 ? "var(--green)" : "var(--red)";
  document.getElementById("r-profit").innerHTML = `<span style="color:${pc}">${rp(profit)}</span>`;
  document.getElementById("r-margin").innerHTML = `<span style="color:${mc}">${margin.toFixed(2)}%</span>`;
  document.getElementById("r-bep").textContent    = bep + " unit";
  document.getElementById("r-rev").textContent    = rp(sell * qty);
}

async function pnlAI() {
  const btn = document.getElementById("btn-pnl-ai");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Analyzing...`;
  const box = document.getElementById("pnl-ai-body");
  box.innerHTML = [80,60,70,50,65].map(w =>
    `<div class="skeleton" style="height:12px;width:${w}%;margin-bottom:8px"></div>`
  ).join("");

  try {
    const prompt = `Kamu analyst keuangan SmartStock. Analisa data P&L dan beri 4-5 rekomendasi actionable dalam bahasa Indonesia:
${PNL_DATA.map(d => `• ${d.name}: margin ${d.margin}%, status ${d.status}`).join("\n")}
Format: poin singkat, langsung ke action.`;

    const text = await callAI(prompt, 800);
    box.innerHTML = `<p class="ai-body">${text.replace(/\n/g, "<br>")}</p>
      <div class="potential-box" style="margin-top:14px">
        <div class="potential-label">Potensi peningkatan profit (estimasi AI)</div>
        <div class="potential-value">Rp 2.850.000 <span style="font-size:13px;font-weight:500">/ bulan</span></div>
      </div>`;
  } catch (e) {
    box.innerHTML = `<p style="color:var(--red);font-size:12px">⚠ Gagal terhubung ke AI. Coba lagi.</p>`;
  }
  btn.disabled = false;
  btn.innerHTML = "🤖 Analyze AI";
}

/* =========================================================
   AI INSIGHT
   ========================================================= */
async function generateInsights() {
  const btn = document.getElementById("btn-insights");
  const grid = document.getElementById("insights-grid");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Analyzing...`;
  grid.innerHTML = [1,2,3].map(() =>
    `<div class="skeleton" style="height:170px;border-radius:16px"></div>`
  ).join("");

  try {
    const prompt = `Kamu AI business advisor untuk toko sembako SmartStock. Berikan 6 insight bisnis dalam format JSON array. Setiap item punya field: title, description, priority ("high"/"medium"/"low"), category, action. Data: 1256 produk, penjualan Rp45,68Jt/bulan, margin 38%, 12 produk rugi, 38 produk akan exp. Balas dengan JSON array SAJA, tanpa teks lain, tanpa markdown.`;

    const raw = await callAI(prompt, 1200);
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const list = JSON.parse(cleaned);

    const PCOLORS = { high:"#dc2626", medium:"#d97706", low:"#16a34a" };
    const PBADGE  = { high:"b-red", medium:"b-amber", low:"b-green" };

    grid.innerHTML = list.map(ins => `
      <div class="insight-card" style="border-top-color:${PCOLORS[ins.priority] || "#16a34a"}">
        <div style="display:flex;align-items:start;justify-content:space-between;gap:8px;margin-bottom:7px">
          <div class="insight-card-title">${ins.title}</div>
          <span class="badge ${PBADGE[ins.priority] || "b-gray"}" style="flex-shrink:0">${ins.priority}</span>
        </div>
        <p class="insight-card-desc">${ins.description}</p>
        <div class="insight-action-box">
          <p class="insight-action-txt" style="color:${PCOLORS[ins.priority] || "var(--green)"}">→ ${ins.action}</p>
        </div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:7px">📂 ${ins.category}</div>
      </div>`).join("");
  } catch (e) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;color:var(--red);padding:32px">
        <div style="font-size:32px;margin-bottom:8px">⚠</div>
        <p>Gagal mengambil insights. Coba lagi.</p>
      </div>`;
  }
  btn.disabled = false;
  btn.innerHTML = "✨ Generate Insights";
}

async function askAdvisor() {
  const q = document.getElementById("advisor-q").value.trim();
  if (!q) return;
  const btn = document.getElementById("btn-ask");
  const ans = document.getElementById("advisor-answer");
  const txt = document.getElementById("advisor-text");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span>`;
  ans.style.display = "block";
  txt.textContent = "AI sedang menganalisa pertanyaan Anda...";

  try {
    const prompt = `Kamu AI advisor untuk toko sembako SmartStock (1256 produk, Rp45,68Jt/bulan, margin 38%). Jawab dalam bahasa Indonesia singkat dan praktis (maksimal 3 paragraf): ${q}`;
    txt.textContent = await callAI(prompt, 600);
  } catch {
    txt.textContent = "Gagal menghubungi AI. Periksa koneksi Anda.";
  }
  btn.disabled = false;
  btn.innerHTML = "Tanya →";
}

/* =========================================================
   PRODUK PAGE
   ========================================================= */
function initProdukPage() {
  const tbody = document.getElementById("produk-tbody");
  if (!tbody) return;
  tbody.innerHTML = PRODUCTS.map(p => {
    const mg  = (((p.price - p.cost) / p.price) * 100).toFixed(1);
    const sc  = p.stock === 0 ? "b-red" : p.stock <= p.min ? "b-amber" : "b-green";
    const sl  = p.stock === 0 ? "Out of Stock" : p.stock <= p.min ? "Low Stock" : "In Stock";
    return `<tr>
      <td><div class="td-name"><span>${p.em}</span>${p.name}</div></td>
      <td>${p.cat}</td>
      <td class="val-profit">${rp(p.price)}</td>
      <td>${rp(p.cost)}</td>
      <td class="${parseFloat(mg) >= 20 ? "val-profit" : "val-low"}">${mg}%</td>
      <td style="font-weight:700;color:${p.stock===0?"var(--red)":p.stock<=p.min?"var(--amber)":"var(--green)"}">${p.stock}</td>
      <td>${p.min}</td>
      <td>${p.exp}</td>
      <td><span class="badge ${sc}">${sl}</span></td>
      <td>
        <div style="display:flex;gap:6px">
          <button class="btn btn-outline btn-sm" onclick="toast('✏ Edit ${p.name}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="toast('🗑 Produk dihapus')">Hapus</button>
        </div>
      </td>
    </tr>`;
  }).join("");
}

/* =========================================================
   STOK PAGE
   ========================================================= */
function initStokPage() {
  const tbody = document.getElementById("stok-tbody");
  if (!tbody) return;
  tbody.innerHTML = PRODUCTS.map(p => {
    const sc = p.stock === 0 ? "b-red" : p.stock <= p.min ? "b-amber" : "b-green";
    const sl = p.stock === 0 ? "Out of Stock" : p.stock <= p.min ? "Low Stock" : "In Stock";
    return `<tr>
      <td><div class="td-name"><span>${p.em}</span>${p.name}</div></td>
      <td>${p.cat}</td>
      <td style="font-weight:700;color:${p.stock===0?"var(--red)":p.stock<=p.min?"var(--amber)":"var(--green)"}">${p.stock}</td>
      <td>${p.min}</td>
      <td>${p.exp}</td>
      <td><span class="badge ${sc}">${sl}</span></td>
      <td><button class="btn btn-primary btn-sm" onclick="toast('📦 Stok ${p.name} diperbarui!')">Update Stok</button></td>
    </tr>`;
  }).join("");
}

/* =========================================================
   LAPORAN
   ========================================================= */
function initLaporan() {
  const ctx1 = document.getElementById("laporan-line");
  if (ctx1) {
    if (charts.lapLine) charts.lapLine.destroy();
    charts.lapLine = new Chart(ctx1.getContext("2d"), {
      type: "line",
      data: {
        labels: SALES_DATA.map(s => s.m),
        datasets: [
          { label:"Penjualan", data: SALES_DATA.map(s => s.s), borderColor:"#16a34a", backgroundColor:"rgba(22,163,74,.08)", tension:.4, pointBackgroundColor:"#16a34a", fill:true },
          { label:"Modal",     data: SALES_DATA.map(s => s.c), borderColor:"#2563eb", backgroundColor:"rgba(37,99,235,.06)",  tension:.4, pointBackgroundColor:"#2563eb", fill:true },
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels:{ color:"#6b7280", font:{ size:11 } } } },
        scales: {
          x: { grid:{ display:false }, ticks:{ color:"#9ca3af", font:{ size:11 } } },
          y: { grid:{ color:"#f3f4f6" }, ticks:{ color:"#9ca3af", font:{ size:11 }, callback: v => (v/1e6).toFixed(0)+"Jt" } },
        }
      }
    });
  }

  const ctx2 = document.getElementById("laporan-pie");
  if (ctx2) {
    if (charts.lapPie) charts.lapPie.destroy();
    charts.lapPie = new Chart(ctx2.getContext("2d"), {
      type: "doughnut",
      data: {
        labels: ["Minuman","Protein","Dairy","Bakery"],
        datasets: [{ data:[35,28,20,17], backgroundColor:["#16a34a","#2563eb","#0891b2","#d97706"], borderWidth:3, borderColor:"#fff" }]
      },
      options: {
        plugins: { legend:{ position:"right", labels:{ color:"#6b7280", font:{ size:11 }, boxWidth:12, padding:10 } } },
        cutout: "55%",
      }
    });
  }
}

/* =========================================================
   BOOT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  loadData(); // Load dari localStorage
  refreshIcons();
  navigate('dashboard'); // atau page default Anda
});

/* ============ LUCIDE ICONS HELPER ============ */
function refreshIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Init saat pertama kali load
document.addEventListener('DOMContentLoaded', () => {
  refreshIcons();
});
