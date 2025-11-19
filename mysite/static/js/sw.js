// static/js/sw.js - SERVICE WORKER FIXED FOR OFFLINE NAVIGATION

const CACHE_NAME = 'learning-journal-offline-fixed-v4';
const STATIC_CACHE = 'static-v4';
const DYNAMIC_CACHE = 'dynamic-v4';

// ALL navigation routes that need to be cached
const NAVIGATION_ROUTES = [
    '/',
    '/journal',
    '/about', 
    '/projects',
    '/offline'
];

// Static assets
const STATIC_ASSETS = [
    '/static/css/style.css',
    '/static/js/script.js',
    '/static/js/storage.js',
    '/static/js/browser.js',
    '/static/js/thirdparty.js',
    '/static/images/icon.png',
    '/static/manifest.json'
];

// Install - Cache ALL navigation routes
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker installing - caching navigation routes...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Caching navigation routes:', NAVIGATION_ROUTES);
                
                // Cache navigation routes first
                return Promise.all(
                    NAVIGATION_ROUTES.map(route => {
                        return cache.add(route).catch(err => {
                            console.warn(`Could not cache ${route}:`, err);
                            return Promise.resolve(); // Continue even if one fails
                        });
                    })
                ).then(() => {
                    console.log('📦 Caching static assets...');
                    return cache.addAll(STATIC_ASSETS).catch(err => {
                        console.warn('Some assets failed to cache:', err);
                    });
                });
            })
            .then(() => {
                console.log('✅ All routes cached successfully!');
                return self.skipWaiting(); // Activate immediately
            })
    );
});

// Activate - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('🔄 Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        console.log('🗑️ Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ Service Worker ready for offline navigation!');
            return self.clients.claim(); // Take control immediately
        })
    );
});

// Fetch - Handle ALL requests
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Handle navigation requests (HTML pages)
    if (request.headers.get('Accept')?.includes('text/html')) {
        event.respondWith(handleNavigationRequest(request));
        return;
    }

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets
    event.respondWith(handleStaticRequest(request));
});

// STRATEGY FOR NAVIGATION - CRITICAL FIX
async function handleNavigationRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    const url = new URL(request.url);

    console.log('🧭 Handling navigation to:', url.pathname);

    try {
        // FIRST: Try network for fresh content
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the successful response
            cache.put(request, networkResponse.clone());
            console.log('✅ Served from network:', url.pathname);
            return networkResponse;
        }
    } catch (error) {
        console.log('🌐 Network failed, trying cache for:', url.pathname);
        
        // SECOND: Try cache when network fails
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('✅ Served from cache:', url.pathname);
            return cachedResponse;
        }

        // THIRD: Try alternative URL formats
        const altUrls = [
            request.url,
            url.pathname,
            url.pathname + '/',
            url.pathname.replace(/\/$/, '') // remove trailing slash
        ];

        for (const altUrl of altUrls) {
            const altCached = await cache.match(altUrl);
            if (altCached) {
                console.log('✅ Served from alternative URL:', altUrl);
                return altCached;
            }
        }

        // FOURTH: If root path, try index
        if (url.pathname === '/') {
            const indexCached = await cache.match('/');
            if (indexCached) {
                console.log('✅ Served root from cache');
                return indexCached;
            }
        }
    }

    // FINAL FALLBACK: Serve offline page
    console.log('❌ No cache found, serving offline page');
    return serveOfflinePage();
}

// API requests strategy
async function handleApiRequest(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Return empty data for offline
        return new Response(
            JSON.stringify({ reflections: [] }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

// Static assets strategy
async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        return new Response('Asset not available offline', {
            status: 408, headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Enhanced offline page
async function serveOfflinePage() {
    const cache = await caches.open(STATIC_CACHE);
    const offlinePage = await cache.match('/offline');
    
    if (offlinePage) return offlinePage;

    // Create comprehensive offline page
    return new Response(
        `<!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Learning Journal</title>
            <style>
                body { 
                    font-family: 'Segoe UI', sans-serif; 
                    background: #2c3e50; 
                    color: white; 
                    margin: 0; 
                    padding: 2rem;
                    text-align: center;
                }
                .container { 
                    max-width: 500px; 
                    margin: 2rem auto; 
                    padding: 2rem; 
                    background: rgba(255,255,255,0.1); 
                    border-radius: 10px; 
                }
                h1 { color: #e74c3c; }
                button { 
                    background: #3498db; 
                    color: white; 
                    border: none; 
                    padding: 1rem 2rem; 
                    margin: 0.5rem; 
                    border-radius: 5px; 
                    cursor: pointer; 
                }
                .nav { margin: 2rem 0; }
                .nav a { 
                    color: #3498db; 
                    margin: 0 1rem; 
                    text-decoration: none; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>📶 You're Offline</h1>
                <p>But don't worry! Your Learning Journal can still work offline.</p>
                <div class="nav">
                    <a href="/">Home</a>
                    <a href="/journal">Journal</a>
                    <a href="/about">About</a>
                    <a href="/projects">Projects</a>
                </div>
                <button onclick="window.location.reload()">Retry Connection</button>
                <button onclick="window.location.href='/'">Go Home</button>
            </div>
        </body>
        </html>`,
        { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
}