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
import { ref, get, set } from "firebase/database";
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
    const fetchAdminPassword = async () => {
      try {
        const passwordRef = ref(db, 'settings/adminPassword');
        const snapshot = await get(passwordRef);
        if (snapshot.exists()) {
          setDbAdminPassword(snapshot.val());
        } else {
          // Fallback to default if not set in DB
          setDbAdminPassword("admin123");
        }
      } catch (error) {
        logger.error("Failed to fetch admin password:", error);
        setDbAdminPassword("admin123"); // Safe fallback
      }
    };

    fetchAdminPassword();

    // Check local storage first for immediate feedback (legacy support)
    const localAuth = localStorage.getItem("isAuthenticated") === "true";
    if (localAuth) {
      setUser({ uid: "local-admin", email: "admin@skyfabric.com" });
    }

    // Subscribe to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        localStorage.setItem("isAuthenticated", "true");
      } else {
        // If no firebase user, check if we are locally authenticated (legacy "admin123")
        const isLocallyAuth = localStorage.getItem("isAuthenticated") === "true";
        if (!isLocallyAuth) {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (password, email = null) => {
    try {
      // Legacy "admin123" support with cloud-based custom password support
      const currentAdminPassword = dbAdminPassword || "admin123";
      if (password === currentAdminPassword) {
        localStorage.setItem("isAuthenticated", "true");
        setUser({ uid: "local-admin", email: "admin@skyfabric.com" });
        return { success: true };
      }

      // Future: Real Firebase Email/Pass login
      if (email) {
        await signInWithEmailAndPassword(auth, email, password);
        return { success: true };
      }

      throw new Error("Invalid credentials");
    } catch (error) {
      logger.error("Login failed:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem("isAuthenticated");
      setUser(null);
      router.push("/login");
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
        await set(passwordRef, newPassword);

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
