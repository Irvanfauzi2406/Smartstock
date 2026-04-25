/* =========================================================
   SmartStock AI — app.js
   ========================================================= */

// Purchase Orders store
let PURCHASE_ORDERS = [];
let PO_COUNTER = 1;

// Load dari localStorage kalau ada
function loadData() {
  try {
    const savedProducts = localStorage.getItem('smartstock_products');
    const savedPO = localStorage.getItem('smartstock_po');
    
    if (savedProducts) {
      const parsed = JSON.parse(savedProducts);
      // Update stock saja, jangan replace seluruh array
      parsed.forEach(saved => {
        const product = PRODUCTS.find(p => p.id === saved.id);
        if (product) {
          product.stock = saved.stock;
        }
      });
    }
    
    if (savedPO) {
      PURCHASE_ORDERS.length = 0; // clear array tanpa reassign
      JSON.parse(savedPO).forEach(po => PURCHASE_ORDERS.push(po));
      PO_COUNTER = PURCHASE_ORDERS.length + 1;
    }
  } catch(e) {
    console.warn('Load data error:', e);
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
  if (product.stock < product.min) return { label: 'Low Stock', class: 'status-amber' };
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
        <td>${p.cat}</td>
        <td class="stock-cell ${status.class}">${p.stock}</td>
        <td>${p.min}</td>
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
  
  // Info produk (kalau element ada)
  const infoEl = document.getElementById('update-stock-info');
  if (infoEl) {
    const statusClass = product.stock === 0 ? 'status-red' : 
                       product.stock < product.min ? 'status-amber' : 'status-green';
    const statusLabel = product.stock === 0 ? 'Out of Stock' : 
                       product.stock < product.min ? 'Low Stock' : 'In Stock';
    
    infoEl.innerHTML = `
      <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px">${product.name}</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:6px">
          ${product.cat} · Stok: <strong>${product.stock}</strong>
        </div>
        <span class="status-badge ${statusClass}">${statusLabel}</span>
      </div>
    `;
  }
  
  // Reset form
  const amountEl = document.getElementById('stock-amount');
  const reasonEl = document.getElementById('stock-reason');
  const previewEl = document.getElementById('stock-preview');
  if (amountEl) { amountEl.value = ''; amountEl.oninput = updateStockPreview; }
  if (reasonEl) reasonEl.value = '';
  if (previewEl) previewEl.innerHTML = '';
  
  // Reset radio buttons
  document.querySelectorAll('#modal-update-stock .radio-btn').forEach(b => b.classList.remove('active'));
  const addBtn = document.querySelector('#modal-update-stock [data-type="add"]');
  if (addBtn) addBtn.classList.add('active');
  
  // Show modal (PAKAI CLASS, BUKAN STYLE)
  const modal = document.getElementById('modal-update-stock');
  if (modal) {
    modal.classList.add('show');
  }
  
  if (typeof refreshIcons === 'function') refreshIcons();
}

function openCreatePOModal() {
  const select = document.getElementById('po-product');
  if (!select) {
    alert('Modal belum siap');
    return;
  }
  
  select.innerHTML = '<option value="">-- Pilih Produk --</option>' +
    PRODUCTS.map(p => `
      <option value="${p.id}">${p.name} (Stok: ${p.stock})</option>
    `).join('');
  
  document.getElementById('po-qty').value = '';
  document.getElementById('po-supplier').value = '';
  document.getElementById('po-note').value = '';
  const preview = document.getElementById('po-preview');
  if (preview) preview.innerHTML = '';
  
  // Show modal pakai class
  const modal = document.getElementById('modal-create-po');
  if (modal) {
    modal.classList.add('show');
  }
  
  if (typeof refreshIcons === 'function') refreshIcons();
}

// Close modal - HAPUS class show
function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('show');
  }
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
  const navBtn = document.querySelector(`[data-page="${page}"]`);
  if (navBtn) navBtn.classList.add('active');
  
  // 🔥 RENDER CONTENT SESUAI PAGE
  try {
    switch (page) {
      case 'produk':
        if (typeof renderProduk === 'function') renderProduk();
        break;
      case 'stok':
        if (typeof renderStok === 'function') renderStok();
        break;
      case 'pembelian':
        if (typeof renderPO === 'function') renderPO();
        break;
      case 'penjualan':
        if (typeof renderTokoOnline === 'function') renderTokoOnline();
        break;
      case 'dashboard':
        if (typeof renderDashboardStats === 'function') renderDashboardStats();
        break;
    }
  } catch(e) {
    console.warn('Render error:', e);
  }
  
  // Refresh Lucide icons
  setTimeout(() => {
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
    }
  }, 50);
  
  console.log('📍 Navigated to:', page);
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

/* ============ LUCIDE ICONS AUTO-REFRESH ============ */
function refreshIcons() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}

// Init saat DOM ready
document.addEventListener('DOMContentLoaded', () => {
  refreshIcons();
});

// Auto-refresh tiap ada perubahan DOM (safety net)
// Refresh setiap 500ms untuk pastikan icon selalu muncul
let iconRefreshInterval;
function startIconRefresh() {
  if (iconRefreshInterval) clearInterval(iconRefreshInterval);
  iconRefreshInterval = setInterval(() => {
    const emptyIcons = document.querySelectorAll('[data-lucide]:not(.lucide)');
    if (emptyIcons.length > 0) {
      refreshIcons();
    }
  }, 500);
}

// Start saat load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startIconRefresh);
} else {
  startIconRefresh();
}

/* ============================================
   RENDER FUNCTIONS
   ============================================ */

