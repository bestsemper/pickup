# Pickup - Find Spontaneous Games & Activities

A Next.js + Firebase app for the UVA community to create and join spontaneous pickup games, activities, and club events happening right now near you.

**Live Site:** https://claudehackspickup.web.app/

## The Problem

You want to play a quick game of pickup basketball, ultimate frisbee, or even a board game, but you can't find a group right now. The app also helps UVA clubs organize and share activities that are going on.

## The Solution

An extremely simple, ephemeral event app where:
- Users create time-limited posts (e.g., "Pickup Basketball @ Slaughter Rec Center")
- Posts expire after their set duration
- Other users see active games/activities near them and tap "Join"
- Real-time updates keep everyone in sync

## Features

- Create and join time-limited events with Google Maps location
- Interactive map view with event clustering
- Friend system with private event visibility
- Dark mode theme with persistence
- Real-time event updates
- Email/password authentication
- User profiles with customizable display name and photo

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS v4
- **Backend**: Firebase (Firestore, Authentication)
- **Maps**: Google Maps API with Places Autocomplete
- **Styling**: CSS Custom Properties for theming
- **Icons**: Custom SVG icon components

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account (free tier is sufficient)
- Google Maps API key
- npm or yarn

### Installation

1. Navigate to the app directory:
```bash
cd pickup-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   Create a `.env.local` file in the `pickup-app` directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
   ```

4. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Firestore Database and Authentication (Email/Password)
   - Create the following Firestore collections: `events`, `users`, `friends`, `friendRequests`
   - Set up Firestore indexes for queries (will be prompted when needed)

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deployment

The app is deployed on Firebase Hosting:
```bash
npm run build
firebase deploy --only hosting
```

## Usage

- Click "Create Event" to post a new activity with location and time
- Browse events on map or list view, filter by activity type
- Click "Join" to participate in events
- Manage friends through user menu to create private events
- Toggle dark mode in Settings

## Contributing

This is a hackathon project built for finding spontaneous activities and games. Contributions, suggestions, and feedback are welcome!

## Team

- **John Kim**
- **Michael Chung**
- **Rohan Batra**

## License

This project is built for the UVA community and open for contributions.
