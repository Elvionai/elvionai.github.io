// ✅ Philadelphia AI — Enhanced App Service Worker v4
const CACHE_NAME = "philadelphia-ai-cache-v4";

const CORE_ASSETS = [
  "/",
  "/app.html",
  "/philadelphia.html",
  "/index.html",
  "/about.html",
  "/enroll.html",
  "/privacy.html",
  "/profile.html",
  "/signup-login.html",
  "/studyingatelvion.html",
  "/terms.html",
  "/university.html",
  "/image-studio.html",
  "/video-studio.html",
  "/audio-studio.html",
  "/website-studio.html",
  "/writing-studio.html",
  "/cover-studio.html",
  "/api.html",
  "/blog.html",
  "/manifest.json",
  "/app-shell.js",
  "/images/IMG_20250715_102103_129.jpg",
  "/images/IMG_20250824_133336_309.jpg",
  "/images/icon-192.png",
  "/images/icon-512.png"
];

// ✅ INSTALL — Cache assets individually so a single 404 never breaks SW installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        CORE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-cache" });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            // Ignore individual asset failure during install
          }
        })
      );
    })
  );
  self.skipWaiting();
});

// ✅ ACTIVATE — Clean up old caches and take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// ✅ FETCH — Network-first for API requests, Stale-While-Revalidate for app pages/assets
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Always go straight to network for backend API calls or Firebase/Auth
  if (
    url.hostname.includes("railway.app") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("firebase") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            url.origin === self.location.origin
          ) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          if (request.mode === "navigate") {
            return caches.match("/app.html") || caches.match("/philadelphia.html");
          }
          return cachedResponse;
        });

      return cachedResponse || networkFetch;
    })
  );
});
