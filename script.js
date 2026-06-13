/* ===================================================================== *
 *  KERNELAB — front-end logic
 *  Now backed by KernelabStore (localStorage). Admin panel writes,
 *  this page reads on load.
 * ===================================================================== */
const Store = window.KernelabStore;

// Pull latest published catalogue from data.json (admin publishes via GitHub API).
// If the file doesn't exist yet, falls through to local defaults.
try { Store.syncFromServerSync(); } catch (e) {}

// Real-time analytics — increments shared counter (once per browser session)
try { Store.Analytics && Store.Analytics.visitOnce(); } catch (e) {}

/* ===== 0. Maintenance gate — short-circuit everything ===== */
const __settings = Store.getSettings();
if (__settings.maintenance && __settings.maintenance.enabled) {
  const mt = document.getElementById("maintenance");
  const m = __settings.maintenance;
  if (m.title) {
    document.getElementById("mtTitle").textContent = m.title;
    document.getElementById("mtTitle").dataset.text = m.title;
  }
  if (m.message) document.getElementById("mtMsg").textContent = m.message;
  if (m.eta)     document.getElementById("mtEta").textContent = m.eta;
  mt.classList.add("active");
  document.body.classList.add("maintenance-on");
}

/* ===== 1. Background generators ===== */
function randHex() {
  return "0x" + Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, "0");
}

// Floating particles
const particlesEl = document.getElementById("particles");
for (let i = 0; i < 36; i++) {
  const p = document.createElement("span");
  p.className = "particle";
  const size = Math.random() * 4 + 1.5;
  p.style.width = size + "px"; p.style.height = size + "px";
  p.style.left = Math.random() * 100 + "vw";
  p.style.animationDuration = Math.random() * 12 + 10 + "s";
  p.style.animationDelay = -Math.random() * 20 + "s";
  particlesEl.appendChild(p);
}

// Floating code snippets in background
const bgCode = document.getElementById("bgCode");
const codeSnippets = [
  "mov rax, [rcx+0x1F8]",
  "lea r10, [rsp+0x40]",
  "call MmGetSystemRoutine",
  "jmp 0x7FF6A4001234",
  "xor rdi, rdi",
  "vpxor ymm0, ymm0, ymm0",
  "ObRegisterCallbacks",
  "PsLookupProcessByPid",
  "0x4D 0x5A 0x90 0x00",
  "ret 0xCC",
  "MiAllocateVad",
  "KiSystemCall64",
];
function spawnCodeLine() {
  const el = document.createElement("div");
  el.className = "bg-code-line";
  el.textContent = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
  el.style.left = Math.random() * 100 + "vw";
  el.style.animationDuration = (12 + Math.random() * 14) + "s";
  bgCode.appendChild(el);
  setTimeout(() => el.remove(), 28000);
}
for (let i = 0; i < 6; i++) setTimeout(spawnCodeLine, i * 1400);
setInterval(spawnCodeLine, 2200);

/* ===== 2. Hero typewriter + terminals ===== */
const lines = [
  "Kernel-Level Game Manipulation",
  "Undetected Anti-Cheat Bypass",
  "HWID Spoofing & Stream-Proof",
  "Memory-Resident Aimbot Engine",
];
const typeEl = document.getElementById("typeLine");
let lineIdx = 0, charIdx = 0, deleting = false;
function typeLoop() {
  const current = lines[lineIdx];
  if (!deleting) {
    typeEl.textContent = current.slice(0, ++charIdx);
    if (charIdx === current.length) { deleting = true; return setTimeout(typeLoop, 1600); }
  } else {
    typeEl.textContent = current.slice(0, --charIdx);
    if (charIdx === 0) { deleting = false; lineIdx = (lineIdx + 1) % lines.length; }
  }
  setTimeout(typeLoop, deleting ? 35 : 70);
}
typeLoop();

function typeTerminal(el, sequence) {
  let i = 0;
  el.innerHTML = "";
  const cursor = document.createElement("span");
  cursor.className = "term-cursor";
  cursor.innerHTML = "&nbsp;";
  function next() {
    if (i >= sequence.length) { el.appendChild(cursor); return; }
    const line = sequence[i++];
    const span = document.createElement("div");
    span.innerHTML = line.text;
    if (line.cls) span.className = line.cls;
    span.style.opacity = "0";
    el.appendChild(span);
    requestAnimationFrame(() => { span.style.transition = "opacity .25s"; span.style.opacity = "1"; });
    el.scrollTop = el.scrollHeight;
    setTimeout(next, line.delay || 360);
  }
  next();
}
const heroSeq = [
  { text: '<span class="prompt">›</span> kernelab inject --target cs2.exe' },
  { text: 'locating process ............. <span class="ok">ok</span> (PID 4821)' },
  { text: 'loading kernel driver ........ <span class="ok">signed ✓</span>' },
  { text: '<span class="warn">⚠ ANTI-CHEAT:</span> VAC + Trusted Mode' },
  { text: 'unhooking callbacks .......... <span class="ok">17 neutralized</span>' },
  { text: 'mapping game memory .......... <span class="ok">0x7FF6A4000000</span>' },
  { text: 'resolving entity list ........ <span class="ok">64 entities</span>' },
  { text: 'hooking renderer ............. <span class="ok">d3d11 present</span>' },
  { text: 'spawning aimbot routine ...... <span class="ok">online</span>' },
];
const feedSeq = [
  { text: '<span class="prompt">›</span> kernelab inject --target cs2.exe --mode kernel' },
  { text: 'locating process ................. <span class="ok">ok</span> (PID 4821)' },
  { text: 'loading driver via mapper ........ <span class="ok">kdmapper ok</span>' },
  { text: '<span class="warn">⚠ ANTI-CHEAT:</span> VAC + Trusted Mode + VACnet' },
  { text: 'unhooking ObRegisterCallbacks .... <span class="ok">3 callbacks removed</span>' },
  { text: 'patching PsSetCreateProcess ...... <span class="ok">trampoline installed</span>' },
  { text: 'mapping game memory .............. <span class="ok">0x7FF6A4000000</span>' },
  { text: 'resolving entity list ............ <span class="ok">64 entities</span>' },
  { text: 'hooking d3d11 Present ............ <span class="ok">overlay armed</span>' },
  { text: '<span class="ok">✓ AIMBOT:</span> bone=head fov=4° smooth=2.1' },
  { text: '<span class="ok">✓ ESP:</span> boxes + skeleton + distance + hp' },
  { text: '<span class="ok">✓ HWID:</span> SMBIOS + disk + MAC randomized' },
  { text: '<span class="ok">✓ STREAM-PROOF:</span> WDA_EXCLUDEFROMCAPTURE' },
  { text: 'status ........................... <span class="ok">INJECTED · UNDETECTED</span>' },
];
const termObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      if (e.target.id === "terminalBody") typeTerminal(e.target, heroSeq);
      if (e.target.id === "feedBody") typeTerminal(e.target, feedSeq);
      termObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.3 });
