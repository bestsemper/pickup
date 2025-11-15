#!/bin/bash

# Firebase Setup Script for Pickup App
echo "Setting up Firebase for Pickup App..."
echo ""

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null
then
    echo "Firebase CLI not found. Installing..."
    npm install -g firebase-tools
else
    echo "Firebase CLI already installed"
fi

echo ""
echo "Next steps:"
echo "1. Login to Firebase: firebase login"
echo "2. Initialize Firebase: firebase init"
echo "   - Select Firestore, Functions (optional), and Hosting (optional)"
echo "   - Use existing project or create new one"
echo ""
echo "3. Update .env.local with your Firebase config"
echo "   - Get web app config from Firebase Console"
echo "   - Get service account key for Admin SDK"
echo ""
echo "4. Set up Firestore rules and indexes (see SETUP.md)"
echo ""
echo "Full instructions in SETUP.md"
