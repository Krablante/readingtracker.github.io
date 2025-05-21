const CACHE_NAME = 'reading-tracker-cache-v8';
const urlsToCache = ['.', 'index.html', 'style.css', 'app.js', 'manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // 1) Игнорируем запросы к Firestore и Google Identity APIs
  if (
    requestUrl.origin.includes('firestore.googleapis.com') ||
    requestUrl.origin.includes('identitytoolkit.googleapis.com') ||
    requestUrl.pathname.startsWith('/__/')
  ) {
    return; // пропускаем эти запросы напрямую
  }

  // 2) Не кешируем index.html и корневой запрос — всегда свежая версия
  if (
    requestUrl.origin === location.origin &&
    (requestUrl.pathname === '/' || requestUrl.pathname.endsWith('/index.html'))
  ) {
    return; // браузер сам выполнит запрос к сети
  }

  // 3) Cache-first для прочих ресурсов
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