termObserver.observe(document.getElementById("terminalBody"));
termObserver.observe(document.getElementById("feedBody"));

/* ===== 3. Stats count-up + reveal observer ===== */
// Render real stats from store
(function renderRealStats() {
  const settings = Store.getSettings();
  const products = Store.getProducts();
  const games = Store.getGames();
  const reviews = products.reduce((s, p) => s + ((p.reviews || []).length), 0);
  const orders = Store.getOrders();
  const uniqCustomers = new Set(orders.map(o => o.email).filter(Boolean)).size;
  const launch = settings.launchDate ? new Date(settings.launchDate).getTime() : Date.now() - 240*86400e3;
  const daysOnline = Math.max(0, Math.floor((Date.now() - launch) / 86400e3));
  const stats = [
    { count: products.length,                 suffix: "",  label: "Modules available" },
    { count: games.length,                    suffix: "",  label: "Titles supported" },
    { count: reviews,                         suffix: "",  label: "Verified reviews" },
    { count: settings.stats?.uptimeDays ?? daysOnline, suffix: "+", label: "Days undetected" },
  ];
  const statsEl = document.getElementById("stats");
  statsEl.innerHTML = stats.map(s => `
    <div class="stat">
      <div class="stat-num" data-count="${s.count}" data-suffix="${s.suffix}">0</div>
      <div class="stat-label">${s.label}</div>
    </div>
  `).join("");
})();

function animateCount(el) {
  const target = Number(el.dataset.count);
  const divide = Number(el.dataset.divide || 1);
  const suffix = el.dataset.suffix || "";
  const dur = 1500, start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / dur, 1);
    const val = target * (1 - Math.pow(1 - t, 3));
    let out;
    if (divide > 1) out = (val / divide).toFixed(1);
    else if (target >= 1000) out = (val / 1000).toFixed(0) + "K";
    else out = Math.floor(val);
    el.textContent = out + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); statObserver.unobserve(e.target); } });
}, { threshold: 0.5 });
document.querySelectorAll(".stat-num[data-count]").forEach(el => statObserver.observe(el));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("revealed"); revealObserver.unobserve(e.target); } });
}, { threshold: 0.12 });
function observeReveals() {
  document.querySelectorAll(".section-head:not(.reveal), .module:not(.reveal), .step:not(.reveal), .stats:not(.reveal), .game-card:not(.reveal)")
    .forEach(el => { el.classList.add("reveal"); revealObserver.observe(el); });
}
observeReveals();

// Scroll bar + back to top
const scrollBar = document.createElement("div");
scrollBar.className = "scroll-bar";
document.body.appendChild(scrollBar);
window.addEventListener("scroll", () => {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  scrollBar.style.width = (window.scrollY / h) * 100 + "%";
});
const toTop = document.createElement("button");
toTop.className = "to-top"; toTop.innerHTML = "↑";
document.body.appendChild(toTop);
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", () => toTop.classList.toggle("show", window.scrollY > 500));

/* ===== 4. Custom crosshair cursor ===== */
const crosshair = document.getElementById("crosshair");
const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
let chX = -9999, chY = -9999, chTargetX = -9999, chTargetY = -9999;

if (isFinePointer && crosshair) {
  let chActivated = false;
  crosshair.style.opacity = "0";
  document.addEventListener("mousemove", (e) => {
    chTargetX = e.clientX; chTargetY = e.clientY;
    if (!chActivated) {
      chActivated = true;
      document.body.classList.add("crosshair-active");
      crosshair.style.opacity = "1";
    }
  });
  document.addEventListener("mouseleave", () => crosshair.style.opacity = "0");
  document.addEventListener("mouseenter", () => crosshair.style.opacity = "1");
  document.addEventListener("mousedown", () => {
    crosshair.classList.add("click");
    setTimeout(() => crosshair.classList.remove("click"), 400);
  });
  function chLoop() {
    chX += (chTargetX - chX) * 0.4;
    chY += (chTargetY - chY) * 0.4;
    crosshair.style.transform = `translate(${chX}px, ${chY}px)`;
    requestAnimationFrame(chLoop);
  }
  chLoop();
  document.addEventListener("mouseover", (e) => {
    const t = e.target;
    const interactive = t.closest && t.closest("a, button, .btn, .nav-link, .module, .step, .game-card, .lo-chip, .pp-tier, .pg-thumb, .wheel-hub, input, select, textarea");
    crosshair.classList.toggle("locked", !!interactive);
  });
} else if (crosshair) {
  crosshair.style.display = "none";
}

/* ===== 5. Welcome wheel of fortune ===== */
const welcome = document.getElementById("welcome");
const welcomeResult = document.getElementById("welcomeResult");
const wheelSvg = document.getElementById("wheelSvg");
const wheelSpin = document.getElementById("wheelSpin");
const welcomeClose = document.getElementById("welcomeClose");
const welcomeSkip = document.getElementById("welcomeSkip");
const resultNum = document.getElementById("resultNum");
const resultSuf = document.getElementById("resultSuf");
const resultCode = document.getElementById("resultCode");
const resultCopy = document.getElementById("resultCopy");

// Wheel segments — pulled from admin settings (with fallback)
const wheelSettings = Store.getSettings().wheel || {};
const wheelSegments = (wheelSettings.segments && wheelSettings.segments.length)
  ? wheelSettings.segments
  : [
      { label: "5%",       value: 5,  suffix: "%", weight: 14 },
      { label: "15%",      value: 15, suffix: "%", weight: 18 },
      { label: "10%",      value: 10, suffix: "%", weight: 18 },
      { label: "25%",      value: 25, suffix: "%", weight: 10 },
      { label: "20%",      value: 20, suffix: "%", weight: 14 },
      { label: "FREE DAY", value: 1,  suffix: "d", weight:  8 },
      { label: "30%",      value: 30, suffix: "%", weight:  6 },
      { label: "BONUS x2", value: 2,  suffix: "x", weight: 12 },
    ];

