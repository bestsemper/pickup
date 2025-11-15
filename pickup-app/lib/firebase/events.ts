'use client';

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
import { db, auth } from '@/lib/firebase/config';
import { PickupEvent } from '@/types';

const EVENTS_COLLECTION = 'events';

// Create a new pickup event
export async function createEvent(eventData: Omit<PickupEvent, 'id' | 'createdAt' | 'expiresAt' | 'status'> & { startTime: Date; endTime: Date; eventName: string; type: string; subType: string; location: { name: string; address: string; lat: number; lng: number } }) {
  const now = new Date();
  const { startTime, endTime, eventName, type, subType, location, ...rest } = eventData;
  // Basic validation to surface helpful errors quickly
  if (!eventName || !type) {
    throw new Error('Missing required eventName or type');
  }
  if (!startTime || !endTime) {
    throw new Error('Missing startTime or endTime');
  }
  if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new Error('Missing or invalid location coordinates (lat/lng)');
  }

  if (!db) {
    throw new Error('Firebase DB not initialized (db is undefined)');
  }

  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be logged in to create an event');
  }

  const event: any = {
    ...rest,
    eventName,
    type,
    subType,
    location,
    creatorId: currentUser.uid,
    createdAt: Timestamp.fromDate(now),
    startTime: Timestamp.fromDate(startTime),
    expiresAt: Timestamp.fromDate(endTime),
    status: 'active' as const,
    participants: eventData.participants || [],
  };

  // Remove undefined fields to prevent Firestore errors
  Object.keys(event).forEach(key => {
    if (event[key] === undefined) {
      delete event[key];
    }
  });

  console.log('📝 Attempting to create event:', event);

  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), event);
    console.log('✅ Event created successfully! ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Failed to create event:', error);
    throw error;
  }
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
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt),
    } as PickupEvent;
  });
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
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt),
    } as PickupEvent;
  }
  return null;
}

// Get past events (expired)
export async function getPastEvents() {
  const now = Timestamp.now();
  const q = query(
    collection(db, EVENTS_COLLECTION),
    where('expiresAt', '<', now),
    orderBy('expiresAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const events = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      expiresAt: data.expiresAt?.toDate ? data.expiresAt.toDate() : new Date(data.expiresAt),
    } as PickupEvent;
  });
  
  return events;
}
