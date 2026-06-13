/* ===================================================================== *
 *  KERNELAB · Admin Panel
 *  Sections: dashboard / products / reviews / games / orders / analytics / settings
 *  Persists everything via window.KernelabStore (localStorage).
 * ===================================================================== */

// IMMEDIATELY expose a stub so the inline auth always finds it.
// Methods get wired up below as they're defined.
window.kernelabAdmin = window.kernelabAdmin || {};

// All admin.js logic wrapped to capture cross-origin-safe error details on file://
(function adminMain() {
try {

/* ===== Global error catcher — show problems visibly ===== */
window.addEventListener("error", (e) => {
  console.error("[admin] uncaught:", e.error || e.message);
  const status = document.getElementById("alStatus");
  if (status) status.textContent = "JS error: " + ((e.error && e.error.message) || e.message);
});

if (!window.KernelabStore) {
  alert("KernelabStore failed to load. Check store.js path.");
}
const Store = window.KernelabStore;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ===== Crosshair — direct positioning, instant on first mousemove ===== */
(function setupCrosshair() {
  const c = document.getElementById("crosshair");
  if (!c) return;
  c.style.opacity = "0";   // hidden until first mousemove
  c.style.transform = "translate(-9999px,-9999px)";
  let activated = false;
  document.addEventListener("mousemove", e => {
    if (!activated) {
      activated = true;
      document.body.classList.add("crosshair-active");
      c.style.opacity = "1";
    }
    c.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  }, { passive: true });
  document.addEventListener("mouseleave", () => c.style.opacity = "0");
  document.addEventListener("mouseenter", () => activated && (c.style.opacity = "1"));
  document.addEventListener("mousedown", () => {
    c.classList.add("click");
    setTimeout(() => c.classList.remove("click"), 400);
  });
  document.addEventListener("mouseover", e => {
    const sel = "a, button, input, textarea, select, label, [role=button], .as-link, .as-foot-link, .ap-card, .kpi, .prod-card, .pp-tier, .pg-thumb, .lo-chip, .ape-chip, .module, .step, .game-card, .faq-q, .faq-item, .legal-tab, .pay-method, .promo-apply, .module-view, .btn-sm, .btn, .ape-input, .legal-tabs, .pi-cat-head";
    const t = e.target && e.target.closest && e.target.closest(sel);
    c.classList.toggle("locked", !!t);
  });
})();

/* ===== Toasts ===== */
const toastsEl = $("#toasts");
function showToast(msg, tag="ADMIN", type="") {
  if (!toastsEl) return;
  const t = document.createElement("div");
  t.className = "toast" + (type ? " " + type : "");
  t.innerHTML = `<span class="tdot-mini"></span><span class="toast-msg">${msg}</span><span class="toast-tag">${tag}</span>`;
  toastsEl.appendChild(t);
  setTimeout(()=>t.remove(), 5200);
  while (toastsEl.children.length > 5) toastsEl.firstChild.remove();
}

/* ===== Confirm dialog ===== */
const confirmDialog = $("#confirmDialog");
function confirmAsk(title, text) {
  return new Promise(resolve => {
    $("#acTitle").textContent = title;
    $("#acText").textContent = text;
    confirmDialog.classList.add("open");
    const ok = $("#acOk"), cancel = $("#acCancel"), backdrop = confirmDialog.querySelector(".payment-backdrop");
    function done(v) {
      confirmDialog.classList.remove("open");
      ok.removeEventListener("click", okH);
      cancel.removeEventListener("click", noH);
      backdrop.removeEventListener("click", noH);
      resolve(v);
    }
    function okH(){ done(true); } function noH(){ done(false); }
    ok.addEventListener("click", okH);
    cancel.addEventListener("click", noH);
    backdrop.addEventListener("click", noH);
  });
}

/* ===== Login ===== */
const loginEl = $("#adminLogin");
const shellEl = $("#adminShell");
const SESSION_KEY = "kernelab_admin_session";
function isAuthed() { return sessionStorage.getItem(SESSION_KEY) === "1"; }
function setAuthed(v) { v ? sessionStorage.setItem(SESSION_KEY,"1") : sessionStorage.removeItem(SESSION_KEY); }

function showShell() {
  loginEl.classList.add("hidden");
  loginEl.style.display = "none";        // belt + suspenders
  shellEl.classList.remove("hidden");
  shellEl.style.display = "grid";        // belt + suspenders
  try { navigate(location.hash.slice(1) || "dashboard"); }
  catch (err) {
    console.error("[admin] navigate failed:", err);
    const root = document.getElementById("adminContent");
    if (root) root.innerHTML = `<div class="ap-card danger"><div class="ap-head"><span class="kicker">// RENDER ERROR</span></div><pre style="color:#e0a3a3;font-family:var(--mono);font-size:12px;white-space:pre-wrap">${(err && err.stack) || err}</pre></div>`;
  }
}
function showLogin() {
  shellEl.classList.add("hidden");
  shellEl.style.display = "none";
  loginEl.classList.remove("hidden");
  loginEl.style.display = "flex";
}

// Wire up exposed API immediately
window.kernelabAdmin.showShell = showShell;
window.kernelabAdmin.showLogin = showLogin;
window.kernelabAdmin.Store = Store;

function tryAuth() {
  const status = document.getElementById("alStatus");
  status.className = "al-status";
  try {
    const pass = document.getElementById("adminPass").value;
    const stored = (Store && Store.getAdminPass) ? Store.getAdminPass() : "admin";
    if (pass !== stored) {
      status.textContent = "✗ Wrong password — default is 'admin' (use reset link below)";
      document.getElementById("adminPass").value = "";
      document.getElementById("adminPass").focus();
      return;
    }
    status.textContent = "";
    setAuthed(true);
    showShell();
    showToast("Authentication successful · <b>WELCOME</b>", "AUTH");
  } catch (err) {
    console.error("[admin] tryAuth failed:", err);
    status.textContent = "✗ Auth error: " + (err && err.message);
  }
}

// Wire buttons (admin.js handlers — kept as fallback; HTML inline `onclick` calls __quickAuth)
const authBtn = document.getElementById("authBtn");
if (authBtn && !authBtn.getAttribute("onclick")) authBtn.addEventListener("click", tryAuth);
const passInp = document.getElementById("adminPass");
if (passInp && !passInp.getAttribute("onkeydown")) passInp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); tryAuth(); } });

// Reset password (the inline HTML button handles localStorage reset directly; this is fallback)
const passResetBtn = document.getElementById("passReset");
if (passResetBtn) passResetBtn.addEventListener("click", async () => {
  if (await confirmAsk("Reset admin password", "Reset to default 'admin'?")) {
    localStorage.removeItem(Store.KEYS.admin);
    showToast("Password reset to <b>admin</b>", "AUTH");
    document.getElementById("adminPass").value = "admin";
    document.getElementById("adminPass").focus();
  }
});

// Logout
const logoutBtn = document.getElementById("adminLogout");
if (logoutBtn) logoutBtn.addEventListener("click", async () => {
  if (await confirmAsk("Logout", "End secure session?")) {
    setAuthed(false);
    showLogin();
  }
});

// Expose helpers to console for debugging — done BEFORE initial render so it's always available
window.kernelabAdmin.tryAuth = tryAuth;

// Initial state — deferred to next tick so all const SECTIONS / render fns are initialized
setTimeout(() => {
  try { if (isAuthed()) showShell(); else showLogin(); }
  catch (err) {
    console.error("[admin] init failed:", err);
    const status = document.getElementById("alStatus");
    if (status) status.textContent = "Init error: " + (err && err.message);
  }
}, 0);

/* ===== Live time pill ===== */
setInterval(() => {
  const d = new Date();
  const t = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}:${String(d.getSeconds()).padStart(2,"0")} UTC${d.getTimezoneOffset()<=0?"+":""}${-d.getTimezoneOffset()/60}`;
  const el = $("#atTime"); if (el) el.textContent = t;
}, 1000);

/* ===== Router ===== */
const SECTIONS = {
  dashboard: { title: "Dashboard", render: renderDashboard },
  products:  { title: "Products",  render: renderProducts },
  reviews:   { title: "Reviews",   render: renderReviews },
  games:     { title: "Games",     render: renderGames },
  promos:    { title: "Promo Codes", render: renderPromos },
  orders:    { title: "Orders",    render: renderOrders },
  analytics: { title: "Analytics", render: renderAnalytics },
  settings:  { title: "Settings",  render: renderSettings },
};
function navigate(name) {
  if (!SECTIONS[name]) name = "dashboard";
  $$(".as-link").forEach(b => b.classList.toggle("active", b.dataset.section === name));
  $("#atTitle").textContent = SECTIONS[name].title;
  $("#adminContent").innerHTML = "";
  location.hash = name;
  SECTIONS[name].render($("#adminContent"));
}
$$(".as-link").forEach(b => b.addEventListener("click", () => navigate(b.dataset.section)));
window.addEventListener("hashchange", () => isAuthed() && navigate(location.hash.slice(1) || "dashboard"));

/* ===================================================================== *
 *  Helpers
 * ===================================================================== */
function fmtMoney(n) { return "$" + (n || 0).toLocaleString("en-US"); }
function fmtTime(ts) {
  const d = new Date(ts);
  const now = Date.now();
  const diff = (now - ts) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff/60) + "m ago";
  if (diff < 86400) return Math.floor(diff/3600) + "h ago";
  if (diff < 86400*7) return Math.floor(diff/86400) + "d ago";
  return d.toLocaleDateString();
}
function startOfDay(ts) { const d = new Date(ts); d.setHours(0,0,0,0); return d.getTime(); }
function escapeHtml(s) { return String(s||"").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

/* ===================================================================== *
 *  CHARTS — vanilla SVG, no deps
 * ===================================================================== */
function lineChart(svg, data, opts={}) {
  const w = 600, h = 180, pad = { l: 40, r: 12, t: 14, b: 24 };
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("preserveAspectRatio", "none");
  const max = Math.max(...data.map(d=>d.v), 1);
  const xs = (i) => pad.l + (i / (data.length-1 || 1)) * (w - pad.l - pad.r);
  const ys = (v) => h - pad.b - (v / max) * (h - pad.t - pad.b);
  // grid + y labels
  let grid = "";
  for (let i=0; i<=4; i++) {
    const v = max * (1 - i/4);
    const y = pad.t + (i/4) * (h - pad.t - pad.b);
    grid += `<line x1="${pad.l}" y1="${y}" x2="${w - pad.r}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="2 4"/>`;
    grid += `<text x="${pad.l - 6}" y="${y + 4}" text-anchor="end" font-family="Share Tech Mono" font-size="10" fill="rgba(255,255,255,0.4)">${Math.round(v)}</text>`;
  }
  // x labels (every other day)
  let xlabels = "";
  data.forEach((d,i) => {
    if (i % Math.ceil(data.length/7) !== 0) return;
    xlabels += `<text x="${xs(i)}" y="${h - 6}" text-anchor="middle" font-family="Share Tech Mono" font-size="10" fill="rgba(255,255,255,0.45)">${d.label}</text>`;
  });
  // line
  const path = data.map((d,i) => `${i===0?"M":"L"} ${xs(i)},${ys(d.v)}`).join(" ");
  const area = path + ` L ${xs(data.length-1)},${h - pad.b} L ${xs(0)},${h - pad.b} Z`;
  // dots
  const dots = data.map((d,i) => `<circle cx="${xs(i)}" cy="${ys(d.v)}" r="2.4" fill="#fff"/>`).join("");
  svg.innerHTML = `
    <defs>
      <linearGradient id="lcGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="rgba(255,255,255,0.35)"/>
        <stop offset="1" stop-color="rgba(255,255,255,0)"/>
      </linearGradient>
    </defs>
    ${grid}
    <path d="${area}" fill="url(#lcGrad)"/>
    <path d="${path}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" filter="drop-shadow(0 0 6px rgba(255,255,255,0.6))"/>
    ${dots}
    ${xlabels}
  `;
}
function barChart(svg, data, opts={}) {
  const w = 600, h = 200, pad = { l: 120, r: 50, t: 8, b: 8 };
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const max = Math.max(...data.map(d=>d.v), 1);
  const rowH = (h - pad.t - pad.b) / data.length;
  const barH = Math.max(10, rowH * 0.55);
  let html = "";
  data.forEach((d, i) => {
    const y = pad.t + i * rowH + (rowH - barH) / 2;
    const bw = (d.v / max) * (w - pad.l - pad.r);
    html += `
      <text x="${pad.l - 8}" y="${y + barH * 0.7}" text-anchor="end" font-family="Share Tech Mono" font-size="11" fill="rgba(255,255,255,0.7)">${escapeHtml(d.label)}</text>
      <rect x="${pad.l}" y="${y}" width="${w - pad.l - pad.r}" height="${barH}" fill="rgba(255,255,255,0.04)" rx="2"/>
      <rect x="${pad.l}" y="${y}" width="${bw}" height="${barH}" fill="#fff" rx="2" filter="drop-shadow(0 0 4px rgba(255,255,255,0.6))">
        <animate attributeName="width" from="0" to="${bw}" dur="0.8s" fill="freeze"/>
      </rect>
      <text x="${pad.l + bw + 6}" y="${y + barH * 0.7}" font-family="Orbitron" font-size="11" font-weight="700" fill="#fff">${d.label2 || d.v}</text>
    `;
  });
  svg.innerHTML = html;
}
function donutChart(svg, data, opts={}) {
  const size = 200, r = 80, ir = 50, cx = size/2, cy = size/2;
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
  const total = data.reduce((s,d)=>s+d.v, 0) || 1;
  let a0 = -Math.PI/2;
  let html = `<circle cx="${cx}" cy="${cy}" r="${r-1}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>`;
  data.forEach((d, i) => {
    const a1 = a0 + (d.v / total) * Math.PI * 2;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + Math.cos(a0) * r,  y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r,  y1 = cy + Math.sin(a1) * r;
    const xi0 = cx + Math.cos(a0) * ir, yi0 = cy + Math.sin(a0) * ir;
    const xi1 = cx + Math.cos(a1) * ir, yi1 = cy + Math.sin(a1) * ir;
    const op = 0.3 + 0.7 * (1 - i / Math.max(1, data.length - 1));
    html += `<path d="M ${x0},${y0} A ${r},${r} 0 ${large} 1 ${x1},${y1} L ${xi1},${yi1} A ${ir},${ir} 0 ${large} 0 ${xi0},${yi0} Z" fill="rgba(255,255,255,${op})" stroke="rgba(0,0,0,0.4)" stroke-width="1"/>`;
    a0 = a1;
  });
  html += `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-family="Orbitron" font-size="22" font-weight="900" fill="#fff" filter="drop-shadow(0 0 6px rgba(255,255,255,0.6))">${total}</text>`;
  html += `<text x="${cx}" y="${cy + 14}" text-anchor="middle" font-family="Share Tech Mono" font-size="10" fill="rgba(255,255,255,0.5)" letter-spacing="2">${opts.label || "TOTAL"}</text>`;
  svg.innerHTML = html;
}

