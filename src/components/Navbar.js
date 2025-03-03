"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { HiMenu, HiX } from "react-icons/hi";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on mount and when it changes
    const checkAuth = () => {
      const auth = localStorage.getItem("isAuthenticated");
      setIsAuthenticated(auth === "true");
      if (!auth) {
        router.push("/login");
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    router.push("/login");
  };

  // Don't render navbar if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/download.png" // Ensure your logo file exists in the public folder
                alt="Sky Fabric Logo"
                width={40}
                height={40}
                className="rounded-md"
              />
              <span className="ml-2 text-2xl font-semibold text-gray-800">
                Sky Fabric's
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Dashboard
            </Link>
            <Link
              href="/cashbook"
              className="text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Cash Book
            </Link>
            <Link
              href="/suppliers"
              className="text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Suppliers
            </Link>
            <Link
              href="/inventory"
              className="text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Inventory
            </Link>
            <Link
              href="/cashmemo"
              className="text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Cash Memo
            </Link>
            <Button className="ml-4">Settings</Button>
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>

          {/* Mobile Navigation Toggle */}
          <div className="flex md:hidden items-center">
            <Button
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              className="p-2"
            >
              {isMenuOpen ? (
                <HiX className="h-6 w-6" />
              ) : (
                <HiMenu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden transition-all duration-300 ease-in-out">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/cashbook"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Cash Book
            </Link>
            <Link
              href="/suppliers"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Suppliers
            </Link>
            <Link
              href="/inventory"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Inventory
            </Link>
            <Link
              href="/cashmemo"
              className="block px-3 py-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              onClick={() => setIsMenuOpen(false)}
            >
              Cash Memo
            </Link>
            <Button
              className="w-full text-left px-3 py-2"
              onClick={() => {
                setIsMenuOpen(false);
                // Navigate to settings if needed
              }}
            >
              Settings
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full text-left px-3 py-2"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