function renderProduk() {
  const container = document.getElementById('page-produk');
  if (!container) return;
  
  const tbody = container.querySelector('#produk-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = PRODUCTS.map(p => {
    // Hitung margin
    const margin = (p.price && p.cost) ? 
      Math.round(((p.price - p.cost) / p.price) * 100) : 0;
    
    // Status
    const statusClass = p.stock === 0 ? 'status-red' : 
                       p.stock < p.min ? 'status-amber' : 'status-green';
    const statusLabel = p.stock === 0 ? 'Out of Stock' : 
                       p.stock < p.min ? 'Low Stock' : 'In Stock';
    
    // Stok color
    const stockColor = p.stock === 0 ? 'var(--red)' : 
                      p.stock < p.min ? 'var(--amber)' : 'var(--green)';
    
    // Format tanggal
    const expDate = p.exp ? new Date(p.exp).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) : '-';
    
    // 10 KOLOM sesuai header
    return `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td>${p.cat}</td>
        <td><strong>Rp ${p.price.toLocaleString('id-ID')}</strong></td>
        <td style="color:#64748b">Rp ${p.cost.toLocaleString('id-ID')}</td>
        <td><strong style="color:var(--green)">${margin}%</strong></td>
        <td><strong style="color:${stockColor}">${p.stock}</strong></td>
        <td style="color:#64748b">${p.min}</td>
        <td style="color:#64748b;font-size:12px">${expDate}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <button class="btn-primary btn-sm" onclick="openUpdateStockModal(${p.id})">
            <i data-lucide="refresh-cw" class="btn-ico"></i>
            Update Stok
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  if (typeof refreshIcons === 'function') refreshIcons();
}

function renderTokoOnline() {
  // Placeholder, tidak error
  return;
}

function renderDashboardStats() {
  // Placeholder, tidak error
  return;
}

function openBulkUpdateModal() {
  // Tampilkan list produk untuk dipilih
  const firstProduct = PRODUCTS[0];
  if (firstProduct) {
    openUpdateStockModal(firstProduct.id);
  } else {
    if (typeof toast === 'function') {
      toast('Belum ada produk', 'error');
    } else {
      alert('Belum ada produk');
    }
  }
}

/* ============================================
   RENDER PRODUK — FIXED VERSION
   ============================================ */
function renderProduk() {
  const tbody = document.getElementById('produk-tbody');
  if (!tbody) {
    console.error('❌ #produk-tbody tidak ditemukan');
    return;
  }
  
  if (!PRODUCTS || PRODUCTS.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="10" style="text-align:center;padding:40px;color:#94a3b8">
        Belum ada produk
      </td></tr>
    `;
    return;
  }
  
  tbody.innerHTML = PRODUCTS.map(p => {
    const margin = (p.price && p.cost) ? 
      Math.round(((p.price - p.cost) / p.price) * 100) : 0;
    
    const statusClass = p.stock === 0 ? 'status-red' : 
                       p.stock < p.min ? 'status-amber' : 'status-green';
    const statusLabel = p.stock === 0 ? 'Out of Stock' : 
                       p.stock < p.min ? 'Low Stock' : 'In Stock';
    const stockColor = p.stock === 0 ? '#dc2626' : 
                      p.stock < p.min ? '#d97706' : '#16a34a';
    
    const expDate = p.exp ? new Date(p.exp).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) : '-';
    
    return `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td><span style="background:#f1f5f9;padding:3px 10px;border-radius:12px;font-size:11px">${p.cat}</span></td>
        <td><strong>Rp ${p.price.toLocaleString('id-ID')}</strong></td>
        <td style="color:#64748b">Rp ${p.cost.toLocaleString('id-ID')}</td>
        <td><strong style="color:#16a34a">${margin}%</strong></td>
        <td><strong style="color:${stockColor};font-size:15px">${p.stock}</strong></td>
        <td style="color:#64748b">${p.min}</td>
        <td style="color:#64748b;font-size:12px">${expDate}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <button class="btn-primary btn-sm" onclick="openUpdateStockModal(${p.id})" style="padding:5px 10px;font-size:11px">
            <i data-lucide="refresh-cw" style="width:12px;height:12px"></i>
            Update
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  if (typeof refreshIcons === 'function') refreshIcons();
  console.log('✅ renderProduk: ', PRODUCTS.length, 'produk ditampilkan');
}

/* ============================================
   RENDER STOK — FIXED VERSION
   ============================================ */
function renderStok() {
  const tbody = document.getElementById('stok-tbody');
  if (!tbody) {
    console.error('❌ #stok-tbody tidak ditemukan');
    return;
  }
  
  tbody.innerHTML = PRODUCTS.map(p => {
    const statusClass = p.stock === 0 ? 'status-red' : 
                       p.stock < p.min ? 'status-amber' : 'status-green';
    const statusLabel = p.stock === 0 ? 'Out of Stock' : 
                       p.stock < p.min ? 'Low Stock' : 'In Stock';
    const stockColor = p.stock === 0 ? '#dc2626' : 
                      p.stock < p.min ? '#d97706' : '#16a34a';
    
    const expDate = p.exp ? new Date(p.exp).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric'
    }) : '-';
    
    return `
      <tr>
        <td><strong>${p.name}</strong></td>
        <td><span style="background:#f1f5f9;padding:3px 10px;border-radius:12px;font-size:11px">${p.cat}</span></td>
        <td><strong style="color:${stockColor};font-size:16px">${p.stock}</strong></td>
        <td style="color:#64748b">${p.min}</td>
        <td style="color:#64748b;font-size:12px">${expDate}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>
          <button class="btn-primary btn-sm" onclick="openUpdateStockModal(${p.id})" style="padding:6px 12px;font-size:12px">
            <i data-lucide="refresh-cw" style="width:13px;height:13px"></i>
            Update
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  if (typeof refreshIcons === 'function') refreshIcons();
  console.log('✅ renderStok: ', PRODUCTS.length, 'produk ditampilkan');
}

/* ============================================
   PURCHASE ORDER — COMPLETE VERSION
   ============================================ */

