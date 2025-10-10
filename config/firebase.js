import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
let firebaseApp;

try {
  // Check if Firebase is already initialized
  if (admin.apps.length === 0) {
    // For development, we'll use a simpler approach
    // You can add service account credentials later if needed
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
    });

    console.log('Firebase Admin SDK initialized successfully');
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.error('Firebase Admin SDK initialization error:', error);
  // Continue without Firebase Admin for now
  firebaseApp = null;
}

export { firebaseApp };
export default admin;
