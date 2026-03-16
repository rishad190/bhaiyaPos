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
      // Legacy "admin123" support with custom password support
      const storedPassword = localStorage.getItem("customAdminPassword") || "admin123";
      if (password === storedPassword) {
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
      // Legacy "admin123" support - password change isn't fully supported without 
      // a proper backend for local users, but we can simulate it by updating local storage
      // if we wanted to. For now, since admin123 is hardcoded in login(), changing it
      // requires changing the code, OR we can store a custom password in localStorage.
      
      const isLocallyAuth = localStorage.getItem("isAuthenticated") === "true" && (!user || user.uid === "local-admin");
      
      if (isLocallyAuth) {
        // Since admin login is hardcoded to "admin123", we would need to update the login
        // function to check localStorage for a custom password.
        // Let's implement that.
        const storedPassword = localStorage.getItem("customAdminPassword") || "admin123";
        
        if (currentPassword !== storedPassword) {
            throw new Error("Current password is incorrect");
        }
        
        localStorage.setItem("customAdminPassword", newPassword);
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