function renderPO() {
  const tbody = document.getElementById('po-tbody');
  if (!tbody) {
    console.error('❌ #po-tbody tidak ditemukan');
    return;
  }
  
  // Update counter
  const pending = PURCHASE_ORDERS.filter(p => p.status === 'pending').length;
  const approved = PURCHASE_ORDERS.filter(p => p.status === 'approved').length;
  const received = PURCHASE_ORDERS.filter(p => p.status === 'received').length;
  
  const pendEl = document.getElementById('po-pending-count');
  const apprEl = document.getElementById('po-approved-count');
  const recvEl = document.getElementById('po-received-count');
  if (pendEl) pendEl.textContent = pending;
  if (apprEl) apprEl.textContent = approved;
  if (recvEl) recvEl.textContent = received;
  
  if (PURCHASE_ORDERS.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="8" style="text-align:center;padding:40px;color:#94a3b8">
        <i data-lucide="inbox" style="width:40px;height:40px;opacity:0.3;display:block;margin:0 auto 10px"></i>
        <p>Belum ada Purchase Order</p>
        <button class="btn-primary" onclick="openCreatePOModal()" style="margin-top:10px">
          <i data-lucide="plus" class="btn-ico"></i> Buat PO Pertama
        </button>
      </td></tr>
    `;
    if (typeof refreshIcons === 'function') refreshIcons();
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
    
    let actionButtons = '';
    if (po.status === 'pending') {
      actionButtons = `
        <button class="btn-primary btn-sm" onclick="approvePO(${po.id})" style="margin-right:4px">
          <i data-lucide="check" style="width:12px;height:12px"></i> Approve
        </button>
        <button class="btn-outline btn-sm" onclick="cancelPO(${po.id})">
          <i data-lucide="x" style="width:12px;height:12px"></i>
        </button>
      `;
    } else if (po.status === 'approved') {
      actionButtons = `
        <button class="btn-primary btn-sm" onclick="receivePO(${po.id})">
          <i data-lucide="package-check" style="width:12px;height:12px"></i> Receive
        </button>
      `;
    } else {
      actionButtons = `<span style="color:#94a3b8;font-size:12px">-</span>`;
    }
    
    return `
      <tr>
        <td><strong>${po.poNumber}</strong></td>
        <td style="font-size:12px;color:#64748b">${po.date}</td>
        <td>${po.productName}</td>
        <td><strong>${po.qty}</strong></td>
        <td><strong>Rp ${po.total.toLocaleString('id-ID')}</strong></td>
        <td style="font-size:12px">${po.supplier}</td>
        <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
        <td>${actionButtons}</td>
      </tr>
    `;
  }).join('');
  
  if (typeof refreshIcons === 'function') refreshIcons();
  console.log('✅ renderPO:', PURCHASE_ORDERS.length, 'PO ditampilkan');
}

function openCreatePOModal() {
  const select = document.getElementById('po-product');
  if (!select) {
    alert('Modal belum siap, refresh halaman');
    return;
  }
  
  select.innerHTML = '<option value="">-- Pilih Produk --</option>' +
    PRODUCTS.map(p => `
      <option value="${p.id}">${p.name} (Stok: ${p.stock})</option>
    `).join('');
  
  document.getElementById('po-qty').value = '';
  document.getElementById('po-supplier').value = '';
  document.getElementById('po-note').value = '';
  document.getElementById('po-preview').innerHTML = '';
  
  document.getElementById('modal-create-po').style.display = 'flex';
  if (typeof refreshIcons === 'function') refreshIcons();
}

function updatePOPreview() {
  const productId = parseInt(document.getElementById('po-product').value);
  const qty = parseInt(document.getElementById('po-qty').value) || 0;
  const preview = document.getElementById('po-preview');
  
  if (!productId || !qty) {
    preview.innerHTML = '';
    return;
  }
  
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  const total = product.cost * qty;
  
  preview.innerHTML = `
    <div style="background:#f0fdf4;border:1px dashed #16a34a;border-radius:10px;padding:14px;margin-top:10px">
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
        <span>Produk:</span><strong>${product.name}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
        <span>Harga Beli:</span><strong>Rp ${product.cost.toLocaleString('id-ID')}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:13px">
        <span>Quantity:</span><strong>${qty}</strong>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0 0;margin-top:6px;border-top:1px dashed #cbd5e1;font-size:15px">
        <span>Total:</span><strong style="color:#16a34a">Rp ${total.toLocaleString('id-ID')}</strong>
      </div>
      <div style="margin-top:10px;padding:8px;background:#fef3c7;border-radius:6px;font-size:12px;color:#92400e">
        ℹ️ Stok akan bertambah dari <strong>${product.stock}</strong> → <strong>${product.stock + qty}</strong> saat PO di-receive
      </div>
    </div>
  `;
}

function createPO() {
  const productId = parseInt(document.getElementById('po-product').value);
  const qty = parseInt(document.getElementById('po-qty').value);
  const supplier = document.getElementById('po-supplier').value.trim();
  const note = document.getElementById('po-note').value.trim();
  
  if (!productId) return alert('Pilih produk dulu');
  if (!qty || qty <= 0) return alert('Masukkan quantity yang valid');
  if (!supplier) return alert('Isi nama supplier');
  
  const product = PRODUCTS.find(p => p.id === productId);
  const poNumber = `PO-${String(PO_COUNTER).padStart(4, '0')}`;
  
  const newPO = {
    id: Date.now(),
    poNumber: poNumber,
    date: new Date().toLocaleDateString('id-ID'),
    productId: productId,
    productName: product.name,
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
  if (typeof saveData === 'function') saveData();
  
  closeModal('modal-create-po');
  renderPO();
  if (typeof toast === 'function') {
    toast(`✅ ${poNumber} berhasil dibuat`, 'success');
  } else {
    alert(`✅ ${poNumber} berhasil dibuat`);
  }
}

function approvePO(poId) {
  const po = PURCHASE_ORDERS.find(p => p.id === poId);
  if (!po) return;
  po.status = 'approved';
  if (typeof saveData === 'function') saveData();
  renderPO();
  if (typeof toast === 'function') toast(`✅ ${po.poNumber} approved`, 'success');
}

function receivePO(poId) {
  const po = PURCHASE_ORDERS.find(p => p.id === poId);
  if (!po) return;
  
  const success = updateStock(po.productId, po.qty, 'add', `Received ${po.poNumber}`);
  
  if (success) {
    po.status = 'received';
    po.receivedAt = new Date().toISOString();
    if (typeof saveData === 'function') saveData();
    renderPO();
  }
}

function cancelPO(poId) {
  if (!confirm('Yakin batalkan PO ini?')) return;
  const po = PURCHASE_ORDERS.find(p => p.id === poId);
  if (!po) return;
  po.status = 'cancelled';
  if (typeof saveData === 'function') saveData();
  renderPO();
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

function openBulkUpdateModal() {
  if (PRODUCTS.length > 0) {
    openUpdateStockModal(PRODUCTS[0].id);
  }
}

/* ===== MODAL FIX — FORCE HIDE ALL MODAL ON LOAD ===== */
(function() {
  function hideAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.classList.remove('show');
      m.style.display = 'none';
    });
  }
  
  // Hide saat load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hideAllModals);
  } else {
    hideAllModals();
  }
  
  // Override function open modal
  window.openUpdateStockModal = function(productId) {
    hideAllModals(); // tutup semua dulu
    
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    window.currentUpdateProductId = productId;
    window.currentUpdateType = 'add';
    
    const infoEl = document.getElementById('update-stock-info');
    if (infoEl) {
      const statusClass = product.stock === 0 ? 'status-red' : 
                         product.stock < product.min ? 'status-amber' : 'status-green';
      const statusLabel = product.stock === 0 ? 'Out of Stock' : 
                         product.stock < product.min ? 'Low Stock' : 'In Stock';
      infoEl.innerHTML = `
        <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:14px">
          <div style="font-weight:700;font-size:14px;margin-bottom:4px">${product.name}</div>
          <div style="font-size:12px;color:#64748b;margin-bottom:6px">
            ${product.cat} · Stok: <strong>${product.stock}</strong>
          </div>
          <span class="status-badge ${statusClass}">${statusLabel}</span>
        </div>
      `;
    }
    
    const amountEl = document.getElementById('stock-amount');
    const reasonEl = document.getElementById('stock-reason');
    const previewEl = document.getElementById('stock-preview');
    if (amountEl) { amountEl.value = ''; amountEl.oninput = updateStockPreview; }
    if (reasonEl) reasonEl.value = '';
    if (previewEl) previewEl.innerHTML = '';
    
    document.querySelectorAll('#modal-update-stock .radio-btn').forEach(b => b.classList.remove('active'));
    const addBtn = document.querySelector('#modal-update-stock [data-type="add"]');
    if (addBtn) addBtn.classList.add('active');
    
    const modal = document.getElementById('modal-update-stock');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
    
    if (typeof refreshIcons === 'function') refreshIcons();
  };
  
  window.openCreatePOModal = function() {
    hideAllModals();
    
    const select = document.getElementById('po-product');
    if (!select) return alert('Modal belum siap');
    
    select.innerHTML = '<option value="">-- Pilih Produk --</option>' +
      PRODUCTS.map(p => `<option value="${p.id}">${p.name} (Stok: ${p.stock})</option>`).join('');
    
    document.getElementById('po-qty').value = '';
    document.getElementById('po-supplier').value = '';
    document.getElementById('po-note').value = '';
    const preview = document.getElementById('po-preview');
    if (preview) preview.innerHTML = '';
    
    const modal = document.getElementById('modal-create-po');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
    
    if (typeof refreshIcons === 'function') refreshIcons();
  };
  
  window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
    }
  };
  
  // Close kalau click di luar modal-box
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.style.display = 'none';
      e.target.classList.remove('show');
    }
  });
  
  // Close dengan ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') hideAllModals();
  });
  
  console.log('✅ Modal fix loaded');
})();

/* ============================================
   FINAL MODAL FIX — FORCE HIDE ON LOAD
   ============================================ */
(function finalModalFix() {
  function killAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(m => {
      m.style.display = 'none';
      m.classList.remove('show');
      m.setAttribute('aria-hidden', 'true');
    });
  }
  
  // Kill saat load
  killAllModals();
  
  // Kill lagi saat DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', killAllModals);
  }
  
  // Kill lagi setelah 100ms (safety net)
  setTimeout(killAllModals, 100);
  setTimeout(killAllModals, 500);
  setTimeout(killAllModals, 1000);
  
  // Override open modal
  window.openUpdateStockModal = function(productId) {
    killAllModals(); // close semua dulu
    
    setTimeout(() => {
      const product = PRODUCTS.find(p => p.id === productId);
      if (!product) return;
      
      window.currentUpdateProductId = productId;
      window.currentUpdateType = 'add';
      
      const infoEl = document.getElementById('update-stock-info');
      if (infoEl) {
        const sc = product.stock === 0 ? 'status-red' : product.stock < product.min ? 'status-amber' : 'status-green';
        const sl = product.stock === 0 ? 'Out of Stock' : product.stock < product.min ? 'Low Stock' : 'In Stock';
        infoEl.innerHTML = `
          <div style="background:#f8fafc;border-radius:10px;padding:14px;margin-bottom:14px">
            <div style="font-weight:700;font-size:14px;margin-bottom:4px">${product.name}</div>
            <div style="font-size:12px;color:#64748b;margin-bottom:6px">${product.cat} · Stok: <strong>${product.stock}</strong></div>
            <span class="status-badge ${sc}">${sl}</span>
          </div>
        `;
      }
      
      const amountEl = document.getElementById('stock-amount');
      const reasonEl = document.getElementById('stock-reason');
      const previewEl = document.getElementById('stock-preview');
      if (amountEl) { amountEl.value = ''; amountEl.oninput = updateStockPreview; }
      if (reasonEl) reasonEl.value = '';
      if (previewEl) previewEl.innerHTML = '';
      
      document.querySelectorAll('#modal-update-stock .radio-btn').forEach(b => b.classList.remove('active'));
      const addBtn = document.querySelector('#modal-update-stock [data-type="add"]');
      if (addBtn) addBtn.classList.add('active');
      
      const modal = document.getElementById('modal-update-stock');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
      }
      
      if (typeof refreshIcons === 'function') refreshIcons();
    }, 50);
  };
  
  window.openCreatePOModal = function() {
    killAllModals();
    
    setTimeout(() => {
      const select = document.getElementById('po-product');
      if (!select) return alert('Modal belum siap');
      
      select.innerHTML = '<option value="">-- Pilih Produk --</option>' +
        PRODUCTS.map(p => `<option value="${p.id}">${p.name} (Stok: ${p.stock})</option>`).join('');
      
      const qtyEl = document.getElementById('po-qty');
      const suppEl = document.getElementById('po-supplier');
      const noteEl = document.getElementById('po-note');
      const prevEl = document.getElementById('po-preview');
      if (qtyEl) qtyEl.value = '';
      if (suppEl) suppEl.value = '';
      if (noteEl) noteEl.value = '';
      if (prevEl) prevEl.innerHTML = '';
      
      const modal = document.getElementById('modal-create-po');
      if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
      }
      
      if (typeof refreshIcons === 'function') refreshIcons();
    }, 50);
  };
  
  window.closeModal = function(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
  };
  
  // Click outside to close
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal-overlay')) {
      e.target.style.display = 'none';
      e.target.classList.remove('show');
    }
  });
  
  // ESC to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') killAllModals();
  });
  
  // Kill modal saat navigate
  const origNav = window.navigate;
  if (typeof origNav === 'function') {
    window.navigate = function(page) {
      killAllModals();
      return origNav.apply(this, arguments);
    };
  }
  
  console.log('✅ Final modal fix loaded');
})();

/* ============================================
   CONFIRM UPDATE STOCK — FIX
   ============================================ */

window.selectUpdateType = function(type) {
  window.currentUpdateType = type;
  document.querySelectorAll('#modal-update-stock .radio-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`#modal-update-stock [data-type="${type}"]`);
  if (btn) btn.classList.add('active');
  
  if (typeof updateStockPreview === 'function') updateStockPreview();
};

window.updateStockPreview = function() {
  const amount = parseInt(document.getElementById('stock-amount').value) || 0;
  const productId = window.currentUpdateProductId;
  const type = window.currentUpdateType || 'add';
  
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  let newStock;
  switch (type) {
    case 'add': newStock = product.stock + amount; break;
    case 'subtract': newStock = Math.max(0, product.stock - amount); break;
    case 'set': newStock = amount; break;
    default: newStock = product.stock;
  }
  
  const diff = newStock - product.stock;
  const sign = diff >= 0 ? '+' : '';
  const color = diff >= 0 ? '#16a34a' : '#dc2626';
  
  const previewEl = document.getElementById('stock-preview');
  if (previewEl) {
    previewEl.innerHTML = `
      <div style="background:#f0fdf4;border:1px dashed #16a34a;border-radius:10px;padding:14px;margin-top:10px">
        <div style="display:flex;justify-content:space-around;align-items:center">
          <div style="text-align:center">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase">Stok Sekarang</div>
            <div style="font-size:22px;font-weight:800;margin-top:4px">${product.stock}</div>
          </div>
          <div style="font-size:20px;color:#16a34a">→</div>
          <div style="text-align:center">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase">Stok Baru</div>
            <div style="font-size:22px;font-weight:800;margin-top:4px;color:${color}">
              ${newStock} <small style="font-size:13px">(${sign}${diff})</small>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};

window.confirmUpdateStock = function() {
  const amount = parseInt(document.getElementById('stock-amount').value);
  const reason = document.getElementById('stock-reason').value;
  const productId = window.currentUpdateProductId;
  const type = window.currentUpdateType || 'add';
  
  console.log('🔍 Debug confirm:', { productId, amount, type, reason });
  
  if (!productId) {
    alert('⚠️ Product ID hilang. Tutup modal dan coba lagi.');
    return;
  }
  
  if (!amount || amount <= 0) {
    alert('⚠️ Masukkan jumlah yang valid');
    return;
  }
  
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) {
    alert('⚠️ Produk tidak ditemukan');
    console.error('Product ID', productId, 'tidak ada di PRODUCTS:', PRODUCTS);
    return;
  }
  
  const oldStock = product.stock;
  
  switch (type) {
    case 'add':
      product.stock += amount;
      break;
    case 'subtract':
      if (product.stock < amount) {
        alert(`⚠️ Stok tidak cukup! Tersedia: ${product.stock}`);
        return;
      }
      product.stock -= amount;
      break;
    case 'set':
      product.stock = amount;
      break;
  }
  
  // Save ke localStorage
  if (typeof saveData === 'function') saveData();
  
  // Log
  console.log(`📦 Stock Update: ${product.name}`, {
    from: oldStock,
    to: product.stock,
    change: type,
    amount: amount,
    reason: reason
  });
  
  // Re-render halaman aktif
  const activePage = document.querySelector('.page.active');
  if (activePage) {
    const pageId = activePage.id;
    if (pageId === 'page-produk' && typeof renderProduk === 'function') renderProduk();
    if (pageId === 'page-stok' && typeof renderStok === 'function') renderStok();
    if (pageId === 'page-dashboard' && typeof renderDashboardStats === 'function') renderDashboardStats();
  }
  
  // Close modal
  closeModal('modal-update-stock');
  
  // Toast
  const diff = product.stock - oldStock;
  const sign = diff > 0 ? '+' : '';
  const msg = `✅ ${product.name}: ${sign}${diff} (stok: ${product.stock})`;
  
  if (typeof toast === 'function') {
    toast(msg, 'success');
  } else {
    // Fallback toast sederhana
    showSimpleToast(msg, 'success');
  }
};

// Simple toast fallback
function showSimpleToast(message, type = 'info') {
  const colors = {
    success: '#16a34a',
    error: '#dc2626',
    info: '#2563eb'
  };
  
  const toastEl = document.createElement('div');
  toastEl.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 12px 20px;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    z-index: 99999;
    font-weight: 600;
    font-size: 13px;
    animation: slideIn 0.3s ease;
  `;
  toastEl.textContent = message;
  document.body.appendChild(toastEl);
  
  setTimeout(() => {
    toastEl.style.opacity = '0';
    toastEl.style.transition = 'opacity 0.3s';
    setTimeout(() => toastEl.remove(), 300);
  }, 3000);
}

console.log('✅ confirmUpdateStock fix loaded');


// Helper: Update stat card by ID
function updateStatCard(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// Helper: Update stat card by label (cari label text, lalu update value yang sibling)
function updateStatByLabel(labelText, value) {
  const labels = document.querySelectorAll('.stat-label');
  labels.forEach(label => {
    if (label.textContent.trim().startsWith(labelText)) {
      const card = label.closest('.stat-card');
      if (card) {
        const valueEl = card.querySelector('.stat-value');
        if (valueEl) valueEl.textContent = value;
      }
    }
  });
}

// Format angka jadi Jt (juta) atau Rb (ribu)
function formatShort(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(2).replace('.', ',') + ' M';
  if (num >= 1000000) return (num / 1000000).toFixed(2).replace('.', ',') + ' Jt';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.', ',') + ' Rb';
  return num.toString();
}

/* ============================================
   CHART: Donut Ringkasan Stok
   ============================================ */
let stockDonutChart = null;

function renderStockDonut(inStock, lowStock, outStock) {
  // Cari canvas donut chart
  let canvas = document.getElementById('stockDonutChart') || 
               document.querySelector('#page-dashboard canvas');
  
  if (!canvas) {
    // Kalau canvas tidak ada, cari container chart
    const container = document.querySelector('#page-dashboard .card');
    if (!container) return;
    
    // Buat canvas baru
    const chartDiv = Array.from(document.querySelectorAll('#page-dashboard .card')).find(c => 
      c.textContent.includes('Ringkasan Stok')
    );
    
    if (chartDiv) {
      const body = chartDiv.querySelector('.card-body') || chartDiv;
      if (!body.querySelector('canvas')) {
        canvas = document.createElement('canvas');
        canvas.id = 'stockDonutChart';
        canvas.style.maxHeight = '200px';
        body.appendChild(canvas);
      } else {
        canvas = body.querySelector('canvas');
      }
    }
  }
  
  if (!canvas || typeof Chart === 'undefined') return;
  
  // Destroy chart lama
  if (stockDonutChart) {
    stockDonutChart.destroy();
    stockDonutChart = null;
  }
  
  stockDonutChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['In Stock', 'Low Stock', 'Out of Stock'],
      datasets: [{
        data: [inStock, lowStock, outStock],
        backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: { display: false }
      }
    }
  });
}

/* ============================================
   CHART: Tren Penjualan vs Modal
   ============================================ */
let trendChart = null;

function renderTrendChart() {
  let canvas = document.getElementById('trendChart');
  
  if (!canvas) {
    const chartDiv = Array.from(document.querySelectorAll('#page-dashboard .card')).find(c => 
      c.textContent.includes('Tren Penjualan')
    );
    
    if (chartDiv) {
      const body = chartDiv.querySelector('.card-body') || chartDiv;
      if (!body.querySelector('canvas')) {
        canvas = document.createElement('canvas');
        canvas.id = 'trendChart';
        canvas.style.maxHeight = '250px';
        body.appendChild(canvas);
      } else {
        canvas = body.querySelector('canvas');
      }
    }
  }
  
  if (!canvas || typeof Chart === 'undefined') return;
  
  if (trendChart) {
    trendChart.destroy();
    trendChart = null;
  }
  
  // Dummy data 7 hari
  const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const penjualan = [5200000, 6100000, 4800000, 7200000, 8500000, 9100000, 6800000];
  const modal = [3500000, 4200000, 3200000, 4900000, 5800000, 6200000, 4600000];
  
  trendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Penjualan',
          data: penjualan,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        },
        {
          label: 'Modal',
          data: modal,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'top',
          align: 'end',
          labels: { boxWidth: 12, font: { size: 11 } }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'Rp ' + (value / 1000000).toFixed(1) + 'Jt';
            }
          }
        }
      }
    }
  });
}

