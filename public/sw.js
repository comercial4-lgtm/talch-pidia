// Talchápidia B2B - Service Worker (sw.js)
// Strategies:
// 1. Cache-First: Static Assets (Images, Fonts, Icons, Scripts, Styles)
// 2. Stale-While-Revalidate: Tea Catalog (Catálogo de Chás e Infusões)
// 3. Network-First with Timeout Fallback: App Shell Navigation
// 4. Offline Resilience (2G/3G/Airplane Mode) + Push Notifications B2B

const CACHE_VERSION = 'v37';
const STATIC_CACHE_NAME = `talchapidia-static-${CACHE_VERSION}`;
const IMAGE_CACHE_NAME = `talchapidia-images-${CACHE_VERSION}`;
const FONT_CACHE_NAME = `talchapidia-fonts-${CACHE_VERSION}`;
const CATALOG_CACHE_NAME = `talchapidia-catalog-${CACHE_VERSION}`;

const CURRENT_CACHES = [
  STATIC_CACHE_NAME,
  IMAGE_CACHE_NAME,
  FONT_CACHE_NAME,
  CATALOG_CACHE_NAME,
];

const TALCHA_COMMERCIAL_PHONE = '5511925963961';

// Core non-HTML metadata & catalog assets to precache on installation (HTML is always network-first)
const PRECACHE_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/data/catalog.json',
];

// High-fidelity fallback SVG for images when disconnected and asset wasn't cached
const OFFLINE_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300" fill="#FAF8F5">
  <rect width="400" height="300" fill="#FAF8F5"/>
  <circle cx="200" cy="130" r="42" fill="#8B2635" opacity="0.12"/>
  <path d="M 180 130 L 220 130 C 218 152, 208 162, 200 162 C 192 162, 182 152, 180 130 Z" stroke="#8B2635" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  <path d="M 194 116 Q 197 106 195 98" stroke="#8B2635" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
  <path d="M 205 116 Q 208 106 206 98" stroke="#8B2635" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>
  <text x="200" y="200" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="#8B2635" text-anchor="middle">Talchá • Acervo Salvo Offline</text>
  <text x="200" y="222" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" fill="#7D7571" text-anchor="middle">Ativo em sincronização em segundo plano</text>
