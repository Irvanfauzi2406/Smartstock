/* =========================================================
   SmartStock AI — style.css
   Theme: Warm White Professional (Indonesian SaaS)
   Font: Plus Jakarta Sans
   ========================================================= */

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fira+Code:wght@400;500&display=swap');

/* ── ROOT VARIABLES ── */
:root {
  --bg:        #f7f6f3;
  --bg2:       #f0ede8;
  --surface:   #ffffff;
  --card:      #ffffff;
  --sidebar:   #1a1f2e;
  --sidebar2:  #232a3b;
  --border:    #e4e0d8;
  --border2:   #d0ccc4;

  --green:     #16a34a;
  --green-lt:  #dcfce7;
  --green-d:   #15803d;
  --blue:      #2563eb;
  --blue-lt:   #dbeafe;
  --teal:      #0891b2;
  --teal-lt:   #cffafe;
  --orange:    #ea580c;
  --orange-lt: #ffedd5;
  --red:       #dc2626;
  --red-lt:    #fee2e2;
  --amber:     #d97706;
  --amber-lt:  #fef3c7;
  --purple:    #7c3aed;
  --purple-lt: #ede9fe;

  --text:      #111827;
  --text-sub:  #374151;
  --text-muted:#6b7280;
  --text-xs:   #9ca3af;

  --shadow-sm: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow:    0 4px 12px rgba(0,0,0,.07), 0 1px 3px rgba(0,0,0,.05);
  --shadow-lg: 0 10px 28px rgba(0,0,0,.09), 0 4px 8px rgba(0,0,0,.05);
  --radius:    12px;
  --radius-sm: 8px;
  --radius-lg: 16px;
  --radius-xl: 20px;

  --sidebar-w: 228px;
  --topbar-h:  60px;
}

/* ── RESET ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: 14px; -webkit-font-smoothing: antialiased; }
body {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  overflow: hidden;
}
button  { cursor: pointer; font-family: inherit; }
input, select, textarea { font-family: inherit; }
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
::placeholder { color: var(--text-xs); }

/* =========================================================
   SIDEBAR
   ========================================================= */
#sidebar {
  width: var(--sidebar-w);
  background: var(--sidebar);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0; top: 0; bottom: 0;
  z-index: 200;
  border-right: 1px solid rgba(255,255,255,.06);
}

.logo-wrap {
  padding: 20px 18px 16px;
  border-bottom: 1px solid rgba(255,255,255,.07);
  display: flex;
  align-items: center;
  gap: 11px;
}
.logo-mark {
  width: 34px; height: 34px;
  background: var(--green);
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800; color: #fff;
  flex-shrink: 0;
  letter-spacing: -.5px;
}
.logo-name  { font-size: 13.5px; font-weight: 700; color: #f1f5f9; line-height: 1.2; }
.logo-tag   { font-size: 10px; color: rgba(255,255,255,.35); font-weight: 400; }

.nav-section { padding: 14px 10px 8px; }
.nav-label {
  font-size: 9.5px; font-weight: 700;
  color: rgba(255,255,255,.25);
  letter-spacing: .08em;
  text-transform: uppercase;
  padding: 0 8px 6px;
}
.nav-item {
  display: flex; align-items: center; gap: 9px;
  padding: 8px 10px; border-radius: 9px;
  font-size: 12.5px; font-weight: 500;
  color: rgba(255,255,255,.45);
  border: none; background: none;
  width: 100%; text-align: left;
  transition: all .15s ease;
  position: relative;
  margin-bottom: 1px;
}
.nav-item:hover {
  color: rgba(255,255,255,.8);
  background: rgba(255,255,255,.06);
}
.nav-item.active {
  color: #fff;
  background: var(--green);
  font-weight: 600;
}
.nav-item.active .nav-ico { opacity: 1; }
.nav-ico { font-size: 14px; flex-shrink: 0; opacity: .7; }

.sidebar-footer {
  margin-top: auto;
  padding: 14px 16px;
  border-top: 1px solid rgba(255,255,255,.07);
  display: flex; align-items: center; gap: 10px;
}
.user-ava {
  width: 32px; height: 32px; border-radius: 50%;
  background: linear-gradient(135deg, #16a34a, #0891b2);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #fff; flex-shrink: 0;
}
.user-name { font-size: 12px; font-weight: 600; color: #e2e8f0; }
.user-role { font-size: 10px; color: rgba(255,255,255,.35); }

/* =========================================================
   MAIN CONTENT
   ========================================================= */
#main {
  margin-left: var(--sidebar-w);
  flex: 1;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg);
}

/* Page visibility */
.page { display: none; }
.page.active { display: block; }

/* ── TOPBAR ── */
.topbar {
  height: var(--topbar-h);
  padding: 0 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; top: 0; z-index: 100;
  box-shadow: var(--shadow-sm);
}
.page-title { font-size: 16px; font-weight: 700; color: var(--text); }
.page-sub   { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

/* ── CONTENT AREA ── */
.content {
  padding: 22px 24px;
  display: flex; flex-direction: column; gap: 20px;
}

/* =========================================================
   CARDS
   ========================================================= */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 22px;
  box-shadow: var(--shadow-sm);
}
.card-title {
  font-size: 13px; font-weight: 700;
  color: var(--text); margin-bottom: 16px;
  display: flex; align-items: center; gap: 7px;
}
.card-title-icon {
  width: 26px; height: 26px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
}

/* =========================================================
   STAT CARDS
   ========================================================= */
.stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 14px; }