/* ============================================
   Akan Expired List
   ============================================ */
function renderExpiredList() {
  // Cari container
  const container = Array.from(document.querySelectorAll('#page-dashboard .card')).find(c => 
    c.querySelector('.card-header, h3, .card-title')?.textContent.includes('Akan Expired')
  );
  
  if (!container) return;
  
  const body = container.querySelector('.card-body') || container;
  
  // Hitung produk yang akan expired dalam 30 hari
  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(today.getDate() + 30);
  
  const expiringProducts = PRODUCTS
    .filter(p => {
      if (!p.exp) return false;
      const expDate = new Date(p.exp);
      return expDate >= today && expDate <= in30Days;
    })
    .sort((a, b) => new Date(a.exp) - new Date(b.exp))
    .slice(0, 5);
  
  // Cari atau buat list container
  let listEl = body.querySelector('.expired-list');
  if (!listEl) {
    listEl = document.createElement('div');
    listEl.className = 'expired-list';
    listEl.style.cssText = 'display:flex;flex-direction:column;gap:10px;margin-top:14px';
    body.appendChild(listEl);
  }
  
  if (expiringProducts.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:20px;color:#94a3b8;font-size:13px">
        ✅ Tidak ada produk akan expired dalam 30 hari
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = expiringProducts.map(p => {
    const expDate = new Date(p.exp);
    const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    const urgency = daysLeft <= 7 ? 'red' : daysLeft <= 14 ? 'amber' : 'green';
    const color = urgency === 'red' ? '#dc2626' : urgency === 'amber' ? '#d97706' : '#16a34a';
    const bg = urgency === 'red' ? '#fee2e2' : urgency === 'amber' ? '#fef3c7' : '#dcfce7';
    
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:#f8fafc;border-radius:8px;border-left:3px solid ${color}">
        <div>
          <div style="font-weight:600;font-size:13px">${p.name}</div>
          <div style="font-size:11px;color:#64748b">Stok: ${p.stock} · Exp: ${expDate.toLocaleDateString('id-ID', {day:'2-digit',month:'short'})}</div>
        </div>
        <span style="padding:3px 10px;border-radius:20px;background:${bg};color:${color};font-size:11px;font-weight:700">
          ${daysLeft} hari
        </span>
      </div>
    `;
  }).join('');
}

/* ============================================
   DASHBOARD RENDER — OPTIMIZED FIX
   ============================================ */

// Flag biar chart tidak render berulang

window.renderDashboardStats = function() {
  // 1. Update Tanggal
  const dateEl = document.getElementById('dash-date');
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }
  
  // 2. Hitung Stats
  const totalProduk = PRODUCTS.length;
  const inStock = PRODUCTS.filter(p => p.stock >= p.min && p.stock > 0).length;
  const outStock = PRODUCTS.filter(p => p.stock === 0).length;
  const lowStock = PRODUCTS.filter(p => p.stock > 0 && p.stock < p.min).length;
  
  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(today.getDate() + 30);
  
  const willExpire = PRODUCTS.filter(p => {
    if (!p.exp) return false;
    const expDate = new Date(p.exp);
    return expDate >= today && expDate <= in30Days;
  }).length;
  
  const totalPenjualan = PRODUCTS.reduce((sum, p) => sum + (p.price * p.stock), 0);
  
  // 3. Update Stat Cards by Label
  updateStatByLabel('Total Produk', totalProduk.toLocaleString('id-ID'));
  updateStatByLabel('In Stock', inStock.toLocaleString('id-ID'));
  updateStatByLabel('Out of Stock', outStock.toLocaleString('id-ID'));
  updateStatByLabel('Akan Expired', willExpire.toLocaleString('id-ID'));
  updateStatByLabel('Total Penjualan', formatShort(totalPenjualan));
  
  // 4. Render Charts HANYA SEKALI
  if (!dashboardRendered) {
    setTimeout(() => {
      renderStockDonut(inStock, lowStock, outStock);
      renderTrendChart();
      dashboardRendered = true;
    }, 100);
  } else {
    // Kalau sudah pernah render, cukup update data
    updateStockDonut(inStock, lowStock, outStock);
  }
  
  // 5. Render Expired List
  renderExpiredList();
  
  console.log('✅ Dashboard refreshed:', { totalProduk, inStock, outStock, willExpire });
};

function updateStatByLabel(labelText, value) {
  const labels = document.querySelectorAll('.stat-label');
  labels.forEach(label => {
    if (label.textContent.trim().startsWith(labelText)) {
      const card = label.closest('.stat-card');
      if (card) {
        const valueEl = card.querySelector('.stat-value');
        if (valueEl) valueEl.textContent = value;
      }
    }
  });
}

function formatShort(num) {
  if (num >= 1000000000) return (num / 1000000000).toFixed(2).replace('.', ',') + ' M';
  if (num >= 1000000) return (num / 1000000).toFixed(2).replace('.', ',') + ' Jt';
  if (num >= 1000) return (num / 1000).toFixed(1).replace('.', ',') + ' Rb';
  return num.toString();
}

/* ============================================
   DONUT CHART — FIXED SIZE
   ============================================ */
function renderStockDonut(inStock, lowStock, outStock) {
  // Cari card "Ringkasan Stok"
  const cards = document.querySelectorAll('#page-dashboard .card');
  let container = null;
  
  cards.forEach(card => {
    if (card.textContent.includes('Ringkasan Stok') && !container) {
      container = card;
    }
  });
  
  if (!container) return;
  
  // Cari atau buat canvas
  let canvas = container.querySelector('canvas');
  
  if (!canvas) {
    // Buat wrapper dengan FIXED HEIGHT
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; height: 180px; width: 100%; margin: 10px 0;';
    
    canvas = document.createElement('canvas');
    canvas.id = 'stockDonutChart';
    wrapper.appendChild(canvas);
    
    // Insert sebelum legend (text "In Stock 892...")
    const body = container.querySelector('.card-body') || container;
    const firstLegend = Array.from(body.children).find(el => 
      el.textContent.includes('In Stock') && el.textContent.includes('%')
    );
    
    if (firstLegend) {
      body.insertBefore(wrapper, firstLegend);
    } else {
      body.appendChild(wrapper);
    }
  } else {
    // Pastikan parent canvas punya fixed height
    const parent = canvas.parentElement;
    if (parent && !parent.style.height) {
      parent.style.cssText = 'position: relative; height: 180px; width: 100%;';
    }
  }
  
  if (typeof Chart === 'undefined') return;
  
  // Destroy chart lama
  if (stockDonutChart) {
    stockDonutChart.destroy();
    stockDonutChart = null;
  }
  
  stockDonutChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['In Stock', 'Low Stock', 'Out of Stock'],
      datasets: [{
        data: [inStock, lowStock, outStock],
        backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
        borderWidth: 0,
        hoverOffset: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      animation: {
        duration: 500 // limit animation
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function(ctx) {
              const total = ctx.dataset.data.reduce((a,b) => a+b, 0);
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return `${ctx.label}: ${ctx.raw} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

function updateStockDonut(inStock, lowStock, outStock) {
  if (stockDonutChart) {
    stockDonutChart.data.datasets[0].data = [inStock, lowStock, outStock];
    stockDonutChart.update('none'); // no animation saat update
  }
}

/* ============================================
   TREND CHART — FIXED SIZE
   ============================================ */
function renderTrendChart() {
  const cards = document.querySelectorAll('#page-dashboard .card');
  let container = null;
  
  cards.forEach(card => {
    if (card.textContent.includes('Tren Penjualan') && !container) {
      container = card;
    }
  });
  
  if (!container) return;
  
  let canvas = container.querySelector('canvas');
  
  if (!canvas) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; height: 240px; width: 100%; margin-top: 10px;';
    
    canvas = document.createElement('canvas');
    canvas.id = 'trendChart';
    wrapper.appendChild(canvas);
    
    const body = container.querySelector('.card-body') || container;
    body.appendChild(wrapper);
  } else {
    const parent = canvas.parentElement;
    if (parent && !parent.style.height) {
      parent.style.cssText = 'position: relative; height: 240px; width: 100%;';
    }
  }
  
  if (typeof Chart === 'undefined') return;
  
  if (trendChart) {
    trendChart.destroy();
    trendChart = null;
  }
  
  const labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const penjualan = [5200000, 6100000, 4800000, 7200000, 8500000, 9100000, 6800000];
  const modal = [3500000, 4200000, 3200000, 4900000, 5800000, 6200000, 4600000];
  
  trendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Penjualan',
          data: penjualan,
          borderColor: '#16a34a',
          backgroundColor: 'rgba(22, 163, 74, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#16a34a',
          pointRadius: 3
        },
        {
          label: 'Modal',
          data: modal,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#3b82f6',
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 500
      },
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 10 },
            callback: function(value) {
              return 'Rp ' + (value / 1000000).toFixed(1) + 'Jt';
            }
          }
        },
        x: {
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

/* ============================================
   EXPIRED LIST
   ============================================ */
function renderExpiredList() {
  const cards = document.querySelectorAll('#page-dashboard .card');
  let container = null;
  
  cards.forEach(card => {
    if (card.textContent.includes('Akan Expired') && !card.textContent.includes('≤30') && !container) {
      container = card;
    }
  });
  
  if (!container) return;
  
  const body = container.querySelector('.card-body') || container;
  
  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(today.getDate() + 30);
  
  const expiring = PRODUCTS
    .filter(p => {
      if (!p.exp) return false;
      const expDate = new Date(p.exp);
      return expDate >= today && expDate <= in30Days;
    })
    .sort((a, b) => new Date(a.exp) - new Date(b.exp))
    .slice(0, 5);
  
  let listEl = body.querySelector('.expired-list');
  if (!listEl) {
    listEl = document.createElement('div');
    listEl.className = 'expired-list';
    listEl.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:14px';
    body.appendChild(listEl);
  }
  
  if (expiring.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center;padding:30px 15px;color:#94a3b8;font-size:13px">
        ✅ Tidak ada produk akan expired dalam 30 hari
      </div>
    `;
    return;
  }
  
  listEl.innerHTML = expiring.map(p => {
    const expDate = new Date(p.exp);
    const daysLeft = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
    const color = daysLeft <= 7 ? '#dc2626' : daysLeft <= 14 ? '#d97706' : '#16a34a';
    const bg = daysLeft <= 7 ? '#fee2e2' : daysLeft <= 14 ? '#fef3c7' : '#dcfce7';
    
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:#f8fafc;border-radius:8px;border-left:3px solid ${color}">
        <div style="min-width:0;flex:1">
          <div style="font-weight:600;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
          <div style="font-size:10px;color:#64748b;margin-top:2px">
            Stok: ${p.stock} · ${expDate.toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}
          </div>
        </div>
        <span style="padding:3px 8px;border-radius:20px;background:${bg};color:${color};font-size:10px;font-weight:700;white-space:nowrap;margin-left:8px">
          ${daysLeft} hari
        </span>
      </div>
    `;
  }).join('');
}