</svg>`;

// ============================================================================
// 1. INSTALL EVENT - Precache Core App Shell & Tea Catalog
// ============================================================================
self.addEventListener('install', (event) => {
  // Activate immediately without waiting for previous workers to shut down
  self.skipWaiting();

  event.waitUntil(
    (async () => {
      try {
        const staticCache = await caches.open(STATIC_CACHE_NAME);
        await staticCache.addAll(PRECACHE_ASSETS);
        console.log('[SW] Precache installed successfully');
      } catch (err) {
        console.warn('[SW] Non-blocking precache warning:', err);
      }
    })()
  );
});

// ============================================================================
// 2. ACTIVATE EVENT - Purge Outdated Caches & Claim Existing Clients
// ============================================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Take control of all clients immediately
      await self.clients.claim();

      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((name) => {
          if (!CURRENT_CACHES.includes(name)) {
            console.log('[SW] Purging outdated cache:', name);
            return caches.delete(name);
          }
        })
      );
    })()
  );
});

// ============================================================================
// Helper: Broadcast messages to all active browser windows
// ============================================================================
async function broadcastToClients(message) {
  try {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage(message);
    }
  } catch (err) {
    console.warn('[SW] Broadcast error:', err);
  }
}

// ============================================================================
// 3. FETCH EVENT - Cache Strategies
// ============================================================================
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Exclude non-http protocols (e.g. chrome-extension://, blob://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // --------------------------------------------------------------------------
  // Strategy 1: TEA CATALOG - "STALE-WHILE-REVALIDATE"
  // Handles: /data/catalog.json, /data/products.json, /api/catalog, etc.
  // Returns cached catalog immediately for 0ms render, and fetches fresh
  // catalog data in background to update cache and broadcast updates.
  // --------------------------------------------------------------------------
  const isCatalogRequest =
    url.pathname.endsWith('/catalog.json') ||
    url.pathname.endsWith('/products.json') ||
    url.pathname.includes('/data/catalog') ||
    url.pathname.includes('/api/catalog') ||
    url.pathname.includes('/api/products') ||
    url.searchParams.has('catalog');

  if (isCatalogRequest) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CATALOG_CACHE_NAME);
        const cachedResponse = await cache.match(request);

        // Fetch fresh copy from network in parallel (Revalidation)
        const fetchPromise = fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              await cache.put(request, networkResponse.clone());
              // Broadcast catalog sync notification to web clients
              broadcastToClients({
                type: 'TALCHA_CATALOG_SYNC',
                payload: {
                  url: request.url,
                  timestamp: Date.now(),
                  revalidated: true,
                },
              });
            }
            return networkResponse;
          })
          .catch((networkErr) => {
            console.log('[SW] Network revalidation failed (offline/slow):', networkErr.message);
            return null;
          });

        // If we have a cached version, return it immediately (Stale)
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache (first visit), await the network response
        const networkResponse = await fetchPromise;
        if (networkResponse) {
          return networkResponse;
        }

        // Fallback: If network failed and nothing in cache, check static cache precache
        const staticFallback = await caches.match('/data/catalog.json');
        if (staticFallback) {
          return staticFallback;
        }

        // Emergency empty catalog payload so client logic does not break
        return new Response(
          JSON.stringify({
            version: CACHE_VERSION,
            offline: true,
            products: [],
            message: 'Catálogo offline indisponível no momento.',
          }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      })()
    );
    return;
  }

  // --------------------------------------------------------------------------
  // Strategy 2: STATIC ASSETS - "CACHE-FIRST"
  // Handles:
  //   - Web Fonts (Google Fonts, gstatic, local woff2/woff)
  //   - Images & Icons (talcha CDN, shopify CDN, local /images, icon.svg, png, etc.)
  //   - Static Bundles (Vite hashed JS, CSS, /assets/*)
  // --------------------------------------------------------------------------

  // 2A: Fonts (Cache-First)
  const isFont =
    request.destination === 'font' ||
    url.origin === 'https://fonts.googleapis.com' ||
    url.origin === 'https://fonts.gstatic.com' ||
    url.pathname.match(/\.(woff|woff2|ttf|otf|eot)$/i);

  if (isFont) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(FONT_CACHE_NAME);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          // Opaque response (status 0) or 200 is acceptable for cross-origin fonts
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cachedResponse || new Response('', { status: 408 });
        }
      })()
    );
    return;
  }

  // 2B: Images & Icons (Cache-First with offline SVG fallback)
  const isImage =
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpg|jpeg|webp|avif|svg|gif|ico)$/i) ||
    url.origin === 'https://talcha.com.br' ||
    url.hostname.includes('talcha.com.br') ||
    url.origin === 'https://images.unsplash.com' ||
    url.pathname.includes('/cdn/shop/files/') ||
    url.pathname.includes('/assets/images/');

  if (isImage) {
    const isBrandAsset = url.pathname.includes('logo_talcha_');
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        if (!isBrandAsset) {
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
        }

        try {
          const networkResponse = await fetch(request, isBrandAsset ? { cache: 'no-store' } : undefined);
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cachedResponse = await cache.match(request);
          if (cachedResponse) return cachedResponse;
          return new Response(OFFLINE_IMAGE_SVG, {
            headers: {
              'Content-Type': 'image/svg+xml',
              'Cache-Control': 'no-store',
            },
          });
        }
      })()
    );
    return;
  }

  // 2C: Static Bundles, Vite Modules & Manifest (Network-First with Offline Cache Fallback)
  const isStaticBundle =
    request.destination === 'script' ||
    request.destination === 'style' ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.css') ||
    url.pathname === '/manifest.json' ||
    url.pathname === '/icon.svg';

  if (isStaticBundle) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(STATIC_CACHE_NAME);
        try {
          const networkResponse = await fetch(request, { cache: 'no-store' });
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          const cachedResponse = await cache.match(request);
          return cachedResponse || new Response('', { status: 408 });
        }
      })()
    );
    return;
  }

  // --------------------------------------------------------------------------
  // Strategy 3: NAVIGATION & APP SHELL (Network-First with Quick Timeout Fallback)
  // Ensures fast rendering on 2G/3G without hanging the page.
  // --------------------------------------------------------------------------
  if (
    request.mode === 'navigate' ||
    (request.headers.get('accept') && request.headers.get('accept').includes('text/html'))
  ) {
    event.respondWith(
      (async () => {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Network timeout')), 8000)
          );
          const networkPromise = fetch(request, { cache: 'no-store' });
          const response = await Promise.race([networkPromise, timeoutPromise]);

          if (response && response.status === 200) {
            const cache = await caches.open(STATIC_CACHE_NAME);
            cache.put(request, response.clone());
            return response;
          }
        } catch {
          // Network failed or timed out (offline / 2G)
        }

        const cachedHtml =
          (await caches.match(request)) ||
          (await caches.match('/index.html')) ||
          (await caches.match('/'));

        if (cachedHtml) {
          return cachedHtml;
        }

        return new Response('Talchápidia Offline', {
          headers: { 'Content-Type': 'text/plain' },
          status: 503,
        });
      })()
    );
    return;
  }

  // --------------------------------------------------------------------------
  // Default Strategy: Network with Cache Fallback
  // --------------------------------------------------------------------------
  event.respondWith(
    (async () => {
      try {
        const networkResponse = await fetch(request);
        return networkResponse;
      } catch {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        return new Response('', { status: 503 });
      }
    })()
  );
});

// ============================================================================
// 4. PUSH NOTIFICATIONS EVENT - Background updates from server
// ============================================================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'Talchá • Atualização B2B',
    body: 'Novo lote de chás especiais ou atualização de estoque no centro de distribuição.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'talcha-push-' + Date.now(),
    data: {
      url: '/?open=catalogo',
      type: 'stock_update',
    },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      data = Object.assign({}, data, payload);
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    tag: data.tag || 'talcha-notification',
    data: data.data || { url: '/' },
    vibrate: [150, 80, 150],
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open_catalog',
        title: 'Ver no Catálogo',
      },
      {
        action: 'contact_whatsapp',
        title: 'Falar no WhatsApp',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

// ============================================================================
// 5. NOTIFICATION CLICK - Navigate or open WhatsApp
// ============================================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const notifData = event.notification.data || {};
  let targetUrl = notifData.url || '/';

  if (action === 'contact_whatsapp') {
    const textMsg = encodeURIComponent(
      'Olá! Recebi uma notificação sobre atualização de estoque/lançamento na Talchápidia e gostaria de verificar.'
    );
    targetUrl = `https://wa.me/${TALCHA_COMMERCIAL_PHONE}?text=${textMsg}`;
  } else if (action === 'open_catalog') {
    targetUrl = '/?mode=catalogo';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (targetUrl.startsWith('https://wa.me')) {
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return;
      }

      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'TALCHA_NOTIFICATION_CLICK',
            payload: notifData,
          });
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ============================================================================
// 6. MESSAGE EVENT - Inter-process communication with web app
// ============================================================================
self.addEventListener('message', (event) => {
  if (!event.data) return;

  // Immediate notification trigger
  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const finalOptions = Object.assign(
      {
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [150, 80, 150],
        tag: 'talcha-alert-' + Date.now(),
        actions: [
          { action: 'open_catalog', title: 'Ver Detalhes' },
          { action: 'contact_whatsapp', title: 'WhatsApp B2B' },
        ],
      },
      options
    );

    event.waitUntil(self.registration.showNotification(title, finalOptions));
  }

  // Precache specific array of asset URLs on demand
  if (event.data.type === 'CACHE_URLS') {
    const { urls } = event.data;
    if (Array.isArray(urls)) {
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        urls.forEach((url) => {
          fetch(url, { mode: 'no-cors' })
            .then((res) => {
              cache.put(url, res);
            })
            .catch(() => {});
        });
      });
    }
  }

  // Scheduled simulated alert
  if (event.data.type === 'SCHEDULE_SIMULATED_ALERT') {
    const { delayMs, title, options } = event.data;
    setTimeout(() => {
      self.registration.showNotification(
        title,
        Object.assign(
          {
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [200, 100, 200],
            tag: 'talcha-scheduled-' + Date.now(),
            actions: [
              { action: 'open_catalog', title: 'Ver no Catálogo' },
              { action: 'contact_whatsapp', title: 'WhatsApp B2B' },
            ],
          },
          options
        )
      );
    }, delayMs || 5000);
  }

  // Skip waiting command
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Ping / health check
  if (event.data.type === 'PING') {
    if (event.source) {
      event.source.postMessage({
        type: 'PONG',
        timestamp: Date.now(),
        version: CACHE_VERSION,
      });
    }
  }
});
