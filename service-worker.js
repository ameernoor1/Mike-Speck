const CACHE_NAME = 'voice-typer-v1.0.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// ===== تثبيت الـ Service Worker وتخزين الملفات =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// ===== تفعيل الـ Service Worker وحذف الكاشات القديمة =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ===== استراتيجية: Network First ثم Cache Fallback =====
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير HTTP
  if (!event.request.url.startsWith('http')) return;

  // تجاهل طلبات Chrome Extensions
  if (event.request.url.includes('chrome-extension')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // حفظ نسخة في الكاش إذا كان الرد ناجحاً
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // في حالة عدم الاتصال، استخدم الكاش
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // إرجاع الصفحة الرئيسية للـ SPA
          return caches.match('./index.html');
        });
      })
  );
});

// ===== استقبال رسائل من الصفحة =====
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
