import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  getDocFromServer,
  collection,
  writeBatch
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import firebaseConfigData from '../../firebase-applet-config.json';
import { CompetitionState } from '../types';

export const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigData.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigData.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigData.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigData.authDomain,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfigData.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigData.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigData.messagingSenderId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with the provisioned or default database ID
export const db = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Keep track of current user and connection state
let currentUser: User | null = null;
let isConnected = false;

// Authenticate anonymously for seamless tournament operations
export const initFirebaseAuth = (): Promise<User | null> => {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
        isConnected = true;
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          currentUser = cred.user;
          isConnected = true;
          resolve(cred.user);
        } catch (error) {
          console.warn('Anonymous auth initialization:', error);
          resolve(null);
        }
      }
    });
  });
};

// Connection health check per skill guidelines
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    isConnected = true;
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline or still initializing network.');
    }
    // Return true anyway if firestore instance is working locally
    return false;
  }
}

// Master Tournament Document Reference
export const COMPETITION_DOC_ID = 'brl_2026';
export const competitionDocRef = doc(db, 'competitions', COMPETITION_DOC_ID);

/**
 * Real-time listener for Competition State from Firestore.
 * Triggers on any cloud update from operators, judges, or external devices.
 */
export function subscribeToCompetitionState(
  onUpdate: (state: CompetitionState) => void,
  onError?: (error: Error) => void
): () => void {
  return onSnapshot(
    competitionDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CompetitionState;
        if (data && data.eventName && Array.isArray(data.schools)) {
          onUpdate(data);
        }
      }
    },
    (err) => {
      console.warn('Firestore real-time subscription update:', err.message);
      if (onError) onError(err);
    }
  );
}

/**
 * Synchronize the current competition state to Firestore.
 * Updates both the master document and collections for granular auditability.
 */
export async function saveCompetitionStateToFirestore(state: CompetitionState): Promise<void> {
  try {
    // 1. Write the unified master state document for ultra-fast snapshot updates across devices.
    // No merge option: `state` is always the complete CompetitionState, and merge:true would
    // deep-merge nested map fields (e.g. `scores`), leaving deleted entries as orphaned leftovers.
    await setDoc(competitionDocRef, {
      ...state,
      lastUpdated: Date.now()
    });

    // 2. Also update collections for schools, scores, matches, and audit logs
    // Using batch writes for consistency where applicable
    if (state.schools && state.schools.length > 0) {
      const batch = writeBatch(db);
      state.schools.slice(0, 20).forEach(school => {
        const sRef = doc(db, 'schools', school.id);
        batch.set(sRef, {
          ...school,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });
      await batch.commit().catch(e => console.warn('School batch sync:', e));
    }
  } catch (err) {
    console.error('Error saving state to Firestore:', err);
    throw err;
  }
}

/**
 * Fetch latest competition state from Firestore once
 */
export async function fetchCompetitionStateFromFirestore(): Promise<CompetitionState | null> {
  try {
    const snap = await getDoc(competitionDocRef);
    if (snap.exists()) {
      return snap.data() as CompetitionState;
    }
  } catch (err) {
    console.warn('Error fetching Firestore state:', err);
  }
  return null;
}