/* ===================================================================== *
 *  SECTION: DASHBOARD
 * ===================================================================== */
function renderDashboard(root) {
  const orders = Store.getOrders();
  const clicks = Store.getClicks();
  const products = Store.getProducts();

  const totalRevenue = orders.filter(o=>o.status==="completed").reduce((s,o)=>s+o.amount, 0);
  const todayStart = startOfDay(Date.now());
  const todayOrders = orders.filter(o=>o.ts >= todayStart);
  const todayRevenue = todayOrders.filter(o=>o.status==="completed").reduce((s,o)=>s+o.amount, 0);
  const conversion = clicks.length ? ((orders.length / clicks.length) * 100).toFixed(1) : "0";

  // Last 14 days revenue series
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const start = startOfDay(Date.now() - i * 86400e3);
    const end = start + 86400e3;
    const v = orders.filter(o => o.ts >= start && o.ts < end && o.status === "completed").reduce((s,o)=>s+o.amount, 0);
    days.push({ label: new Date(start).toLocaleDateString("en-US",{day:"numeric",month:"short"}), v });
  }
  // Top products by revenue
  const byProduct = {};
  orders.forEach(o => { byProduct[o.productId] = (byProduct[o.productId] || 0) + o.amount; });
  const top = products.map(p => ({ id: p.id, label: p.name, v: byProduct[p.id] || 0, label2: fmtMoney(byProduct[p.id] || 0) }))
    .sort((a,b) => b.v - a.v).slice(0, 6);
  // Method split
  const byMethod = { ru: 0, eu: 0, ltc: 0, btc: 0 };
  orders.forEach(o => { if (byMethod[o.method] !== undefined) byMethod[o.method]++; });
  const methodData = [
    { label: "RU",  v: byMethod.ru },
    { label: "EU",  v: byMethod.eu },
    { label: "LTC", v: byMethod.ltc },
    { label: "BTC", v: byMethod.btc },
  ].filter(d => d.v > 0);

  root.innerHTML = `
    <div class="kpi-row">
      <div class="kpi"><div class="kpi-label">TOTAL REVENUE</div><div class="kpi-val">${fmtMoney(totalRevenue)}</div><div class="kpi-sub">all-time, completed orders</div></div>
      <div class="kpi"><div class="kpi-label">TODAY</div><div class="kpi-val">${fmtMoney(todayRevenue)}</div><div class="kpi-sub">${todayOrders.length} orders</div></div>
      <div class="kpi"><div class="kpi-label">TOTAL ORDERS</div><div class="kpi-val">${orders.length}</div><div class="kpi-sub">${orders.filter(o=>o.status==="completed").length} completed</div></div>
      <div class="kpi"><div class="kpi-label">CLICKS · CONVERSION</div><div class="kpi-val">${clicks.length}</div><div class="kpi-sub">${conversion}% conversion</div></div>
    </div>

    <div class="ap-card">
      <div class="ap-head">
        <span class="kicker">// LIVE TRAFFIC · GLOBAL</span>
        <span class="ap-head-side">via counterapi.dev · cross-browser</span>
      </div>
      <div class="kpi-row">
        <div class="kpi"><div class="kpi-label">VISITS · TODAY</div><div class="kpi-val" id="liveTodayVisits">…</div><div class="kpi-sub">unique sessions across all browsers</div></div>
        <div class="kpi"><div class="kpi-label">VISITS · ALL TIME</div><div class="kpi-val" id="liveTotalVisits">…</div><div class="kpi-sub">since site launch</div></div>
        <div class="kpi"><div class="kpi-label">CLICKS · ALL TIME</div><div class="kpi-val" id="liveTotalClicks">…</div><div class="kpi-sub">product modal opens</div></div>
        <div class="kpi"><div class="kpi-label">CONVERSION · LIVE</div><div class="kpi-val" id="liveConv">…</div><div class="kpi-sub">orders / visits</div></div>
      </div>
      <div class="ap-head" style="margin-top:18px"><span class="kicker">// CLICKS PER PRODUCT (GLOBAL)</span></div>
      <svg class="ap-chart" id="liveBar" style="height:240px"></svg>
    </div>

    <div class="ap-grid two">
      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// REVENUE · LAST 14 DAYS</span><span class="ap-head-side">${fmtMoney(days.reduce((s,d)=>s+d.v,0))} total</span></div>
        <svg class="ap-chart" id="dashLine"></svg>
      </div>
      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// PAYMENT METHOD SPLIT</span><span class="ap-head-side">${orders.length} orders</span></div>
        <div class="donut-wrap">
          <svg class="donut" id="dashDonut"></svg>
          <div class="donut-legend">
            ${methodData.map((d,i)=>`<div class="dl-row"><span class="dl-swatch" style="opacity:${0.3 + 0.7 * (1 - i/Math.max(1,methodData.length-1))}"></span>${d.label} <b>${d.v}</b></div>`).join("")}
          </div>
        </div>
      </div>
    </div>

    <div class="ap-card">
      <div class="ap-head"><span class="kicker">// TOP PRODUCTS BY REVENUE</span></div>
      <svg class="ap-chart" id="dashBar" style="height:240px"></svg>
    </div>

    <div class="ap-grid two">
      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// RECENT ORDERS</span><a class="ap-head-link" data-link="orders">view all ›</a></div>
        <table class="ap-table">
          <thead><tr><th>ORDER</th><th>PRODUCT</th><th>TIER</th><th>AMOUNT</th><th>WHEN</th></tr></thead>
          <tbody>
            ${orders.slice(0, 8).map(o => {
              const p = products.find(x=>x.id===o.productId);
              return `<tr><td><code>${o.id}</code></td><td>${p?p.name:o.productId}</td><td>${o.tier}</td><td><b>${fmtMoney(o.amount)}</b></td><td>${fmtTime(o.ts)}</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// RECENT CLICKS</span><a class="ap-head-link" data-link="analytics">view all ›</a></div>
        <table class="ap-table">
          <thead><tr><th>PRODUCT</th><th>WHEN</th></tr></thead>
          <tbody>
            ${clicks.slice(0, 12).map(c => {
              const p = products.find(x=>x.id===c.productId);
              return `<tr><td>${p?p.name:c.productId}</td><td>${fmtTime(c.ts)}</td></tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
  lineChart($("#dashLine"), days);
  barChart($("#dashBar"), top);
  donutChart($("#dashDonut"), methodData, { label: "ORDERS" });
  $$(".ap-head-link").forEach(a => a.addEventListener("click", () => navigate(a.dataset.link)));

  // Async: pull live cross-browser stats from counterapi.dev
  (async () => {
    try {
      if (!Store.Analytics) return;
      const stats = await Store.Analytics.getStats(products);
      const elTotal = document.getElementById("liveTotalVisits");
      const elToday = document.getElementById("liveTodayVisits");
      const elClicks = document.getElementById("liveTotalClicks");
      const elConv  = document.getElementById("liveConv");
      if (elTotal) elTotal.textContent = stats.totalVisits.toLocaleString("en-US");
      if (elToday) elToday.textContent = stats.todayVisits.toLocaleString("en-US");
      if (elClicks) elClicks.textContent = stats.totalClicks.toLocaleString("en-US");
      if (elConv)  elConv.textContent = stats.totalVisits ? ((orders.length / stats.totalVisits) * 100).toFixed(1) + "%" : "0%";

      // Live bar chart per product
      const liveBarData = products
        .map(p => ({
          id: p.id,
          label: p.name,
          v: stats.productClicks[p.id] || 0,
          label2: (stats.productClicks[p.id] || 0).toString(),
        }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 10);
      const liveBar = document.getElementById("liveBar");
      if (liveBar) barChart(liveBar, liveBarData);
    } catch (e) {
      console.error("[dashboard] live stats failed:", e);
      const elTotal = document.getElementById("liveTotalVisits");
      if (elTotal) elTotal.textContent = "—";
    }
  })();
}

/* ===================================================================== *
 *  SECTION: PRODUCTS
 * ===================================================================== */
function renderProducts(root) {
  const products = Store.getProducts();
  const clicks = Store.getClicks();
  root.innerHTML = `
    <div class="ap-toolbar">
      <button class="btn btn-primary" id="addProduct" type="button">+ NEW PRODUCT</button>
      <input class="ap-search" id="prodSearch" placeholder="Search products..." />
      <span class="ap-meta">${products.length} products</span>
    </div>
    <div class="prod-grid" id="prodGrid"></div>
  `;
  function paint(filter="") {
    const f = filter.trim().toLowerCase();
    // Persist sort order so admin's drag results survive across sections.
    // We always read fresh from store to avoid stale state.
    const all = Store.getProducts();
    const sorted = [...all].sort((a,b) => (a.sort ?? 100) - (b.sort ?? 100) || (a.name||"").localeCompare(b.name||""));
    const filtered = !f ? sorted : sorted.filter(p => p.name.toLowerCase().includes(f) || p.id.toLowerCase().includes(f));
    $("#prodGrid").innerHTML = filtered.map(p => {
      const allTiers = Store.makePrices(p);
      const visibleTiers = allTiers.filter(t => t.price > 0);
      const fromPrice = visibleTiers[0] ? visibleTiers[0].price : 0;
      const clickCount = clicks.filter(c => c.productId === p.id).length;
      return `
      <div class="prod-card" data-id="${p.id}">
        <div class="prod-cover" ${p.images && p.images[0] ? `style="background-image:url('${p.images[0]}'); background-size:cover; background-position:center;"`:""}>
          <span class="module-status ${p.status.toLowerCase()}"><span class="ms-dot"></span>${p.status}</span>
          ${!(p.images && p.images[0]) ? `<span class="prod-cover-mark">${p.short}</span>` : ""}
        </div>
        <div class="prod-meta">
          <div class="prod-id">${p.id}</div>
          <div class="prod-name">${escapeHtml(p.name)}</div>
          <div class="prod-stats">
            <span>${fromPrice ? `FROM <b>$${fromPrice}</b>` : `<b style="color:#e0a3a3">UNAVAILABLE</b>`}</span>
            <span>★ ${p.rating}</span>
            <span>${(p.reviews||[]).length} reviews</span>
            <span>${clickCount} clicks</span>
            <span>${visibleTiers.length}/${allTiers.length} tiers</span>
            <span>sort: <b>${p.sort ?? 100}</b></span>
          </div>
          <div class="prod-actions">
            <button class="btn-sm" data-action="edit">EDIT</button>
            <button class="btn-sm danger" data-action="del">DELETE</button>
          </div>
        </div>
      </div>`;
    }).join("");
    $$(".prod-card [data-action='edit']").forEach(b => b.addEventListener("click", e => {
      e.stopPropagation();
      openProductEditor(b.closest(".prod-card").dataset.id);
    }));
    $$(".prod-card [data-action='del']").forEach(b => b.addEventListener("click", async e => {
      e.stopPropagation();
      const id = b.closest(".prod-card").dataset.id;
      const p = Store.getProduct(id);
      if (!p) return;
      if (await confirmAsk("Delete product", `Permanently delete "${p.name}" (${id})?`)) {
        Store.deleteProduct(id);
        showToast(`Deleted ${id}`, "PRODUCT");
        renderProducts(root);
      }
    }));
    $$(".prod-card").forEach(c => c.addEventListener("click", () => openProductEditor(c.dataset.id)));

    // ===== Drag-and-drop reordering for product cards =====
    let dragId = null;
    $$(".prod-card").forEach(card => {
      card.draggable = true;
      card.addEventListener("dragstart", e => {
        // Don't start drag from action buttons — let those clicks go through
        if (e.target.closest("[data-action]")) { e.preventDefault(); return; }
        dragId = card.dataset.id;
        card.classList.add("dragging");
        try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", dragId); } catch(_){}
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        $$(".prod-card").forEach(c => c.classList.remove("drag-over"));
        dragId = null;
      });
      card.addEventListener("dragover", e => {
        if (!dragId || card.dataset.id === dragId) return;
        e.preventDefault();
        try { e.dataTransfer.dropEffect = "move"; } catch(_){}
        $$(".prod-card").forEach(c => c.classList.toggle("drag-over", c === card));
      });
      card.addEventListener("dragleave", () => card.classList.remove("drag-over"));
      card.addEventListener("drop", e => {
        e.preventDefault();
        if (!dragId || card.dataset.id === dragId) return;
        // Reorder by re-numbering sort field — keeps everything else stable
        const all = Store.getProducts();
        const visible = [...all].sort((a,b) => (a.sort ?? 100) - (b.sort ?? 100) || (a.name||"").localeCompare(b.name||""));
        const fromIdx = visible.findIndex(p => p.id === dragId);
        const toIdx   = visible.findIndex(p => p.id === card.dataset.id);
        if (fromIdx < 0 || toIdx < 0) return;
        const [moved] = visible.splice(fromIdx, 1);
        visible.splice(toIdx, 0, moved);
        // Renumber sort with step 10 starting from 10 — leaves room for manual tweaks
        visible.forEach((p, i) => { p.sort = (i + 1) * 10; });
        // Save back — preserve products not in visible (none usually, but safe)
        const idMap = new Map(visible.map(p => [p.id, p]));
        const updated = all.map(p => idMap.get(p.id) || p);
        Store.setProducts(updated);
        showToast(`Reordered · ${moved.name} → position ${toIdx + 1}`, "ORDER");
        paint(filter);
      });
    });
  }
  paint();
  $("#prodSearch").addEventListener("input", e => paint(e.target.value));
  $("#addProduct").addEventListener("click", () => openProductEditor(null));
}

/* Product editor — full modal-style form */
function openProductEditor(id) {
  const games = Store.getGames();
  const isNew = !id;
  const p = id ? Store.getProduct(id) : (function() {
    // Generate unique ID — find max existing KAB-NNN, increment
    const existing = Store.getProducts();
    let maxN = 0;
    existing.forEach(x => {
      const m = /^KAB-(\d+)$/.exec(x.id || "");
      if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
    });
    return {
      id: "KAB-" + String(maxN + 1).padStart(3, "0"),
      name: "", short: "", clear: "S", base: 5, status: "NEW", rating: 5.0,
      sort: 100, badges: [],
      desc: "", tags: [], games: [],
      features: { aim: [], visual: [], misc: [] },
      req: { os: "Windows 10/11 x64", cpu: "—", ram: "—", driver: "—", net: "—" },
      images: [], reviews: [], videoUrl: "",
    };
  })();
  const editor = document.createElement("div");
  editor.className = "ap-editor open";
  editor.innerHTML = `
    <div class="payment-backdrop" data-close="1"></div>
    <div class="ap-editor-panel">
      <div class="wc-corner tl"></div><div class="wc-corner tr"></div>
      <div class="wc-corner bl"></div><div class="wc-corner br"></div>
      <header class="ape-head">
        <div>
          <span class="kicker">// ${isNew ? "CREATE PRODUCT" : "EDIT PRODUCT"}</span>
          <h3>${isNew ? "New module" : escapeHtml(p.name) || p.id}</h3>
        </div>
        <button class="payment-close" data-close="1">×</button>
      </header>

      <div class="ape-grid">
        <div>
          <label class="ape-label">ID</label>
          <input class="ape-input" id="fId" value="${escapeHtml(p.id)}" ${isNew?"":"disabled"} />
        </div>
        <div>
          <label class="ape-label">SHORT TAG (preview)</label>
          <input class="ape-input" id="fShort" value="${escapeHtml(p.short)}" placeholder="AIMBOT"/>
        </div>
        <div class="ape-full">
          <label class="ape-label">NAME</label>
          <input class="ape-input" id="fName" value="${escapeHtml(p.name)}"/>
        </div>
        <div>
          <label class="ape-label">CLEARANCE</label>
          <select class="ape-input" id="fClear">
            ${["TS","S","C","R"].map(c=>`<option ${c===p.clear?"selected":""}>${c}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="ape-label">STATUS</label>
          <select class="ape-input" id="fStatus">
            ${Store.STATUSES.map(s=>`<option ${s===p.status?"selected":""}>${s}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="ape-label">BASE PRICE (USD/day · legacy auto-fill, optional)</label>
          <input class="ape-input" id="fBase" type="number" step="0.5" min="0" value="${p.base}"/>
          <span class="ape-hint">Used only if you don't define explicit tiers below.</span>
        </div>
        <div>
          <label class="ape-label">RATING (0-5)</label>
          <input class="ape-input" id="fRating" type="number" step="0.1" min="0" max="5" value="${p.rating}"/>
        </div>
        <div>
          <label class="ape-label">SORT ORDER (lower = first on the page)</label>
          <input class="ape-input" id="fSort" type="number" step="1" value="${p.sort ?? 100}"/>
          <span class="ape-hint">Default 100. Use 50 to push earlier, 150 to push later.</span>
        </div>

        <div class="ape-full">
          <label class="ape-label">PINS · BADGES</label>
          <p class="ape-hint">Tick badges to display them as pins on the product card.</p>
          <div class="ape-chips" id="fBadges">
            ${["POPULAR","BEST SELLER","SAFEST","HOT","NEW","LIMITED","UPDATED","EXCLUSIVE","TOP RATED","FAST DELIVERY"].map(b => `<label class="ape-chip"><input type="checkbox" value="${b}" ${(p.badges||[]).includes(b)?"checked":""}/> ${b}</label>`).join("")}
          </div>
        </div>

        <div class="ape-full">
          <label class="ape-label">PRICING TIERS</label>
          <p class="ape-hint">Each tier has its own duration label, price and per-method payment links. Add as many as you want — <code>6 hours</code>, <code>1 day</code>, <code>Lifetime</code>, anything. Tiers with empty label or price ≤ 0 are not saved.</p>
          <div class="tiers-list" id="tiersList"></div>
          <button class="btn btn-ghost btn-sm" id="tiersAdd" type="button" style="margin-top:10px">+ ADD TIER</button>
        </div>
        <div class="ape-full">
          <label class="ape-label">DESCRIPTION</label>
          <textarea class="ape-input" id="fDesc" rows="3">${escapeHtml(p.desc)}</textarea>
        </div>
        <div class="ape-full">
          <label class="ape-label">TAGS (comma-separated)</label>
          <input class="ape-input" id="fTags" value="${(p.tags||[]).join(", ")}"/>
        </div>
        <div class="ape-full">
          <label class="ape-label">SUPPORTED GAMES</label>
          <div class="ape-chips" id="fGames">
            ${games.map(g => `<label class="ape-chip"><input type="checkbox" value="${g.key}" ${(p.games||[]).includes(g.key)?"checked":""}/> ${g.short}</label>`).join("")}
          </div>
        </div>

        <div class="ape-full">
          <label class="ape-label">FEATURES — AIM</label>
          <textarea class="ape-input" id="fAim" rows="4" placeholder="One per line">${(p.features?.aim||[]).join("\n")}</textarea>
        </div>
        <div class="ape-full">
          <label class="ape-label">FEATURES — VISUAL</label>
          <textarea class="ape-input" id="fVisual" rows="4" placeholder="One per line">${(p.features?.visual||[]).join("\n")}</textarea>
        </div>
        <div class="ape-full">
          <label class="ape-label">FEATURES — MISC</label>
          <textarea class="ape-input" id="fMisc" rows="4" placeholder="One per line">${(p.features?.misc||[]).join("\n")}</textarea>
        </div>

        <div><label class="ape-label">REQ · OS</label><input class="ape-input" id="fReqOs" value="${escapeHtml(p.req?.os||"")}"/></div>
        <div><label class="ape-label">REQ · CPU</label><input class="ape-input" id="fReqCpu" value="${escapeHtml(p.req?.cpu||"")}"/></div>
        <div><label class="ape-label">REQ · RAM</label><input class="ape-input" id="fReqRam" value="${escapeHtml(p.req?.ram||"")}"/></div>
        <div><label class="ape-label">REQ · DRIVER</label><input class="ape-input" id="fReqDrv" value="${escapeHtml(p.req?.driver||"")}"/></div>
        <div><label class="ape-label">REQ · NETWORK</label><input class="ape-input" id="fReqNet" value="${escapeHtml(p.req?.net||"")}"/></div>

        <div class="ape-full">
          <label class="ape-label">VIDEO URL (optional, replaces image preview)</label>
          <input class="ape-input" id="fVideoUrl" placeholder="https://example.com/clip.mp4" value="${escapeHtml(p.videoUrl||"")}"/>
          <span class="ape-hint">If set, the card shows this video instead of the image (auto-play, muted, loop) and a red <code>▶ VIDEO</code> pin appears. Use direct <code>.mp4</code> / <code>.webm</code> URL — host on Catbox.moe, Streamable direct link, or your own server.</span>
        </div>

        <div class="ape-full">
          <label class="ape-label">IMAGES</label>
          <div class="ape-images" id="fImages"></div>
          <input type="file" id="fImageFile" accept="image/*" multiple style="display:none"/>
          <button class="btn btn-ghost btn-sm" id="fImageAdd" type="button">+ ADD IMAGES</button>
          <span class="ape-hint">Stored in browser localStorage. Resized to ≤800px wide. Multiple supported.</span>
        </div>
      </div>

      <footer class="ape-foot">
        <button class="btn btn-ghost" data-close="1">CANCEL</button>
        <button class="btn btn-primary" id="fSave" type="button">${isNew ? "CREATE" : "SAVE CHANGES"}</button>
      </footer>
    </div>
  `;
  document.body.appendChild(editor);
  document.body.style.overflow = "hidden";

  // Tier preview — replaced by dynamic tiers editor below
  // (Old refreshTierPreview removed; tiers section is now self-managed)

  // ----- Dynamic pricing tiers (per-product, per-method links) -----
  // Initialise from existing tiers, or migrate from legacy base/prices/buyLinks
  let productTiers = [];
  if (Array.isArray(p.tiers) && p.tiers.length) {
    productTiers = JSON.parse(JSON.stringify(p.tiers));
  } else if (p.prices || p.buyLinks || p.base) {
    // One-time legacy migration in the editor
    const computed = Store.makePrices(p);
    productTiers = computed.filter(t => t.price > 0).map(t => ({
      dur: t.dur,
      price: t.price,
      links: { ...(t.links || {}) },
    }));
  }
  if (!productTiers.length) {
    productTiers = [{ dur: "", price: 0, links: {} }];
  }
  function paintTiers() {
    const list = $("#tiersList", editor);
    if (!list) return;
    list.innerHTML = productTiers.map((t, i) => `
      <div class="tier-row" data-i="${i}">
        <div class="tier-row-head">
          <span class="tier-drag" title="Drag to reorder">⋮⋮</span>
          <span class="tier-row-num">${String(i+1).padStart(2,"0")}</span>
          <input class="ape-input" data-tf="dur" placeholder="e.g. 6 hours, 1 day, Lifetime" value="${escapeHtml(t.dur||"")}"/>
          <span class="tier-row-currency">$</span>
          <input class="ape-input" data-tf="price" type="number" step="0.01" min="0" placeholder="0" value="${t.price||0}" style="max-width:110px;text-align:center"/>
          <button class="btn-sm danger" data-tier-rm="${i}" type="button" title="Remove tier">×</button>
        </div>
        <div class="tier-row-links">
          <div><label class="ape-label">RU CARDS</label><input class="ape-input" data-tf="ru" placeholder="https://buy.example.com/ru/..." value="${escapeHtml((t.links&&t.links.ru)||"")}"/></div>
          <div><label class="ape-label">EU/US CARDS</label><input class="ape-input" data-tf="eu" placeholder="https://buy.example.com/eu/..." value="${escapeHtml((t.links&&t.links.eu)||"")}"/></div>
          <div><label class="ape-label">CRYPTO · LTC</label><input class="ape-input" data-tf="ltc" placeholder="https://buy.example.com/ltc/..." value="${escapeHtml((t.links&&t.links.ltc)||"")}"/></div>
          <div><label class="ape-label">CRYPTO · BTC</label><input class="ape-input" data-tf="btc" placeholder="https://buy.example.com/btc/..." value="${escapeHtml((t.links&&t.links.btc)||"")}"/></div>
        </div>
      </div>
    `).join("");
    // Wire row inputs
    $$(".tier-row input", editor).forEach(inp => inp.addEventListener("input", e => {
      const row = e.target.closest(".tier-row");
      const i = Number(row.dataset.i);
      const f = e.target.dataset.tf;
      if (!productTiers[i]) return;
      if (f === "dur")        productTiers[i].dur = e.target.value;
      else if (f === "price") productTiers[i].price = Number(e.target.value) || 0;
      else { productTiers[i].links = productTiers[i].links || {}; productTiers[i].links[f] = e.target.value.trim(); }
    }));
    $$("[data-tier-rm]", editor).forEach(b => b.addEventListener("click", () => {
      productTiers.splice(Number(b.dataset.tierRm), 1);
      if (!productTiers.length) productTiers.push({ dur: "", price: 0, links: {} });
      paintTiers();
    }));

    // ----- Drag-and-drop reordering -----
    let dragIdx = null;
    $$(".tier-row", editor).forEach(row => {
      const handle = row.querySelector(".tier-drag");
      // Activate drag only when grabbing the handle (so inputs don't interfere)
      handle.addEventListener("mousedown", () => { row.draggable = true; });
      row.addEventListener("dragstart", e => {
        dragIdx = Number(row.dataset.i);
        row.classList.add("dragging");
        try { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", String(dragIdx)); } catch(_){}
      });
      row.addEventListener("dragend", () => {
        row.classList.remove("dragging");
        row.draggable = false;
        $$(".tier-row", editor).forEach(r => r.classList.remove("drag-over"));
        dragIdx = null;
      });
      row.addEventListener("dragover", e => {
        if (dragIdx == null) return;
        e.preventDefault();
        try { e.dataTransfer.dropEffect = "move"; } catch(_){}
        $$(".tier-row", editor).forEach(r => r.classList.toggle("drag-over", r === row && Number(r.dataset.i) !== dragIdx));
      });
      row.addEventListener("drop", e => {
        e.preventDefault();
        const targetIdx = Number(row.dataset.i);
        if (dragIdx == null || dragIdx === targetIdx) return;
        const moved = productTiers.splice(dragIdx, 1)[0];
        productTiers.splice(targetIdx, 0, moved);
        dragIdx = null;
        paintTiers();
      });
    });
  }
  paintTiers();
  $("#tiersAdd", editor).addEventListener("click", () => {
    productTiers.push({ dur: "", price: 0, links: {} });
    paintTiers();
  });

  // Images
  let images = [...(p.images || [])];
  function paintImages() {
    $("#fImages", editor).innerHTML = images.map((src, i) => `
      <div class="ape-image" style="background-image:url('${src}')">
        <button class="ape-image-del" data-i="${i}" type="button">×</button>
      </div>
    `).join("") || `<div class="ape-image-empty">No images yet</div>`;
    $$(".ape-image-del", editor).forEach(b => b.addEventListener("click", () => {
      images.splice(Number(b.dataset.i), 1); paintImages();
    }));
  }
  paintImages();

  $("#fImageAdd", editor).addEventListener("click", () => $("#fImageFile", editor).click());
  $("#fImageFile", editor).addEventListener("change", async (e) => {
    for (const file of e.target.files) {
      try {
        const dataUrl = await readImageResized(file, 800);
        images.push(dataUrl);
      } catch (err) { showToast("Failed to read " + file.name, "ERROR", "err"); }
    }
    paintImages();
    e.target.value = "";
  });

  // Save
  $("#fSave", editor).addEventListener("click", () => {
    const newP = {
      id: $("#fId", editor).value.trim() || p.id,
      name: $("#fName", editor).value.trim(),
      short: $("#fShort", editor).value.trim().toUpperCase(),
      clear: $("#fClear", editor).value,
      status: $("#fStatus", editor).value,
      base: Math.max(0.5, Number($("#fBase", editor).value) || 5),
      rating: Math.min(5, Math.max(0, Number($("#fRating", editor).value) || 5)),
      desc: $("#fDesc", editor).value.trim(),
      tags: $("#fTags", editor).value.split(",").map(s => s.trim()).filter(Boolean),
      games: $$('#fGames input:checked', editor).map(i => i.value),
      features: {
        aim: $("#fAim", editor).value.split("\n").map(s=>s.trim()).filter(Boolean),
        visual: $("#fVisual", editor).value.split("\n").map(s=>s.trim()).filter(Boolean),
        misc: $("#fMisc", editor).value.split("\n").map(s=>s.trim()).filter(Boolean),
      },
      req: {
        os: $("#fReqOs", editor).value.trim() || "—",
        cpu: $("#fReqCpu", editor).value.trim() || "—",
        ram: $("#fReqRam", editor).value.trim() || "—",
        driver: $("#fReqDrv", editor).value.trim() || "—",
        net: $("#fReqNet", editor).value.trim() || "—",
      },
      images,
      videoUrl: $("#fVideoUrl", editor).value.trim(),
      reviews: p.reviews || [],
      badges: $$('#fBadges input:checked', editor).map(i => i.value),
      sort:   Number($("#fSort", editor).value) || 100,
      tiers: productTiers
        .map(t => ({
          dur: (t.dur || "").trim(),
          price: Number(t.price) || 0,
          links: {
            ru:  ((t.links && t.links.ru)  || "").trim(),
            eu:  ((t.links && t.links.eu)  || "").trim(),
            ltc: ((t.links && t.links.ltc) || "").trim(),
            btc: ((t.links && t.links.btc) || "").trim(),
          },
        }))
        .filter(t => t.dur && t.price > 0),
    };
    if (!newP.name) { showToast("Name is required", "ERROR", "err"); return; }
    if (!newP.short) newP.short = newP.name.split(/\s+/)[0].toUpperCase();
    Store.upsertProduct(newP);
    showToast(`${isNew ? "Created" : "Saved"} <b>${newP.name}</b>`, "PRODUCT");
    closeEditor();
    navigate("products");
  });

  // Close handlers
  function closeEditor() {
    editor.remove();
    if (!document.querySelector(".ap-editor.open")) document.body.style.overflow = "";
  }
  editor.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", closeEditor));
}

// Resize image to data URL
function readImageResized(file, maxWidth = 800) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = reject;
    fr.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const ratio = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}

/* ===================================================================== *
 *  SECTION: REVIEWS
 * ===================================================================== */
function renderReviews(root) {
  const products = Store.getProducts();
  root.innerHTML = `
    <div class="ap-toolbar">
      <select class="ape-input" id="revProd" style="max-width:280px">
        ${products.map(p=>`<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("")}
      </select>
      <button class="btn btn-primary" id="addReview">+ NEW REVIEW</button>
    </div>
    <div class="ap-card">
      <div class="ap-head"><span class="kicker">// REVIEWS</span><span class="ap-head-side" id="revStats"></span></div>
      <div id="revList"></div>
    </div>
  `;
  function paint() {
    const id = $("#revProd").value;
    const p = Store.getProduct(id);
    const list = (p?.reviews) || [];
    $("#revStats").textContent = `${list.length} reviews · avg ${p?.rating ?? "—"}`;
    $("#revList").innerHTML = list.map((r, i) => `
      <div class="rev-item">
        <div class="rev-head">
          <div class="pi-rev-avatar">${(r.user.replace(/[^A-Za-zА-Яа-я0-9]/g,"").slice(0,2)||"OP").toUpperCase()}</div>
          <div class="rev-meta">
            <div class="rev-name">${escapeHtml(r.user)} <span class="pi-rev-game">${escapeHtml(r.game||"—")}</span></div>
            <div class="rev-sub">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)} · ${r.days||0} days ago</div>
          </div>
          <button class="btn-sm danger" data-i="${i}">DELETE</button>
        </div>
        <div class="rev-text">${escapeHtml(r.text)}</div>
      </div>
    `).join("") || `<p class="ape-hint">No reviews yet.</p>`;
    $$("#revList .btn-sm.danger").forEach(b => b.addEventListener("click", async () => {
      if (await confirmAsk("Delete review", "Remove this review permanently?")) {
        Store.deleteReview(id, Number(b.dataset.i));
        showToast("Review removed", "REVIEW");
        paint();
      }
    }));
  }
  paint();
  $("#revProd").addEventListener("change", paint);
  $("#addReview").addEventListener("click", () => openReviewEditor($("#revProd").value, paint));
}

function openReviewEditor(productId, onDone) {
  const editor = document.createElement("div");
  editor.className = "ap-editor open";
  editor.innerHTML = `
    <div class="payment-backdrop" data-close="1"></div>
    <div class="ap-editor-panel small">
      <div class="wc-corner tl"></div><div class="wc-corner tr"></div>
      <div class="wc-corner bl"></div><div class="wc-corner br"></div>
      <header class="ape-head">
        <div><span class="kicker">// NEW REVIEW</span><h3>Add review</h3></div>
        <button class="payment-close" data-close="1">×</button>
      </header>
      <div class="ape-grid">
        <div class="ape-full"><label class="ape-label">USER</label><input class="ape-input" id="rUser" placeholder="shadow_op77"/></div>
        <div><label class="ape-label">RATING</label>
          <select class="ape-input" id="rRating">${[5,4,3,2,1].map(n=>`<option value="${n}">${n} ★</option>`).join("")}</select>
        </div>
        <div><label class="ape-label">GAME</label><input class="ape-input" id="rGame" placeholder="CS2"/></div>
        <div class="ape-full"><label class="ape-label">DAYS AGO</label><input class="ape-input" id="rDays" type="number" value="3" min="0"/></div>
        <div class="ape-full"><label class="ape-label">TEXT</label><textarea class="ape-input" id="rText" rows="4" placeholder="Real, useful feedback..."></textarea></div>
      </div>
      <footer class="ape-foot">
        <button class="btn btn-ghost" data-close="1">CANCEL</button>
        <button class="btn btn-primary" id="rSave" type="button">ADD REVIEW</button>
      </footer>
    </div>
  `;
  document.body.appendChild(editor);
  function close() { editor.remove(); }
  editor.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", close));
  $("#rSave", editor).addEventListener("click", () => {
    const r = {
      user:   $("#rUser", editor).value.trim(),
      rating: Number($("#rRating", editor).value),
      game:   $("#rGame", editor).value.trim().toUpperCase(),
      days:   Number($("#rDays", editor).value) || 0,
      text:   $("#rText", editor).value.trim(),
    };
    if (!r.user || !r.text) { showToast("User and text required", "ERROR", "err"); return; }
    Store.addReview(productId, r);
    showToast("Review added", "REVIEW");
    close(); onDone && onDone();
  });
}

/* ===================================================================== *
 *  SECTION: GAMES
 * ===================================================================== */
function renderGames(root) {
  root.innerHTML = `
    <div class="ap-toolbar">
      <button class="btn btn-primary" id="addGame">+ NEW GAME</button>
      <span class="ap-meta">${Store.getGames().length} games</span>
    </div>
    <div class="ap-card">
      <table class="ap-table">
        <thead><tr><th>KEY</th><th>NAME</th><th>SHORT</th><th>ANTI-CHEAT</th><th>STATUS</th><th></th></tr></thead>
        <tbody id="gamesBody"></tbody>
      </table>
    </div>
  `;
  function paint() {
    const games = Store.getGames();
    $("#gamesBody").innerHTML = games.map((g, i) => `
      <tr>
        <td><code>${g.key}</code></td>
        <td>${escapeHtml(g.name)}</td>
        <td>${escapeHtml(g.short)}</td>
        <td>${escapeHtml(g.ac)}</td>
        <td><span class="status-pill ${g.status.toLowerCase()}">${g.status}</span></td>
        <td>
          <button class="btn-sm" data-edit="${g.key}">EDIT</button>
          <button class="btn-sm danger" data-del="${g.key}">DEL</button>
        </td>
      </tr>
    `).join("");
    $$("#gamesBody [data-edit]").forEach(b => b.addEventListener("click", () => openGameEditor(b.dataset.edit, paint)));
    $$("#gamesBody [data-del]").forEach(b => b.addEventListener("click", async () => {
      if (await confirmAsk("Delete game", `Remove game "${b.dataset.del}"?`)) {
        Store.deleteGame(b.dataset.del); showToast("Game removed", "GAME"); paint();
      }
    }));
  }
  paint();
  $("#addGame").addEventListener("click", () => openGameEditor(null, paint));
}
function openGameEditor(key, onDone) {
  const isNew = !key;
  const g = isNew ? { key: "", name: "", short: "", ac: "", status: "UNDETECTED" }
                  : Store.getGames().find(x => x.key === key) || { key, name: "", short: "", ac: "", status: "UNDETECTED" };
  const editor = document.createElement("div");
  editor.className = "ap-editor open";
  editor.innerHTML = `
    <div class="payment-backdrop" data-close="1"></div>
    <div class="ap-editor-panel small">
      <div class="wc-corner tl"></div><div class="wc-corner tr"></div>
      <div class="wc-corner bl"></div><div class="wc-corner br"></div>
      <header class="ape-head">
        <div><span class="kicker">// ${isNew?"NEW GAME":"EDIT GAME"}</span><h3>${isNew?"Add game":escapeHtml(g.name)}</h3></div>
        <button class="payment-close" data-close="1">×</button>
      </header>
      <div class="ape-grid">
        <div><label class="ape-label">KEY (slug)</label><input class="ape-input" id="gKey" value="${escapeHtml(g.key)}" ${isNew?"":"disabled"}/></div>
        <div><label class="ape-label">SHORT</label><input class="ape-input" id="gShort" value="${escapeHtml(g.short)}"/></div>
        <div class="ape-full"><label class="ape-label">NAME</label><input class="ape-input" id="gName" value="${escapeHtml(g.name)}"/></div>
        <div class="ape-full"><label class="ape-label">ANTI-CHEAT</label><input class="ape-input" id="gAc" value="${escapeHtml(g.ac)}"/></div>
        <div class="ape-full"><label class="ape-label">STATUS</label>
          <select class="ape-input" id="gStatus">${Store.STATUSES.map(s=>`<option ${s===g.status?"selected":""}>${s}</option>`).join("")}</select>
        </div>
      </div>
      <footer class="ape-foot">
        <button class="btn btn-ghost" data-close="1">CANCEL</button>
        <button class="btn btn-primary" id="gSave" type="button">${isNew?"CREATE":"SAVE"}</button>
      </footer>
    </div>
  `;
  document.body.appendChild(editor);
  function close() { editor.remove(); }
  editor.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", close));
  $("#gSave", editor).addEventListener("click", () => {
    const newG = {
      key:   $("#gKey", editor).value.trim() || g.key,
      short: $("#gShort", editor).value.trim().toUpperCase(),
      name:  $("#gName", editor).value.trim(),
      ac:    $("#gAc", editor).value.trim(),
      status:$("#gStatus", editor).value,
    };
    if (!newG.key || !newG.name) { showToast("Key and name required", "ERROR", "err"); return; }
    Store.upsertGame(newG); showToast("Saved", "GAME"); close(); onDone && onDone();
  });
}

/* ===================================================================== *
 *  SECTION: ORDERS
 * ===================================================================== */
function renderOrders(root) {
  root.innerHTML = `
    <div class="ap-toolbar">
      <input class="ap-search" id="ordSearch" placeholder="Search by ID, email, product..."/>
      <select class="ape-input" id="ordStatus" style="max-width:160px">
        <option value="">All statuses</option><option>completed</option><option>pending</option><option>refunded</option>
      </select>
      <span class="ap-meta" id="ordMeta"></span>
    </div>
    <div class="ap-card">
      <table class="ap-table">
        <thead><tr><th>ORDER</th><th>WHEN</th><th>EMAIL</th><th>PRODUCT</th><th>TIER</th><th>METHOD</th><th>AMOUNT</th><th>STATUS</th><th></th></tr></thead>
        <tbody id="ordBody"></tbody>
      </table>
    </div>
  `;
  function paint() {
    const orders = Store.getOrders();
    const products = Store.getProducts();
    const f = $("#ordSearch").value.trim().toLowerCase();
    const sf = $("#ordStatus").value;
    const filtered = orders.filter(o => {
      if (sf && o.status !== sf) return false;
      if (!f) return true;
      const p = products.find(x=>x.id===o.productId);
      return o.id.toLowerCase().includes(f)
          || o.email.toLowerCase().includes(f)
          || o.productId.toLowerCase().includes(f)
          || (p && p.name.toLowerCase().includes(f));
    });
    $("#ordMeta").textContent = `${filtered.length} of ${orders.length} orders · ${fmtMoney(filtered.filter(o=>o.status==="completed").reduce((s,o)=>s+o.amount,0))} revenue`;
    $("#ordBody").innerHTML = filtered.slice(0, 200).map(o => {
      const p = products.find(x=>x.id===o.productId);
      return `
        <tr>
          <td><code>${o.id}</code></td>
          <td>${fmtTime(o.ts)}</td>
          <td>${escapeHtml(o.email)}</td>
          <td>${p?escapeHtml(p.name):o.productId}</td>
          <td>${o.tier}</td>
          <td><span class="method-pill ${o.method}">${o.method.toUpperCase()}</span></td>
          <td><b>${fmtMoney(o.amount)}</b></td>
          <td><span class="status-pill ${o.status}">${o.status}</span></td>
          <td>
            <select class="ape-input ape-mini" data-id="${o.id}">
              ${["completed","pending","refunded"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}
            </select>
          </td>
        </tr>`;
    }).join("");
    $$("#ordBody select[data-id]").forEach(s => s.addEventListener("change", () => {
      const arr = Store.getOrders();
      const idx = arr.findIndex(x => x.id === s.dataset.id);
      if (idx >= 0) { arr[idx].status = s.value; Store.setOrders(arr); showToast(`${s.dataset.id} → ${s.value}`, "ORDER"); paint(); }
    }));
  }
  paint();
  $("#ordSearch").addEventListener("input", paint);
  $("#ordStatus").addEventListener("change", paint);
}

/* ===================================================================== *
 *  SECTION: ANALYTICS — clicks, hourly heat
 * ===================================================================== */
function renderAnalytics(root) {
  const clicks = Store.getClicks();
  const orders = Store.getOrders();
  const products = Store.getProducts();
  // Clicks per product
  const byProd = {};
  clicks.forEach(c => byProd[c.productId] = (byProd[c.productId]||0) + 1);
  const orderByProd = {};
  orders.forEach(o => orderByProd[o.productId] = (orderByProd[o.productId]||0) + 1);
  const rows = products.map(p => {
    const cl = byProd[p.id]||0, or = orderByProd[p.id]||0;
    const conv = cl ? ((or/cl)*100).toFixed(1) + "%" : "—";
    return { id: p.id, name: p.name, label: p.name, v: cl, label2: cl + " · " + conv, clicks: cl, orders: or, conv };
  }).sort((a,b)=>b.v - a.v);

  // Hourly distribution
  const hourly = Array.from({length: 24}, (_, h) => ({ label: String(h).padStart(2,"0"), v: 0 }));
  clicks.forEach(c => { const h = new Date(c.ts).getHours(); hourly[h].v++; });

  // Last 14 days clicks
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const start = startOfDay(Date.now() - i * 86400e3), end = start + 86400e3;
    const v = clicks.filter(c => c.ts >= start && c.ts < end).length;
    days.push({ label: new Date(start).toLocaleDateString("en-US",{day:"numeric",month:"short"}), v });
  }

  root.innerHTML = `
    <div class="kpi-row">
      <div class="kpi"><div class="kpi-label">TOTAL CLICKS</div><div class="kpi-val">${clicks.length}</div><div class="kpi-sub">all time</div></div>
      <div class="kpi"><div class="kpi-label">CLICKS TODAY</div><div class="kpi-val">${clicks.filter(c=>c.ts>=startOfDay(Date.now())).length}</div><div class="kpi-sub">last 24h</div></div>
      <div class="kpi"><div class="kpi-label">CONVERSION</div><div class="kpi-val">${clicks.length?((orders.length/clicks.length)*100).toFixed(1):"0"}%</div><div class="kpi-sub">orders / clicks</div></div>
      <div class="kpi"><div class="kpi-label">PEAK HOUR</div><div class="kpi-val">${String(hourly.reduce((a,b,i)=>b.v>hourly[a].v?i:a,0)).padStart(2,"0")}:00</div><div class="kpi-sub">UTC local</div></div>
    </div>
    <div class="ap-card">
      <div class="ap-head"><span class="kicker">// CLICKS · LAST 14 DAYS</span></div>
      <svg class="ap-chart" id="anLine"></svg>
    </div>
    <div class="ap-grid two">
      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// CLICKS BY PRODUCT</span></div>
        <svg class="ap-chart" id="anBar" style="height:280px"></svg>
      </div>
      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// CLICKS BY HOUR (24H)</span></div>
        <svg class="ap-chart" id="anHourly"></svg>
      </div>
    </div>
    <div class="ap-card">
      <div class="ap-head"><span class="kicker">// CONVERSION FUNNEL</span></div>
      <table class="ap-table">
        <thead><tr><th>PRODUCT</th><th>CLICKS</th><th>ORDERS</th><th>CONVERSION</th></tr></thead>
        <tbody>${rows.map(r=>`<tr><td>${escapeHtml(r.name)}</td><td>${r.clicks}</td><td>${r.orders}</td><td><b>${r.conv}</b></td></tr>`).join("")}</tbody>
      </table>
    </div>
  `;
  lineChart($("#anLine"), days);
  barChart($("#anBar"), rows.slice(0, 8));
  // hourly as bar chart with smaller labels
  const svgH = $("#anHourly");
  svgH.style.height = "200px";
  const w=600,h=200,pad={l:24,r:12,t:8,b:24};
  svgH.setAttribute("viewBox",`0 0 ${w} ${h}`);
  const max = Math.max(...hourly.map(x=>x.v),1);
  let html = "";
  hourly.forEach((d,i)=>{
    const x = pad.l + i * ((w - pad.l - pad.r) / 24);
    const bw = ((w - pad.l - pad.r) / 24) - 2;
    const bh = (d.v / max) * (h - pad.t - pad.b);
    html += `<rect x="${x}" y="${h - pad.b - bh}" width="${bw}" height="${bh}" fill="#fff" opacity="${0.4 + 0.6 * (d.v/max)}"/>`;
    if (i % 3 === 0) html += `<text x="${x + bw/2}" y="${h - 6}" text-anchor="middle" font-family="Share Tech Mono" font-size="9" fill="rgba(255,255,255,0.5)">${d.label}</text>`;
  });
  svgH.innerHTML = html;
}

/* ===================================================================== *
 *  SECTION: PROMO CODES — full CRUD with rules
 * ===================================================================== */
function renderPromos(root) {
  const orders = Store.getOrders();
  function paint() {
    const s = Store.getSettings();
    const promos = s.promoCodes || [];
    root.innerHTML = `
      <div class="ap-toolbar">
        <button class="btn btn-primary" id="pcAdd" type="button">+ NEW PROMO CODE</button>
        <span class="ap-meta">${promos.length} promo codes</span>
      </div>
      <div class="ap-card">
        <table class="ap-table">
          <thead><tr><th>CODE</th><th>TYPE</th><th>VALUE</th><th>ACTIVE</th><th>USAGE</th><th>STATUS</th><th></th></tr></thead>
          <tbody id="promoBody"></tbody>
        </table>
      </div>
    `;
    const body = document.getElementById("promoBody");
    body.innerHTML = promos.map(p => {
      const used = orders.filter(o => o.promo === p.code).length;
      const limit = p.useLimit ? p.useLimit : "∞";
      const now = Date.now();
      let status = "active";
      if (p.disabled) status = "disabled";
      else if (p.endDate && new Date(p.endDate).getTime() < now) status = "expired";
      else if (p.startDate && new Date(p.startDate).getTime() > now) status = "scheduled";
      else if (p.useLimit && used >= p.useLimit) status = "exhausted";
      const valueLabel = p.type === "percentage" ? `${p.discount}%` : `$${p.discount}`;
      const window_ = (p.startDate ? new Date(p.startDate).toLocaleDateString() : "now") + " → " + (p.endDate ? new Date(p.endDate).toLocaleDateString() : "∞");
      return `
        <tr>
          <td><code>${escapeHtml(p.code)}</code></td>
          <td>${p.type}</td>
          <td><b>${valueLabel}</b></td>
          <td>${window_}</td>
          <td>${used} / ${limit}</td>
          <td><span class="status-pill ${status}">${status}</span></td>
          <td>
            <button class="btn-sm" data-edit="${p.id}">EDIT</button>
            <button class="btn-sm danger" data-del="${p.id}">DEL</button>
          </td>
        </tr>
      `;
    }).join("") || `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:20px">No promo codes yet — click + NEW PROMO CODE</td></tr>`;
    $$("#promoBody [data-edit]").forEach(b => b.addEventListener("click", () => openPromoEditor(b.dataset.edit, paint)));
    $$("#promoBody [data-del]").forEach(b => b.addEventListener("click", async () => {
      if (await confirmAsk("Delete promo", "Permanently remove this promo code?")) {
        const ns = Store.getSettings();
        ns.promoCodes = (ns.promoCodes || []).filter(x => x.id !== b.dataset.del);
        Store.setSettings(ns);
        showToast("Promo deleted", "PROMO");
        paint();
      }
    }));
  }
  paint();
  document.getElementById("pcAdd").addEventListener("click", () => openPromoEditor(null, paint));
}

function openPromoEditor(id, onDone) {
  const products = Store.getProducts();
  const settings = Store.getSettings();
  const isNew = !id;
  const p = id
    ? (settings.promoCodes || []).find(x => x.id === id) || null
    : {
        id: "promo_" + Math.random().toString(36).slice(2, 8),
        code: "", type: "percentage", discount: 10,
        startDate: "", endDate: "",
        useLimit: 0, perCustomerLimit: 0,
        minOrderValue: 0, emailAllowlist: [],
        productIds: [], methods: [],
        disabled: false,
      };
  if (!p) { showToast("Promo not found", "ERROR", "err"); return; }

  const editor = document.createElement("div");
  editor.className = "ap-editor open";
  editor.innerHTML = `
    <div class="payment-backdrop" data-close="1"></div>
    <div class="ap-editor-panel">
      <div class="wc-corner tl"></div><div class="wc-corner tr"></div>
      <div class="wc-corner bl"></div><div class="wc-corner br"></div>
      <header class="ape-head">
        <div>
          <span class="kicker">// ${isNew ? "NEW PROMO CODE" : "EDIT PROMO CODE"}</span>
          <h3>${isNew ? "Create promo" : escapeHtml(p.code) || "Promo"}</h3>
        </div>
        <button class="payment-close" data-close="1">×</button>
      </header>

      <div class="promo-grid">
        <div class="promo-col">
          <div class="ap-card" style="margin:0">
            <div class="ap-head"><span class="kicker">// GENERAL</span></div>
            <label class="ape-label">CODE</label>
            <div class="ape-row">
              <input class="ape-input" id="pcCode" value="${escapeHtml(p.code)}" placeholder="SAVE10" style="text-transform:uppercase;letter-spacing:2px;font-weight:700"/>
              <button class="btn btn-ghost btn-sm" id="pcGen" type="button">⤬ GENERATE</button>
            </div>

            <label class="ape-label" style="margin-top:14px">TYPE</label>
            <div class="ape-row">
              <label class="ape-chip"><input type="radio" name="pcType" value="percentage" ${p.type==="percentage"?"checked":""}/> % Percentage</label>
              <label class="ape-chip"><input type="radio" name="pcType" value="fixed" ${p.type==="fixed"?"checked":""}/> $ Fixed Amount</label>
            </div>

            <label class="ape-label" style="margin-top:14px">DISCOUNT</label>
            <div class="ape-row">
              <input class="ape-input" id="pcDiscount" type="number" min="0" step="0.01" value="${p.discount}" style="max-width:140px"/>
              <span class="pc-unit" id="pcUnit">${p.type==="percentage"?"%":"$"}</span>
              <span class="pc-quick">
                ${[5,10,15,20,25,50,100].map(n => `<button class="btn-sm" data-quick="${n}" type="button">${n}</button>`).join("")}
              </span>
            </div>
          </div>

          <div class="ap-card" style="margin:0">
            <div class="ap-head"><span class="kicker">// SCHEDULE & LIMITS</span></div>
            <div class="ape-grid">
              <div>
                <label class="ape-label">START DATE (optional)</label>
                <input class="ape-input" id="pcStart" type="datetime-local" value="${p.startDate||""}"/>
                <span class="ape-hint">Empty → active immediately.</span>
              </div>
              <div>
                <label class="ape-label">END DATE (optional)</label>
                <input class="ape-input" id="pcEnd" type="datetime-local" value="${p.endDate||""}"/>
                <span class="ape-hint">Empty → no expiration.</span>
              </div>
              <div>
                <label class="ape-label">USE LIMIT (total)</label>
                <input class="ape-input" id="pcLimit" type="number" min="0" value="${p.useLimit||""}" placeholder="unlimited"/>
              </div>
              <div>
                <label class="ape-label">PER-CUSTOMER LIMIT</label>
                <input class="ape-input" id="pcPerCust" type="number" min="0" value="${p.perCustomerLimit||""}" placeholder="unlimited"/>
              </div>
              <div class="ape-full">
                <label class="ape-label">MINIMUM ORDER VALUE (USD)</label>
                <input class="ape-input" id="pcMinOrder" type="number" min="0" step="0.01" value="${p.minOrderValue||""}" placeholder="no minimum"/>
              </div>
              <div class="ape-full">
                <label class="ape-label">EMAIL ALLOWLIST (optional)</label>
                <input class="ape-input" id="pcEmails" value="${(p.emailAllowlist||[]).join(", ")}" placeholder="email@example.com, another@example.com"/>
                <span class="ape-hint">Comma-separated. Empty → any email allowed.</span>
              </div>
            </div>
          </div>
        </div>

        <div class="promo-col">
          <div class="ap-card" style="margin:0">
            <div class="ap-head"><span class="kicker">// PRODUCTS</span></div>
            <label class="ape-chip" style="margin-bottom:10px"><input type="checkbox" id="pcAllProducts" ${(p.productIds||[]).length===0?"checked":""}/> Apply to All Products</label>
            <div id="pcProductPick" style="${(p.productIds||[]).length===0?"display:none":""}">
              <span class="ape-hint" style="display:block;margin-bottom:6px">Specific products only:</span>
              <div class="ape-chips">
                ${products.map(pr => `<label class="ape-chip"><input type="checkbox" data-pid value="${pr.id}" ${(p.productIds||[]).includes(pr.id)?"checked":""}/> ${escapeHtml(pr.name)}</label>`).join("")}
              </div>
            </div>
          </div>

          <div class="ap-card" style="margin:0">
            <div class="ap-head"><span class="kicker">// PAYMENT METHODS</span></div>
            <span class="ape-hint" style="display:block;margin-bottom:6px">Empty = all methods allowed.</span>
            <div class="ape-chips">
              ${["ru","eu","ltc","btc"].map(m => `<label class="ape-chip"><input type="checkbox" data-pm value="${m}" ${(p.methods||[]).includes(m)?"checked":""}/> ${m.toUpperCase()}</label>`).join("")}
            </div>
          </div>

          <div class="ap-card" style="margin:0">
            <div class="ap-head">
              <span class="kicker">// STATUS</span>
              <label class="ap-toggle"><input type="checkbox" id="pcDisabled" ${p.disabled?"checked":""}/><span class="ap-toggle-track"></span><span class="ap-toggle-label">${p.disabled?"DISABLED":"ENABLED"}</span></label>
            </div>
            <span class="ape-hint">When disabled, code is rejected even if not expired.</span>
          </div>
        </div>
      </div>

      <footer class="ape-foot">
        <button class="btn btn-ghost" data-close="1">CANCEL</button>
        <button class="btn btn-primary" id="pcSave" type="button">${isNew?"CREATE PROMO":"SAVE CHANGES"}</button>
      </footer>
    </div>
  `;
  document.body.appendChild(editor);
  document.body.style.overflow = "hidden";

  function close() { editor.remove(); if (!document.querySelector(".ap-editor.open")) document.body.style.overflow = ""; }
  editor.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", close));

  // Generate code button
  $("#pcGen", editor).addEventListener("click", () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random()*chars.length)];
    $("#pcCode", editor).value = s;
  });

  // Quick discount chips
  $$("[data-quick]", editor).forEach(b => b.addEventListener("click", () => {
    $("#pcDiscount", editor).value = b.dataset.quick;
  }));

  // Type radio updates unit indicator
  $$("input[name='pcType']", editor).forEach(r => r.addEventListener("change", () => {
    $("#pcUnit", editor).textContent = r.value === "percentage" ? "%" : "$";
  }));

  // Apply to all toggle
  $("#pcAllProducts", editor).addEventListener("change", e => {
    $("#pcProductPick", editor).style.display = e.target.checked ? "none" : "";
  });

  // Disabled toggle label
  $("#pcDisabled", editor).addEventListener("change", e => {
    e.target.parentElement.querySelector(".ap-toggle-label").textContent = e.target.checked ? "DISABLED" : "ENABLED";
  });

  $("#pcSave", editor).addEventListener("click", () => {
    const code = $("#pcCode", editor).value.trim().toUpperCase();
    if (!code) { showToast("Code required", "ERROR", "err"); return; }
    const allProducts = $("#pcAllProducts", editor).checked;
    const newPromo = {
      id: p.id,
      code,
      type: ($$('input[name="pcType"]:checked', editor)[0] || {}).value || "percentage",
      discount: Number($("#pcDiscount", editor).value) || 0,
      startDate: $("#pcStart", editor).value,
      endDate:   $("#pcEnd", editor).value,
      useLimit:        Number($("#pcLimit", editor).value) || 0,
      perCustomerLimit: Number($("#pcPerCust", editor).value) || 0,
      minOrderValue:   Number($("#pcMinOrder", editor).value) || 0,
      emailAllowlist: $("#pcEmails", editor).value.split(",").map(x => x.trim().toLowerCase()).filter(Boolean),
      productIds: allProducts ? [] : $$("[data-pid]:checked", editor).map(i => i.value),
      methods: $$("[data-pm]:checked", editor).map(i => i.value),
      disabled: $("#pcDisabled", editor).checked,
    };
    const ns = Store.getSettings();
    ns.promoCodes = ns.promoCodes || [];
    const idx = ns.promoCodes.findIndex(x => x.id === p.id);
    if (idx >= 0) ns.promoCodes[idx] = newPromo;
    else ns.promoCodes.push(newPromo);
    // Mirror to legacy discountCodes for back-compat
    ns.discountCodes = {};
    ns.promoCodes.forEach(pc => { if (pc.type === "percentage" && !pc.disabled) ns.discountCodes[pc.code] = pc.discount; });
    Store.setSettings(ns);
    showToast(`${isNew ? "Created" : "Saved"} <b>${code}</b>`, "PROMO");
    close();
    onDone && onDone();
  });
}

/* ===================================================================== *
 *  SECTION: SETTINGS
 * ===================================================================== */
function renderSettings(root) {
  const s = Store.getSettings();
  root.innerHTML = `
    <div class="ap-grid two">
      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// CONTACT · SOCIALS</span></div>
        <p class="ape-hint">Channels shown on the Contact section + footer links.</p>
        <div class="ape-grid">
          <div><label class="ape-label">DISCORD URL</label><input class="ape-input" id="socDis" value="${escapeHtml(s.social.discord||"")}"/></div>
          <div><label class="ape-label">DISCORD HANDLE</label><input class="ape-input" id="socDisH" value="${escapeHtml(s.social.discordHandle||"")}"/></div>
          <div><label class="ape-label">TELEGRAM URL</label><input class="ape-input" id="socTg" value="${escapeHtml(s.social.telegram||"")}"/></div>
          <div><label class="ape-label">TELEGRAM HANDLE</label><input class="ape-input" id="socTgH" value="${escapeHtml(s.social.telegramHandle||"")}"/></div>
        </div>
        <button class="btn btn-primary" id="saveSoc">SAVE CONTACTS</button>
      </div>

      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// LEGAL LINKS</span></div>
        <p class="ape-hint">Where footer links point. Internal pages: <code>/faq.html</code> · <code>/terms.html</code> · <code>/terms.html#privacy</code>. External works too.</p>
        <div class="ape-grid">
          <div class="ape-full"><label class="ape-label">FAQ URL</label><input class="ape-input" id="legFaq" value="${escapeHtml(s.legal.faqUrl||"")}"/></div>
          <div class="ape-full"><label class="ape-label">TERMS URL</label><input class="ape-input" id="legTerms" value="${escapeHtml(s.legal.termsUrl||"")}"/></div>
          <div class="ape-full"><label class="ape-label">PRIVACY URL</label><input class="ape-input" id="legPriv" value="${escapeHtml(s.legal.privacyUrl||"")}"/></div>
        </div>
        <button class="btn btn-primary" id="saveLegal">SAVE LEGAL LINKS</button>
      </div>

      <div class="ap-card ape-full-card">
        <div class="ap-head"><span class="kicker">// FAQ EDITOR</span><button class="btn btn-ghost btn-sm" id="faqAdd">+ ADD QUESTION</button></div>
        <p class="ape-hint">Question/answer pairs shown on <code>/faq.html</code>. Newlines are preserved as paragraphs.</p>
        <div class="faq-editor" id="faqList"></div>
        <button class="btn btn-primary" id="saveFaq" style="margin-top:14px">SAVE FAQ</button>
      </div>

      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// TERMS OF SERVICE</span></div>
        <p class="ape-hint">Plain text, paragraphs separated by empty lines. Shown on <code>/terms.html</code>.</p>
        <textarea class="ape-input" id="termsText" rows="14" style="font-family:var(--mono);font-size:12px">${escapeHtml(s.terms||"")}</textarea>
        <button class="btn btn-primary" id="saveTerms" style="margin-top:10px">SAVE TERMS</button>
      </div>

      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// PRIVACY POLICY</span></div>
        <p class="ape-hint">Plain text. Shown on <code>/terms.html#privacy</code> tab.</p>
        <textarea class="ape-input" id="privText" rows="14" style="font-family:var(--mono);font-size:12px">${escapeHtml(s.privacy||"")}</textarea>
        <button class="btn btn-primary" id="savePriv" style="margin-top:10px">SAVE PRIVACY</button>
      </div>

      <div class="ap-card">
        <div class="ap-head">
          <span class="kicker">// MAINTENANCE MODE</span>
          <label class="ap-toggle"><input type="checkbox" id="mtEnable" ${s.maintenance.enabled?"checked":""}/><span class="ap-toggle-track"></span><span class="ap-toggle-label">${s.maintenance.enabled?"ENABLED":"DISABLED"}</span></label>
        </div>
        <p class="ape-hint">When enabled, all visitors see a maintenance overlay instead of the site. Admin panel stays accessible.</p>
        <div class="ape-grid">
          <div class="ape-full"><label class="ape-label">TITLE</label><input class="ape-input" id="mtT" value="${escapeHtml(s.maintenance.title)}"/></div>
          <div class="ape-full"><label class="ape-label">MESSAGE</label><textarea class="ape-input" id="mtM" rows="3">${escapeHtml(s.maintenance.message)}</textarea></div>
          <div class="ape-full"><label class="ape-label">ETA</label><input class="ape-input" id="mtE" value="${escapeHtml(s.maintenance.eta)}"/></div>
        </div>
        <button class="btn btn-primary" id="saveMt">SAVE MAINTENANCE</button>
      </div>

      <div class="ap-card">
        <div class="ap-head">
          <span class="kicker">// WHEEL OF FORTUNE</span>
          <label class="ap-toggle"><input type="checkbox" id="whEnable" ${s.wheel.enabled?"checked":""}/><span class="ap-toggle-track"></span><span class="ap-toggle-label">${s.wheel.enabled?"ENABLED":"DISABLED"}</span></label>
        </div>
        <p class="ape-hint">Welcome bonus shown to first-time visitors. Edit segments below — label, discount value, weight (chance).</p>
        <div class="ape-grid">
          <div class="ape-full"><label class="ape-label">TITLE</label><input class="ape-input" id="whTitle" value="${escapeHtml(s.wheel.title || "")}"/></div>
          <div class="ape-full"><label class="ape-label">DESCRIPTION</label><textarea class="ape-input" id="whDesc" rows="2">${escapeHtml(s.wheel.desc || "")}</textarea></div>
        </div>
        <div class="ape-label" style="margin-top:14px">SEGMENTS</div>
        <div class="wh-segs" id="whSegs"></div>
        <div class="ape-row" style="margin-top:8px">
          <button class="btn btn-ghost btn-sm" id="whAdd">+ ADD SEGMENT</button>
          <span class="ape-hint" id="whTotalHint" style="margin-left:auto"></span>
        </div>
        <button class="btn btn-primary" id="saveWh" style="margin-top:14px">SAVE WHEEL</button>
      </div>

      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// PUBLISHING · GITHUB</span></div>
        <p class="ape-hint">Push your local changes to <code>data.json</code> in your repo. Visitors fetch this file on every page load — changes go live within a minute.</p>
        <div class="ape-grid">
          <div><label class="ape-label">REPO (owner/name)</label><input class="ape-input" id="ghRepo" value="${escapeHtml(s.github?.repo || "")}" placeholder="username/repo-name"/></div>
          <div><label class="ape-label">BRANCH</label><input class="ape-input" id="ghBranch" value="${escapeHtml(s.github?.branch || "main")}"/></div>
          <div class="ape-full">
            <label class="ape-label">PERSONAL ACCESS TOKEN</label>
            <input class="ape-input" id="ghToken" type="password" value="${escapeHtml(s.github?.token || "")}" placeholder="github_pat_..."/>
            <span class="ape-hint">Create at <code>github.com/settings/tokens?type=beta</code> · scope: <code>Contents: Read &amp; Write</code> for the repo above. Stored locally in your browser only.</span>
          </div>
        </div>
        <div class="ape-row" style="margin-top:10px">
          <button class="btn btn-primary" id="ghPublish">› PUBLISH TO GITHUB</button>
          <button class="btn btn-ghost" id="ghPull">↓ PULL FROM SERVER</button>
          <button class="btn btn-ghost" id="ghExport">⬇ EXPORT data.json</button>
        </div>
      </div>

      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// PAYMENT LINKS</span></div>
        <p class="ape-hint">Templates with placeholders: <code>{id}</code> <code>{tier}</code> <code>{amount}</code> <code>{email}</code> <code>{order}</code></p>
        <div class="ape-grid">
          <div class="ape-full"><label class="ape-label">RU CARDS</label><input class="ape-input" id="lnkRu" value="${escapeHtml(s.paymentLinks.ru)}"/></div>
          <div class="ape-full"><label class="ape-label">EU/US CARDS</label><input class="ape-input" id="lnkEu" value="${escapeHtml(s.paymentLinks.eu)}"/></div>
          <div class="ape-full"><label class="ape-label">CRYPTO · LTC</label><input class="ape-input" id="lnkLtc" value="${escapeHtml(s.paymentLinks.ltc)}"/></div>
          <div class="ape-full"><label class="ape-label">CRYPTO · BTC</label><input class="ape-input" id="lnkBtc" value="${escapeHtml(s.paymentLinks.btc)}"/></div>
        </div>
        <button class="btn btn-primary" id="saveLinks">SAVE LINKS</button>
      </div>

      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// DISCOUNT CODES</span></div>
        <p class="ape-hint">One per line: <code>CODE = percent</code></p>
        <textarea class="ape-input" id="codes" rows="6">${Object.entries(s.discountCodes).map(([k,v])=>`${k} = ${v}`).join("\n")}</textarea>
        <button class="btn btn-primary" id="saveCodes">SAVE CODES</button>
      </div>

      <div class="ap-card">
        <div class="ap-head"><span class="kicker">// ADMIN PASSWORD</span></div>
        <div class="ape-grid">
          <div class="ape-full"><label class="ape-label">CURRENT</label><input class="ape-input" id="passOld" type="password"/></div>
          <div class="ape-full"><label class="ape-label">NEW</label><input class="ape-input" id="passNew" type="password"/></div>
        </div>
        <button class="btn btn-primary" id="savePass">UPDATE PASSWORD</button>
      </div>

      <div class="ap-card danger">
        <div class="ap-head"><span class="kicker">// DANGER ZONE</span></div>
        <p class="ape-hint">These actions cannot be undone. Customer-visible data on the site will reset to defaults.</p>
        <div class="ape-row">
          <button class="btn btn-ghost" id="clearClicks">CLEAR CLICK DATA</button>
          <button class="btn btn-ghost" id="clearOrders">CLEAR ORDERS</button>
          <button class="btn btn-ghost" id="clearMedia">CLEAR ALL VIDEO BLOBS</button>
          <button class="btn btn-ghost danger" id="resetAll">RESET EVERYTHING</button>
        </div>
      </div>
    </div>
  `;

  // ----- Contacts -----
  $("#saveSoc").addEventListener("click", () => {
    const ns = Store.getSettings();
    ns.social = {
      discord: $("#socDis").value.trim(),
      discordHandle: $("#socDisH").value.trim(),
      telegram: $("#socTg").value.trim(),
      telegramHandle: $("#socTgH").value.trim(),
    };
    Store.setSettings(ns); showToast("Contacts saved", "SETTINGS");
  });

  // ----- Legal links -----
  $("#saveLegal").addEventListener("click", () => {
    const ns = Store.getSettings();
    ns.legal = {
      faqUrl: $("#legFaq").value.trim(),
      termsUrl: $("#legTerms").value.trim(),
      privacyUrl: $("#legPriv").value.trim(),
    };
    Store.setSettings(ns); showToast("Legal links saved", "SETTINGS");
  });

  // ----- FAQ editor -----
  let faqs = JSON.parse(JSON.stringify(s.faq || []));
  function paintFaq() {
    $("#faqList").innerHTML = faqs.map((f, i) => `
      <div class="faq-row" data-i="${i}">
        <div class="faq-row-head">
          <span class="faq-row-num">${String(i+1).padStart(2,"0")}</span>
          <input class="ape-input" data-f="q" placeholder="Question" value="${escapeHtml(f.q || "")}"/>
          <button class="btn-sm danger" data-rm="${i}">×</button>
        </div>
        <textarea class="ape-input" data-f="a" rows="3" placeholder="Answer (newlines preserved)">${escapeHtml(f.a || "")}</textarea>
      </div>
    `).join("") || `<p class="ape-hint">No questions yet — click ADD QUESTION.</p>`;
    $$(".faq-row input, .faq-row textarea").forEach(inp => inp.addEventListener("input", e => {
      const row = e.target.closest(".faq-row");
      faqs[Number(row.dataset.i)][e.target.dataset.f] = e.target.value;
    }));
    $$(".faq-row [data-rm]").forEach(b => b.addEventListener("click", () => { faqs.splice(Number(b.dataset.rm), 1); paintFaq(); }));
  }
  paintFaq();
  $("#faqAdd").addEventListener("click", () => { faqs.push({ q: "", a: "" }); paintFaq(); });
  $("#saveFaq").addEventListener("click", () => {
    const ns = Store.getSettings();
    ns.faq = faqs.filter(f => f.q && f.a);
    Store.setSettings(ns); showToast(`Saved ${ns.faq.length} questions`, "FAQ");
  });

  // ----- Terms / Privacy -----
  $("#saveTerms").addEventListener("click", () => {
    const ns = Store.getSettings();
    ns.terms = $("#termsText").value;
    Store.setSettings(ns); showToast("Terms saved", "SETTINGS");
  });
  $("#savePriv").addEventListener("click", () => {
    const ns = Store.getSettings();
    ns.privacy = $("#privText").value;
    Store.setSettings(ns); showToast("Privacy saved", "SETTINGS");
  });

  // ----- Maintenance -----
  $("#mtEnable").addEventListener("change", e => {
    e.target.parentElement.querySelector(".ap-toggle-label").textContent = e.target.checked ? "ENABLED" : "DISABLED";
  });
  $("#saveMt").addEventListener("click", () => {
    const ns = Store.getSettings();
    ns.maintenance = {
      enabled: $("#mtEnable").checked,
      title:   $("#mtT").value.trim() || "TECHNICAL BREAK",
      message: $("#mtM").value.trim(),
      eta:     $("#mtE").value.trim(),
    };
    Store.setSettings(ns);
    showToast(`Maintenance ${ns.maintenance.enabled ? "<b>ENABLED</b>" : "disabled"}`, "SETTINGS");
  });

  // ----- Wheel -----
  let wheelSegs = JSON.parse(JSON.stringify(s.wheel.segments || []));
  $("#whEnable").addEventListener("change", e => {
    e.target.parentElement.querySelector(".ap-toggle-label").textContent = e.target.checked ? "ENABLED" : "DISABLED";
  });
  function paintSegs() {
    const total = wheelSegs.reduce((a, x) => a + Number(x.weight || 0), 0) || 1;
    $("#whTotalHint").textContent = `total weight: ${total} · chances calculated as weight/${total}`;
    $("#whSegs").innerHTML = wheelSegs.map((seg, i) => {
      const chance = ((Number(seg.weight || 0) / total) * 100).toFixed(1);
      return `
        <div class="wh-seg" data-i="${i}">
          <input class="ape-input" data-f="label"  value="${escapeHtml(seg.label || "")}" placeholder="Label (e.g. 15%)"/>
          <input class="ape-input" data-f="value"  value="${seg.value ?? 0}" type="number" step="0.5" placeholder="Value"/>
          <input class="ape-input" data-f="suffix" value="${escapeHtml(seg.suffix || "%")}" placeholder="Suffix"/>
          <input class="ape-input" data-f="weight" value="${seg.weight ?? 0}" type="number" min="0" placeholder="Weight"/>
          <span class="wh-chance">${chance}%</span>
          <button class="btn-sm danger" data-rm="${i}">×</button>
        </div>
      `;
    }).join("");
    $$(".wh-seg input").forEach(inp => inp.addEventListener("input", e => {
      const row = e.target.closest(".wh-seg");
      const i = Number(row.dataset.i);
      const f = e.target.dataset.f;
      const v = e.target.value;
      wheelSegs[i][f] = (f === "value" || f === "weight") ? Number(v) : v;
      const total = wheelSegs.reduce((a,x)=>a+Number(x.weight||0),0)||1;
      $("#whTotalHint").textContent = `total weight: ${total} · chances calculated as weight/${total}`;
      $$(".wh-seg").forEach(r => {
        const idx = Number(r.dataset.i);
        const ch = ((Number(wheelSegs[idx].weight || 0) / total) * 100).toFixed(1);
        r.querySelector(".wh-chance").textContent = ch + "%";
      });
    }));
    $$(".wh-seg [data-rm]").forEach(btn => btn.addEventListener("click", () => {
      wheelSegs.splice(Number(btn.dataset.rm), 1); paintSegs();
    }));
  }
  paintSegs();
  $("#whAdd").addEventListener("click", () => {
    wheelSegs.push({ label: "NEW", value: 0, suffix: "%", weight: 5 }); paintSegs();
  });
  $("#saveWh").addEventListener("click", () => {
    const ns = Store.getSettings();
    ns.wheel = {
      enabled: $("#whEnable").checked,
      title:   $("#whTitle").value.trim() || "SPIN THE WHEEL",
      desc:    $("#whDesc").value.trim(),
      segments: wheelSegs.filter(x => x.label),
    };
    Store.setSettings(ns);
    showToast(`Wheel ${ns.wheel.enabled ? "<b>ENABLED</b>" : "disabled"} · ${ns.wheel.segments.length} segments`, "WHEEL");
  });

  // ----- Existing handlers -----
  $("#saveLinks").addEventListener("click", () => {
    const ns = Store.getSettings();
    ns.paymentLinks = {
      ru: $("#lnkRu").value, eu: $("#lnkEu").value,
      ltc: $("#lnkLtc").value, btc: $("#lnkBtc").value,
    };
    Store.setSettings(ns); showToast("Payment links saved", "SETTINGS");
  });
  $("#saveCodes").addEventListener("click", () => {
    const ns = Store.getSettings();
    const codes = {};
    $("#codes").value.split("\n").forEach(line => {
      const m = line.match(/^\s*([A-Z0-9-]+)\s*=\s*(\d+)\s*$/i);
      if (m) codes[m[1].toUpperCase()] = Number(m[2]);
    });
    ns.discountCodes = codes;
    Store.setSettings(ns); showToast(`Saved ${Object.keys(codes).length} codes`, "SETTINGS");
  });
  $("#savePass").addEventListener("click", () => {
    if ($("#passOld").value !== Store.getAdminPass()) { showToast("Current password wrong", "ERROR", "err"); return; }
    const np = $("#passNew").value;
    if (np.length < 3) { showToast("Password too short", "ERROR", "err"); return; }
    Store.setAdminPass(np); showToast("Password updated", "SETTINGS");
    $("#passOld").value = ""; $("#passNew").value = "";
  });
  $("#clearClicks").addEventListener("click", async () => {
    if (await confirmAsk("Clear clicks", "Wipe all click tracking data?")) { Store.clearClicks(); showToast("Clicks cleared","DATA"); }
  });
  $("#clearOrders").addEventListener("click", async () => {
    if (await confirmAsk("Clear orders", "Wipe all order history?")) { Store.setOrders([]); showToast("Orders cleared","DATA"); }
  });
  $("#clearMedia").addEventListener("click", async () => {
    if (await confirmAsk("Clear media blobs", "Wipe all uploaded videos? Image references stay but won't resolve.")) {
      try { await Store.Media.clear(); showToast("All video blobs cleared","DATA"); }
      catch (e) { showToast("Failed: " + e.message, "ERROR", "err"); }
    }
  });
  $("#resetAll").addEventListener("click", async () => {
    if (await confirmAsk("Reset everything", "Restore products/games/orders/clicks/settings to defaults? Cannot be undone.")) {
      Store.reset(); showToast("Reset complete · reload pages","DATA");
    }
  });

  // ----- GitHub Publishing -----
  // Light obfuscation for the token so it doesn't sit plain in data.json.
  // Not real crypto — anyone reading the source can recover the key.
  const TOKEN_KEY = "kernelab-pat-shared-key-9k4fXq2-do-not-rename";
  function xorEnc(text) {
    if (!text) return "";
    let out = "";
    for (let i = 0; i < text.length; i++) out += String.fromCharCode(text.charCodeAt(i) ^ TOKEN_KEY.charCodeAt(i % TOKEN_KEY.length));
    try { return btoa(unescape(encodeURIComponent(out))); } catch (e) { return ""; }
  }
  function xorDec(b64) {
    if (!b64) return "";
    try {
      const str = decodeURIComponent(escape(atob(b64)));
      let out = "";
      for (let i = 0; i < str.length; i++) out += String.fromCharCode(str.charCodeAt(i) ^ TOKEN_KEY.charCodeAt(i % TOKEN_KEY.length));
      return out;
    } catch (e) { return ""; }
  }
  function getCurrentToken() {
    const ns = Store.getSettings();
    const enc = ns.github && ns.github.tokenEncrypted;
    if (enc) return xorDec(enc);
    // Migrate old plain token if present
    const plain = ns.github && ns.github.token;
    if (plain) {
      ns.github.tokenEncrypted = xorEnc(plain);
      delete ns.github.token;
      Store.setSettings(ns);
      return plain;
    }
    return "";
  }
  // Fill the form with the decrypted token (if any) so other admins see it pre-filled
  const tokInp = $("#ghToken");
  if (tokInp && !tokInp.value) tokInp.value = getCurrentToken();

  function saveGitHubSettings() {
    const ns = Store.getSettings();
    const plain = $("#ghToken").value.trim();
    ns.github = {
      repo:   $("#ghRepo").value.trim(),
      branch: $("#ghBranch").value.trim() || "main",
      tokenEncrypted: plain ? xorEnc(plain) : "",
    };
    delete ns.github.token; // never store plain
    Store.setSettings(ns);
    return { repo: ns.github.repo, branch: ns.github.branch, token: plain };
  }

  $("#ghExport").addEventListener("click", () => {
    const data = Store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "data.json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("data.json downloaded — commit it to your repo", "EXPORT");
  });

  $("#ghPull").addEventListener("click", async () => {
    if (!(await confirmAsk("Pull from server", "Replace local catalogue with the published data.json from GitHub Pages? Your unsaved local edits will be lost."))) return;
    const ok = Store.syncFromServerSync();
    if (ok) { showToast("Synced from server · refresh sections to see changes", "PULL"); navigate("dashboard"); }
    else    { showToast("data.json not found on server (or fetch failed)", "ERROR", "err"); }
  });

  $("#ghPublish").addEventListener("click", async () => {
    const gh = saveGitHubSettings();
    if (!gh.repo || !gh.token) { showToast("Repo and token required", "ERROR", "err"); return; }
    if (!/^[\w.-]+\/[\w.-]+$/.test(gh.repo)) { showToast("Repo format: owner/name", "ERROR", "err"); return; }
    if (!(await confirmAsk("Publish to GitHub", `Push current catalogue to ${gh.repo}@${gh.branch}/data.json? This goes live to all visitors.`))) return;

    const data = Store.exportData();
    const json = JSON.stringify(data, null, 2);
    const content = btoa(unescape(encodeURIComponent(json)));
    const apiBase = `https://api.github.com/repos/${gh.repo}/contents/data.json`;
    const headers = {
      "Authorization": "Bearer " + gh.token,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    showToast("Publishing...", "DEPLOY");

    async function fetchSha() {
      const r = await fetch(`${apiBase}?ref=${encodeURIComponent(gh.branch)}&_ts=${Date.now()}`, {
        headers, cache: "no-store",
      });
      if (r.ok) { const j = await r.json(); return j.sha; }
      if (r.status === 404) return null;
      throw new Error(`GET sha failed ${r.status} ${r.statusText}`);
    }
    async function putContent(sha) {
      return fetch(apiBase, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `Publish data.json (${new Date().toISOString().slice(0,16).replace("T"," ")})`,
          content,
          branch: gh.branch,
          ...(sha ? { sha } : {}),
        }),
      });
    }
    try {
      let sha = await fetchSha();
      let putResp = await putContent(sha);

      // On 409 (SHA out-of-date), refetch and retry once
      if (putResp.status === 409) {
        await new Promise(r => setTimeout(r, 800));
        sha = await fetchSha();
        putResp = await putContent(sha);
      }

      if (!putResp.ok) {
        const txt = await putResp.text();
        console.error("[publish] PUT failed:", putResp.status, txt);
        showToast(`Publish failed: ${putResp.status} — see console`, "ERROR", "err");
        return;
      }
      showToast("✓ Published — visitors see updates within ~60s", "DEPLOY");
    } catch (err) {
      console.error("[publish] error:", err);
      showToast("Publish failed: " + (err.message || err), "ERROR", "err");
    }
  });
}


} catch (err) {
  // Cross-origin-safe error reporter: caught locally so we see real details
  console.error("[admin.js] throw:", err);
  var b = document.getElementById("__earlyError");
  if (!b) {
    b = document.createElement("div");
    b.id = "__earlyError";
    b.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:2147483647;padding:12px 16px;background:#3a0e0e;color:#ffd5d5;font:12px/1.5 monospace;border-bottom:2px solid #c94f4f;white-space:pre-wrap;max-height:50vh;overflow:auto";
    (document.body || document.documentElement).appendChild(b);
  }
  b.textContent = "ADMIN.JS ERROR\n\n" + (err && err.message ? err.message : err) + "\n\n" + (err && err.stack ? err.stack : "(no stack)");
}
})();
