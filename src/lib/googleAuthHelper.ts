import { Capacitor } from '@capacitor/core';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { auth } from './firebase';

export interface GoogleAuthResult {
  email: string;
  name: string;
  photoUrl?: string;
  idToken?: string;
}

export async function performGoogleSignIn(): Promise<GoogleAuthResult> {
  const isAndroidOrNative =
    Capacitor.isNativePlatform() ||
    Capacitor.getPlatform() === 'android' ||
    Capacitor.isPluginAvailable('GoogleAuth');

  if (isAndroidOrNative) {
    // Native Android Google Play Services System Bottom-Sheet
    const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');

    try {
      GoogleAuth.initialize({
        clientId: '419857452747-453f73qthak6vimjea3l1bid1fhvnjq7.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: false,
      });
      await GoogleAuth.signOut().catch(() => {});
    } catch (initErr) {
      console.warn('GoogleAuth initialize warning:', initErr);
    }

    const googleUser = await GoogleAuth.signIn();

    if (!googleUser || !googleUser.email) {
      throw new Error('No Google account was selected.');
    }

    return {
      email: googleUser.email,
      name: googleUser.name || googleUser.givenName || googleUser.email.split('@')[0],
      photoUrl: googleUser.imageUrl,
      idToken: googleUser.authentication?.idToken,
    };
  }

  // Web Browser: Firebase Google Popup (stays in the same app without redirecting)
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
  });

  const result = await signInWithPopup(auth, provider);
  const fbUser = result.user;

  if (!fbUser.email) {
    throw new Error('Google account has no associated email.');
  }

  return {
    email: fbUser.email,
    name: fbUser.displayName || fbUser.email.split('@')[0],
    photoUrl: fbUser.photoURL || undefined,
  };
}
