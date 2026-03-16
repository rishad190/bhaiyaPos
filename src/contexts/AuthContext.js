"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updatePassword as firebaseUpdatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, get, set, onValue } from "firebase/database";
import logger from "@/utils/logger";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbAdminPassword, setDbAdminPassword] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // 1. Listen for password changes in realtime to support global logout
    const passwordRef = ref(db, 'settings/adminPassword');
    const timestampRef = ref(db, 'settings/passwordLastChanged');
    
    let isInitialLoad = true;
    
    const unsubscribePassword = onValue(passwordRef, (snapshot) => {
      if (snapshot.exists()) {
        setDbAdminPassword(snapshot.val());
      } else {
        setDbAdminPassword("admin123");
      }
    }, (error) => {
       logger.error("Failed to fetch admin password:", error);
       setDbAdminPassword("admin123"); 
    });

    const unsubscribeTimestamp = onValue(timestampRef, (snapshot) => {
      if (snapshot.exists()) {
        const lastChanged = snapshot.val();
        const localLoginTime = parseInt(localStorage.getItem("loginTimestamp") || "0", 10);
        
        // If password was changed AFTER this device logged in, and this isn't the initial mount before login logic ran
        if (localLoginTime > 0 && lastChanged > localLoginTime) {
          logger.info("Password changed remotely. Logging out this session.");
          logout(true); // Force logout without recursive loop
        }
      }
    });

    // 2. Check local storage first for immediate feedback (legacy support)
    const checkLocalAuth = () => {
       const localAuth = localStorage.getItem("isAuthenticated") === "true";
       const localLoginTime = parseInt(localStorage.getItem("loginTimestamp") || "0", 10);
       if (localAuth && localLoginTime > 0) {
         setUser({ uid: "local-admin", email: "admin@skyfabric.com" });
       }
    };
    checkLocalAuth();

    // 3. Subscribe to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.setItem("isAuthenticated", "true");
        // Update login timestamp for firebase user too just in case
        if (!localStorage.getItem("loginTimestamp")) {
           localStorage.setItem("loginTimestamp", Date.now().toString());
        }
      } else {
        // If no firebase user, check if we are locally authenticated (legacy "admin123")
        const isLocallyAuth = localStorage.getItem("isAuthenticated") === "true";
        if (!isLocallyAuth) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribePassword();
      unsubscribeTimestamp();
      unsubscribeAuth();
    };
  }, []);

  const login = async (password, email = null) => {
    try {
      // Legacy "admin123" support with cloud-based custom password support
      const currentAdminPassword = dbAdminPassword || "admin123";
      if (password === currentAdminPassword) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("loginTimestamp", Date.now().toString());
        setUser({ uid: "local-admin", email: "admin@skyfabric.com" });
        return { success: true };
      }

      // Future: Real Firebase Email/Pass login
      if (email) {
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem("loginTimestamp", Date.now().toString());
        return { success: true };
      }

      throw new Error("Invalid credentials");
    } catch (error) {
      logger.error("Login failed:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async (forced = false) => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("loginTimestamp");
      setUser(null);
      router.push("/login");
      if (forced) {
         // Optionally you could show a toast here, but we don't have direct access to useToast
         // We rely on the router pushing to login.
      }
    } catch (error) {
      logger.error("Logout failed:", error);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const isLocallyAuth = localStorage.getItem("isAuthenticated") === "true" && (!user || user.uid === "local-admin");
      
      if (isLocallyAuth) {
        const currentAdminPassword = dbAdminPassword || "admin123";
        
        if (currentPassword !== currentAdminPassword) {
            throw new Error("Current password is incorrect");
        }
        
        // Save to Firebase Realtime Database
        const passwordRef = ref(db, 'settings/adminPassword');
        const timestampRef = ref(db, 'settings/passwordLastChanged');
        
        await set(passwordRef, newPassword);
        
        // Set timestamp to trigger global logout on other devices/tabs
        // Wait, if we set it, it will log *us* out too because our local loginTimestamp is old!
        // We must update our local loginTimestamp FIRST before setting the remote one.
        const newTimestamp = Date.now();
        localStorage.setItem("loginTimestamp", (newTimestamp + 1000).toString()); // give ourselves a 1s buffer
        await set(timestampRef, newTimestamp);

        // Update local state so user doesn't have to refresh
        setDbAdminPassword(newPassword);

        return { success: true };
      }

      // Firebase Auth password change
      if (user && user.email) {
        // Re-authenticate first
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        // Then update password
        await firebaseUpdatePassword(user, newPassword);
        return { success: true };
      }

      throw new Error("User not found or not authenticated");
    } catch (error) {
      logger.error("Change password failed:", error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
