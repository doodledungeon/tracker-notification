import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyB8iLuPBi46pDsnKoU2dVrWvhuEUFZk0ko",
  authDomain: "tracker117-ee50d.firebaseapp.com",
  projectId: "tracker117-ee50d",
  storageBucket: "tracker117-ee50d.appspot.com",
  messagingSenderId: "694623649308",
  appId: "1:694623649308:web:c5095602b699ed0bb4a9d9",
  measurementId: "G-EQL768R9K"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const messaging = getMessaging(app); 