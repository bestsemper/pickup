export interface PickupEvent {
  id: string;
  title: string;
  activity: string; // "Sports", "Club", "Entertainment", "Other"
  subType?: string; // For Sports: "Basketball", "Soccer", etc. For Club: club name, etc.
  location: {
    name: string;
    address: string;
    lat: number;
    lng: number;
  };
  createdBy: {
    uid: string;
    name: string;
  };
  createdAt: Date;
  startTime?: Date; // When the event actually starts
  expiresAt: Date; // When the event actually ends
  duration: number; // in minutes (default 60)
  participants: string[]; // array of user IDs who joined
  maxParticipants?: number;
  description?: string;
  status: 'active' | 'expired' | 'cancelled';
  isPrivate?: boolean; // true if event is friends-only
  invitedFriends?: string[]; // array of friend user IDs who can see/join this event
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  isNetBadgeVerified?: boolean; // true if user authenticated via UVA NetBadge
  computingId?: string; // UVA Computing ID (e.g., abc1de)
}

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  university: string;
}
