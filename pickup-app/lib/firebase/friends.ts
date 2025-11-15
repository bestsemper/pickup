'use client';

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';

const FRIENDS_COLLECTION = 'friends';
const FRIEND_REQUESTS_COLLECTION = 'friendRequests';

// Send a friend request
export async function sendFriendRequest(toUserId: string, toUserEmail: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be logged in to send friend requests');
  }

  // Check if already friends
  const existingFriendship = await checkFriendship(currentUser.uid, toUserId);
  if (existingFriendship) {
    throw new Error('Already friends with this user');
  }

  // Check if request already exists
  const existingRequest = await getDoc(
    doc(db, FRIEND_REQUESTS_COLLECTION, `${currentUser.uid}_${toUserId}`)
  );
  
  if (existingRequest.exists()) {
    throw new Error('Friend request already sent');
  }

  // Check for reverse request (they sent you a request)
  const reverseRequest = await getDoc(
    doc(db, FRIEND_REQUESTS_COLLECTION, `${toUserId}_${currentUser.uid}`)
  );

  if (reverseRequest.exists()) {
    // Auto-accept if they already sent you a request
    await acceptFriendRequest(toUserId);
    return;
  }

  // Get current user profile
  const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
  const userData = userDoc.data();

  // Create friend request
  await addDoc(collection(db, FRIEND_REQUESTS_COLLECTION), {
    fromUserId: currentUser.uid,
    fromUserEmail: currentUser.email,
    fromUserName: userData?.displayName || currentUser.email,
    toUserId,
    toUserEmail,
    status: 'pending',
    createdAt: Timestamp.now()
  });
}

// Accept a friend request
export async function acceptFriendRequest(fromUserId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be logged in');
  }

  // Find the friend request
  const requestsQuery = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', currentUser.uid),
    where('status', '==', 'pending')
  );

  const requestSnapshot = await getDocs(requestsQuery);
  if (requestSnapshot.empty) {
    throw new Error('Friend request not found');
  }

  const requestDoc = requestSnapshot.docs[0];
  const requestData = requestDoc.data();

  // Create friendship document
  await addDoc(collection(db, FRIENDS_COLLECTION), {
    user1Id: currentUser.uid,
    user2Id: fromUserId,
    createdAt: Timestamp.now()
  });

  // Delete the friend request
  await deleteDoc(requestDoc.ref);
}

// Reject a friend request
export async function rejectFriendRequest(fromUserId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be logged in');
  }

  const requestsQuery = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where('fromUserId', '==', fromUserId),
    where('toUserId', '==', currentUser.uid),
    where('status', '==', 'pending')
  );

  const requestSnapshot = await getDocs(requestsQuery);
  if (requestSnapshot.empty) {
    throw new Error('Friend request not found');
  }

  await deleteDoc(requestSnapshot.docs[0].ref);
}

// Remove a friend
export async function removeFriend(friendUserId: string) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('User must be logged in');
  }

  // Find friendship (can be in either direction)
  const friendshipQuery1 = query(
    collection(db, FRIENDS_COLLECTION),
    where('user1Id', '==', currentUser.uid),
    where('user2Id', '==', friendUserId)
  );

  const friendshipQuery2 = query(
    collection(db, FRIENDS_COLLECTION),
    where('user1Id', '==', friendUserId),
    where('user2Id', '==', currentUser.uid)
  );

  const [snapshot1, snapshot2] = await Promise.all([
    getDocs(friendshipQuery1),
    getDocs(friendshipQuery2)
  ]);

  if (!snapshot1.empty) {
    await deleteDoc(snapshot1.docs[0].ref);
  } else if (!snapshot2.empty) {
    await deleteDoc(snapshot2.docs[0].ref);
  } else {
    throw new Error('Friendship not found');
  }
}

// Get user's friends list
export async function getFriends() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return [];
  }

  // Get friendships where user is user1
  const query1 = query(
    collection(db, FRIENDS_COLLECTION),
    where('user1Id', '==', currentUser.uid)
  );

  // Get friendships where user is user2
  const query2 = query(
    collection(db, FRIENDS_COLLECTION),
    where('user2Id', '==', currentUser.uid)
  );

  const [snapshot1, snapshot2] = await Promise.all([
    getDocs(query1),
    getDocs(query2)
  ]);

  const friendIds = new Set<string>();
  
  snapshot1.docs.forEach(doc => {
    friendIds.add(doc.data().user2Id);
  });
  
  snapshot2.docs.forEach(doc => {
    friendIds.add(doc.data().user1Id);
  });

  // Get friend profiles
  const friends = await Promise.all(
    Array.from(friendIds).map(async (friendId) => {
      const userDoc = await getDoc(doc(db, 'users', friendId));
      if (userDoc.exists()) {
        return {
          uid: friendId,
          ...userDoc.data()
        };
      }
      return null;
    })
  );

  return friends.filter(f => f !== null);
}

// Get pending friend requests (received)
export async function getPendingFriendRequests() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return [];
  }

  const requestsQuery = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where('toUserId', '==', currentUser.uid),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(requestsQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Get sent friend requests
export async function getSentFriendRequests() {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return [];
  }

  const requestsQuery = query(
    collection(db, FRIEND_REQUESTS_COLLECTION),
    where('fromUserId', '==', currentUser.uid),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(requestsQuery);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// Check if two users are friends
export async function checkFriendship(userId1: string, userId2: string): Promise<boolean> {
  const query1 = query(
    collection(db, FRIENDS_COLLECTION),
    where('user1Id', '==', userId1),
    where('user2Id', '==', userId2)
  );

  const query2 = query(
    collection(db, FRIENDS_COLLECTION),
    where('user1Id', '==', userId2),
    where('user2Id', '==', userId1)
  );

  const [snapshot1, snapshot2] = await Promise.all([
    getDocs(query1),
    getDocs(query2)
  ]);

  return !snapshot1.empty || !snapshot2.empty;
}

// Find user by email
export async function findUserByEmail(email: string) {
  const usersQuery = query(
    collection(db, 'users'),
    where('email', '==', email)
  );

  const snapshot = await getDocs(usersQuery);
  
  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];
  return {
    uid: userDoc.id,
    ...userDoc.data()
  };
}