console.log('✅ Dashboard v2 loaded');

/* ============================================
   AUTO RENDER DASHBOARD ON LOAD
   ============================================ */
document.addEventListener('DOMContentLoaded', function() {
  // Tunggu semua script loaded, baru render dashboard
  setTimeout(() => {
    // Cek apakah dashboard yang aktif
    const dashEl = document.getElementById('page-dashboard');
    if (dashEl && dashEl.classList.contains('active')) {
      if (typeof renderDashboardStats === 'function') {
        renderDashboardStats();
      }
    }
  }, 300);
});

// Kalau DOMContentLoaded sudah lewat (document already loaded)
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(() => {
    const dashEl = document.getElementById('page-dashboard');
    if (dashEl && dashEl.classList.contains('active')) {
      if (typeof renderDashboardStats === 'function') {
        renderDashboardStats();
      }
    }
  }, 300);
}

/* ============================================
   DASHBOARD — CLEAN VERSION (NO DUPLICATE)
   ============================================ */

// Gunakan window.xxx untuk menghindari "already declared"
window._dashboardRendered = false;
window._stockDonutChart = null;
window._trendChart = null;

window.renderDashboardStats = function() {
  // Tanggal
  const dateEl = document.getElementById('dash-date');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }
  
  // Stats
  const total = PRODUCTS.length;
  const inStk = PRODUCTS.filter(p => p.stock >= p.min && p.stock > 0).length;
  const outStk = PRODUCTS.filter(p => p.stock === 0).length;
  const lowStk = PRODUCTS.filter(p => p.stock > 0 && p.stock < p.min).length;
  
  const today = new Date();
  const in30 = new Date();
  in30.setDate(today.getDate() + 30);
  
  const expire = PRODUCTS.filter(p => {
    if (!p.exp) return false;
    const d = new Date(p.exp);
    return d >= today && d <= in30;
  }).length;
  
  const totalSales = PRODUCTS.reduce((s, p) => s + (p.price * p.stock), 0);
  
  // Update stat cards
  updateStatByLabel('Total Produk', total.toLocaleString('id-ID'));
  updateStatByLabel('In Stock', inStk.toLocaleString('id-ID'));
  updateStatByLabel('Out of Stock', outStk.toLocaleString('id-ID'));
  updateStatByLabel('Akan Expired', expire.toLocaleString('id-ID'));
  updateStatByLabel('Total Penjualan', formatShort(totalSales));
  
  // Render chart sekali aja
  if (!window._dashboardRendered) {
    setTimeout(() => {
      renderStockDonut(inStk, lowStk, outStk);
      renderTrendChart();
      window._dashboardRendered = true;
    }, 100);
  } else {
    // Update data chart yang sudah ada
    if (window._stockDonutChart) {
      window._stockDonutChart.data.datasets[0].data = [inStk, lowStk, outStk];
      window._stockDonutChart.update('none');
    }
  }
  
  renderExpiredList();
  console.log('✅ Dashboard:', { total, inStk, outStk, expire });
};

