/**
 * Philadelphia AI by Elvion — Native App Shell & PWA Enhancer (app-shell.js)
 * Drop-in script (<script src="app-shell.js" defer></script>) that morphs
 * any Elvion HTML page into a standalone mobile/desktop app experience.
 */
(function () {
  "use strict";
  if (window.__ELVION_APP_SHELL_LOADED__) return;
  window.__ELVION_APP_SHELL_LOADED__ = true;

  // 0. Fail-Safe Splash Screen Dismissal (prevents getting stuck midway if external scripts/ads stall)
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

  // 1. Register Service Worker automatically (for http/https origins)
  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("service-worker.js")
        .catch((err) => console.warn("SW registration note:", err));
    });
  }

  // 2. Inject App-Mode Styles & Studio Quick-Sheet Styles
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
      #installButton {
        display: none !important;
      }
    }

    /* Offline / Online Connectivity Toast */
    #elv-net-pill {
      position: fixed;
      top: 74px;
      left: 50%;
      transform: translateX(-50%) translateY(-20px);
      background: rgba(15, 15, 12, 0.96);
      border: 1px solid rgba(201, 169, 110, 0.45);
      color: #e8d5b0;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      z-index: 10002;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s ease;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.8);
    }
    #elv-net-pill.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
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

  function initAppShell() {
    // Ensure splash is scheduled for dismissal
    setTimeout(dismissSplashFailSafe, 1500);

    // 3. Connectivity Toast Pill
    const netPill = document.createElement("div");
    netPill.id = "elv-net-pill";
    document.body.appendChild(netPill);

    function showNetStatus(msg) {
      netPill.textContent = msg;
      netPill.classList.add("show");
      setTimeout(() => netPill.classList.remove("show"), 3200);
    }

    window.addEventListener("offline", () =>
      showNetStatus("⚡ Offline Mode — Using Cached App Data")
    );
    window.addEventListener("online", () =>
      showNetStatus("✨ Back Online — Live Sync Restored")
    );

    // 4. Studio Launcher Bottom Sheet
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
    window.ElvionAppShell = { toggleSwitcher };

    // 5. Inject Mobile Bottom App Dock if page doesn't already have .bottom-nav or #bnav
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAppShell);
  } else {
    initAppShell();
  }
})();
