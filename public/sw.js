// public/sw.js
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
// Ingen fetch-handler. Ingen HTML-caching.
