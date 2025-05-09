// sw.js

const CACHE_NAME = 'abastecimento-trator-cache-v1.1'; // Increment version for updates

// IMPORTANT: Add any new local files or icons you create to this list.
// For CDN resources, ensure they are cachable or consider hosting them locally.
const URLS_TO_CACHE = [
  './', // This will cache the root URL, often serving index.html
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  
  // Placeholder icons - replace with your actual icon paths if they differ
  // These should match the paths used in manifest.json
  './icon-192x192.png',
  './icon-512x512.png',
  './icon-maskable-192x192.png',
  './icon-maskable-512x512.png',

  // External libraries from CDN
  // Caching these can be complex due to CORS and opaque responses.
  // For full offline reliability, hosting these locally is recommended.
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  // Font Awesome font files (these paths are typical but might vary)
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-brands-400.woff2',
  
  'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js'
];

// Install event: cache core assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        // Attempt to cache all specified URLs.
        // Some external resources might fail due to CORS if not configured properly by the CDN.
        const cachePromises = URLS_TO_CACHE.map(urlToCache => {
          return cache.add(urlToCache).catch(err => {
            // Log errors for individual asset caching failures but don't let it stop SW installation
            // for non-critical assets. If index.html or core scripts fail, the app might not work.
            console.warn(`[Service Worker] Failed to cache ${urlToCache}: ${err}`);
          });
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[Service Worker] All specified assets pre-caching complete (or attempted).');
        return self.skipWaiting(); // Activate the new SW immediately
      })
      .catch(error => {
        console.error('[Service Worker] Pre-caching failed:', error);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[Service Worker] Activated and old caches cleaned.');
        return self.clients.claim(); // Take control of uncontrolled clients (e.g., open tabs)
    })
  );
});

// Fetch event: serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  // For navigation requests (typically HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If network request is successful, clone, cache, and return it
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve the main page from cache
          console.log('[Service Worker] Network fetch failed for navigation, trying cache for:', event.request.url);
          return caches.match(event.request) // Try to match the exact navigation request
            .then(cachedResponse => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Fallback to the main index.html if specific navigation request isn't cached
              // This ensures the app shell loads even if a deep link was attempted offline.
              return caches.match('./index.html'); 
            });
        })
    );
    return;
  }

  // For other requests (CSS, JS, images, fonts), use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse; // Serve from cache
        }
        // Not in cache, fetch from network
        return fetch(event.request).then(
          networkResponse => {
            // If the request is successful, clone, cache, and return it
            if (networkResponse && networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          }
        ).catch(error => {
          console.error('[Service Worker] Fetch failed for non-navigation request:', event.request.url, error);
          // Optionally provide a fallback for specific asset types like images
          // e.g., if (event.request.destination === 'image') return caches.match('./placeholder-image.png');
          // For now, just let it fail, and the browser will show its default error.
        });
      })
  );
});

/*
// --- Conceptual: Background Sync for sending data to a server ---
// This part is for if you later add a server backend.
// The application (script.js) would need to:
// 1. Save data to IndexedDB (Service Workers cannot directly access localStorage).
// 2. Register a sync event: navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-abastecimentos'));

self.addEventListener('sync', event => {
  if (event.tag === 'sync-abastecimentos') {
    console.log('[Service Worker] Background sync event triggered for: ', event.tag);
    event.waitUntil(syncDataToServer());
  }
});

async function syncDataToServer() {
  // This function would:
  // 1. Open IndexedDB.
  // 2. Read unsynced data.
  // 3. Send data to your server API (e.g., using fetch).
  // 4. If successful, mark data as synced in IndexedDB or remove it.
  // 5. If failed, keep data for next sync attempt.
  console.log('[Service Worker] Attempting to sync data to server...');
  try {
    // Example: const data = await readDataFromIndexedDB('unsynced_store');
    // if (data.length === 0) return;
    // const response = await fetch('/api/sync-data', { method: 'POST', body: JSON.stringify(data) });
    // if (response.ok) {
    //   await markDataAsSyncedInIndexedDB('unsynced_store', data.map(d => d.id));
    //   console.log('[Service Worker] Data synced successfully.');
    // } else {
    //   console.error('[Service Worker] Server error during sync:', response.status);
    //   // Potentially throw an error to retry the sync later if it's a network/server issue
    //   if (response.status >= 500) throw new Error('Server error');
    // }
  } catch (error) {
    console.error('[Service Worker] Error during sync:', error);
    throw error; // Ensure the sync event retries if an error occurs
  }
}
*/