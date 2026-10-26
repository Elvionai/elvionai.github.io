/**
 * Philadelphia AI by Elvion — Native App Shell & PWA Installer (app-shell.js)
 * Drop-in script (<script src="app-shell.js"></script>) that morphs
 * any Elvion HTML page into an installable PWA & mobile app experience.
 */
(function () {
  "use strict";
  if (window.__ELVION_APP_SHELL_LOADED__) return;
  window.__ELVION_APP_SHELL_LOADED__ = true;

  // =========================================================================
  // 0. CAPTURE `beforeinstallprompt` IMMEDIATELY (Must be outside DOMContentLoaded!)
  // =========================================================================
  window.__ELVION_DEFERRED_PROMPT__ = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.__ELVION_DEFERRED_PROMPT__ = e;
    updateInstallButtonsUI(true);
  });

  window.addEventListener("appinstalled", () => {
    window.__ELVION_DEFERRED_PROMPT__ = null;
    showElvionToast("✨ Philadelphia AI App Installed! Check your home screen.");
    closeElvionInstallModal();
  });

  function isRunningStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function updateInstallButtonsUI(isReady) {
    const installBtn = document.getElementById("installButton");
    const appPwaBtn = document.getElementById("app-pwa-btn");
    if (installBtn && !isRunningStandalone()) {
      installBtn.style.display = "flex";
    }
    if (appPwaBtn && !isRunningStandalone()) {
      appPwaBtn.style.display = "inline-flex";
    }
  }

  // =========================================================================
  // 1. FAIL-SAFE SPLASH SCREEN DISMISSAL (Never get stuck midway on launch)
  // =========================================================================
  function dismissSplashFailSafe() {
    const splash = document.getElementById("splash-screen");
    if (splash && splash.style.display !== "none") {
      splash.classList.add("hide-splash");
      setTimeout(() => {
        splash.style.display = "none";
      }, 800);
    }
  }
  setTimeout(dismissSplashFailSafe, 2200);
  window.addEventListener("load", () => setTimeout(dismissSplashFailSafe, 600));

  // =========================================================================
  // 2. REGISTER SERVICE WORKER & REFRESH MANIFEST ONCE ACTIVE
  // =========================================================================
  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then(() => {
        // When SW claims the page on first visit, refresh manifest link so Chrome sees generated 192/512 PNG icons
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          const manifestLink = document.querySelector('link[rel="manifest"]');
          if (manifestLink) {
            manifestLink.href = "/manifest.json?v=" + Date.now();
          }
        });
      })
      .catch(() => {
        navigator.serviceWorker.register("service-worker.js").catch(() => {});
      });
  }

  // =========================================================================
  // 3. UNIVERSAL PWA INSTALL HANDLER (Works on philadelphia.html & app.html)
  // =========================================================================
  async function triggerElvionPWAInstall(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 1. If native browser install prompt is ready, trigger it immediately!
    if (window.__ELVION_DEFERRED_PROMPT__) {
      try {
        const promptEvent = window.__ELVION_DEFERRED_PROMPT__;
        promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === "accepted") {
          window.__ELVION_DEFERRED_PROMPT__ = null;
          showElvionToast("✨ Installing Philadelphia AI App...");
        }
        return;
      } catch (err) {
        console.warn("Install prompt error:", err);
      }
    }

    // 2. If already running inside the installed PWA
    if (isRunningStandalone()) {
      showElvionToast("✨ You are already inside the installed Philadelphia AI App!");
      return;
    }

    // 3. Otherwise show the interactive PWA Install Modal (handles iOS Safari, Chrome when already installed, etc.)
    openElvionInstallModal();
  }

  window.triggerElvionPWAInstall = triggerElvionPWAInstall;

  // Intercept clicks on #installButton (philadelphia.html), #app-pwa-btn (app.html), or [data-pwa-install]
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target.closest(
        "#installButton, #app-pwa-btn, [data-pwa-install], a[href*='philadelphia-ai.apk']"
      );
      if (target) {
        triggerElvionPWAInstall(e);
      }
    },
    true // Capture phase so it overrides any broken/empty click listener
  );

  // =========================================================================
  // 4. STYLES FOR APP SHELL, STUDIO SWITCHER & PWA INSTALL MODAL
  // =========================================================================
  const style = document.createElement("style");
  style.textContent = `
    html {
      -webkit-tap-highlight-color: transparent;
      overscroll-behavior-y: none;
    }
    @media all and (display-mode: standalone) {
      body {
        user-select: none;
        -webkit-user-select: none;
        padding-top: env(safe-area-inset-top, 0px);
      }
      input, textarea, pre, code, [contenteditable="true"] {
        user-select: text;
        -webkit-user-select: text;
      }
      #installButton, #app-pwa-btn {
        display: none !important;
      }
    }

    /* Toast Pill */
    #elv-net-pill {
      position: fixed;
      top: 74px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: rgba(15, 15, 12, 0.96);
      border: 1px solid rgba(201, 169, 110, 0.55);
      color: #e8d5b0;
      padding: 8px 18px;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.4px;
      z-index: 10005;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s ease;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.85);
      text-align: center;
      max-width: 90vw;
    }
    #elv-net-pill.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }

    /* Interactive PWA Install Modal */
    #elv-install-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.82);
      backdrop-filter: blur(8px);
      z-index: 10004;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    #elv-install-modal-backdrop.open {
      display: flex;
    }
    #elv-install-modal {
      width: 100%;
      max-width: 430px;
      background: #0f0f0c;
      border: 1px solid rgba(201, 169, 110, 0.5);
      border-radius: 22px;
      padding: 1.6rem 1.4rem;
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.95), 0 0 25px rgba(201, 169, 110, 0.2);
      color: #efefef;
      position: relative;
      animation: elvModalPop 0.22s ease-out;
    }
    @keyframes elvModalPop {
      from { opacity: 0; transform: scale(0.94) translateY(10px); }
      to { opacity: 1; transform: scale(1) translateY(0); }
    }
    .elv-modal-close {
      position: absolute;
      top: 14px;
      right: 16px;
      background: rgba(201, 169, 110, 0.1);
      border: 1px solid rgba(201, 169, 110, 0.25);
      color: #c9a96e;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      font-size: 1.1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .elv-modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 1rem;
    }
    .elv-modal-header img {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      border: 2px solid #c9a96e;
      object-fit: cover;
    }
    .elv-modal-header h3 {
      font-family: 'Orbitron', 'Playfair Display', serif;
      font-size: 1.05rem;
      color: #c9a96e;
      margin: 0 0 3px 0;
    }
    .elv-modal-header p {
      font-size: 0.78rem;
      color: #b5b0a3;
      margin: 0;
    }
    .elv-step-box {
      background: #161614;
      border: 1px solid rgba(201, 169, 110, 0.2);
      border-radius: 14px;
      padding: 0.9rem 1rem;
      margin-bottom: 0.75rem;
      font-size: 0.84rem;
      line-height: 1.5;
      color: #e2dfd7;
    }
    .elv-step-box strong {
      color: #c9a96e;
    }
    .elv-modal-btn {
      width: 100%;
      padding: 0.8rem 1rem;
      border-radius: 50px;
      border: none;
      background: linear-gradient(135deg, #c9a96e 0%, #e8d5b0 50%, #af8f50 100%);
      color: #000;
      font-family: 'Orbitron', sans-serif;
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 0.9rem;
      text-decoration: none;
      box-shadow: 0 0 20px rgba(201, 169, 110, 0.35);
    }

    /* Quick Studio Launcher Sheet */
    #elv-studio-sheet-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(6px);
      z-index: 10000;
      display: none;
      align-items: flex-end;
      justify-content: center;
    }
    #elv-studio-sheet-backdrop.open {
      display: flex;
    }
    #elv-studio-sheet {
      width: 100%;
      max-width: 540px;
      background: #0f0f0c;
      border-top: 1px solid rgba(201, 169, 110, 0.4);
      border-radius: 22px 22px 0 0;
      padding: 1.25rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom, 0px));
      box-shadow: 0 -12px 45px rgba(0, 0, 0, 0.95);
      animation: elvSheetUp 0.25s ease-out;
    }
    @keyframes elvSheetUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    .elv-sheet-handle {
      width: 42px;
      height: 4px;
      background: rgba(201, 169, 110, 0.35);
      border-radius: 4px;
      margin: 0 auto 1rem;
    }
    .elv-sheet-title {
      font-family: 'Orbitron', 'Playfair Display', serif;
      font-size: 0.95rem;
      color: #c9a96e;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      text-align: center;
      margin-bottom: 1rem;
    }
    .elv-sheet-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    .elv-sheet-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0.8rem 0.9rem;
      border-radius: 14px;
      background: #161614;
      border: 1px solid rgba(201, 169, 110, 0.16);
      color: #efefef;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .elv-sheet-item:hover, .elv-sheet-item:active {
      border-color: rgba(201, 169, 110, 0.55);
      background: rgba(201, 169, 110, 0.12);
      color: #e8d5b0;
      transform: translateY(-2px);
    }
    .elv-sheet-item i {
      color: #c9a96e;
      font-size: 1.05rem;
      width: 22px;
      text-align: center;
    }

    /* Universal Mobile Bottom Dock (auto-injected when page has no .bottom-nav) */
    .elv-universal-dock {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(10, 10, 8, 0.96);
      backdrop-filter: blur(14px);
      border-top: 1px solid rgba(201, 169, 110, 0.18);
      display: none;
      justify-content: space-around;
      padding: 0.55rem 0.4rem calc(0.55rem + env(safe-area-inset-bottom, 0px));
      z-index: 999;
    }
    .elv-universal-dock a, .elv-universal-dock button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      color: #857d6d;
      font-size: 0.68rem;
      font-weight: 600;
      padding: 0.3rem 0.7rem;
      border-radius: 10px;
      background: none;
      border: none;
      cursor: pointer;
      text-decoration: none;
      font-family: inherit;
      transition: 0.25s;
    }
    .elv-universal-dock a i, .elv-universal-dock button i {
      font-size: 1.08rem;
    }
    .elv-universal-dock a.active, .elv-universal-dock button.active,
    .elv-universal-dock a:hover, .elv-universal-dock button:hover {
      color: #c9a96e;
      background: rgba(201, 169, 110, 0.08);
    }
    @media (max-width: 768px) {
      .elv-universal-dock {
        display: flex;
      }
      body.elv-has-dock {
        padding-bottom: 78px;
      }
    }
  `;
  document.head.appendChild(style);

  let netPillEl = null;
  function showElvionToast(msg) {
    if (!netPillEl) return;
    netPillEl.textContent = msg;
    netPillEl.classList.add("show");
    setTimeout(() => netPillEl.classList.remove("show"), 3800);
  }

  let installModalBackdrop = null;
  function openElvionInstallModal() {
    if (!installModalBackdrop) return;
    installModalBackdrop.classList.add("open");
  }
  function closeElvionInstallModal() {
    if (!installModalBackdrop) return;
    installModalBackdrop.classList.remove("open");
  }

  function initAppShell() {
    setTimeout(dismissSplashFailSafe, 1500);

    // 1. Connectivity & Status Toast Pill
    netPillEl = document.createElement("div");
    netPillEl.id = "elv-net-pill";
    document.body.appendChild(netPillEl);

    window.addEventListener("offline", () =>
      showElvionToast("⚡ Offline Mode — Using Cached App Data")
    );
    window.addEventListener("online", () =>
      showElvionToast("✨ Back Online — Live Sync Restored")
    );

    // 2. Interactive PWA Install Modal (shown when browser requires manual menu install or already installed)
    installModalBackdrop = document.createElement("div");
    installModalBackdrop.id = "elv-install-modal-backdrop";
    installModalBackdrop.innerHTML = `
      <div id="elv-install-modal">
        <button type="button" class="elv-modal-close" aria-label="Close">&times;</button>
        <div class="elv-modal-header">
          <img src="/images/IMG_20250715_102103_129.jpg" onerror="this.src='https://i.postimg.cc/8cNLwzjz/IMG-20251229-124110-433.png'" alt="Philadelphia AI">
          <div>
            <h3>Install Philadelphia AI</h3>
            <p>Official Web App (PWA) • Zero Storage Bloat</p>
          </div>
        </div>
        <div class="elv-step-box">
          <strong><i class="fa-brands fa-android"></i> Android / Chrome / Edge:</strong><br>
          Tap the browser menu icon <strong>(⋮)</strong> at the top-right of your screen and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.<br>
          <span style="font-size:0.76rem; color:#9e998e;">(If you already installed it earlier, tap <strong>"Open in Philadelphia AI"</strong> in your browser menu!)</span>
        </div>
        <div class="elv-step-box">
          <strong><i class="fa-brands fa-apple"></i> iPhone / iPad (Safari):</strong><br>
          Tap the <strong>Share</strong> button <i class="fa-solid fa-arrow-up-from-bracket"></i> at the bottom of Safari and select <strong>"Add to Home Screen"</strong>.
        </div>
        <a href="app.html" class="elv-modal-btn" onclick="document.getElementById('elv-install-modal-backdrop').classList.remove('open')">
          <i class="fa-solid fa-rocket"></i> Launch App Hub Now
        </a>
      </div>
    `;
    document.body.appendChild(installModalBackdrop);

    installModalBackdrop
      .querySelector(".elv-modal-close")
      .addEventListener("click", closeElvionInstallModal);
    installModalBackdrop.addEventListener("click", (e) => {
      if (e.target === installModalBackdrop) closeElvionInstallModal();
    });

    // 3. Studio Launcher Bottom Sheet
    const sheetBackdrop = document.createElement("div");
    sheetBackdrop.id = "elv-studio-sheet-backdrop";
    sheetBackdrop.innerHTML = `
      <div id="elv-studio-sheet">
        <div class="elv-sheet-handle"></div>
        <div class="elv-sheet-title">Switch Creative Studio</div>
        <div class="elv-sheet-grid">
          <a href="app.html" class="elv-sheet-item"><i class="fa-solid fa-grip"></i><span>App Hub</span></a>
          <a href="philadelphia.html" class="elv-sheet-item"><i class="fa-solid fa-bolt"></i><span>Philadelphia Home</span></a>
          <a href="profile.html" class="elv-sheet-item"><i class="fa-solid fa-comments"></i><span>Chat Studio</span></a>
          <a href="image-studio.html" class="elv-sheet-item"><i class="fa-solid fa-wand-magic-sparkles"></i><span>Image Studio</span></a>
          <a href="video-studio.html" class="elv-sheet-item"><i class="fa-solid fa-film"></i><span>Video Studio</span></a>
          <a href="audio-studio.html" class="elv-sheet-item"><i class="fa-solid fa-music"></i><span>Audio Studio</span></a>
          <a href="writing-studio.html" class="elv-sheet-item"><i class="fa-solid fa-pen-nib"></i><span>Writing Studio</span></a>
          <a href="cover-studio.html" class="elv-sheet-item"><i class="fa-solid fa-book"></i><span>Cover Studio</span></a>
          <a href="website-studio.html" class="elv-sheet-item"><i class="fa-solid fa-globe"></i><span>Website Studio</span></a>
          <a href="university.html" class="elv-sheet-item"><i class="fa-solid fa-graduation-cap"></i><span>Elvion Learning</span></a>
        </div>
      </div>
    `;
    document.body.appendChild(sheetBackdrop);

    sheetBackdrop.addEventListener("click", (e) => {
      if (e.target === sheetBackdrop) {
        sheetBackdrop.classList.remove("open");
      }
    });

    function toggleSwitcher(forceOpen) {
      if (navigator.vibrate) navigator.vibrate(10);
      const shouldOpen =
        typeof forceOpen === "boolean"
          ? forceOpen
          : !sheetBackdrop.classList.contains("open");
      sheetBackdrop.classList.toggle("open", shouldOpen);
    }

    window.openElvionStudioSheet = function () {
      toggleSwitcher(true);
    };
    window.ElvionAppShell = { toggleSwitcher, triggerInstall: triggerElvionPWAInstall };

    // 4. Inject Mobile Bottom App Dock if page doesn't already have .bottom-nav or #bnav
    if (!document.querySelector(".bottom-nav") && !document.querySelector("#bnav")) {
      document.body.classList.add("elv-has-dock");
      const path = window.location.pathname;
      const dock = document.createElement("nav");
      dock.className = "elv-universal-dock";
      dock.innerHTML = `
        <a href="app.html" class="${path.includes("app.html") ? "active" : ""}">
          <i class="fa-solid fa-grip"></i><span>App Hub</span>
        </a>
        <a href="philadelphia.html" class="${path.includes("philadelphia.html") ? "active" : ""}">
          <i class="fa-solid fa-bolt"></i><span>Home</span>
        </a>
        <a href="profile.html" class="${path.includes("profile.html") ? "active" : ""}">
          <i class="fa-solid fa-comments"></i><span>Chat</span>
        </a>
        <button type="button" onclick="window.openElvionStudioSheet()">
          <i class="fa-solid fa-layer-group"></i><span>Studios</span>
        </button>
        <a href="university.html" class="${path.includes("university.html") ? "active" : ""}">
          <i class="fa-solid fa-graduation-cap"></i><span>Learn</span>
        </a>
      `;
      document.body.appendChild(dock);
    }

    updateInstallButtonsUI(Boolean(window.__ELVION_DEFERRED_PROMPT__));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAppShell);
  } else {
    initAppShell();
  }
})();
