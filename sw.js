// SKILL ISSUE service worker: keeps a copy of the app so the installed version opens offline.
// Not bundled. vite.config.ts fills in the build id and file list and writes it to dist/sw.js.
const BUILD = 'e0eedf025fc6';
const FILES = ["assets/CharacterView-C1Ipa-W6.js","assets/ChronicleView-BsxOzfpA.js","assets/Companion-R76RRmY0.js","assets/ComposerView-Cjuil5SB.js","assets/CourseCta-CMigtAs7.js","assets/GameRound-Bm1VzrD9.js","assets/JourneyView-BCR_Jqs7.js","assets/MicTest-DlSRfTxg.js","assets/PlaythroughView-FrpVEXTA.js","assets/QuestsView-ONncYxnj.js","assets/ReviewView-xbo-CYKW.js","assets/SettingsView-ByaQ3dXw.js","assets/SkillsView-C-98G_nJ.js","assets/TipsCard-DpJBlhRj.js","assets/TrainView-DBM15FZJ.js","assets/WritingPad-EEPMdy07.js","assets/games-MbhbExZO.js","assets/harsh-en-B33KvNh2.js","assets/harsh-pt-DRpRQSUn.js","assets/harsh-zh-B5J1opY0.js","assets/index-8c1jAJe7.css","assets/index-B55CtSua.js","assets/index-BBfChRCj.js","assets/lilita-one-latin-87r-Z-Re.woff2","assets/lilita-one-latin-ext-DxX3B4s6.woff2","assets/mapFocus-B7MtIaI-.js","assets/nunito-latin-BzFMHfZw.woff2","assets/nunito-latin-ext-CXYtwYOx.woff2","assets/reading-CxicwzUJ.js","assets/text-en-O1dUO9DT.js","assets/text-pt-iLCYQMLK.js","assets/text-zh-BG50EhBy.js","favicon.svg","icons/apple-touch-icon.png","icons/icon-192.png","icons/icon-512.png","icons/icon-maskable-192.png","icons/icon-maskable-512.png","index.html","licenses/OFL-Lilita-One.txt","licenses/OFL-Nunito.txt","manifest.webmanifest"];
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
