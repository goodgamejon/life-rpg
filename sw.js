// SKILL ISSUE service worker: keeps a copy of the app so the installed version opens offline.
// Not bundled. vite.config.ts fills in the build id and file list and writes it to dist/sw.js.
const BUILD = 'bc345d080f89';
const FILES = ["assets/index-D07qEKMR.css","assets/index-XIJqYgEa.js","favicon.svg","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png","index.html","manifest.webmanifest"];
const CACHE = `life-rpg-${BUILD}`;
const FONTS = 'life-rpg-fonts';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE && key !== FONTS).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Google Fonts: serve the saved copy, refresh it in the background.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    const refresh = fetch(request).then(async (response) => {
      if (response.ok || response.type === 'opaque') await (await caches.open(FONTS)).put(request, response.clone());
      return response;
    });
    event.waitUntil(refresh.catch(() => undefined));
    event.respondWith(caches.match(request).then((hit) => hit ?? refresh));
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Pages: network first so a new publish shows up right away; the saved page when offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('index.html', { cacheName: CACHE, ignoreVary: true })));
    return;
  }

  // Built files have hashed names, so a saved copy is never stale.
  // ignoreVary: module scripts send an Origin header the install request did not, and some hosts answer "Vary: Origin".
  event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit ?? fetch(request)));
});
