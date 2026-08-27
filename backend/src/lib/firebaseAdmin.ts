import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let appInitialized = false;

try {
  if (getApps().length === 0) {
    let credential;
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    
    const isPlaceholder = 
      (serviceAccountKey && serviceAccountKey.includes("YOUR_PRIVATE_KEY_HERE")) ||
      (privateKey && privateKey.includes("YOUR_PRIVATE_KEY_HERE"));

    if (serviceAccountKey && !isPlaceholder) {
      try {
        const parsedKey = JSON.parse(serviceAccountKey);
        if (parsedKey.private_key && parsedKey.private_key.includes("YOUR_PRIVATE_KEY_HERE")) {
          // It's a placeholder inside parsed JSON
        } else {
          credential = cert(parsedKey);
        }
      } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", e);
      }
    }
    
    if (!credential && privateKey && clientEmail && projectId && !isPlaceholder) {
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      credential = cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      });
    }

    if (credential) {
      initializeApp({
        credential,
      });
      appInitialized = true;
    } else if (projectId) {
      initializeApp({
        projectId,
      });
      appInitialized = true;
      if (isPlaceholder) {
        console.warn("⚠️ Firebase Admin SDK keys are set to placeholder values. Firestore operations will fail until real keys are provided.");
      }
    } else {
      console.warn("⚠️ Firebase Admin SDK environment variables are missing! Firestore queries will fail.");
    }
  } else {
    appInitialized = true;
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

const adminDb = appInitialized ? getFirestore() : null;
const adminAuth = appInitialized ? getAuth() : null;

export function getAdminDb() {
  if (!adminDb) {
    throw new Error("Firebase Firestore Admin SDK is not initialized. Please configure FIREBASE_SERVICE_ACCOUNT_KEY in .env");
  }
  return adminDb;
}

export function getAdminAuth() {
  if (!adminAuth) {
    throw new Error("Firebase Auth Admin SDK is not initialized. Please configure FIREBASE_SERVICE_ACCOUNT_KEY in .env");
  }
  return adminAuth;
}
