# Pickup - Find Spontaneous Games & Activities

A Next.js + Firebase app for creating and joining spontaneous pickup games, activities, and club events happening right now near you.

## The Problem

You want to play a quick game of pickup basketball, ultimate frisbee, or even a board game, but you can't find a group right now. The app will also include club activities (e.g., different UVA clubs) that are going on.

## The Solution

An extremely simple, "one-hour-only" event app where:
- Users create ephemeral posts (e.g., "Pickup Basketball @ Slaughter Rec Center")
- Posts are only active for 60 minutes (or custom duration)
- After expiration, they're automatically removed
- Other users see active games/activities near them and tap "I'm in"

## Features

- **Two Views**: Map view and List view with activity filters
- **Real-time Updates**: See active events happening right now
- **Ephemeral Events**: Posts automatically expire after set duration
- **Firebase Backend**: Firestore for data, Authentication for users
- **NetBadge Authentication**: UVA students can sign in with NetBadge and receive a verification badge
- **Responsive Design**: Works on mobile and desktop

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript and Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Cloud Functions)
- **Maps**: Google Maps or Mapbox (to be integrated)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase account (free tier is sufficient)
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

3. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com/
   - Enable Firestore Database and Authentication
   - Copy your Firebase configuration to `.env.local` (see `.env.local` for template)
   - See `pickup-app/SETUP.md` for detailed Firebase setup instructions

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
pickup/
├── README.md                       # This file
├── QUICKSTART.md                   # Quick overview
└── pickup-app/                     # Main application directory
    ├── app/                        # Next.js app directory
    │   ├── page.tsx               # Home page
    │   ├── map/page.tsx           # Map view
    │   └── list/page.tsx          # List view
    ├── lib/firebase/              # Firebase configuration
    │   ├── config.ts              # Client-side Firebase
    │   ├── admin.ts               # Server-side Firebase Admin
    │   └── events.ts              # Event CRUD operations
    ├── components/                # React components
    ├── types/                     # TypeScript type definitions
    ├── SETUP.md                   # Detailed setup instructions
    └── CHECKLIST.md               # Implementation checklist
```

## Documentation

- **SETUP.md** - Detailed Firebase configuration and setup instructions
- **QUICKSTART.md** - Quick start guide and feature overview
- **CHECKLIST.md** - Development checklist and feature roadmap

## Development Roadmap

### Completed
- Next.js project structure with TypeScript
- Firebase client and admin SDK integration
- Home, Map, and List view pages
- Activity type filters
- Event CRUD operations
- Create event modal component

### In Progress
- Firebase configuration
- User authentication
- Map integration (Google Maps/Mapbox)
- Real-time event updates

### Planned
- Join/leave event functionality
- User profiles
- Push notifications
- Club activities integration
- Event auto-expiration via Cloud Functions

## Contributing

This is a hackathon project. For questions or contributions, please reach out to the team.

## License

This project is for educational and hackathon purposes.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
