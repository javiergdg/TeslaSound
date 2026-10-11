const CACHE_NAME = 'teslasound-v23';
const ASSETS_TO_CACHE = [
  './',
  './styles.css',
  './vehicles.js',
  './engine-dsp.js',
  './audio-engine.js',
  './physics.js',
  './app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

/**
 * Safari WebKit restricts responses passed to event.respondWith from having
 * response.redirected === true. Otherwise, WebKit throws:
 * "Response served by service worker has redirections".
 * This function reconstructs a fresh Response object without the redirected flag.
 */
function cleanResponse(response) {
  if (!response || !response.redirected || response.status === 0) {
    return response;
  }
  try {
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (err) {
    return response;
  }
}

// 1. Kurulum: Varlıkları önbelleğe al ve anında aktifleşmeye hazırlan
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of ASSETS_TO_CACHE) {
        try {
          const res = await fetch(url, { redirect: 'follow' });
          if (res.ok) {
            await cache.put(url, cleanResponse(res));
          }
        } catch (err) {
          console.warn('[SW] Precache failed for:', url, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

// 2. Etkinleştirme: Eski önbellekleri temizle ve kontrolü hemen devral
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eski önbellek siliniyor:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. İstek Yönetimi: Çevrimdışı destek, hızlı başlatma ve WebKit koruması
self.addEventListener('fetch', (event) => {
  // Yalnızca GET isteklerini ele al
  if (event.request.method !== 'GET') return;

  // Sayfa yönlendirme / PWA açılış istekleri (Navigasyon)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // Önbellekteki kök sayfayı kontrol et (Hızlı açılış ve çevrimdışı destek)
        const cachedResponse = (await caches.match(event.request)) || (await caches.match('./'));

        // Çevrimiçi ise arka planda yeni sürümü al ve önbelleği tazele
        const fetchPromise = fetch(event.request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.ok) {
              const cache = await caches.open(CACHE_NAME);
              cache.put('./', cleanResponse(networkResponse.clone()));
              cache.put(event.request, cleanResponse(networkResponse.clone()));
            }
            return cleanResponse(networkResponse);
          })
          .catch(() => null);

        // Önbellekte varsa Safari yönlendirme hatasını temizleyip anında sun
        if (cachedResponse) {
          return cleanResponse(cachedResponse);
        }

        // Önbellekte yoksa ağ yanıtını bekle
        const networkResponse = await fetchPromise;
        if (networkResponse) {
          return networkResponse;
        }

        return new Response('TeslaSound - Çevrimdışı', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })()
    );
    return;
  }

  // Statik dosyalar (CSS, JS, İkonlar vs.) - Stale While Revalidate
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(event.request);

      const fetchPromise = fetch(event.request)
        .then(async (networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, cleanResponse(networkResponse.clone()));
          }
          return cleanResponse(networkResponse);
        })
        .catch(() => null);

      if (cachedResponse) {
        return cleanResponse(cachedResponse);
      }

      const networkRes = await fetchPromise;
      if (networkRes) {
        return networkRes;
      }

      return new Response('', { status: 404 });
    })()
  );
});
