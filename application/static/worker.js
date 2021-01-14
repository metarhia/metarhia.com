const files = [
  '/',
  '/console.css',
  '/events.js',
  '/console.js',
  '/metacom.js',
  '/favicon.ico',
  '/favicon.png',
  '/metarhia.png',
  '/metarhia.svg',
];

self.addEventListener('install', (event) => event.waitUntil(
  caches.open('metarhia').then((cache) => cache.addAll(files))
));

self.addEventListener('fetch', (event) => {
  event.respondWith(caches
    .match(event.request)
    .then((response) => response || fetch(event.request))
  );
});