function updateStatByLabel(labelText, value) {
  document.querySelectorAll('.stat-label').forEach(label => {
    if (label.textContent.trim().startsWith(labelText)) {
      const card = label.closest('.stat-card');
      if (card) {
        const valueEl = card.querySelector('.stat-value');
        if (valueEl) valueEl.textContent = value;
      }
    }
  });
}

function formatShort(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(2).replace('.', ',') + ' M';
  if (num >= 1e6) return (num / 1e6).toFixed(2).replace('.', ',') + ' Jt';
  if (num >= 1e3) return (num / 1e3).toFixed(1).replace('.', ',') + ' Rb';
  return String(num);
}

function renderStockDonut(inStk, lowStk, outStk) {
  const cards = document.querySelectorAll('#page-dashboard .card');
  let container = null;
  cards.forEach(c => {
    if (c.textContent.includes('Ringkasan Stok') && !container) container = c;
  });
  if (!container) return;
  
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;height:180px;width:100%;margin:10px 0';
    canvas = document.createElement('canvas');
    canvas.id = 'stockDonutChart';
    wrap.appendChild(canvas);
    (container.querySelector('.card-body') || container).appendChild(wrap);
  } else if (canvas.parentElement && !canvas.parentElement.style.height) {
    canvas.parentElement.style.cssText = 'position:relative;height:180px;width:100%';
  }
  
  if (typeof Chart === 'undefined') return;
  
  if (window._stockDonutChart) {
    window._stockDonutChart.destroy();
  }
  
  window._stockDonutChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['In Stock', 'Low Stock', 'Out of Stock'],
      datasets: [{
        data: [inStk, lowStk, outStk],
        backgroundColor: ['#16a34a', '#d97706', '#dc2626'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      animation: { duration: 400 },
      plugins: { legend: { display: false } }
    }
  });
}

