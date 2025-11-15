export interface PickupEvent {
  id: string;
  title: string;
  activity: string; // "Basketball", "Ultimate Frisbee", "Soccer", etc.
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
  expiresAt: Date; // Auto-delete after this time
  duration: number; // in minutes (default 60)
  participants: string[]; // array of user IDs who joined
  maxParticipants?: number;
  description?: string;
  status: 'active' | 'expired' | 'cancelled';
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  category: string;
  university: string;
}
