// static/js/sw.js - Service Worker for Complete Offline Support

const CACHE_NAME = 'learning-journal-v2.1';
const STATIC_CACHE = 'static-cache-v2';
const DYNAMIC_CACHE = 'dynamic-cache-v2';

// Assets to cache during install 
const STATIC_ASSETS = [
    '/',
    '/about',
    '/journal', 
    '/projects',
    '/static/css/style.css',
    '/static/js/script.js',
    '/static/js/storage.js',
    '/static/js/browser.js',
    '/static/js/thirdparty.js',
    '/static/js/sw.js',
    '/static/images/icon.png',
    '/static/manifest.json',
    '/index' 
];

// API routes to cache
const API_ROUTES = [
    '/api/reflections',
    '/health'
];

// Install event - cache ALL assets 
self.addEventListener('install', (event) => {
    console.log('🔄 Service Worker installing with complete offline support (No Snake Game)...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('📦 Caching all static assets (excluding Snake game)');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker installed with complete offline support');
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
            console.log('✅ Service Worker activated with complete offline support');
            return self.clients.claim();
        })
    );
});

// Enhanced Fetch event - serve from cache or network
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

// Enhanced strategy for page requests: Cache first, then network
async function handlePageRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    
    try {
        // Try cache first for better performance
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            // Update cache in background
            fetchAndCache(request, cache);
            return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        
        // Cache the network response for next time
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('🌐 Network failed for page, serving enhanced offline page...');
        
        // Serve enhanced offline page
        return getEnhancedOfflinePage();
    }
}

// Strategy for static assets: Cache first, then network
async function handleStaticRequest(request) {
    const cache = await caches.open(STATIC_CACHE);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        // Update cache in background for static assets
        fetchAndCache(request, cache);
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // If both cache and network fail, return appropriate fallback
        if (request.url.includes('.css')) {
            return new Response('/* Offline fallback */', {
                headers: { 'Content-Type': 'text/css' }
            });
        }
        if (request.url.includes('.js')) {
            return new Response('// Offline fallback', {
                headers: { 'Content-Type': 'application/javascript' }
            });
        }
        
        return new Response('Offline - Resource not available', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// Helper function to fetch and cache in background
async function fetchAndCache(request, cache) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse);
        }
    } catch (error) {
        // Silent fail - we're just updating cache in background
        console.log('Background cache update failed:', error);
    }
}