function renderTrendChart() {
  const cards = document.querySelectorAll('#page-dashboard .card');
  let container = null;
  cards.forEach(c => {
    if (c.textContent.includes('Tren Penjualan') && !container) container = c;
  });
  if (!container) return;
  
  let canvas = container.querySelector('canvas');
  if (!canvas) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;height:240px;width:100%;margin-top:10px';
    canvas = document.createElement('canvas');
    canvas.id = 'trendChart';
    wrap.appendChild(canvas);
    (container.querySelector('.card-body') || container).appendChild(wrap);
  } else if (canvas.parentElement && !canvas.parentElement.style.height) {
    canvas.parentElement.style.cssText = 'position:relative;height:240px;width:100%';
  }
  
  if (typeof Chart === 'undefined') return;
  
  if (window._trendChart) {
    window._trendChart.destroy();
  }
  
  window._trendChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['Sen','Sel','Rab','Kam','Jum','Sab','Min'],
      datasets: [
        { label: 'Penjualan', data: [5.2e6,6.1e6,4.8e6,7.2e6,8.5e6,9.1e6,6.8e6], borderColor: '#16a34a', backgroundColor: 'rgba(22,163,74,0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3 },
        { label: 'Modal', data: [3.5e6,4.2e6,3.2e6,4.9e6,5.8e6,6.2e6,4.6e6], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { font: { size: 10 }, callback: v => 'Rp ' + (v/1e6).toFixed(1) + 'Jt' }
        },
        x: { ticks: { font: { size: 11 } } }
      }
    }
  });
}

