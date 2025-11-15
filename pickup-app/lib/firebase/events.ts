import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { PickupEvent } from '@/types';

const EVENTS_COLLECTION = 'events';

// Create a new pickup event
/* eventName, type, , subType, startTime, endTime, createdAt, expiresAt, status */
//TODO add location data field.
export async function createEvent(eventData: Omit<PickupEvent, 'createdAt' | 'expiresAt' | 'status'> & { startTime: Date; endTime: Date; eventName: string; type: string; subType: string }) {
  const now = new Date();
  const { startTime, endTime, eventName, type, subType, ...rest } = eventData;
  
  const event = {
    ...rest,
    eventName,
    type,
    subType,
    createdAt: Timestamp.fromDate(now),
    startTime: Timestamp.fromDate(startTime),
    expiresAt: Timestamp.fromDate(endTime),
    status: 'active',
    participants: eventData.participants || [],
  };

  const docRef = await addDoc(collection(db, EVENTS_COLLECTION), event);
  return docRef.id;
}

// Get all active events (not expired)
export async function getActiveEvents() {
  const now = Timestamp.now();
  
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('status', '==', 'active'),
    where('expiresAt', '>', now),
    orderBy('expiresAt', 'asc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    expiresAt: doc.data().expiresAt.toDate(),
  })) as PickupEvent[];
}

// Join an event
export async function joinEvent(eventId: string, userId: string) {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    participants: arrayUnion(userId)
  });
}

// Leave an event
export async function leaveEvent(eventId: string, userId: string) {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  await updateDoc(eventRef, {
    participants: arrayRemove(userId)
  });
}

// Delete an event
export async function deleteEvent(eventId: string) {
  await deleteDoc(doc(db, EVENTS_COLLECTION, eventId));
}

// Get a single event by ID
export async function getEventById(eventId: string) {
  const docRef = doc(db, EVENTS_COLLECTION, eventId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt.toDate(),
      expiresAt: docSnap.data().expiresAt.toDate(),
    } as PickupEvent;
  }
  return null;
}
