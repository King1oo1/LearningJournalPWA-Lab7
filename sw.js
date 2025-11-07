// static/js/sw.js - Service Worker for PWA Offline Support

const CACHE_NAME = 'learning-journal-v1.7';
const STATIC_CACHE = 'static-cache-v1';
const DYNAMIC_CACHE = 'dynamic-cache-v1';

// Assets to cache during install
const STATIC_ASSETS = [
    '/',
    '/static/css/style.css',
    '/static/js/script.js',
    '/static/js/storage.js',
    '/static/js/browser.js',
    '/static/js/thirdparty.js',
    '/static/images/icon.png',
    '/static/manifest.json'  // Updated path
];

// API routes to cache
const API_ROUTES = [
    '/api/reflections'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🔄 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker installed');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Cache installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle page navigation requests
    if (request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(handlePageRequest(request));
        return;
    }

    // Handle static asset requests
    event.respondWith(handleStaticRequest(request));
});

// Strategy for API requests: Network first, then cache
async function handleApiRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Clone and cache the successful response
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('🌐 Network failed for API, trying cache...', error);
        
        // Try to serve from cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for API
        return new Response(
            JSON.stringify({ 
                message: 'You are offline. Please check your connection.',
                reflections: [] 
            }),
            { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Strategy for page requests: Cache first, then network
async function handlePageRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    
    try {
        // Try cache first
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('🌐 Network failed for page, serving offline page...');
        
        // Serve custom offline page
        return new Response(
            `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Offline - Learning Journal</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', sans-serif; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white; 
                        margin: 0; 
                        padding: 2rem; 
                        min-height: 100vh;
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        text-align: center;
                    }
                    .offline-container { 
                        background: rgba(255,255,255,0.1); 
                        padding: 3rem; 
                        border-radius: 20px; 
                        backdrop-filter: blur(10px);
                        max-width: 500px;
                    }
                    h1 { margin-bottom: 1rem; }
                    p { margin-bottom: 2rem; opacity: 0.9; }
                    button { 
                        background: white; 
                        color: #667eea; 
                        border: none; 
                        padding: 1rem 2rem; 
                        border-radius: 25px; 
                        font-weight: bold; 
                        cursor: pointer;
                        transition: transform 0.3s ease;
                    }
                    button:hover { transform: translateY(-2px); }
                </style>
            </head>
            <body>
                <div class="offline-container">
                    <h1>📶 You're Offline</h1>
                    <p>Don't worry! You can still view your cached journal entries. Some features may be limited until you're back online.</p>
                    <button onclick="window.location.reload()">🔄 Retry Connection</button>
                </div>
            </body>
            </html>
            `,
            { 
                status: 200,
                headers: { 'Content-Type': 'text/html' }
            }
        );
    }
}

// Strategy for static assets: Cache first, then network
async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // If both cache and network fail, you might return a fallback
        return new Response('Network error happened', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// Background sync for offline reflections
self.addEventListener('sync', (event) => {
    if (event.tag === 'background-sync-reflections') {
        console.log('🔄 Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    console.log('🔄 Syncing pending reflections...');
    // Implementation would depend on your specific sync needs
}

// Push notifications (extra feature)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'New update available!',
        icon: '/static/images/icon.png',
        badge: '/static/images/icon.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Learning Journal', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});