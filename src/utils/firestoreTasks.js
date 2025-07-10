import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  orderBy
} from 'firebase/firestore';

// Add a new task for a given date and user
export async function addTask(userId, dateString, text) {
  const docRef = await addDoc(collection(db, 'tasks'), {
    userId,
    text,
    done: false,
    date: dateString,
    created: Date.now()
  });
  return { id: docRef.id, text, done: false, date: dateString };
}

// Get all tasks for a given date and user
export async function getTasks(userId, dateString) {
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    where('date', '==', dateString),
    orderBy('created', 'asc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
}

// Toggle a task's done status
export async function toggleTask(taskId, done) {
  const ref = doc(db, 'tasks', taskId);
  await updateDoc(ref, { done });
}

// Remove a task
export async function removeTask(taskId) {
  const ref = doc(db, 'tasks', taskId);
  await deleteDoc(ref);
} 