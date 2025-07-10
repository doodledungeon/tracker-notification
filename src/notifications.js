import { messaging } from './firebase';
import { getToken } from 'firebase/messaging';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// Check if running on iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function requestNotificationPermission(userId) {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return null;
    }

    // Check if service workers are supported (required for FCM)
    if (!('serviceWorker' in navigator)) {
      alert('Service workers are not supported in this browser');
      return null;
    }

    // For iOS, we need to check if the app is installed as PWA
    if (isIOS && !window.navigator.standalone) {
      alert('For best notification experience on iOS, please add this app to your home screen and open it from there.');
    }

    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      try {
        // Register the service worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service Worker registered:', registration);
        
        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: 'BFj48n9xoTseED0-WWxJLzDTYyfjPtdqoYD0pAjAWfdwYM6I3Gk5nLI-pD-snfN9XnAMJomm6KAIa_N6TVhfHf8',
          serviceWorkerRegistration: registration,
        });
        
        console.log('FCM Token:', token);
        
        // Save this token to Firestore for the user
        if (userId && token) {
          await setDoc(doc(db, 'fcmTokens', userId), { 
            token,
            platform: isIOS ? 'ios' : 'web',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          });
          console.log('Token saved to Firestore');
        }
        
        // Show success message
        if (isIOS) {
          alert('Notifications enabled! You\'ll receive reminders about your daily tasks.');
        } else {
          console.log('Notifications enabled successfully');
        }
        
        return token;
      } catch (swError) {
        console.error('Service Worker registration failed:', swError);
        alert('Failed to set up notifications. Please try again.');
        return null;
      }
    } else if (permission === 'denied') {
      alert('Notification permission denied. You can enable it later in your browser settings.');
      return null;
    } else {
      console.log('Notification permission request was dismissed');
      return null;
    }
  } catch (err) {
    console.error('Error getting notification permission or token', err);
    alert('There was an error setting up notifications. Please try again.');
    return null;
  }
}

// Function to check current notification permission status
export function getNotificationPermissionStatus() {
  if (!('Notification' in window)) {
    return 'not-supported';
  }
  return Notification.permission;
}

// Function to check if the app is installed as PWA on iOS
export function isPWAInstalled() {
  if (isIOS) {
    return window.navigator.standalone;
  }
  return true; // For non-iOS, assume it's fine
} 