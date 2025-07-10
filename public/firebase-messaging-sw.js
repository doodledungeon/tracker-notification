// [START initialize_firebase_in_sw]
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB8iLuPBi46pDsnKoU2dVrWvhuEUFZk0ko",
  authDomain: "tracker117-ee50d.firebaseapp.com",
  projectId: "tracker117-ee50d",
  storageBucket: "tracker117-ee50d.appspot.com",
  messagingSenderId: "694623649308",
  appId: "1:694623649308:web:c5095602b699ed0bb4a9d9",
  measurementId: "G-EQL768R9K"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customize notification for iOS
  const notificationTitle = payload.notification?.title || 'Daily Tracker';
  const notificationOptions = {
    body: payload.notification?.body || 'You have tasks to complete!',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'daily-tracker-notification',
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
    data: payload.data || {},
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-192x192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    // Open the app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[firebase-messaging-sw.js] Notification closed:', event.notification.tag);
});

// Log service worker installation
self.addEventListener('install', function(event) {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
});

// Log service worker activation
self.addEventListener('activate', function(event) {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
});
// [END initialize_firebase_in_sw] 