# Pickup App - Implementation Checklist

## Completed
- [x] Next.js project structure
- [x] Firebase client SDK setup
- [x] Firebase Admin SDK setup
- [x] TypeScript interfaces (Event, User, Club)
- [x] Event CRUD operations
- [x] Home page with navigation
- [x] Map view page
- [x] List view page
- [x] Activity filters
- [x] Create event modal component
- [x] Firebase packages installed
- [x] Environment variables template
- [x] Setup documentation

## Firebase Configuration (DO THIS FIRST)
- [ ] Create Firebase project at https://console.firebase.google.com/
- [ ] Enable Firestore Database
- [ ] Enable Authentication (Email/Password + Google)
- [ ] Copy Firebase web config to `.env.local`
- [ ] Generate service account key
- [ ] Copy admin credentials to `.env.local`
- [ ] Set up Firestore security rules
- [ ] Create composite index (status + expiresAt)

## High Priority Features
- [ ] Implement Authentication
  - [ ] Sign up/login UI
  - [ ] Auth context provider
  - [ ] Protect create event action
  - [ ] Store user profiles in Firestore
  
- [ ] Wire up Create Event
  - [ ] Add modal to map/list pages
  - [ ] Connect to Firebase
  - [ ] Get user location for default
  - [ ] Add location autocomplete (Google Places)
  
- [ ] Map Integration
  - [ ] Get Google Maps API key (or use Mapbox)
  - [ ] Add map component
  - [ ] Display event markers
  - [ ] Show user location
  - [ ] Click marker to view event
  
- [ ] Real-time Updates
  - [ ] Replace `getActiveEvents()` with Firestore listener
  - [ ] Auto-update event list
  - [ ] Live participant count
  - [ ] Remove expired events

- [ ] Join/Leave Events
  - [ ] Require authentication
  - [ ] Update Firestore participants array
  - [ ] Show joined events differently
  - [ ] Disable join when at max capacity

## Medium Priority Features
- [ ] User Profile
  - [ ] View profile page
  - [ ] Edit name and avatar
  - [ ] Upload profile picture to Storage
  - [ ] Activity history
  
- [ ] Event Details
  - [ ] Full event page
  - [ ] Participant list with avatars
  - [ ] Directions/navigation link
  - [ ] Share event
  
- [ ] Auto-Expiration
  - [ ] Cloud Function to delete expired events
  - [ ] Or scheduled client-side cleanup
  - [ ] Send notification before expiration
  
- [ ] Search & Filters
  - [ ] Search by location
  - [ ] Distance filter
  - [ ] Time range filter
  - [ ] Club activities toggle

## UI/UX Improvements
- [ ] Loading skeletons
- [ ] Empty states
- [ ] Error handling & messages
- [ ] Success toasts
- [ ] Responsive design testing
- [ ] Dark mode (optional)
- [ ] Animations & transitions

## Notifications
- [ ] Set up Firebase Cloud Messaging
- [ ] Request notification permission
- [ ] New participant joined
- [ ] Event starting soon
- [ ] Event cancelled

## Club Features
- [ ] Club profiles in Firestore
- [ ] Browse clubs
- [ ] Official club events
- [ ] Club announcements
- [ ] Follow clubs

## Testing & Polish
- [ ] Test auth flow
- [ ] Test event creation
- [ ] Test joining/leaving
- [ ] Test on mobile
- [ ] Test with multiple users
- [ ] Handle edge cases
- [ ] Performance optimization

## Deployment
- [ ] Set up Vercel project
- [ ] Add environment variables to Vercel
- [ ] Deploy to production
- [ ] Test production build
- [ ] Update Firebase authorized domains
- [ ] Set up custom domain (optional)

## Analytics (Optional)
- [ ] Firebase Analytics
- [ ] Track event creation
- [ ] Track joins
- [ ] User engagement metrics

## Security
- [ ] Review Firestore rules
- [ ] Test rule enforcement
- [ ] Rate limiting (Cloud Functions)
- [ ] Input validation
- [ ] XSS protection

## Notes
- Start with Firebase config and authentication
- Map integration can come later (use list view first)
- Real-time updates are crucial for good UX
- Test with friends/team for feedback
