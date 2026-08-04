import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

const TOKEN_KEY = 'kindergarten_google_access_token';

let isSigningIn = false;
let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.warn('Failed to persist access token:', e);
  }
};

// Handle pending redirect result on app boot (for mobile sign-in)
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }
    }
  })
  .catch((err) => {
    console.warn('Google redirect result error:', err);
  });

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = getAccessToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      setCachedAccessToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    
    // On mobile devices, prefer redirect flow to avoid popup blocker issues
    if (isMobileDevice()) {
      await signInWithRedirect(auth, provider);
      return null;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('無法取得 Google 存取金鑰');
      }

      setCachedAccessToken(credential.accessToken);
      return { user: result.user, accessToken: credential.accessToken };
    } catch (popupErr: any) {
      // Fallback to redirect if popup was blocked or failed on mobile/browser
      if (
        popupErr?.code === 'auth/popup-blocked' ||
        popupErr?.code === 'auth/operation-not-supported-in-this-environment' ||
        popupErr?.code === 'auth/popup-closed-by-user'
      ) {
        console.warn('Popup blocked/failed, falling back to redirect:', popupErr);
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw popupErr;
    }
  } catch (error: any) {
    if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
      console.log('Google Sign-in popup closed by user.');
      return null;
    }
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  if (!cachedAccessToken) {
    try {
      cachedAccessToken = localStorage.getItem(TOKEN_KEY);
    } catch {}
  }
  return cachedAccessToken;
};

export const logout = async () => {
  await signOut(auth);
  setCachedAccessToken(null);
};
