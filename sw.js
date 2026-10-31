// SKILL ISSUE service worker: keeps a copy of the app so the installed version opens offline.
// Not bundled. vite.config.ts fills in the build id and file list and writes it to dist/sw.js.
const BUILD = 'bc5fa922c9c2';
const FILES = ["assets/CharacterView-BvbRwjhv.js","assets/ChronicleView-CVQMYcIR.js","assets/Companion-NZBov2hv.js","assets/ComposerView-Cr6y2Xic.js","assets/CourseCta-BaeCCcww.js","assets/JourneyView-DTrMjmR8.js","assets/MicTest-BQHYASeh.js","assets/QuestsView-BfL67Dsi.js","assets/ReviewView-BP8Ueevr.js","assets/SettingsView-anzPV-Pt.js","assets/SkillsView-Bq2lSaTH.js","assets/TipsCard-Bz8fb3T6.js","assets/harsh-en-B33KvNh2.js","assets/harsh-pt-DRpRQSUn.js","assets/harsh-zh-B5J1opY0.js","assets/index-Cl9bLaqM.js","assets/index-CxWvaI95.css","assets/lilita-one-latin-87r-Z-Re.woff2","assets/lilita-one-latin-ext-DxX3B4s6.woff2","assets/nunito-latin-BzFMHfZw.woff2","assets/nunito-latin-ext-CXYtwYOx.woff2","assets/reading-DXQaMUAX.js","assets/text-en-DYHx1vl-.js","assets/text-pt-DhyEwq9t.js","assets/text-zh-Cl-fMmK9.js","favicon.svg","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png","index.html","licenses/OFL-Lilita-One.txt","licenses/OFL-Nunito.txt","manifest.webmanifest"];
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
      // Every older copy goes, including the Google Fonts one earlier versions kept (the fonts are part of the app now).
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
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
    event.respondWith(fetch(request).catch(() => caches.match('index.html', { cacheName: CACHE, ignoreVary: true })));
    return;
  }

  // Built files have hashed names, so a saved copy is never stale.
  // ignoreVary: module scripts send an Origin header the install request did not, and some hosts answer "Vary: Origin".
  event.respondWith(caches.match(request, { ignoreVary: true }).then((hit) => hit ?? fetch(request)));
});