function renderExpiredList() {
  const cards = document.querySelectorAll('#page-dashboard .card');
  let container = null;
  cards.forEach(c => {
    if (c.textContent.includes('Akan Expired') && !c.textContent.includes('≤30') && !container) container = c;
  });
  if (!container) return;
  
  const body = container.querySelector('.card-body') || container;
  const today = new Date();
  const in30 = new Date();
  in30.setDate(today.getDate() + 30);
  
  const expiring = PRODUCTS
    .filter(p => p.exp && new Date(p.exp) >= today && new Date(p.exp) <= in30)
    .sort((a, b) => new Date(a.exp) - new Date(b.exp))
    .slice(0, 5);
  
  let list = body.querySelector('.expired-list');
  if (!list) {
    list = document.createElement('div');
    list.className = 'expired-list';
    list.style.cssText = 'display:flex;flex-direction:column;gap:8px;margin-top:14px';
    body.appendChild(list);
  }
  
  if (expiring.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:30px;color:#94a3b8;font-size:13px">✅ Tidak ada produk akan expired dalam 30 hari</div>';
    return;
  }
  
  list.innerHTML = expiring.map(p => {
    const exp = new Date(p.exp);
    const days = Math.ceil((exp - today) / 86400000);
    const color = days <= 7 ? '#dc2626' : days <= 14 ? '#d97706' : '#16a34a';
    const bg = days <= 7 ? '#fee2e2' : days <= 14 ? '#fef3c7' : '#dcfce7';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:#f8fafc;border-radius:8px;border-left:3px solid ${color}">
      <div style="min-width:0;flex:1">
        <div style="font-weight:600;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</div>
        <div style="font-size:10px;color:#64748b;margin-top:2px">Stok: ${p.stock} · ${exp.toLocaleDateString('id-ID',{day:'2-digit',month:'short'})}</div>
      </div>
      <span style="padding:3px 8px;border-radius:20px;background:${bg};color:${color};font-size:10px;font-weight:700;white-space:nowrap;margin-left:8px">${days} hari</span>
    </div>`;
  }).join('');
}

// Auto render saat load
(function() {
  function tryRender() {
    const dash = document.getElementById('page-dashboard');
    if (dash && dash.classList.contains('active') && typeof renderDashboardStats === 'function') {
      renderDashboardStats();
    }
  }
  setTimeout(tryRender, 200);
  setTimeout(tryRender, 800);
  document.addEventListener('DOMContentLoaded', tryRender);
  window.addEventListener('load', tryRender);
})();

console.log('✅ Dashboard clean v3 loaded');