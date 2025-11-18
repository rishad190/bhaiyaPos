import { initializeApp } from "firebase/app";
import { get, getDatabase, ref, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";
import logger from "@/utils/logger";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);

  // Monitor database connection
  const connectedRef = ref(db, ".info/connected");
  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      logger.debug("Connected to Firebase", "Firebase");
    } else {
      logger.warn("Not connected to Firebase", "Firebase");
    }
  });

  // Test database access
  const dbRef = ref(db);
  get(dbRef)
    .then(() => {
      logger.debug("Firebase data access successful", "Firebase");
    })
    .catch((error) => {
      logger.error(`Firebase data access error: ${error.message}`, "Firebase");
    });
} catch (error) {
  logger.error(`Firebase initialization error: ${error.message}`, "Firebase");
  throw new Error("Failed to initialize Firebase");
}

// Export database instance and auth
export { db, auth };

// Helper function to safely get database reference
export const getDbRef = (path) => {
  if (!db) throw new Error("Database not initialized");
  return ref(db, path);
};

// Helper function to safely get data
export const getData = async (path) => {
  try {
    const snapshot = await get(getDbRef(path));
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    logger.error(`Error getting data from ${path}: ${error.message}`, "Firebase");
    throw error;
  }
};

// Helper function to safely set data
export const setData = async (path, data) => {
  try {
    const dbRef = getDbRef(path);
    await set(dbRef, data);
    return true;
  } catch (error) {
    logger.error(`Error setting data at ${path}: ${error.message}`, "Firebase");
    throw error;
  }
};
