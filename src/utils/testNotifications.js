// Test notification utility for development
export const testNotification = () => {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('Daily Tracker Test', {
      body: 'This is a test notification from your tracker app!',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'test-notification',
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
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
    });

    notification.onclick = function() {
      window.focus();
      notification.close();
    };

    return notification;
  } else {
    console.log('Notifications not available or permission not granted');
    return null;
  }
};

// Test Firebase Cloud Messaging (if available)
export const testFCMNotification = async () => {
  try {
    // This would require a server-side implementation to send FCM messages
    // For now, we'll just log that this would be called
    console.log('FCM test notification would be sent here');
    console.log('You would need to implement a server function to send FCM messages');
    
    // Example of what the server would send:
    const examplePayload = {
      notification: {
        title: 'Daily Tracker Reminder',
        body: 'Time to check your daily tasks!'
      },
      data: {
        url: '/',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Example FCM payload:', examplePayload);
    
  } catch (error) {
    console.error('Error testing FCM notification:', error);
  }
}; 