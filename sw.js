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

// 1. Instalación: guardar los recursos en caché y prepararse para activarse al instante
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

// 2. Activación: limpiar las cachés antiguas y tomar el control de inmediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Eliminando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Gestión de peticiones: soporte sin conexión, arranque rápido y protección para WebKit
self.addEventListener('fetch', (event) => {
  // Gestionar solo las peticiones GET
  if (event.request.method !== 'GET') return;

  // Navegación de páginas / peticiones de apertura de la PWA (Navegación)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        // Comprobar la página raíz en caché (apertura rápida y soporte sin conexión)
        const cachedResponse = (await caches.match(event.request)) || (await caches.match('./'));

        // Si hay conexión, obtener la nueva versión en segundo plano y refrescar la caché
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

        // Si está en caché, limpiar el error de redirección de Safari y servirla al instante
        if (cachedResponse) {
          return cleanResponse(cachedResponse);
        }

        // Si no está en caché, esperar la respuesta de red
        const networkResponse = await fetchPromise;
        if (networkResponse) {
          return networkResponse;
        }

        return new Response('TeslaSound - Sin conexión', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })()
    );
    return;
  }

  // Archivos estáticos (CSS, JS, iconos, etc.) - Stale While Revalidate
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
