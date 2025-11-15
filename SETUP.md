# Pickup App - Firebase Setup Guide

## Getting Started

### 1. Install Dependencies
```bash
cd pickup-app
npm install firebase firebase-admin
```

### 2. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable the following services:
   - **Authentication** (Email/Password, Google, etc.)
   - **Firestore Database** (Start in production mode)
   - **Storage** (for future user avatars/images)

### 3. Get Firebase Configuration

#### Client-Side Config (Web App):
1. Go to Project Settings > General
2. Under "Your apps", add a Web app
3. Copy the `firebaseConfig` object
4. Update `.env.local` with these values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

#### Server-Side Config (Admin SDK):
1. Go to Project Settings > Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Update `.env.local` with these values:

```env
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
```

### 4. Firestore Security Rules

In Firebase Console > Firestore Database > Rules, add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Events collection
    match /events/{eventId} {
      // Anyone can read active events
      allow read: if resource.data.status == 'active';
      
      // Authenticated users can create events
      allow create: if request.auth != null;
      
      // Only creator can delete their own events
      allow delete: if request.auth != null && 
                       resource.data.createdBy.uid == request.auth.uid;
      
      // Users can update to join/leave events
      allow update: if request.auth != null;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 5. Firestore Indexes

Create a composite index for efficient queries:
1. Go to Firestore Database > Indexes
2. Create index:
   - Collection: `events`
   - Fields:
     - `status` (Ascending)
     - `expiresAt` (Ascending)

### 6. Run the App

```bash
npm run dev
```

Visit `http://localhost:3000`

## Project Structure

```
pickup-app/
├── app/
│   ├── page.tsx           # Home page
│   ├── map/
│   │   └── page.tsx       # Map view
│   └── list/
│       └── page.tsx       # List view
├── lib/
│   └── firebase/
│       ├── config.ts      # Client-side Firebase
│       ├── admin.ts       # Server-side Firebase Admin
│       └── events.ts      # Event operations
├── types/
│   └── index.ts           # TypeScript types
└── .env.local             # Environment variables
```

## Next Steps

1. **Add Authentication UI**
   - Sign in/sign up modal
   - User profile

2. **Create Event Form**
   - Location picker with autocomplete
   - Activity type selector
   - Duration picker

3. **Map Integration**
   - Google Maps API or Mapbox
   - Show event markers
   - Current location

4. **Real-time Updates**
   - Use Firestore listeners for live data
   - Auto-refresh event list

5. **Auto-Expiration**
   - Cloud Function to delete expired events
   - Or client-side filtering

## Environment Variables

Make sure `.env.local` is in your `.gitignore`!

Never commit your Firebase credentials to version control.