// Customizable title/desc
const wTitleEl = welcome.querySelector(".welcome-title");
const wDescEl  = welcome.querySelector(".welcome-desc");
if (wheelSettings.title) { wTitleEl.textContent = wheelSettings.title; wTitleEl.dataset.text = wheelSettings.title; }
if (wheelSettings.desc)  { wDescEl.textContent  = wheelSettings.desc; }

const WHEEL_R = 96;

function buildWheel() {
  wheelSvg.innerHTML = "";
  // Outer ring
  const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  ring.setAttribute("cx", 0); ring.setAttribute("cy", 0); ring.setAttribute("r", WHEEL_R + 2);
  ring.setAttribute("fill", "none");
  ring.setAttribute("stroke", "rgba(255,255,255,0.6)");
  ring.setAttribute("stroke-width", "1");
  wheelSvg.appendChild(ring);

  const seg = (2 * Math.PI) / wheelSegments.length;
  wheelSegments.forEach((s, i) => {
    const a1 = -Math.PI / 2 + i * seg;
    const a2 = a1 + seg;
    const x1 = Math.cos(a1) * WHEEL_R, y1 = Math.sin(a1) * WHEEL_R;
    const x2 = Math.cos(a2) * WHEEL_R, y2 = Math.sin(a2) * WHEEL_R;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M0,0 L${x1},${y1} A${WHEEL_R},${WHEEL_R} 0 0 1 ${x2},${y2} Z`);
    path.setAttribute("fill", i % 2 === 0 ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)");
    path.setAttribute("stroke", "rgba(255,255,255,0.35)");
    path.setAttribute("stroke-width", "0.5");
    wheelSvg.appendChild(path);

    // Label
    const aMid = a1 + seg / 2;
    const tx = Math.cos(aMid) * (WHEEL_R * 0.62);
    const ty = Math.sin(aMid) * (WHEEL_R * 0.62);
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", tx); text.setAttribute("y", ty);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("transform", `rotate(${(aMid * 180 / Math.PI) + 90} ${tx} ${ty})`);
    text.setAttribute("fill", "#eafff4");
    text.setAttribute("font-family", "Orbitron, sans-serif");
    text.setAttribute("font-weight", "700");
    text.setAttribute("font-size", s.label.length > 4 ? "8" : "12");
    text.setAttribute("letter-spacing", "1");
    text.style.textShadow = "0 0 6px #fff";
    text.textContent = s.label;
    wheelSvg.appendChild(text);

    // Spoke dot at outer rim
    const dx = Math.cos(a1) * (WHEEL_R - 4);
    const dy = Math.sin(a1) * (WHEEL_R - 4);
    const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    dot.setAttribute("cx", dx); dot.setAttribute("cy", dy); dot.setAttribute("r", "1.6");
    dot.setAttribute("fill", "#fff");
    wheelSvg.appendChild(dot);
  });
}
buildWheel();

function pickWeighted() {
  const total = wheelSegments.reduce((s, x) => s + x.weight, 0);
  let r = Math.random() * total;
  for (let i = 0; i < wheelSegments.length; i++) {
    r -= wheelSegments[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}
function genCode(prefix) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = prefix + "-";
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function spawnConfetti() {
  const card = document.querySelector(".welcome-card");
  if (!card) return;
  for (let i = 0; i < 36; i++) {
    const c = document.createElement("span");
    c.className = "confetti";
    const angle = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 240;
    c.style.setProperty("--cx", Math.cos(angle) * dist + "px");
    c.style.setProperty("--cy", Math.sin(angle) * dist + "px");
    c.style.setProperty("--cr", (Math.random() * 720 - 360) + "deg");
    c.style.background = Math.random() > 0.5 ? "#fff" : "#bdbdbd";
    c.style.width = (3 + Math.random() * 5) + "px";
    c.style.height = (3 + Math.random() * 8) + "px";
    c.style.animationDuration = (1 + Math.random() * 0.8) + "s";
    card.appendChild(c);
    setTimeout(() => c.remove(), 1500);
  }
}

let wheelSpinning = false;
let currentRotation = 0;
function spinWheel() {
  if (wheelSpinning) return;
  wheelSpinning = true;
  wheelSpin.disabled = true;

  const winIdx = pickWeighted();
  const seg = 360 / wheelSegments.length;
  // Pointer is at top (angle -90°); we want winning segment center under it.
  // Segments laid out clockwise starting from -90° in SVG; rotate wheel by negative.
  const winAngle = winIdx * seg + seg / 2; // center of segment, in segment coords
  // Land such that (currentRotation + extraSpin) mod 360 == 360 - winAngle
  const targetMod = (360 - winAngle) % 360;
  const extraTurns = 5 + Math.floor(Math.random() * 3); // 5-7 full turns
  const finalRotation = currentRotation + extraTurns * 360 + ((targetMod - (currentRotation % 360) + 360) % 360);
  currentRotation = finalRotation;
  wheelSvg.style.transform = `rotate(${finalRotation}deg)`;

  setTimeout(() => {
    const win = wheelSegments[winIdx];
    resultNum.textContent = win.value;
    resultSuf.textContent = win.suffix;
    resultCode.textContent = genCode("KAB");
    welcomeResult.classList.add("show");
    spawnConfetti();
    showToast(`Discount unlocked · <b>${win.label}</b>`, "BONUS");
    wheelSpinning = false;
  }, 5600);
}
wheelSpin.addEventListener("click", spinWheel);
welcomeClose.addEventListener("click", () => {
  welcome.classList.add("hidden");
  localStorage.setItem("kernelab_spun", "1");
});
welcomeSkip.addEventListener("click", () => {
  welcome.classList.add("hidden");
  localStorage.setItem("kernelab_spun", "1");
});
resultCopy.addEventListener("click", () => {
  navigator.clipboard?.writeText(resultCode.textContent).catch(() => {});
  resultCopy.textContent = "COPIED";
  setTimeout(() => resultCopy.textContent = "COPY", 1500);
});

// Show only on first visit (and only if enabled in admin)
if (localStorage.getItem("kernelab_spun") === "1" || wheelSettings.enabled === false) {
  welcome.classList.add("hidden");
}

/* ===== 6. Games grid + loadout filter ===== */
const games = Store.getGames();
const gamesGrid = document.getElementById("gamesGrid");
gamesGrid.innerHTML = games.map(g => {
  const cover = g.image
    ? `style="background-image: linear-gradient(135deg, rgba(0,0,0,0.45), rgba(0,0,0,0.65)), url('${g.image}'); background-size: cover; background-position: center;"`
    : "";
  return `
  <button class="game-card" data-game="${g.key}" type="button">
    <span class="gc-status"><span class="gc-dot"></span>${g.status}</span>
    <div class="gc-image" ${cover}>${g.image ? "" : `<div class="gc-mark">${g.short}</div>`}</div>
    <div class="gc-meta">
      <div class="gc-name">${g.name}</div>
      <div class="gc-sub">AC: ${g.ac} · TAP TO FILTER</div>
    </div>
  </button>
`;}).join("");

/* ===== 7. Modules grid (with prices) ===== */
const TIERS = Store.TIERS;
const makePrices = Store.makePrices;

const modules = Store.getProducts();

const modulesGrid = document.getElementById("modules-grid");
const loadoutFilterLabel = document.getElementById("loadoutFilterLabel");
const loadoutClear = document.getElementById("loadoutClear");
let currentFilter = "all";

function renderModules(filter = "all") {
  currentFilter = filter;
  const filteredByGame = filter === "all" ? modules : modules.filter(m => m.games.includes(filter));
  // Hide products that have no purchasable tiers
  const visible = filteredByGame.filter(m => makePrices(m).some(t => t.price > 0));
  // Sort by admin-defined sort order, then name
  const filtered = [...visible].sort((a,b) => (a.sort ?? 100) - (b.sort ?? 100) || (a.name||"").localeCompare(b.name||""));
  if (filter === "all") {
    loadoutFilterLabel.textContent = "All Games";
    loadoutClear.hidden = true;
  } else {
    const g = games.find(x => x.key === filter);
    loadoutFilterLabel.textContent = g ? g.name : filter;
    loadoutClear.hidden = false;
  }
  modulesGrid.innerHTML = filtered.map(m => {
    const allTiers = makePrices(m);
    const visibleTiers = allTiers.filter(t => t.price > 0);
    const fromPrice = visibleTiers[0] ? visibleTiers[0].price : 0;
    const tierCount = visibleTiers.length;
    const statusClass = m.status.toLowerCase();
    // Pick first IMAGE from media (or legacy images) for cover
    let coverUrl = "";
    if (Array.isArray(m.media)) {
      const firstImg = m.media.find(x => x.type === "image" && x.url);
      const firstVid = m.media.find(x => x.type === "video" && x.thumb);
      coverUrl = (firstImg && firstImg.url) || (firstVid && firstVid.thumb) || "";
    }
    if (!coverUrl && Array.isArray(m.images) && m.images[0]) coverUrl = m.images[0];
    const hasVideo = m.videoUrl && m.videoUrl.trim();
    let coverHtml = "";
    let coverStyle = "";
    if (hasVideo) {
      coverHtml = `<video class="module-video" src="${m.videoUrl}" autoplay muted loop playsinline preload="metadata"></video>`;
    } else if (coverUrl) {
      coverStyle = `style="background-image: linear-gradient(135deg, rgba(10,10,10,0.55), rgba(0,0,0,0.4)), url('${coverUrl}'); background-size: cover; background-position: center;"`;
    }
    // Auto-prepend VIDEO badge if videoUrl present
    const badges = hasVideo ? ["VIDEO", ...(m.badges || [])] : (m.badges || []);
    return `
      <div class="module" data-id="${m.id}">
        <div class="module-img" ${coverStyle}>
          ${coverHtml}
          <span class="module-status ${statusClass}"><span class="ms-dot"></span>${m.status}</span>
          <span class="module-rating">★ ${m.rating}</span>
          ${(hasVideo || coverUrl) ? "" : `<span class="module-img-mark">${m.short}</span><div class="module-img-grid"></div>`}
        </div>
        <div class="module-content">
          <div class="module-row">
            <span class="module-id">DOSSIER · ${m.id}</span>
            <span class="module-clear">CLEARANCE: ${m.clear}</span>
          </div>
          <div class="module-name">${m.name}</div>
          ${badges.length ? `<div class="module-badges">${badges.map(b => `<span class="module-badge" data-b="${b}">${b}</span>`).join("")}</div>` : ""}
          <div class="module-tags">${m.tags.map(t => `<span class="module-tag">${t}</span>`).join("")}</div>
          <div class="module-foot">
            <div class="module-price">
              <span class="module-price-from">FROM</span>
              <span class="module-price-val">$${fromPrice}</span>
            </div>
            <button class="module-view" type="button">VIEW · ${tierCount} TIERS</button>
          </div>
        </div>
      </div>
    `;
  }).join("");
  // wire clicks
  modulesGrid.querySelectorAll(".module").forEach(card => {
    card.addEventListener("click", () => openProduct(card.dataset.id));
  });
  observeReveals();
}
renderModules("all");

function activateFilter(key) {
  document.querySelectorAll(".game-card").forEach(c => c.classList.toggle("active", c.dataset.game === key));
  renderModules(key);
}

loadoutClear.addEventListener("click", () => activateFilter("all"));

// Game card click → toggle filter (click active = clear)
gamesGrid.querySelectorAll(".game-card").forEach(card => {
  card.addEventListener("click", () => {
    const key = card.dataset.game;
    if (currentFilter === key) {
      activateFilter("all");
    } else {
      activateFilter(key);
      document.getElementById("modules").scrollIntoView({ behavior: "smooth" });
    }
  });
});

/* ===== 8. Protocol ===== */
const steps = [
  { n: "01", name: "Inject",  desc: "Signed kernel driver loads via vulnerable mapper. Process attached with stripped PE headers, no module entry." },
  { n: "02", name: "Bypass",  desc: "Anti-cheat callbacks unhooked. ObRegisterCallbacks, PsSetCreate routines and integrity scans neutralized." },
  { n: "03", name: "Hook",    desc: "Game memory mapped, entity list resolved, renderer hooked. Aimbot, ESP and triggerbot routines spawned in-process." },
  { n: "04", name: "Operate", desc: "HUD active, HWID spoofed, stream-proof. All telemetry routed through encrypted side-channel. Zero-trace shutdown." },
];
document.getElementById("protocol-grid").innerHTML = steps.map(s => `
  <div class="step">
    <div class="step-num">${s.n}</div>
    <div class="step-name">${s.name}</div>
    <div class="step-desc">${s.desc}</div>
  </div>
`).join("");
observeReveals();

/* ===== 8b. Review helpers (shared by modal + testimonials) ===== */
const reviewStars = (n) => "★".repeat(n) + "☆".repeat(5 - n);
const reviewInitials = (name) => {
  const clean = name.replace(/[^A-Za-zА-Яа-я0-9]/g, "");
  return (clean.slice(0, 2) || "OP").toUpperCase();
};
const reviewAgo = (d) =>
  d === 1 ? "1 day ago" :
  d < 7   ? d + " days ago" :
  d < 14  ? "1 week ago" :
  d < 30  ? Math.floor(d / 7) + " weeks ago" :
            Math.floor(d / 30) + " month ago";

/* ===== 8c. Testimonials marquee — all reviews aggregated, dual-row scroll ===== */
const allReviews = [];
modules.forEach(m => {
  m.reviews.forEach(r => allReviews.push({ ...r, moduleId: m.id, moduleName: m.name }));
});
// Shuffle for variety
for (let i = allReviews.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [allReviews[i], allReviews[j]] = [allReviews[j], allReviews[i]];
}
const half = Math.ceil(allReviews.length / 2);
const tmRow1 = allReviews.slice(0, half);
const tmRow2 = allReviews.slice(half);

function renderReviewCards(arr) {
  return arr.map(r => `
    <div class="tm-card" data-id="${r.moduleId}" role="button" tabindex="0">
      <div class="tm-head">
        <div class="tm-avatar">${reviewInitials(r.user)}</div>
        <div class="tm-head-meta">
          <div class="tm-name">${r.user}</div>
          <div class="tm-sub">
            <span class="tm-rating">${reviewStars(r.rating)}</span>
            <span class="tm-date">${reviewAgo(r.days)}</span>
          </div>
        </div>
        <span class="tm-game">${r.game}</span>
      </div>
      <div class="tm-text">${r.text}</div>
      <div class="tm-foot">
        <span class="tm-module-tag">${r.moduleName}</span>
        <span class="tm-verified">✓ VERIFIED</span>
      </div>
    </div>
  `).join("");
}

const row1El = document.getElementById("reviewsRow1");
const row2El = document.getElementById("reviewsRow2");
// Duplicate content for seamless loop
row1El.innerHTML = renderReviewCards(tmRow1) + renderReviewCards(tmRow1);
row2El.innerHTML = renderReviewCards(tmRow2) + renderReviewCards(tmRow2);

// Click any card → open that module's modal
document.querySelectorAll(".tm-card").forEach(card => {
  card.addEventListener("click", () => openProduct(card.dataset.id));
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProduct(card.dataset.id); }
  });
});

/* ===== 9. Product modal ===== */
const productModal = document.getElementById("productModal");
const productClose = document.getElementById("productClose");
const pmName = document.getElementById("pmName");
const pmId   = document.getElementById("pmId");
const pmDesc = document.getElementById("pmDesc");
const pmFeatures = document.getElementById("pmFeatures");
const pmGames = document.getElementById("pmGames");
const pmReq = document.getElementById("pmReq");
const pmTiers = document.getElementById("pmTiers");
const pmTotal = document.getElementById("pmTotal");
const pmReviewsSummary = document.getElementById("pmReviewsSummary");
const pmReviews = document.getElementById("pmReviews");
const pgMain = document.getElementById("pgMain");
const pgThumbs = document.getElementById("pgThumbs");
const pgTag = document.getElementById("pgTag");

let activeTierIdx = 2;

function openProduct(id) {
  const m = modules.find(x => x.id === id);
  if (!m) return;
  // Track click for analytics — local + global
  try { Store.pushClick(id); } catch (e) {}
  try { Store.Analytics && Store.Analytics.click(id); } catch (e) {}

  pmName.textContent = m.name;
  pmId.textContent   = `DOSSIER · ${m.id} · CLEARANCE ${m.clear}`;
  pmDesc.textContent = m.desc;
  // Feature categories (expandable)
  const catMeta = {
    aim:    { name: "AIM",    icon: "◎" },
    visual: { name: "VISUAL", icon: "◇" },
    misc:   { name: "MISC",   icon: "▤" },
  };
  const order = ["aim", "visual", "misc"];
  const cats = order.filter(k => m.features[k] && m.features[k].length);
  pmFeatures.innerHTML = cats.map(k => `
    <div class="pi-cat" data-cat="${k}">
      <button class="pi-cat-head" type="button">
        <span class="pi-cat-icon">${catMeta[k].icon}</span>
        <span class="pi-cat-name">${catMeta[k].name}</span>
        <span class="pi-cat-count">${m.features[k].length}</span>
        <span class="pi-cat-arrow">›</span>
      </button>
      <div class="pi-cat-body">
        <ul class="pi-cat-list">
          ${m.features[k].map(f => `<li>${f}</li>`).join("")}
        </ul>
      </div>
    </div>
  `).join("");
  pmFeatures.querySelectorAll(".pi-cat-head").forEach(btn => {
    btn.addEventListener("click", () => btn.parentElement.classList.toggle("open"));
  });
  pmGames.innerHTML = m.games.map(k => {
    const g = games.find(x => x.key === k);
    return `<span>${g ? g.short : k.toUpperCase()}</span>`;
  }).join("");
  pmReq.innerHTML = `
    <tr><td>OS</td><td>${m.req.os}</td></tr>
    <tr><td>CPU</td><td>${m.req.cpu || "—"}</td></tr>
    <tr><td>RAM</td><td>${m.req.ram || "—"}</td></tr>
    <tr><td>Driver</td><td>${m.req.driver || "—"}</td></tr>
    <tr><td>Network</td><td>${m.req.net || "—"}</td></tr>
  `;

  // Reviews
  const totalReviews = m.reviews.length * 31 + 47; // synthesised total > sample
  const fullStars = Math.round(m.rating);
  pmReviewsSummary.innerHTML = `
    <div class="pi-rev-avg">${m.rating.toFixed(1)}</div>
    <div class="pi-rev-meta-block">
      <div class="pi-rev-stars">${reviewStars(fullStars)}</div>
      <div class="pi-rev-count">Based on <b>${totalReviews}</b> verified customers</div>
    </div>
    <div class="pi-rev-bar"><span style="width:${(m.rating / 5) * 100}%"></span></div>
  `;
  pmReviews.innerHTML = m.reviews.map(r => `
    <div class="pi-review">
      <div class="pi-rev-head">
        <div class="pi-rev-avatar">${reviewInitials(r.user)}</div>
        <div class="pi-rev-meta">
          <div class="pi-rev-name">${r.user}
            <span class="pi-rev-verified">VERIFIED</span>
            <span class="pi-rev-game">${r.game}</span>
          </div>
          <div class="pi-rev-sub">
            <span class="pi-rev-rating">${reviewStars(r.rating)}</span>
            <span class="pi-rev-date">${reviewAgo(r.days)}</span>
          </div>
        </div>
      </div>
      <div class="pi-rev-text">${r.text}</div>
    </div>
  `).join("");

  // Pricing tiers — only show purchasable ones (price > 0)
  const tiers = makePrices(m).filter(t => t.price > 0);
  if (!tiers.length) {
    pmTiers.innerHTML = `<div class="ape-hint" style="text-align:center;padding:20px">All tiers currently unavailable.</div>`;
    pmTotal.textContent = "—";
    activeTierIdx = 0;
  } else {
    activeTierIdx = Math.min(2, tiers.length - 1); // default to 30-days if available, else first
    pmTiers.innerHTML = tiers.map((t, i) => `
    <button class="pp-tier ${i === activeTierIdx ? "active" : ""}" data-idx="${i}" type="button">
      <span class="pp-tier-radio"></span>
      <span class="pp-tier-info">
        <span class="pp-tier-dur">${t.dur}</span>
        ${t.saving ? `<span class="pp-tier-saving">SAVE ${t.saving}%</span>` : `<span class="pp-tier-saving">BASE TIER</span>`}
      </span>
      <span class="pp-tier-price">$${t.price}</span>
    </button>
    `).join("");
    pmTotal.textContent = "$" + tiers[activeTierIdx].price;
    pmTiers.querySelectorAll(".pp-tier").forEach(btn => {
      btn.addEventListener("click", () => {
        activeTierIdx = Number(btn.dataset.idx);
        pmTiers.querySelectorAll(".pp-tier").forEach(b => b.classList.toggle("active", b === btn));
        pmTotal.textContent = "$" + tiers[activeTierIdx].price;
      });
    });
  }

  // Gallery — supports images (data URLs) and videos (IDB blob URLs).
  // Build unified media list: prefer m.media if present, fall back to m.images.
  let media = [];
  if (Array.isArray(m.media) && m.media.length) {
    media = m.media.slice();
  } else if (Array.isArray(m.images) && m.images.length) {
    media = m.images.map(url => ({ type: "image", url }));
  }
  const slotCount = media.length || 4;
  // Resolve any video blob URLs from IDB
  const objectUrls = []; // for cleanup on close
  async function resolveItem(item) {
    if (item.type === "video" && item.id) {
      const blobUrl = await Store.Media.getURL(item.id);
      if (blobUrl) objectUrls.push(blobUrl);
      return { ...item, src: blobUrl, thumb: item.thumb || null };
    }
    return { ...item, src: item.url || "" };
  }

  async function setMain(idx) {
    pgTag.textContent = `PREVIEW · ${String(idx + 1).padStart(2, "0")}/${String(slotCount).padStart(2, "0")}`;
    pgMain.querySelector(".pg-placeholder").style.display = "none";
    // Remove any previous video element
    const oldVid = pgMain.querySelector("video");
    if (oldVid) oldVid.remove();
    if (!media.length) {
      pgMain.style.backgroundImage = "";
      pgMain.querySelector(".pg-placeholder").style.display = "";
      pgMain.querySelector(".pg-placeholder").innerHTML = `<span class="pg-ph-text">${m.name.toUpperCase()}</span>`;
      return;
    }
    const item = await resolveItem(media[idx]);
    if (item.type === "video") {
      pgMain.style.backgroundImage = "";
      const v = document.createElement("video");
      v.src = item.src; v.controls = true; v.preload = "metadata"; v.playsInline = true;
      v.className = "pg-video";
      pgMain.appendChild(v);
    } else {
      pgMain.style.backgroundImage = `url('${item.src}')`;
      pgMain.style.backgroundSize = "cover";
      pgMain.style.backgroundPosition = "center";
    }
  }
  setMain(0);
  // Build thumbnails
  pgThumbs.innerHTML = "";
  if (!media.length) {
    pgThumbs.innerHTML = ["FRAME 01","FRAME 02","FRAME 03","FRAME 04"].map((t,i)=>
      `<button class="pg-thumb ${i === 0 ? "active" : ""}" data-idx="${i}" type="button">${t}</button>`
    ).join("");
  } else {
    media.forEach((item, i) => {
      const btn = document.createElement("button");
      btn.className = "pg-thumb" + (i === 0 ? " active" : "");
      btn.dataset.idx = i;
      btn.type = "button";
      if (item.type === "video") {
        btn.classList.add("video");
        const thumb = item.thumb || "";
        if (thumb) btn.style.backgroundImage = `url('${thumb}')`;
        btn.innerHTML = `<span class="pg-thumb-play">▶</span>`;
      } else {
        btn.style.backgroundImage = `url('${item.url}')`;
      }
      btn.style.backgroundSize = "cover";
      btn.style.backgroundPosition = "center";
      pgThumbs.appendChild(btn);
    });
  }
  pgThumbs.querySelectorAll(".pg-thumb").forEach(t => {
    t.addEventListener("click", () => {
      const idx = Number(t.dataset.idx);
      pgThumbs.querySelectorAll(".pg-thumb").forEach(x => x.classList.toggle("active", x === t));
      setMain(idx);
      pgMain.style.opacity = "0.4";
      setTimeout(() => pgMain.style.opacity = "1", 180);
    });
  });

  productModal.classList.add("open");
  document.body.style.overflow = "hidden";
  // Cleanup blob URLs when modal closes
  productModal._cleanupUrls = () => {
    objectUrls.forEach(u => URL.revokeObjectURL(u));
    objectUrls.length = 0;
  };
  // Wire PURCHASE → opens payment modal (only if there's a purchasable tier)
  document.getElementById("pmBuy").onclick = () => {
    if (!tiers.length) {
      showToast("This product has no purchasable tiers configured.", "WARN");
      return;
    }
    openPayment(m, tiers[activeTierIdx]);
  };
}
function closeProduct() {
  productModal.classList.remove("open");
  // Stop any playing video and free blob URLs
  const v = productModal.querySelector("video");
  if (v) { v.pause(); v.removeAttribute("src"); v.load(); v.remove(); }
  if (productModal._cleanupUrls) productModal._cleanupUrls();
  document.body.style.overflow = "";
}
productClose.addEventListener("click", closeProduct);
productModal.querySelector(".product-backdrop").addEventListener("click", closeProduct);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && productModal.classList.contains("open")) closeProduct(); });

/* ===== 10. Toasts + purchase ticker + live customer counter ===== */
const toastsEl = document.getElementById("toasts");
function showToast(msg, tag, type = "") {
  if (!toastsEl) return;
  const t = document.createElement("div");
  t.className = "toast" + (type ? " " + type : "");
  t.innerHTML = `<span class="tdot-mini"></span><span class="toast-msg">${msg}</span><span class="toast-tag">${tag}</span>`;
  toastsEl.appendChild(t);
  setTimeout(() => t.remove(), 5200);
  while (toastsEl.children.length > 4) toastsEl.firstChild.remove();
}
const toastPool = [
  { msg: "Driver loaded · <b>kdmapper</b>",          tag: "RING0" },
  { msg: "VAC callbacks unhooked · <b>3 removed</b>", tag: "BYPASS" },
  { msg: "Aimbot armed · <b>FOV 4°</b>",             tag: "AIMBOT" },
  { msg: "ESP overlay rendered · <b>d3d11</b>",      tag: "RENDER" },
  { msg: "HWID randomized · <b>SMBIOS+DISK+MAC</b>", tag: "SPOOF" },
  { msg: "Stream-proof active · <b>OBS blind</b>",   tag: "STEALTH" },
  { msg: "Trigger delay · <b>2.4ms variance</b>",    tag: "TRIGGER" },
];
let toastIdx = 0;
function nextToast() {
  const t = toastPool[toastIdx % toastPool.length];
  showToast(t.msg, t.tag);
  toastIdx++;
}
setTimeout(nextToast, 2200);
setInterval(nextToast, 6500);

// Live customer counter (kept for potential reuse, no DOM target now)
let customers = 2300 + Math.floor(Math.random() * 400);

// Recent purchase ticker — disabled (markup removed)
const ticker = null;

/* ===== 11. Easter egg — type "kernel" anywhere ===== */
const secret = "kernel";
let secretBuf = "";
window.addEventListener("keydown", (e) => {
  if (e.key.length !== 1) return;
  secretBuf += e.key.toLowerCase();
  if (secretBuf.length > secret.length) secretBuf = secretBuf.slice(-secret.length);
  if (secretBuf === secret) {
    secretBuf = "";
    triggerSecret();
  }
});
function triggerSecret() {
  showToast("Secret access · <b>CUSTOMER MODE</b>", "ROOT");
  document.body.animate(
    [{ filter: "invert(1) hue-rotate(0deg)" }, { filter: "invert(0) hue-rotate(0deg)" }],
    { duration: 1100, easing: "ease-out" }
  );
  // Brief code rain burst
  for (let i = 0; i < 20; i++) setTimeout(spawnCodeLine, i * 60);
}


/* ===================================================================== *
 * 11. Payment modal — checkout flow
 * ===================================================================== */
const paymentModal = document.getElementById("paymentModal");
const paymentClose = document.getElementById("paymentClose");
const paymentCancel = document.getElementById("paymentCancel");
const payPlan   = document.getElementById("payPlan");
const payPrice  = document.getElementById("payPrice");
const payEmail  = document.getElementById("payEmail");
const payPromo  = document.getElementById("payPromo");
const promoApply = document.getElementById("promoApply");
const promoStatus = document.getElementById("promoStatus");

let currentPay = { product: null, tier: null, basePrice: 0, finalPrice: 0, discount: 0 };

function openPayment(product, tier) {
  currentPay = { product, tier, basePrice: tier.price, finalPrice: tier.price, discount: 0 };
  payPlan.textContent  = tier.dur;
  payPrice.textContent = "$" + tier.price;
  payPromo.value = "";
  promoStatus.textContent = "";
  promoStatus.className = "promo-status";

  // Show only payment methods configured for this tier (or fall back to global if tier has none)
  const settings = Store.getSettings();
  const tierLinks = (tier && tier.links) || {};
  const ALL = ["ru","eu","ltc","btc"];
  const tierConfigured = ALL.filter(m => tierLinks[m] && tierLinks[m].trim());
  const visible = tierConfigured.length
    ? tierConfigured
    : ALL.filter(m => settings.paymentLinks && settings.paymentLinks[m] && settings.paymentLinks[m].trim());
  document.querySelectorAll(".pay-method").forEach(btn => {
    btn.style.display = visible.includes(btn.dataset.method) ? "" : "none";
  });

  paymentModal.classList.add("open");
  document.body.style.overflow = "hidden";
}
function closePayment() {
  paymentModal.classList.remove("open");
  if (!productModal.classList.contains("open")) document.body.style.overflow = "";
}
paymentClose.addEventListener("click", closePayment);
paymentCancel.addEventListener("click", closePayment);
paymentModal.querySelector(".payment-backdrop").addEventListener("click", closePayment);
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && paymentModal.classList.contains("open")) closePayment();
});

// Promo code
promoApply.addEventListener("click", () => {
  const code = (payPromo.value || "").trim().toUpperCase();
  if (!code) return;
  const settings = Store.getSettings();
  const codes = settings.discountCodes || {};
  if (codes[code]) {
    const pct = codes[code];
    currentPay.discount = pct;
    currentPay.finalPrice = Math.round(currentPay.basePrice * (1 - pct / 100));
    payPrice.textContent = "$" + currentPay.finalPrice;
    promoStatus.textContent = `✓ ${pct}% off applied`;
    promoStatus.className = "promo-status ok";
    showToast(`Promo applied · <b>−${pct}%</b>`, "PROMO");
  } else {
    promoStatus.textContent = "✗ Invalid or expired code";
    promoStatus.className = "promo-status err";
    currentPay.discount = 0;
    currentPay.finalPrice = currentPay.basePrice;
    payPrice.textContent = "$" + currentPay.basePrice;
  }
});

// Method selection → record order + redirect to payment URL
document.querySelectorAll(".pay-method").forEach(btn => {
  btn.addEventListener("click", () => {
    if (!currentPay.product) return;
    const method = btn.dataset.method;
    const email = (payEmail.value || "").trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      payEmail.classList.add("err");
      payEmail.focus();
      setTimeout(() => payEmail.classList.remove("err"), 1500);
      showToast("Email required", "ERROR", "err");
      return;
    }
    // Record order
    const order = {
      id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      ts: Date.now(),
      productId: currentPay.product.id,
      tier: currentPay.tier.dur,
      amount: currentPay.finalPrice,
      email,
      method,
      discount: currentPay.discount,
      status: "pending",
    };
    try { Store.pushOrder(order); } catch (e) {}
    showToast(`Order ${order.id} created · <b>${method.toUpperCase()}</b>`, "PAY");
    // Per-tier per-method link → fall back to global template
    const settings = Store.getSettings();
    const tierLink = currentPay.tier && currentPay.tier.links && currentPay.tier.links[method];
    const tmpl = tierLink || (settings.paymentLinks && settings.paymentLinks[method]) || "";
    if (tmpl) {
      const url = tmpl
        .replace("{id}", encodeURIComponent(currentPay.product.id))
        .replace("{tier}", encodeURIComponent(currentPay.tier.dur))
        .replace("{amount}", encodeURIComponent(currentPay.finalPrice))
        .replace("{email}", encodeURIComponent(email))
        .replace("{order}", encodeURIComponent(order.id));
      window.open(url, "_blank", "noopener");
    } else {
      showToast("No payment URL configured for this method/tier", "WARN");
    }
    // Brief success animation then close
    btn.classList.add("clicked");
    setTimeout(() => {
      btn.classList.remove("clicked");
      closePayment();
    }, 600);
  });
});


/* ===================================================================== *
 * 12. Contact section + footer links (driven by admin settings)
 * ===================================================================== */
(function renderContactAndLinks() {
  const s = Store.getSettings();
  const social = s.social || {};
  const legal = s.legal || {};

  // Hero badge — real days online
  const launch = s.launchDate ? new Date(s.launchDate).getTime() : Date.now() - 240*86400e3;
  const daysOnline = Math.max(0, Math.floor((Date.now() - launch) / 86400e3));
  const badge = document.querySelector(".hero-badge");
  if (badge) badge.innerHTML = `<span class="pulse-dot"></span> CLASSIFIED ENGINE · UNDETECTED <b>${daysOnline}+</b> DAYS`;

  const grid = document.getElementById("contactGrid");
  if (grid) {
    const cards = [];
    if (social.discord) cards.push({
      url: social.discord, platform: "DISCORD",
      handle: social.discordHandle || social.discord.replace(/^https?:\/\//, ""),
      icon: "▣", sub: "Live chat · 24/7 ops support",
    });
    if (social.telegram) cards.push({
      url: social.telegram, platform: "TELEGRAM",
      handle: social.telegramHandle || social.telegram.replace(/^https?:\/\//, ""),
      icon: "◬", sub: "Instant DM · keys & support",
    });
    grid.innerHTML = cards.map(c => `
      <a class="contact-card" href="${c.url}" target="_blank" rel="noopener">
        <div class="cc-icon">${c.icon}</div>
        <div class="cc-meta">
          <div class="cc-platform">${c.platform}</div>
          <div class="cc-handle">${c.handle}</div>
          <div class="cc-sub">${c.sub}</div>
        </div>
        <div class="cc-arrow">›</div>
      </a>
    `).join("") || `<p class="ape-hint" style="grid-column:1/-1;text-align:center">Contact channels not configured.</p>`;
  }

  const fl = document.getElementById("footerLinks");
  if (fl) {
    const items = [];
    if (legal.faqUrl)     items.push(`<a href="#faq" data-legal="faq">FAQ</a>`);
    if (legal.termsUrl)   items.push(`<a href="#terms" data-legal="terms">TERMS</a>`);
    if (legal.privacyUrl && legal.privacyUrl !== legal.termsUrl) items.push(`<a href="#privacy" data-legal="privacy">PRIVACY</a>`);
    if (social.discord)   items.push(`<a href="${social.discord}" target="_blank" rel="noopener">DISCORD</a>`);
    if (social.telegram)  items.push(`<a href="${social.telegram}" target="_blank" rel="noopener">TELEGRAM</a>`);
    fl.innerHTML = items.join('<span class="fl-sep">·</span>');
    fl.querySelectorAll("[data-legal]").forEach(a => a.addEventListener("click", e => {
      e.preventDefault();
      if (window.openLegalModal) window.openLegalModal(a.dataset.legal);
    }));
  }
})();


/* ===================================================================== *
 * 13. Legal modal (FAQ / Terms / Privacy) — opens from footer links
 * ===================================================================== */
(function setupLegalModal() {
  const modal = document.getElementById("legalModal");
  if (!modal) return;
  const titleEl  = document.getElementById("legalTitle");
  const kickerEl = document.getElementById("legalKicker");
  const bodyEl   = document.getElementById("legalBody");
  const closeBtn = document.getElementById("legalClose");
  const backdrop = modal.querySelector(".payment-backdrop");

  function escHtml(t) { return String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;"); }
  function fmtBlock(t) { return escHtml(t).replace(/\n\n/g,"</p><p>").replace(/\n/g,"<br>"); }

  function renderFaq(s) {
    const faq = s.faq || [];
    bodyEl.innerHTML = `<div class="faq-list">${
      faq.map((item, i) => `
        <div class="faq-item" data-i="${i}">
          <button class="faq-q" type="button">
            <span class="faq-num">${String(i+1).padStart(2,"0")}</span>
            <span class="faq-q-text">${escHtml(item.q)}</span>
            <span class="faq-arrow">›</span>
          </button>
          <div class="faq-a"><div class="faq-a-inner">${escHtml(item.a).replace(/\n/g,"<br>")}</div></div>
        </div>
      `).join("") || `<p class="ape-hint" style="text-align:center;padding:30px">No questions configured yet.</p>`
    }</div>`;
    bodyEl.querySelectorAll(".faq-q").forEach(b => b.addEventListener("click", () => b.parentElement.classList.toggle("open")));
  }

  window.openLegalModal = function (type) {
    const s = Store.getSettings();
    if (type === "faq") {
      kickerEl.textContent = "// FREQUENTLY ASKED";
      titleEl.textContent  = "FAQ";
      renderFaq(s);
    } else if (type === "terms") {
      kickerEl.textContent = "// LEGAL · TERMS";
      titleEl.textContent  = "Terms of Service";
      bodyEl.innerHTML = `<article class="legal-content active"><p>${fmtBlock(s.terms)}</p></article>`;
    } else if (type === "privacy") {
      kickerEl.textContent = "// LEGAL · PRIVACY";
      titleEl.textContent  = "Privacy Policy";
      bodyEl.innerHTML = `<article class="legal-content active"><p>${fmtBlock(s.privacy)}</p></article>`;
    } else { return; }
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    bodyEl.scrollTop = 0;
  };
  function close() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  }
  closeBtn.addEventListener("click", close);
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal.classList.contains("open")) close();
  });

  // Open via hash on initial load (e.g. /#faq)
  function openFromHash() {
    const h = (location.hash || "").replace("#", "");
    if (h === "faq" || h === "terms" || h === "privacy") {
      window.openLegalModal(h);
      // strip hash so re-clicks fire properly
      history.replaceState(null, "", location.pathname + location.search);
    }
  }
  openFromHash();
  window.addEventListener("hashchange", openFromHash);
})();
