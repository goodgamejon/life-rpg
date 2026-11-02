// SKILL ISSUE service worker: keeps a copy of the app so the installed version opens offline.
// Not bundled. vite.config.ts fills in the build id and file list and writes it to dist/sw.js.
const BUILD = '34ab943ee22e';
const FILES = ["assets/CharacterView-B6GuVvyb.js","assets/ChronicleView-C3FACmL8.js","assets/Companion-BV9NvjYG.js","assets/ComposerView-CplOzFuq.js","assets/CourseCta-u7fxvYgd.js","assets/GameRound-HX18r7KR.js","assets/JourneyView-Dd1ukYV9.js","assets/MicTest-DUU8abpn.js","assets/PlaythroughView-DgOGVxKo.js","assets/QuestsView-BNrHe2xg.js","assets/ReviewView-DaOaGJBw.js","assets/SettingsView-BVbkvXru.js","assets/SkillsView-Dv2EPXmA.js","assets/TipsCard-D7fi3DCe.js","assets/WritingPad-juhf4Imk.js","assets/games-MbhbExZO.js","assets/harsh-en-B33KvNh2.js","assets/harsh-pt-DRpRQSUn.js","assets/harsh-zh-B5J1opY0.js","assets/index-BzZjYpr0.js","assets/index-CUQY__Vb.js","assets/index-D9sVkxlM.css","assets/lilita-one-latin-87r-Z-Re.woff2","assets/lilita-one-latin-ext-DxX3B4s6.woff2","assets/nunito-latin-BzFMHfZw.woff2","assets/nunito-latin-ext-CXYtwYOx.woff2","assets/reading-W1rO06t3.js","assets/text-en-DCZmnAFx.js","assets/text-pt-C6ErXaT5.js","assets/text-zh-DB0yS_qm.js","favicon.svg","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png","index.html","licenses/OFL-Lilita-One.txt","licenses/OFL-Nunito.txt","manifest.webmanifest"];
const CACHE = `life-rpg-${BUILD}`;

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
      // Only this app's caches (life-rpg-*). Leave any other origin cache alone; drop our older builds.
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith('life-rpg-') && key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // The app makes no request to any other site, so anything from elsewhere is left alone.
  if (url.origin !== self.location.origin) return;

  // Pages: network first so a new publish shows up right away; the saved page when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // A failed navigate (404 after a partial publish) falls back to the installed shell.
          if (!response.ok) throw new Error('navigate');
          return response;
        })
        .catch(() => caches.match('index.html', { cacheName: CACHE, ignoreVary: true }).then((hit) => hit || Response.error())),
    );
    return;
  }

  // Built files have hashed names, so a saved copy is never stale.
  // ignoreVary: module scripts send an Origin header the install request did not, and some hosts answer "Vary: Origin".
  // Offline: prefer the cache; if missing (mid-update), try the network once, then fail cleanly.
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then((hit) => {
      if (hit) return hit;
      return fetch(request).catch(() => Response.error());
    }),
  );
});
