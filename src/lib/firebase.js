import { initializeApp } from "firebase/app";
import { get, getDatabase, ref, onValue } from "firebase/database";
import { getAuth } from "firebase/auth";

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
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Test database connection and monitor connectivity
const connectedRef = ref(db, ".info/connected");
onValue(connectedRef, (snap) => {
  if (snap.val() === true) {
    console.log("Connected to Firebase");
  } else {
    console.log("Not connected to Firebase");
  }
});

// Test data access
const dbRef = ref(db);
get(dbRef)
  .then(() => {
    console.log("Firebase data access successful");
  })
  .catch((error) => {
    console.error("Firebase data access error:", error);
  });

// Add this after the existing code to check for data
const customersRef = ref(db, "customers");
get(customersRef)
  .then((snapshot) => {
    if (snapshot.exists()) {
      console.log(
        "Customers data exists:",
        Object.keys(snapshot.val()).length,
        "records found"
      );
    } else {
      console.log("No customers data available");
    }
  })
  .catch((error) => {
    console.error("Error fetching customers:", error);
  });

// Export database instance
export { db, auth };
