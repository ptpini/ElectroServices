// Service worker: guarda la app en el teléfono para que abra rápido.
// Los datos siempre vienen de Supabase (necesita internet para guardar).
// Para forzar una actualización en los teléfonos, cambia VERSION.
const VERSION = 'es-1.2.0';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'css/styles.css?v=1.2.0', 'js/config.js?v=1.2.0', 'js/vendor/supabase.js', 'js/db.js?v=1.2.0', 'js/app.js?v=1.2.0',
  'icons/icon-192.png', 'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Primero internet (para recibir actualizaciones); si no hay señal, la copia guardada.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
  );
});