// Enhanced offline page 
function getEnhancedOfflinePage() {
    return new Response(
        `<!DOCTYPE html>
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
                    border: 2px solid rgba(255,255,255,0.2);
                }
                h1 { 
                    margin-bottom: 1rem; 
                    font-size: 2.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                }
                p { 
                    margin-bottom: 2rem; 
                    opacity: 0.9; 
                    line-height: 1.6;
                    font-size: 1.1rem;
                }
                .features-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    margin: 2rem 0;
                }
                .feature {
                    background: rgba(255,255,255,0.1);
                    padding: 1rem;
                    border-radius: 10px;
                    text-align: center;
                }
                .feature-icon {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }
                .button-group {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                    justify-content: center;
                }
                button { 
                    background: white; 
                    color: #667eea; 
                    border: none; 
                    padding: 1rem 2rem; 
                    border-radius: 25px; 
                    font-weight: bold; 
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 1rem;
                }
                button:hover { 
                    transform: translateY(-2px); 
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                }
                .offline-note {
                    margin-top: 2rem;
                    padding: 1rem;
                    background: rgba(52, 152, 219, 0.2);
                    border-radius: 10px;
                    border: 1px solid rgba(52, 152, 219, 0.5);
                }
                @media (max-width: 768px) {
                    .offline-container {
                        padding: 2rem;
                        margin: 1rem;
                    }
                    .features-grid {
                        grid-template-columns: 1fr;
                    }
                    .button-group {
                        flex-direction: column;
                    }
                    button {
                        width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <h1>📶 You're Offline</h1>
                <p>Don't worry! Your Learning Journal PWA is designed to work completely offline. All your journal entries and content are available!</p>
                
                <div class="features-grid">
                    <div class="feature">
                        <div class="feature-icon">📖</div>
                        <strong>Journal Entries</strong>
                        <div>Read & write entries</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">👤</div>
                        <strong>About Page</strong>
                        <div>View profile</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">💾</div>
                        <strong>Local Storage</strong>
                        <div>Data saved locally</div>
                    </div>
                    <div class="feature">
                        <div class="feature-icon">⚡</div>
                        <strong>Fast Loading</strong>
                        <div>Instant access</div>
                    </div>
                </div>

                <div class="offline-note">
                    <strong>📱 Full Offline Support</strong>
                    <p>All pages and features work without internet connection. Add new entries and they'll sync when you're back online.</p>
                </div>

                <div class="button-group">
                    <button onclick="window.location.reload()">🔄 Retry Connection</button>
                    <button onclick="window.location.href='/'">🏠 Go to Home</button>
                    <button onclick="window.location.href='/journal'">📓 Open Journal</button>
                </div>
                
                <p style="margin-top: 2rem; font-size: 0.9rem; opacity: 0.7;">
                    🔄 Changes will sync automatically when you're back online
                </p>
            </div>

            <script>
                // Enhanced offline functionality
                document.addEventListener('DOMContentLoaded', function() {
                    console.log('📱 Enhanced offline page loaded');
                    
                    // Check if we're back online
                    function checkOnlineStatus() {
                        if (navigator.onLine) {
                            setTimeout(() => {
                                window.location.reload();
                            }, 2000);
                        }
                    }
                    
                    window.addEventListener('online', checkOnlineStatus);
                    setInterval(checkOnlineStatus, 5000);
                });
            </script>
        </body>
        </html>`,
        { 
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        }
    );
}

// Background sync for offline data 
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync-reflections') {
        event.waitUntil(syncPendingReflections());
    }
});

// Sync pending reflections when back online
async function syncPendingReflections() {
    try {
        // Get pending reflections from localStorage
        const pendingReflections = await getPendingReflections();
        
        for (const reflection of pendingReflections) {
            try {
                await fetch('/api/reflections', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(reflection)
                });
                console.log('✅ Synced reflection:', reflection);
            } catch (error) {
                console.error('❌ Failed to sync reflection:', error);
            }
        }
        
        // Clear pending reflections after successful sync
        await clearPendingReflections();
        
    } catch (error) {
        console.error('❌ Background sync failed:', error);
    }
}

// Helper functions for pending data
async function getPendingReflections() {
    const pending = localStorage.getItem('pendingReflections');
    return pending ? JSON.parse(pending) : [];
}

async function clearPendingReflections() {
    localStorage.removeItem('pendingReflections');
}

// Enhanced push notifications for offline events
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body || 'Your Learning Journal is ready offline!',
        icon: '/static/images/icon.png',
        badge: '/static/images/icon.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            offline: true
        },
        actions: [
            {
                action: 'open-journal',
                title: '📖 Open Journal',
                icon: '/static/images/icon.png'
            },
            {
                action: 'open-about',
                title: '👤 View Profile',
                icon: '/static/images/icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'Learning Journal - Offline Ready', 
            options
        )
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'open-journal') {
        event.waitUntil(
            clients.openWindow('/journal')
        );
    } else if (event.action === 'open-about') {
        event.waitUntil(
            clients.openWindow('/about')
        );
    } else {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});

// Periodic sync for background updates (when supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'content-update') {
        console.log('🔄 Periodic sync triggered');
        event.waitUntil(updateContent());
    }
});

async function updateContent() {
    // Update cached content in background
    try {
        const cache = await caches.open(STATIC_CACHE);
        const urlsToUpdate = [
            '/',
            '/index',
            '/journal',
            '/about',
            '/projects'
        ];
        
        for (const url of urlsToUpdate) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    await cache.put(url, response);
                    console.log('✅ Updated cache for:', url);
                }
            } catch (error) {
                console.log('❌ Failed to update:', url, error);
            }
        }
    } catch (error) {
        console.error('❌ Periodic sync failed:', error);
    }
}
