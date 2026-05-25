// Minimal service worker — required for Chrome's PWA install prompt criteria.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Mandatory empty fetch listener so Chrome considers the app installable.
self.addEventListener('fetch', (event) => {
  // no-op: pass through to network
});
