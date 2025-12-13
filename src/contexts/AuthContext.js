"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut 
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import logger from "@/utils/logger";
import { useRouter } from "next/navigation";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
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
      // Legacy "admin123" support
      if (password === "admin123") {
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