.stat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  transition: box-shadow .2s, transform .2s;
}
.stat-card:hover { box-shadow: var(--shadow); transform: translateY(-1px); }

.stat-card-stripe {
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.stat-icon-wrap {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; margin-bottom: 12px; margin-top: 6px;
}
.stat-label { font-size: 10.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; }
.stat-value { font-size: 24px; font-weight: 800; margin: 3px 0 2px; line-height: 1.1; }
.stat-trend { font-size: 10.5px; font-weight: 600; display: flex; align-items: center; gap: 3px; }
.trend-up   { color: var(--green); }
.trend-dn   { color: var(--red); }
.trend-warn { color: var(--amber); }

/* =========================================================
   BADGES
   ========================================================= */
.badge {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 9px; border-radius: 99px;
  font-size: 10.5px; font-weight: 600;
}
.b-green  { background: var(--green-lt);  color: var(--green-d); }
.b-red    { background: var(--red-lt);    color: var(--red); }
.b-amber  { background: var(--amber-lt);  color: var(--amber); }
.b-blue   { background: var(--blue-lt);   color: var(--blue); }
.b-purple { background: var(--purple-lt); color: var(--purple); }
.b-teal   { background: var(--teal-lt);   color: var(--teal); }
.b-orange { background: var(--orange-lt); color: var(--orange); }
.b-gray   { background: #f3f4f6; color: #374151; }

/* =========================================================
   BUTTONS
   ========================================================= */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 16px; border-radius: var(--radius-sm);
  font-size: 12.5px; font-weight: 700;
  border: none; cursor: pointer;
  transition: all .15s ease;
  white-space: nowrap;
}
.btn:disabled { opacity: .5; cursor: not-allowed; }
.btn:hover:not(:disabled) { filter: brightness(.94); transform: translateY(-1px); }
.btn:active { transform: translateY(0); }

.btn-primary  { background: var(--green);  color: #fff; box-shadow: 0 2px 8px rgba(22,163,74,.25); }
.btn-blue     { background: var(--blue);   color: #fff; box-shadow: 0 2px 8px rgba(37,99,235,.2); }
.btn-teal     { background: var(--teal);   color: #fff; }
.btn-orange   { background: var(--orange); color: #fff; }
.btn-outline  { background: transparent; border: 1.5px solid var(--border2); color: var(--text-sub); }
.btn-outline:hover:not(:disabled) { border-color: var(--green); color: var(--green); background: var(--green-lt); filter: none; }
.btn-ghost    { background: transparent; color: var(--text-muted); }
.btn-ghost:hover { background: var(--bg); color: var(--text); filter: none; }
.btn-danger   { background: var(--red-lt); color: var(--red); }
.btn-danger:hover { background: var(--red); color: #fff; filter: none; }

.btn-sm  { padding: 5px 12px; font-size: 11.5px; border-radius: 7px; }
.btn-lg  { padding: 10px 22px; font-size: 13.5px; border-radius: 10px; }
.btn-xl  { padding: 13px 28px; font-size: 14px; border-radius: 11px; }
.btn-icon { width: 34px; height: 34px; padding: 0; border-radius: 9px; font-size: 15px; }

/* =========================================================
   INPUTS
   ========================================================= */
.form-group { margin-bottom: 14px; }
.form-label {
  display: block; font-size: 11.5px; font-weight: 600;
  color: var(--text-sub); margin-bottom: 5px;
}
.form-input {
  width: 100%;
  background: var(--bg);
  border: 1.5px solid var(--border);
  color: var(--text);
  padding: 9px 13px;
  border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 400;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
}
.form-input:focus {
  border-color: var(--green);
  background: var(--surface);
  box-shadow: 0 0 0 3px rgba(22,163,74,.1);
}

/* =========================================================
   TABLE
   ========================================================= */
.table-wrap { overflow-x: auto; border-radius: var(--radius); }
table { width: 100%; border-collapse: collapse; }
thead tr { background: var(--bg); }
th {
  padding: 10px 14px; text-align: left;
  font-size: 10.5px; font-weight: 700;
  color: var(--text-muted); letter-spacing: .04em;
  text-transform: uppercase; white-space: nowrap;
  border-bottom: 1px solid var(--border);
}
td {
  padding: 11px 14px; font-size: 12.5px;
  color: var(--text-sub);
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover td { background: #fafaf7; }
.td-name { font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px; }
.td-name span { font-size: 20px; }

/* =========================================================
   GRID LAYOUTS
   ========================================================= */
.g-2    { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.g-3    { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.g-2-1  { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
.g-1-2  { display: grid; grid-template-columns: 1fr 2fr; gap: 16px; }
.g-3-c  { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }

/* =========================================================
   DIVIDER & MISC
   ========================================================= */
.divider { height: 1px; background: var(--border); margin: 14px 0; }
.sec-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.text-green  { color: var(--green); }
.text-red    { color: var(--red); }
.text-amber  { color: var(--amber); }
.text-blue   { color: var(--blue); }
.text-purple { color: var(--purple); }
.text-muted  { color: var(--text-muted); }
.text-sub    { color: var(--text-sub); }
.fw-600 { font-weight: 600; }
.fw-700 { font-weight: 700; }
.fw-800 { font-weight: 800; }
.mono   { font-family: 'Fira Code', monospace; }
.fs-10  { font-size: 10.5px; }
.fs-12  { font-size: 12px; }
.fs-13  { font-size: 13px; }

/* =========================================================
   SECTION BANNERS / HIGHLIGHTS
   ========================================================= */
.insight-banner {
  background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
  border: 1px solid #bbf7d0;
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  display: flex; align-items: flex-start; gap: 12px;
}
.insight-banner-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: var(--green); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; flex-shrink: 0;
}
.insight-title { font-size: 12.5px; font-weight: 700; color: var(--green-d); margin-bottom: 3px; }
.insight-text  { font-size: 12px; color: #166534; line-height: 1.55; }

.warning-banner {
  background: #fffbeb;
  border: 1px solid #fed7aa;
  border-radius: var(--radius-lg);
  padding: 14px 18px;
  display: flex; align-items: center; gap: 10px;
}

/* =========================================================
   EXPIRY ROW
   ========================================================= */
.exp-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 0;
  border-bottom: 1px solid var(--border);
}
.exp-item:last-child { border-bottom: none; }
.exp-prod-name { font-size: 12px; font-weight: 600; color: var(--text); }
.exp-prod-date { font-size: 10.5px; color: var(--text-muted); }
.exp-days-chip {
  font-size: 11px; font-weight: 700;
  padding: 3px 9px; border-radius: 99px;
}

/* =========================================================
   STORE / PENJUALAN
   ========================================================= */
.store-layout { display: flex; height: 100vh; overflow: hidden; }
.store-main   { flex: 1; overflow-y: auto; padding: 18px 22px; background: var(--bg); }
.store-aside  { width: 320px; background: var(--surface); border-left: 1px solid var(--border); overflow-y: auto; flex-shrink: 0; box-shadow: -4px 0 16px rgba(0,0,0,.04); }

.store-topbar {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 16px;
  box-shadow: var(--shadow-sm);
}
.store-brand { font-size: 15px; font-weight: 800; color: var(--text); }
.store-brand-sub { font-size: 10px; color: var(--text-muted); }

.cat-pills { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.cat-pill {
  padding: 6px 14px; border-radius: 99px;
  font-size: 12px; font-weight: 600;
  border: 1.5px solid var(--border);
  background: var(--surface); color: var(--text-muted);
  cursor: pointer; transition: all .15s;
}
.cat-pill:hover { border-color: var(--green); color: var(--green); background: var(--green-lt); }
.cat-pill.active { background: var(--green); color: #fff; border-color: var(--green); }

.prod-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.prod-card {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 16px;
  cursor: pointer;
  transition: all .15s ease;
  box-shadow: var(--shadow-sm);
}
.prod-card:hover { border-color: var(--green); box-shadow: var(--shadow); transform: translateY(-2px); }
.prod-card.selected { border-color: var(--green); background: #f0fdf4; box-shadow: 0 0 0 3px rgba(22,163,74,.1); }
.prod-emoji   { font-size: 38px; text-align: center; display: block; margin-bottom: 10px; }
.prod-name    { font-size: 12.5px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
.prod-cat-tag { font-size: 10.5px; color: var(--text-muted); margin-bottom: 10px; }
.prod-footer  { display: flex; align-items: center; justify-content: space-between; }
.prod-price   { font-size: 14px; font-weight: 800; color: var(--green); }

/* Aside Detail */
.aside-inner { padding: 22px 20px; }
.aside-emoji { font-size: 64px; text-align: center; display: block; margin-bottom: 14px; }
.aside-name  { font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 4px; }
.aside-price { font-size: 22px; font-weight: 800; color: var(--green); margin-bottom: 10px; }
.aside-stock-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.pickup-box {
  background: var(--blue-lt);
  border: 1px solid #bfdbfe;
  border-radius: var(--radius);
  padding: 12px 14px; margin-bottom: 16px;
}
.pickup-title { font-size: 12px; font-weight: 700; color: var(--blue); margin-bottom: 3px; display: flex; align-items: center; justify-content: space-between; }

/* Map */
.fake-map {
  background: #e8f4f0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  height: 140px; position: relative; overflow: hidden;
  margin-bottom: 16px;
}
.map-label {
  position: absolute; bottom: 8px; left: 8px;
  background: rgba(255,255,255,.96);
  border: 1px solid var(--border);
  border-radius: 8px; padding: 5px 10px;
  box-shadow: var(--shadow-sm);
}
.map-label-name { font-size: 11px; font-weight: 700; color: var(--text); }
.map-label-addr { font-size: 10px; color: var(--text-muted); }
.map-label-open { font-size: 10px; color: var(--green); font-weight: 600; }
.map-pin-outer  { position: absolute; top: 42%; left: 50%; transform: translate(-50%, -100%); }
.map-pin-inner  {
  width: 28px; height: 28px;
  background: var(--red);
  border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 8px rgba(220,38,38,.4);
}

/* Qty Selector */
.qty-wrap {
  display: flex; align-items: center; gap: 8px;
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: 9px; padding: 5px 12px;
}
.qty-btn {
  background: none; border: none;
  font-size: 16px; color: var(--text); cursor: pointer;
  width: 20px; text-align: center; line-height: 1;
  transition: color .1s;
}
.qty-btn:hover { color: var(--green); }
.qty-val { font-size: 13px; font-weight: 700; min-width: 22px; text-align: center; }

/* Cart Mini */
.cart-mini {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}
.cart-row { display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 5px; align-items: center; }
.cart-total-row { display: flex; justify-content: space-between; padding-top: 10px; margin-top: 6px; border-top: 1px solid var(--border); }

/* =========================================================
   PAYMENT
   ========================================================= */
.pay-layout { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }

.method-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 13px; border-radius: var(--radius);
  border: 1.5px solid var(--border); background: var(--surface);
  cursor: pointer; transition: all .15s; width: 100%; text-align: left;
  margin-bottom: 8px;
}
.method-btn:hover     { border-color: var(--green); background: var(--bg); }
.method-btn.active    { border-color: var(--green); background: var(--green-lt); }
.method-ico           { font-size: 20px; flex-shrink: 0; }
.method-name          { font-size: 12.5px; font-weight: 700; color: var(--text); }
.method-sub           { font-size: 10.5px; color: var(--text-muted); }
.method-radio         { width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--border2); margin-left: auto; flex-shrink: 0; transition: all .15s; }
.method-btn.active .method-radio { background: var(--green); border-color: var(--green); }

.qr-wrapper { background: #fff; padding: 14px; border-radius: 12px; display: inline-block; border: 1px solid var(--border); box-shadow: var(--shadow-sm); }
.countdown  { font-family: 'Fira Code', monospace; font-size: 30px; font-weight: 700; text-align: center; color: var(--green); letter-spacing: .05em; }
.countdown.urgent { color: var(--red); }
.pay-order-box { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
.pay-success {
  background: var(--green-lt); border: 1px solid #86efac;
  border-radius: var(--radius-lg); padding: 24px 16px;
  text-align: center;
}

/* Summary Box */
.summary-item { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.summary-item-info { flex: 1; }
.summary-item-name  { font-size: 12px; font-weight: 600; color: var(--text); }
.summary-item-sub   { font-size: 10.5px; color: var(--text-muted); }
.summary-total-row  { display: flex; justify-content: space-between; padding: 10px 0; border-top: 1px solid var(--border); }

/* =========================================================
   P&L / CALCULATOR
   ========================================================= */
.pnl-stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }

.calc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.calc-result-box {
  background: var(--bg);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
  margin-top: 16px;
}
.result-label { font-size: 10.5px; color: var(--text-muted); font-weight: 500; margin-bottom: 3px; }
.result-value { font-size: 15px; font-weight: 800; }

/* =========================================================
   AI PANEL
   ========================================================= */
.ai-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #f0fdfa 100%);
  border: 1.5px solid #bbf7d0;
  border-radius: var(--radius-lg);
  padding: 20px;
}
.ai-card-purple {
  background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%);
  border: 1.5px solid #ddd6fe;
  border-radius: var(--radius-lg);
  padding: 20px;
}
.ai-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.ai-title  { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 7px; }
.ai-body   { font-size: 12px; color: var(--text-sub); line-height: 1.65; white-space: pre-wrap; }

.ai-rec-list { list-style: none; display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
.ai-rec-list li { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #15803d; }
.ai-rec-list li::before { content: '✓'; font-weight: 700; flex-shrink: 0; margin-top: 1px; }

.ai-response-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
}
.ai-resp-header { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.ai-resp-badge  { background: var(--green-lt); color: var(--green-d); padding: 3px 10px; border-radius: 99px; font-size: 10.5px; font-weight: 700; }

/* =========================================================
   INSIGHT CARDS
   ========================================================= */
.insight-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow .2s, transform .2s;
  border-top-width: 3px;
}
.insight-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
.insight-card-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
.insight-card-desc  { font-size: 12px; color: var(--text-sub); line-height: 1.5; margin-bottom: 12px; }
.insight-action-box { background: var(--bg); border-radius: 8px; padding: 8px 12px; }
.insight-action-txt { font-size: 11.5px; font-weight: 700; }

/* =========================================================
   SKELETON / LOADING
   ========================================================= */
@keyframes shimmer { 0%,100%{opacity:.5} 50%{opacity:1} }
.skeleton { background: var(--bg2); border-radius: 6px; animation: shimmer 1.5s infinite; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinner {
  width: 16px; height: 16px;
  border: 2px solid var(--border2);
  border-top-color: var(--green);
  border-radius: 50%; animation: spin .7s linear infinite;
  display: inline-block; vertical-align: middle;
}

/* =========================================================
   TOAST
   ========================================================= */
#toast {
  position: fixed; bottom: 22px; right: 22px; z-index: 9999;
  background: var(--text); color: #fff;
  padding: 11px 18px; border-radius: 10px;
  font-size: 12.5px; font-weight: 600;
  display: flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,.2);
  transform: translateY(60px); opacity: 0;
  transition: all .3s cubic-bezier(.34,1.56,.64,1);
  max-width: 320px;
}
#toast.show { transform: translateY(0); opacity: 1; }

/* =========================================================
   CHART CONTAINERS
   ========================================================= */
.chart-wrap { position: relative; }
.chart-legend { display: flex; gap: 16px; margin-top: 10px; }
.legend-item  { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-muted); }
.legend-dot   { width: 10px; height: 10px; border-radius: 2px; }

/* =========================================================
   PROFIT POTENTIAL BOX
   ========================================================= */
.potential-box {
  background: var(--green-lt);
  border: 1px solid #86efac;
  border-radius: var(--radius);
  padding: 14px 16px;
  margin-top: 14px;
}
.potential-label { font-size: 10.5px; color: #166534; font-weight: 500; }
.potential-value { font-size: 22px; font-weight: 800; color: var(--green-d); margin-top: 2px; }

/* =========================================================
   STATUS TAG COLORS  (in-text colored values)
   ========================================================= */
.val-profit { color: var(--green);  font-weight: 700; }
.val-loss   { color: var(--red);    font-weight: 700; }
.val-low    { color: var(--amber);  font-weight: 700; }

/* =========================================================
   RESPONSIVE — basic (sidebar collapses below 1024px)
   ========================================================= */
@media (max-width: 1200px) {
  .stat-grid       { grid-template-columns: repeat(3, 1fr); }
  .pnl-stat-grid   { grid-template-columns: repeat(3, 1fr); }
  .prod-grid       { grid-template-columns: repeat(2, 1fr); }
  .pay-layout      { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 900px) {
  :root { --sidebar-w: 0px; }
  #sidebar { display: none; }
  .g-2, .g-3, .g-2-1, .g-1-2, .g-3-c { grid-template-columns: 1fr; }
  .stat-grid, .pnl-stat-grid { grid-template-columns: repeat(2, 1fr); }
}
