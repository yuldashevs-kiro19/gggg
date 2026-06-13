/* ===================================================================== *
 *  KERNELAB Store — shared data layer (main site + admin panel)
 *  Persists products, games, orders, clicks, settings to localStorage.
 *  On first load seeds from DEFAULTS (also generates fake history so the
 *  admin dashboard is not empty).
 * ===================================================================== */
(function () {
  const KEYS = {
    products: "kernelab_products",
    games:    "kernelab_games",
    orders:   "kernelab_orders",
    clicks:   "kernelab_clicks",
    settings: "kernelab_settings",
    admin:    "kernelab_admin_pass",
    seeded:   "kernelab_seeded_v2",
    seededV1: "kernelab_seeded_v1",
  };

  function readJSON(k, fallback) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function writeJSON(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { console.error("[store] write failed:", e); return false; }
  }

  /* ===== DEFAULTS ===== */
  const DEFAULT_GAMES = [
    { key: "cs2",      name: "Counter-Strike 2",   short: "CS2",   ac: "VAC + Trusted",     status: "UNDETECTED" },
    { key: "rust",     name: "Rust",               short: "RUST",  ac: "EAC",               status: "UNDETECTED" },
    { key: "apex",     name: "Apex Legends",       short: "APEX",  ac: "EAC",               status: "UNDETECTED" },
    { key: "valorant", name: "Valorant",           short: "VAL",   ac: "Vanguard",          status: "UPDATING" },
    { key: "fortnite", name: "Fortnite",           short: "FN",    ac: "EAC + BattlEye",    status: "UNDETECTED" },
    { key: "tarkov",   name: "Escape from Tarkov", short: "EFT",   ac: "BattlEye",          status: "UNDETECTED" },
    { key: "pubg",     name: "PUBG",               short: "PUBG",  ac: "BattlEye",          status: "UNDETECTED" },
    { key: "cod",      name: "Call of Duty",       short: "CoD",   ac: "Ricochet (kernel)", status: "UNDETECTED" },
    { key: "dayz",     name: "DayZ",               short: "DAYZ",  ac: "BattlEye",          status: "UNDETECTED" },
    { key: "gta",      name: "GTA V Online",       short: "GTA",   ac: "BattleEye",         status: "UNDETECTED" },
  ];

  const DEFAULT_PRODUCTS = [
    {
      id: "KAB-001", clear: "TS", base: 6, name: "Aimbot Engine", short: "AIMBOT",
      status: "POPULAR", rating: 4.9,
      desc: "Predictive aim with bone selection, FOV control, smoothing curves and recoil compensation. Frame-perfect target acquisition.",
      tags: ["PREDICTION","BONE SELECT","RECOIL"],
      games: ["cs2","apex","fortnite","tarkov","pubg","cod","valorant"],
      features: {
        aim: ["Predictive lead aim with velocity tracking","Per-bone selection (head/chest/pelvis)","Adjustable FOV cone (0.5° – 180°)","Smoothing curve editor","Recoil compensation per weapon","Visibility & friendly checks","Humanizer with delay variance"],
        misc: ["Hotkey toggle / aim-assist mode","Per-game config profiles"],
      },
      req: { os: "Windows 10/11 x64", cpu: "Intel/AMD with SMT", ram: "8 GB", driver: "UEFI Secure Boot OFF", net: "5 Mbps stable" },
      images: [],
      reviews: [
        { user: "shadow_op77", rating: 5, game: "CS2", days: 3, text: "Smoothing curves are insane. Set FOV 4° on CS2, it doesn't snap, just glides. Won every aim duel last week. Spectators don't suspect a thing." },
        { user: "Frost_RU", rating: 5, game: "EFT", days: 7, text: "Лучший аимбот что я пробовал. На Тарковe prediction отрабатывает идеально, хедшот на 200 метрах без шансов. Раньше юзал другой сервис — небо и земля." },
        { user: "venom_x", rating: 5, game: "APEX", days: 14, text: "Took some time to dial in the smoothing curve but once you get it it's god mode. 60+ hours on Apex, zero flags." },
        { user: "kek_player", rating: 4, game: "VAL", days: 4, text: "Норм, работает чётко. Хотелось бы готовых пресетов под каждое оружие из коробки, а не настраивать с нуля." },
        { user: "apex_main99", rating: 5, game: "APEX", days: 5, text: "Humanizer is what sells it for me. Random delay variance makes my clips look completely organic. No bans across 3 accounts." },
      ]
    },
    {
      id: "KAB-002", clear: "S", base: 5, name: "ESP / Wallhack", short: "ESP",
      status: "UNDETECTED", rating: 4.8,
      desc: "Entity boxes, skeleton lines, distance, health and weapon overlays rendered through the game's own pipeline.",
      tags: ["BOXES","SKELETON","DISTANCE"],
      games: ["cs2","apex","fortnite","tarkov","pubg","cod","valorant","rust","dayz"],
      features: {
        visual: ["2D / 3D entity boxes","Skeleton bone lines","Distance meter (m)","Health & armor bars","Weapon & ammo readout","Snapline / crosshair","Loot ESP (Tarkov, DayZ, Rust)","Customizable opacity & color"],
        misc: ["Per-team / per-class filters","Hotkey toggle"],
      },
      req: { os: "Windows 10/11 x64", cpu: "Quad-core 2.5+ GHz", ram: "8 GB", driver: "UEFI Secure Boot OFF", net: "—" },
      images: [],
      reviews: [
        { user: "wallseer", rating: 5, game: "CS2", days: 2, text: "Skeleton lines + distance meter is the perfect combo. Zero FPS overhead, runs alongside my 240Hz config flawlessly." },
        { user: "vyzhivshiy_RU", rating: 5, game: "EFT", days: 8, text: "На Таркове с loot ESP теперь не пропускаю ни одного шмота. Цвета настраиваются под себя, можно отключить мусор и видеть только лут от LL3+." },
        { user: "spec_ops", rating: 4, game: "PUBG", days: 6, text: "Boxes are crisp, no flicker. Could use more font options for the distance text but otherwise rock solid." },
        { user: "leha_pro", rating: 5, game: "RUST", days: 3, text: "Хорошо что есть friendly фильтр, тиммейты не палят когда смотрят за плечо. На Расте видно всё через стены." },
        { user: "streamer_404", rating: 5, game: "VAL", days: 14, text: "Stream-proof out of the box because it renders through d3d. My Twitch clips look 100% legit. Insane work." },
      ]
    },
    {
      id: "KAB-003", clear: "S", base: 5, name: "Triggerbot", short: "TRIGGER",
      status: "UNDETECTED", rating: 4.7,
      desc: "Sub-millisecond fire-on-target with hitbox filtering, burst control and humanized delay variance.",
      tags: ["INSTANT","HITBOX","HUMANIZED"],
      games: ["cs2","apex","fortnite","valorant","cod","pubg"],
      features: {
        aim: ["Fire on visible target","Hitbox filter (head only / any)","Burst-fire mode","Humanized delay (1–80 ms)","Distance limit slider"],
        misc: ["Toggle / hold hotkey","Friendly / teammate filter"],
      },
      req: { os: "Windows 10/11 x64", cpu: "Any modern CPU", ram: "4 GB", driver: "—", net: "—" },
      images: [],
      reviews: [
        { user: "fastfingers", rating: 5, game: "CS2", days: 1, text: "Sub-ms reaction, hitbox filter set to head-only is brutal. AWP one-taps every time someone peeks." },
        { user: "krit_4ik", rating: 5, game: "CS2", days: 4, text: "Burst режим топ для AK, спрей вообще не нужен. Просто наводишь и кликаешь — два в голову." },
        { user: "vault_op", rating: 5, game: "APEX", days: 7, text: "Humanized delay keeps spectators guessing. 30ms variance is the sweet spot, looks like normal reaction." },
        { user: "ghost_ru", rating: 4, game: "APEX", days: 5, text: "Триггер иногда срабатывает на тиммейтов в Apex когда они в куче, friendly filter надо подкрутить. В остальном огонь." },
      ]
    },
    {
      id: "KAB-004", clear: "TS", base: 8, name: "HWID Spoofer", short: "HWID",
      status: "UNDETECTED", rating: 4.9,
      desc: "Disk serials, MAC, SMBIOS, GPU and TPM identifiers randomized at boot. Survives full reinstall and ban waves.",
      tags: ["SMBIOS","DISK","MAC","TPM"],
      games: ["cs2","apex","fortnite","tarkov","pubg","cod","valorant","rust","dayz","gta"],
      features: {
        misc: ["SMBIOS / DMI table spoof","Disk serial number rewrite","MAC address randomization","GPU / monitor EDID spoof","TPM 2.0 attestation patch","Persistent across reboots","One-click reset to vanilla","Pre-injection cleaner"],
      },
      req: { os: "Windows 10/11 x64", cpu: "—", ram: "—", driver: "Disable BitLocker", net: "—" },
      images: [],
      reviews: [
        { user: "phoenix_98", rating: 5, game: "APEX", days: 14, text: "Got hwid banned in Apex, ran the spoofer + cleaner, made new account, 3 weeks in zero issues. Money well spent." },
        { user: "survivor_msk", rating: 5, game: "RUST", days: 30, text: "Спас аккаунт после волны банов в Расте. Пересоздал стим, спокойно играю месяц. Раз в неделю прогоняю reset для надёжности." },
        { user: "val_op", rating: 5, game: "VAL", days: 7, text: "TPM 2.0 patch is the missing piece nobody else has. Finally Vanguard-ready spoofer that actually works." },
        { user: "admin_root", rating: 5, game: "CS2", days: 21, text: "Работает чётко, пришлось отключить BitLocker как в инструкции. Один клик — и SMBIOS+disk+MAC рандом. Всё." },
      ]
    },
    {
      id: "KAB-005", clear: "TS", base: 10, name: "Anti-Cheat Bypass", short: "BYPASS",
      status: "UPDATING", rating: 4.6,
      desc: "Kernel callbacks neutralized for EAC, BattlEye, Vanguard and FACEIT. Manual mapping with stripped PE headers.",
      tags: ["EAC","BE","VANGUARD","FACEIT"],
      games: ["cs2","apex","fortnite","tarkov","pubg","cod","valorant","rust","dayz"],
      features: {
        misc: ["Kernel manual mapper","Stripped PE headers","Callback unhooking (Ob/Ps/Cm)","Trusted-mode evasion","Dump prevention","Memory integrity emulation","Per-AC tuned profiles","Stealth shutdown"],
      },
      req: { os: "Windows 10/11 x64", cpu: "—", ram: "8 GB", driver: "Test-signing OR vuln driver", net: "—" },
      images: [],
      reviews: [
        { user: "lowlevel", rating: 5, game: "EFT", days: 5, text: "Manual mapper + stripped headers as advertised. Two weeks running EAC titles back to back, zero detections, no kicks." },
        { user: "kernel_man", rating: 5, game: "CS2", days: 7, text: "Профили под каждый AC — реально удобно. Переключаешься между CS2 / Apex / Tarkov без перенастройки." },
        { user: "ring0_op", rating: 4, game: "VAL", days: 1, text: "Updating to v3 right now, support said 24-48h ETA on Vanguard build. Hoping it lands before weekend grind." },
        { user: "moscow_op", rating: 5, game: "CS2", days: 14, text: "Обход FACEIT клиента работает, но требует точной настройки. Саппорт за час всё разрулил по тимспику. Респект." },
      ]
    },
    {
      id: "KAB-006", clear: "S", base: 4, name: "Stream Proof", short: "STREAM",
      status: "UNDETECTED", rating: 4.8,
      desc: "Overlays invisible to OBS, Discord, NVIDIA ShadowPlay and Windows Game Bar. Hardware-backed window exclusion.",
      tags: ["OBS","DISCORD","SHADOWPLAY"],
      games: ["cs2","apex","fortnite","valorant","cod","pubg","rust"],
      features: {
        visual: ["WDA_EXCLUDEFROMCAPTURE","OBS Studio invisible","Discord screen-share invisible","NVIDIA ShadowPlay invisible","Windows Game Bar invisible","Replay Buffer safe"],
        misc: ["Multi-monitor handled","Auto-detect capture sources"],
      },
      req: { os: "Windows 10 1903+ x64", cpu: "—", ram: "4 GB", driver: "—", net: "—" },
      images: [],
      reviews: [
        { user: "twitch_op", rating: 5, game: "CS2", days: 6, text: "Streamed 4 hours on Twitch with the cheat running. Chat sees a clean game. Insane piece of tech for the price." },
        { user: "gigachad_ru", rating: 5, game: "APEX", days: 7, text: "Discord screen-share не палит вообще. Тиммейты в шоке как я так играю, думают руки золотые." },
        { user: "recordops", rating: 5, game: "PUBG", days: 4, text: "WDA flag is solid. ShadowPlay replays come out clean every single time. No more deleting clips." },
        { user: "ozzy_ru", rating: 5, game: "VAL", days: 14, text: "Один раз словил запись через GameBar — тех поддержка за пару часов выкатила фикс. Вот это сервис." },
      ]
    },
    {
      id: "KAB-007", clear: "C", base: 3, name: "No Recoil & No Spread", short: "NORECOIL",
      status: "NEW", rating: 4.7,
      desc: "Zero spray pattern, zero bullet spread, per-weapon profiles. Compatible with anti-cheat heuristic checks.",
      tags: ["RECOIL","SPREAD","PROFILES"],
      games: ["cs2","apex","fortnite","cod","pubg","rust"],
      features: {
        aim: ["Per-weapon recoil tables","Bullet spread = 0","Configurable strength","Auto profile per game"],
        misc: ["Hotkey toggle"],
      },
      req: { os: "Windows 10/11 x64", cpu: "—", ram: "—", driver: "—", net: "—" },
      images: [],
      reviews: [
        { user: "pix_op", rating: 5, game: "CS2", days: 3, text: "AK on CS2 stays planted at 30 rounds. Compatible with VAC heuristics, no auto-bans across 2 weeks of grinding." },
        { user: "taiga_op", rating: 5, game: "RUST", days: 5, text: "На Расте абсолютно бесшумно, спрей AK в одну точку на 50 метрах. За такие деньги — шикарно." },
        { user: "gearhead", rating: 5, game: "CoD", days: 7, text: "Per-weapon profiles save hours of testing. Auto-detects loadout and applies the right table. Nice touch." },
        { user: "budget_kid", rating: 4, game: "PUBG", days: 2, text: "Цена топ за такой функционал. Минус один балл — нет регулировки в реальном времени, надо в меню лезть." },
      ]
    },
    {
      id: "KAB-008", clear: "S", base: 7, name: "Radar / Map Hack", short: "RADAR",
      status: "POPULAR", rating: 4.8,
      desc: "External radar window with full map coverage, enemy positions, viewing cones and loot markers.",
      tags: ["RADAR","MAP","EXTERNAL"],
      games: ["cs2","tarkov","rust","dayz","pubg"],
      features: {
        visual: ["External radar window","Full map coverage","Enemy view cones","Loot & item markers","Zoom / pan controls"],
        misc: ["Discord-streamable separately","Multi-instance friendly"],
      },
      req: { os: "Windows 10/11 x64", cpu: "—", ram: "4 GB", driver: "—", net: "—" },
      images: [],
      reviews: [
        { user: "extract_op", rating: 5, game: "EFT", days: 7, text: "External radar window dragged to second monitor. Knew every rotation last raid. Best 7 bucks ever." },
        { user: "bandit_ru", rating: 5, game: "RUST", days: 14, text: "Раст с радаром — другая игра. Видишь всех противников на карте, плюс можно стримить отдельным окном без палева." },
        { user: "pubg_main", rating: 5, game: "PUBG", days: 4, text: "View cones + loot markers = climbed 200 SR in ranked over a weekend. Zoom controls are smooth." },
        { user: "radar_op", rating: 5, game: "CS2", days: 7, text: "Ставлю на второй моник, выглядит как обычная мини-карта. Тиммейты не палят даже когда смотрят на мой стол." },
      ]
    },
  ];

  const DEFAULT_SETTINGS = {
    paymentLinks: {
      ru:  "https://buy.example.com/ru?product={id}&tier={tier}",
      eu:  "https://buy.example.com/eu?product={id}&tier={tier}",
      ltc: "https://buy.example.com/ltc?product={id}&tier={tier}",
      btc: "https://buy.example.com/btc?product={id}&tier={tier}",
    },
    siteName: "KERNELAB",
    discountCodes: { "KAB-DEMO": 15 },
    promoCodes: [
      {
        id: "promo_demo",
        code: "KAB-DEMO",
        type: "percentage",
        discount: 15,
        startDate: "",
        endDate: "",
        useLimit: 0,
        perCustomerLimit: 0,
        minOrderValue: 0,
        emailAllowlist: [],
        productIds: [],
        methods: [],
        disabled: false,
      },
    ],
    wheel: {
      enabled: true,
      title: "SPIN THE WHEEL",
      desc: "Spin to unlock a single-use discount code. Up to 30% off any module. Code expires in 24 hours.",
      segments: [
        { label: "5%",       value: 5,  suffix: "%", weight: 14 },
        { label: "15%",      value: 15, suffix: "%", weight: 18 },
        { label: "10%",      value: 10, suffix: "%", weight: 18 },
        { label: "25%",      value: 25, suffix: "%", weight: 10 },
        { label: "20%",      value: 20, suffix: "%", weight: 14 },
        { label: "FREE DAY", value: 1,  suffix: "d", weight:  8 },
        { label: "30%",      value: 30, suffix: "%", weight:  6 },
        { label: "BONUS x2", value: 2,  suffix: "x", weight: 12 },
      ],
    },
    maintenance: {
      enabled: false,
      title: "TECHNICAL BREAK",
      message: "Engine is undergoing kernel-level maintenance. We'll be back shortly.",
      eta: "ETA: 30 minutes",
    },
    social: {
      discord:        "https://discord.gg/your-invite",
      discordHandle:  "discord.gg/kernelab",
      telegram:       "https://t.me/your_channel",
      telegramHandle: "@kernelab_support",
    },
    legal: {
      faqUrl:     "#faq",
      termsUrl:   "#terms",
      privacyUrl: "#privacy",
    },
    launchDate: new Date(Date.now() - 240 * 86400e3).toISOString(),
    faq: [
      {
        q: "Каков шанс получить бан? · What's the ban chance?",
        a: "Мы используем kernel-level техники обхода (manual mapper, stripped PE headers, callback unhooking) и постоянно обновляемся под изменения анти-читов. Однако полностью гарантировать отсутствие бана невозможно — это всегда риск пользователя. По статистике наших клиентов, средний uptime аккаунта без бана 200+ дней при соблюдении рекомендаций (HWID-спуф, стрим-пруф, разумное поведение в матче).\n\nWe use kernel-level evasion (manual mapping, stripped PE headers, callback unhooking) and update continuously against anti-cheat changes. However we cannot fully guarantee no bans — using cheats is always at the user's risk. Average account uptime across our base is 200+ days with HWID spoof, stream-proof and sensible in-match behaviour.",
      },
      {
        q: "Возвращаете ли деньги при бане? · Do you refund bans?",
        a: "Нет. Использование любых читов нарушает EULA игр и относится к зоне риска оператора. Мы не несём ответственности за блокировки игровых аккаунтов, потерю инвентаря, рейтинга или платёжных методов. Перед покупкой убедитесь, что вы понимаете и принимаете этот риск.\n\nNo. The use of any cheats violates the games' EULA and is fully at the operator's risk. We are not responsible for game account bans, lost inventory, ranks, or payment-method bans. Make sure you understand and accept this risk before purchasing.",
      },
      {
        q: "Когда придёт ключ после оплаты? · When do I get my key?",
        a: "Доставка ключа на email мгновенная — обычно в течение 1–2 минут после подтверждения платежа. Если ключ не пришёл за 10 минут — проверьте спам, затем напишите в Discord или Telegram, поможем.\n\nKey delivery is instant — usually within 1–2 minutes after payment confirmation. If you don't see it within 10 minutes, check your spam folder and DM us in Discord or Telegram.",
      },
      {
        q: "Как установить и запустить чит? · How to install and launch?",
        a: "После оплаты на email приходит лицензионный ключ и ссылка на загрузку лоадера. Запустите лоадер от имени администратора, введите ключ, выберите процесс игры. Полная пошаговая инструкция в личном кабинете и в нашем Discord.\n\nAfter purchase you get a license key and a loader download link by email. Run the loader as administrator, enter your key, pick the game process. Full step-by-step instructions are in your dashboard and our Discord.",
      },
      {
        q: "Какая ОС поддерживается? · Supported OS?",
        a: "Только Windows 10 и Windows 11 x64. Для большинства модулей нужно отключить Secure Boot, для HWID Spoofer — также BitLocker. Точные требования в карточке каждого продукта.\n\nWindows 10 / 11 x64 only. Most modules require Secure Boot off; HWID Spoofer also requires BitLocker disabled. See system requirements per product card.",
      },
      {
        q: "Можно использовать на нескольких ПК? · Multi-PC license?",
        a: "Лицензия привязывается к hardware fingerprint (HWID). Один бесплатный перенос на новый ПК. Дополнительные переносы — 50% от стоимости активной подписки.\n\nLicenses are bound to your HWID. One free transfer to a new machine. Extra transfers cost 50% of your active subscription.",
      },
      {
        q: "Как часто обновляются читы? · How often are updates released?",
        a: "Обновления выкатываются автоматически при запуске лоадера. После масштабного обновления анти-чита мы обычно возвращаем поддержку в течение 4–48 часов в зависимости от глубины изменений. Для подписки время простоя не списывается с тарифа Lifetime.\n\nUpdates push automatically through the loader. After major anti-cheat updates we typically restore support within 4–48 hours. Lifetime tier downtime does not count against your subscription.",
      },
      {
        q: "Чит не запускается, что делать? · Cheat won't start, what do I do?",
        a: "1) Проверьте что Secure Boot и BitLocker отключены согласно требованиям. 2) Запустите лоадер от имени администратора. 3) Отключите сторонние антивирусы. 4) Перезагрузите ПК. Если не помогло — пишите в Discord, отвечаем 24/7.\n\n1) Make sure Secure Boot and BitLocker are off as required. 2) Run the loader as administrator. 3) Disable third-party antivirus. 4) Reboot the PC. Still broken? DM us in Discord, 24/7 support.",
      },
    ],
    terms: `TERMS OF SERVICE / ОТКАЗ ОТ ОТВЕТСТВЕННОСТИ

By purchasing or using KERNELAB software ("the Service") you agree to the following terms.

1. ACCEPTANCE OF RISK / ПРИНЯТИЕ РИСКА
The use of game modification software violates the End User License Agreements (EULA) and Terms of Service of the games it is used with. You acknowledge that using the Service may result in:
— Permanent or temporary suspension of your game account
— Hardware ID (HWID) bans across multiple accounts
— Loss of in-game progress, inventory, ranks and statistics
— Banning of associated payment methods or platform accounts

Используя ПО KERNELAB вы признаёте, что это нарушает EULA игр, может привести к блокировке аккаунта и потере прогресса. Все риски полностью на стороне пользователя.

2. NO REFUNDS FOR BANS / ОТСУТСТВИЕ ВОЗВРАТОВ ПРИ БАНЕ
We do not issue refunds for game account bans, hardware bans, payment-method bans or any other consequence resulting from the use of the Service. Refunds may be considered only if the Service is technically non-functional and no fix is delivered within 7 days.

Возвраты при блокировках аккаунтов, hardware-банах и других последствиях использования сервиса не производятся. Возврат возможен только если сервис технически нерабочий более 7 дней.

3. NO WARRANTIES / БЕЗ ГАРАНТИЙ
The Service is provided "AS IS" without any warranties. We make no guarantees regarding undetectability, compatibility or continued operation. Anti-cheat technology evolves continuously and we cannot guarantee permanent functionality.

4. AGE / ВОЗРАСТ
You must be at least 18 years of age to purchase or use the Service.

5. PROHIBITED USES / ЗАПРЕЩЕНО
— Reselling, redistributing or sharing access credentials
— Reverse engineering, decompiling or modifying the Service
— Using the Service in tournaments, leagues or matches with prize pools
— Using the Service to cause financial harm to other players

6. LICENSE TRANSFER / ПЕРЕНОС ЛИЦЕНЗИИ
Licenses are bound to your hardware fingerprint. Transfers between machines are limited as described in the FAQ.

7. JURISDICTION / ЮРИСДИКЦИЯ
Any disputes shall be resolved under private arbitration. By purchasing you waive class-action rights.

Last updated: 2026-06-01
`,
    privacy: `PRIVACY POLICY / ПОЛИТИКА КОНФИДЕНЦИАЛЬНОСТИ

KERNELAB collects only the minimum data necessary to deliver the Service.

DATA WE COLLECT / ДАННЫЕ КОТОРЫЕ МЫ СОБИРАЕМ
— Email address (for delivery of license keys and receipts)
— Hardware fingerprint (for license binding)
— Order metadata (amount, timestamp, payment method)

DATA WE DO NOT COLLECT / ЧТО МЫ НЕ СОБИРАЕМ
— No payment card details — handled entirely by third-party processors
— No browsing behaviour outside this website
— No third-party advertising or analytics trackers
— No linkage to external identity services

DATA RETENTION / ХРАНЕНИЕ ДАННЫХ
— Order records: 12 months for support purposes
— Email addresses: while subscription active + 30 days
— Hardware fingerprints: while subscription active

YOUR RIGHTS / ВАШИ ПРАВА
You may request deletion of all your data at any time by contacting support. Deletion is processed within 14 days.

CONTACT
For privacy inquiries reach us via the contact channels listed on the main page.

Last updated: 2026-06-01
`,
    stats: {
      // null = compute from real data; otherwise admin override
      uptimeDays: null,
      // optional fourth marketing stat
      uptimeBadge: null,
    },
  };

  const STATUSES = ["UNDETECTED","POPULAR","NEW","UPDATING","BETA","DETECTED"];

  /* ===== Tier price multipliers ===== */
  const TIERS = [
    { dur: "1 day",   mult: 1.00 },
    { dur: "7 days",  mult: 4.50 },
    { dur: "30 days", mult: 14.0 },
    { dur: "90 days", mult: 32.0 },
    { dur: "Lifetime",mult: 80.0 },
  ];

  function makePrices(productOrBase) {
    // If a number is passed (legacy), build mock tiers from base × multiplier.
    if (typeof productOrBase === "number" || productOrBase == null) {
      const base = Number(productOrBase) || 0;
      return TIERS.map((t, i) => {
        const price = base > 0 ? Math.round(base * t.mult) : 0;
        const saving = (i === 0 || price <= 0)
          ? 0
          : Math.max(0, Math.min(Math.round((1 - price / (base * (i+1))) * 100) + 5, 65));
        return { dur: t.dur, price, saving, links: {} };
      });
    }
    const p = productOrBase;
    // Preferred: explicit `tiers` array on the product (new schema).
    if (Array.isArray(p.tiers) && p.tiers.length) {
      return p.tiers.map((t, i, arr) => {
        const price = Number(t.price) || 0;
        // Compute saving relative to first non-zero tier × index — informational only.
        const first = arr.find(x => Number(x.price) > 0);
        const baseEq = first ? Number(first.price) : 0;
        const saving = (i === 0 || price <= 0 || baseEq <= 0)
          ? 0
          : Math.max(0, Math.min(Math.round((1 - price / (baseEq * (i+1))) * 100) + 5, 65));
        return {
          dur: t.dur || "",
          price,
          saving,
          links: t.links || {},
        };
      });
    }
    // Fallback: old schema with base + prices override.
    const explicit = p.prices || {};
    const base = Number(p.base) || 0;
    return TIERS.map((t, i) => {
      const v = explicit[t.dur];
      let price;
      if (v !== undefined && v !== "" && v !== null) price = Number(v) || 0;
      else if (base > 0) price = Math.round(base * t.mult);
      else price = 0;
      const saving = (i === 0 || price <= 0 || base <= 0)
        ? 0
        : Math.max(0, Math.min(Math.round((1 - price / (base * (i+1))) * 100) + 5, 65));
      // Migrate single-link buyLinks → eu method
      const oldLink = p.buyLinks && p.buyLinks[t.dur];
      const links = oldLink ? { eu: oldLink } : {};
      return { dur: t.dur, price, saving, links };
    });
  }

  /* ===== IndexedDB media (videos / large blobs) ===== */
  const Media = (function () {
    const DB = "kernelab_media", STORE = "files";
    let db;
    function open() {
      return new Promise((res, rej) => {
        if (db) return res(db);
        const r = indexedDB.open(DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE);
        r.onsuccess = () => { db = r.result; res(db); };
        r.onerror = () => rej(r.error);
      });
    }
    function newId() { return "med_" + Math.random().toString(36).slice(2, 10); }
    return {
      newId,
      async put(id, blob) {
        const d = await open();
        return new Promise((res, rej) => {
          const tx = d.transaction(STORE, "readwrite");
          tx.objectStore(STORE).put(blob, id);
          tx.oncomplete = () => res(id);
          tx.onerror = () => rej(tx.error);
        });
      },
      async get(id) {
        const d = await open();
        return new Promise((res, rej) => {
          const tx = d.transaction(STORE, "readonly");
          const req = tx.objectStore(STORE).get(id);
          req.onsuccess = () => res(req.result || null);
          req.onerror = () => rej(req.error);
        });
      },
      async getURL(id) {
        const blob = await this.get(id);
        return blob ? URL.createObjectURL(blob) : null;
      },
      async del(id) {
        const d = await open();
        return new Promise((res, rej) => {
          const tx = d.transaction(STORE, "readwrite");
          tx.objectStore(STORE).delete(id);
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        });
      },
      async clear() {
        const d = await open();
        return new Promise((res, rej) => {
          const tx = d.transaction(STORE, "readwrite");
          tx.objectStore(STORE).clear();
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        });
      },
    };
  })();

  /* ===== Real-time analytics via counterapi.dev (free public counter) ===== */
  const Analytics = (function () {
    const BASE = "https://api.counterapi.dev/v2";
    const NS = "kernelab";
    function pad(n) { return String(n).padStart(2, "0"); }
    function todayKey() {
      const d = new Date();
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
    }
    async function bump(key) {
      try {
        const r = await fetch(`${BASE}/${NS}/${encodeURIComponent(key)}/up`, { cache: "no-store" });
        if (!r.ok) return null;
        const j = await r.json();
        return (j && (j.data ? j.data.up_count : j.count)) || null;
      } catch (e) { return null; }
    }
    async function read(key) {
      try {
        const r = await fetch(`${BASE}/${NS}/${encodeURIComponent(key)}`, { cache: "no-store" });
        if (!r.ok) return 0;
        const j = await r.json();
        return (j && (j.data ? j.data.up_count : j.count)) || 0;
      } catch (e) { return 0; }
    }
    return {
      // Increment site-wide visit (once per browser session)
      visitOnce() {
        try {
          if (sessionStorage.getItem("kab_visit_logged")) return;
          sessionStorage.setItem("kab_visit_logged", "1");
        } catch (e) {}
        bump("visits-total");
        bump("visits-" + todayKey());
      },
      // Increment product click counter
      click(productId) {
        if (!productId) return;
        bump("clicks-total");
        bump("clicks-" + productId);
      },
      // Pull current stats for admin dashboard
      async getStats(products) {
        const out = {
          totalVisits: 0,
          todayVisits: 0,
          totalClicks: 0,
          productClicks: {},
        };
        try {
          out.totalVisits = await read("visits-total");
          out.todayVisits = await read("visits-" + todayKey());
          out.totalClicks = await read("clicks-total");
          if (products && products.length) {
            await Promise.all(products.map(async p => {
              out.productClicks[p.id] = await read("clicks-" + p.id);
            }));
          }
        } catch (e) { console.error("[analytics] stats failed:", e); }
        return out;
      },
    };
  })();

  /* ===== Public API ===== */
  const Store = {
    KEYS, TIERS, STATUSES, Media, Analytics,

    /* products */
    getProducts() { return readJSON(KEYS.products, DEFAULT_PRODUCTS); },
    setProducts(arr) { return writeJSON(KEYS.products, arr); },
    getProduct(id) { return this.getProducts().find(p => p.id === id) || null; },
    upsertProduct(p) {
      const arr = this.getProducts();
      const idx = arr.findIndex(x => x.id === p.id);
      if (idx >= 0) arr[idx] = p; else arr.push(p);
      this.setProducts(arr);
    },
    deleteProduct(id) {
      this.setProducts(this.getProducts().filter(p => p.id !== id));
    },

    /* games */
    getGames() { return readJSON(KEYS.games, DEFAULT_GAMES); },
    setGames(arr) { return writeJSON(KEYS.games, arr); },
    upsertGame(g) {
      const arr = this.getGames();
      const idx = arr.findIndex(x => x.key === g.key);
      if (idx >= 0) arr[idx] = g; else arr.push(g);
      this.setGames(arr);
    },
    deleteGame(key) {
      this.setGames(this.getGames().filter(g => g.key !== key));
    },

    /* orders */
    getOrders() { return readJSON(KEYS.orders, []); },
    setOrders(arr) { return writeJSON(KEYS.orders, arr); },
    pushOrder(o) {
      const arr = this.getOrders();
      arr.unshift(o);
      if (arr.length > 5000) arr.length = 5000;
      this.setOrders(arr);
    },

    /* clicks */
    getClicks() { return readJSON(KEYS.clicks, []); },
    pushClick(productId) {
      const arr = this.getClicks();
      arr.unshift({ ts: Date.now(), productId });
      if (arr.length > 10000) arr.length = 10000;
      writeJSON(KEYS.clicks, arr);
    },
    clearClicks() { writeJSON(KEYS.clicks, []); },

    /* reviews */
    addReview(productId, review) {
      const arr = this.getProducts();
      const p = arr.find(x => x.id === productId);
      if (!p) return false;
      if (!p.reviews) p.reviews = [];
      p.reviews.unshift(review);
      this.setProducts(arr);
      return true;
    },
    deleteReview(productId, idx) {
      const arr = this.getProducts();
      const p = arr.find(x => x.id === productId);
      if (!p || !p.reviews) return false;
      p.reviews.splice(idx, 1);
      this.setProducts(arr);
      return true;
    },

    /* settings */
    getSettings() {
      const s = readJSON(KEYS.settings, DEFAULT_SETTINGS);
      // Migrate: ensure new fields exist
      if (!s.wheel)         s.wheel = DEFAULT_SETTINGS.wheel;
      if (!s.maintenance)   s.maintenance = DEFAULT_SETTINGS.maintenance;
      if (!s.paymentLinks)  s.paymentLinks = DEFAULT_SETTINGS.paymentLinks;
      if (!s.discountCodes) s.discountCodes = DEFAULT_SETTINGS.discountCodes;
      // Migrate old discountCodes → promoCodes (one-time)
      if (!s.promoCodes) {
        s.promoCodes = Object.entries(s.discountCodes || {}).map(([code, pct]) => ({
          id: "promo_" + Math.random().toString(36).slice(2,8),
          code: String(code).toUpperCase(),
          type: "percentage",
          discount: Number(pct) || 0,
          startDate: "", endDate: "",
          useLimit: 0, perCustomerLimit: 0,
          minOrderValue: 0, emailAllowlist: [],
          productIds: [], methods: [],
          disabled: false,
        }));
      }
      if (!s.social)        s.social = DEFAULT_SETTINGS.social;
      if (!s.legal)         s.legal = DEFAULT_SETTINGS.legal;
      // Migrate legacy paths to in-page anchors
      if (s.legal) {
        if (s.legal.faqUrl     === "/faq.html"           || s.legal.faqUrl     === "faq.html")           s.legal.faqUrl     = "#faq";
        if (s.legal.termsUrl   === "/terms.html"         || s.legal.termsUrl   === "terms.html")         s.legal.termsUrl   = "#terms";
        if (s.legal.privacyUrl === "/terms.html#privacy" || s.legal.privacyUrl === "terms.html#privacy") s.legal.privacyUrl = "#privacy";
      }
      if (!s.faq)           s.faq = DEFAULT_SETTINGS.faq;
      if (!s.terms)         s.terms = DEFAULT_SETTINGS.terms;
      if (!s.privacy)       s.privacy = DEFAULT_SETTINGS.privacy;
      if (!s.stats)         s.stats = DEFAULT_SETTINGS.stats;
      if (!s.launchDate)    s.launchDate = DEFAULT_SETTINGS.launchDate;
      return s;
    },
    setSettings(s) { return writeJSON(KEYS.settings, s); },

    /* admin */
    getAdminPass() { return localStorage.getItem(KEYS.admin) || "admin"; },
    setAdminPass(p) { return localStorage.setItem(KEYS.admin, p); },

    /* helpers */
    makePrices,

    /* reset everything */
    reset() {
      Object.values(KEYS).forEach(k => localStorage.removeItem(k));
      Media.clear().catch(()=>{});
      this.seed();
    },

    /* ===== Publish / Sync with server-side data.json ===== */

    // Snapshot of admin-controlled data (no per-visitor stuff like orders/clicks)
    exportData() {
      return {
        version: Date.now(),
        products: this.getProducts(),
        games:    this.getGames(),
        settings: this.getSettings(),
      };
    },

    // Replace local store from a snapshot object
    importData(obj) {
      if (!obj || typeof obj !== "object") return false;
      if (Array.isArray(obj.products)) writeJSON(KEYS.products, obj.products);
      if (Array.isArray(obj.games))    writeJSON(KEYS.games, obj.games);
      if (obj.settings)                writeJSON(KEYS.settings, obj.settings);
      return true;
    },

    // Synchronously fetch data.json (called by main page on load).
    // Replaces local catalogue with server-published state.
    // Synchronous XHR is deprecated but ideal here: small one-time fetch
    // before any rendering, runs only on visitor pages.
    syncFromServerSync() {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "data.json?t=" + Date.now(), false);
        xhr.send();
        if (xhr.status !== 200) return false;
        const data = JSON.parse(xhr.responseText);
        return this.importData(data);
      } catch (e) { return false; }
    },

    /* seed on first run — clean state, no fake history */
    seed() {
      // Migration: if old v1 seed populated fake orders/clicks, wipe them
      // and mark v2 so we don't re-seed defaults over the user's data.
      if (localStorage.getItem(KEYS.seededV1) && !localStorage.getItem(KEYS.seeded)) {
        writeJSON(KEYS.orders, []);
        writeJSON(KEYS.clicks, []);
        localStorage.removeItem(KEYS.seededV1);
        localStorage.setItem(KEYS.seeded, "1");
        return;
      }
      if (localStorage.getItem(KEYS.seeded)) return;
      writeJSON(KEYS.products, DEFAULT_PRODUCTS);
      writeJSON(KEYS.games, DEFAULT_GAMES);
      writeJSON(KEYS.settings, DEFAULT_SETTINGS);
      writeJSON(KEYS.orders, []);
      writeJSON(KEYS.clicks, []);
      localStorage.setItem(KEYS.seeded, "1");
    },
  };

  Store.seed();
  window.KernelabStore = Store;
})();
