// Service Worker for AI Tools Hub PWA
// Implements offline functionality with strategic caching

const CACHE_NAME = 'ai-tools-hub-v1.0.0';
const DATA_CACHE_NAME = 'ai-tools-data-v1.0.0';

// Files to cache for offline functionality
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/offline.html',
  '/assets/favicon.svg',
  // External CDN resources
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.tailwindcss.com'
];

// Data files that need network-first strategy
const DATA_FILES = [
  '/data/links.json',
  '/data/contributors.json'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[ServiceWorker] Pre-caching static files');
        return cache.addAll(FILES_TO_CACHE.map(url => {
          return new Request(url, { cache: 'reload' });
        }));
      }),
      // Cache data files
      caches.open(DATA_CACHE_NAME).then((cache) => {
        console.log('[ServiceWorker] Pre-caching data files');
        return cache.addAll(DATA_FILES.map(url => {
          return new Request(url, { cache: 'reload' });
        }));
      })
    ])
  );
  
  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all pages
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle data files with Network First strategy
  if (DATA_FILES.some(dataFile => url.pathname.includes(dataFile.replace('/', '')))) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // Handle external CDN resources with Cache First strategy
  if (url.origin !== location.origin) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Handle app shell with Stale While Revalidate strategy
  if (url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(staleWhileRevalidateStrategy(request));
    return;
  }
  
  // Handle static assets with Cache First strategy
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' ||
      url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // Default: try cache first, then network, then offline page
  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(request).catch(() => {
        // If both cache and network fail, show offline page for navigation requests
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Network First Strategy - for dynamic data
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Update cache with fresh data
      const cache = await caches.open(DATA_CACHE_NAME);
      cache.put(request, networkResponse.clone());
      
      // Notify clients of data update
      broadcastUpdate(request.url);
      
      return networkResponse;
    }
    
    throw new Error('Network response was not ok');
  } catch (error) {
    console.log('[ServiceWorker] Network first failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Notify clients that we're serving stale data
      broadcastUpdate(request.url, true);
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Cache first failed:', error);
    throw error;
  }
}

// Stale While Revalidate Strategy - for app shell
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  // Start fetching fresh version in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      const cache = caches.open(CACHE_NAME);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => {
    // Network failed, but we might have cache
    return cachedResponse;
  });
  
  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Broadcast updates to all clients
function broadcastUpdate(url, isStale = false) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: 'DATA_UPDATE',
        url,
        isStale,
        timestamp: Date.now()
      });
    });
  });
}

// Handle background sync (future enhancement)
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-data') {
    event.waitUntil(syncData());
  }
});

// Sync data when back online
async function syncData() {
  try {
    // Refresh data files
    const cache = await caches.open(DATA_CACHE_NAME);
    
    for (const dataFile of DATA_FILES) {
      try {
        const response = await fetch(dataFile, { cache: 'no-cache' });
        if (response.ok) {
          await cache.put(dataFile, response);
          console.log('[ServiceWorker] Synced:', dataFile);
        }
      } catch (error) {
        console.log('[ServiceWorker] Sync failed for:', dataFile, error);
      }
    }
    
    // Notify clients
    broadcastUpdate('sync-complete');
  } catch (error) {
    console.log('[ServiceWorker] Background sync failed:', error);
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  const { data } = event;
  
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (data.type === 'GET_CACHE_STATUS') {
    event.ports[0].postMessage({
      type: 'CACHE_STATUS',
      cacheSize: getCacheSize(),
      lastUpdate: getLastUpdate()
    });
  }
  
  if (data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({
        type: 'CACHE_CLEARED'
      });
    });
  }
});

// Get cache size for debugging
async function getCacheSize() {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      totalSize += requests.length;
    }
    
    return totalSize;
  } catch (error) {
    return 0;
  }
}

// Get last update timestamp
function getLastUpdate() {
  return localStorage.getItem('ai-tools-last-update') || 'Never';
}

// Clear all caches
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
}

// Periodic cache cleanup (runs every hour)
setInterval(() => {
  cleanupOldCaches();
}, 60 * 60 * 1000);

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const currentCaches = [CACHE_NAME, DATA_CACHE_NAME];
    
    await Promise.all(
      cacheNames
        .filter(name => !currentCaches.includes(name))
        .map(name => caches.delete(name))
    );
  } catch (error) {
    console.log('[ServiceWorker] Cache cleanup failed:', error);
  }
}