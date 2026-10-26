// ✅ Philadelphia AI — Enhanced App Service Worker v5 (Auto-Generates 192 & 512 PWA Icons)
const CACHE_NAME = "philadelphia-ai-cache-v5";

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
  "/images/IMG_20250824_133336_309.jpg"
];

// Dynamically generate a real 192x192 or 512x512 PNG from your existing IMG_20250715_102103_129.jpg logo
// so Chrome's strict PWA check passes 100% without needing extra icon files uploaded to GitHub!
async function buildPngIconResponse(size) {
  try {
    const logoResp = await fetch("/images/IMG_20250715_102103_129.jpg");
    if (
      logoResp.ok &&
      typeof OffscreenCanvas !== "undefined" &&
      typeof createImageBitmap !== "undefined"
    ) {
      const blob = await logoResp.blob();
      const bitmap = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(size, size);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(bitmap, 0, 0, size, size);
      const pngBlob = await canvas.convertToBlob({ type: "image/png" });
      return new Response(pngBlob, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000"
        }
      });
    }
  } catch (err) {
    // Fallback if OffscreenCanvas is unavailable
  }
  return fetch("/images/IMG_20250715_102103_129.jpg");
}

// ✅ INSTALL — Cache assets & pre-generate 192x192 and 512x512 PNG icons in cache
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
            // Ignore single asset failure
          }
        })
      );

      // Pre-build /images/icon-192.png and /images/icon-512.png into cache
      try {
        const icon192 = await buildPngIconResponse(192);
        if (icon192 && icon192.ok) await cache.put("/images/icon-192.png", icon192);
        const icon512 = await buildPngIconResponse(512);
        if (icon512 && icon512.ok) await cache.put("/images/icon-512.png", icon512);
      } catch (e) {}
    })
  );
  self.skipWaiting();
});

// ✅ ACTIVATE — Clean up old caches and claim clients immediately
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

// ✅ FETCH — Serve dynamic PNG icons, bypass APIs, Stale-While-Revalidate for app pages
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Intercept /images/icon-192.png and /images/icon-512.png so they NEVER 404 on GitHub
  if (url.pathname.endsWith("/images/icon-192.png") || url.pathname.endsWith("icon-192.png")) {
    event.respondWith(
      caches.match("/images/icon-192.png").then((cached) => cached || buildPngIconResponse(192))
    );
    return;
  }
  if (url.pathname.endsWith("/images/icon-512.png") || url.pathname.endsWith("icon-512.png")) {
    event.respondWith(
      caches.match("/images/icon-512.png").then((cached) => cached || buildPngIconResponse(512))
    );
    return;
  }

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
