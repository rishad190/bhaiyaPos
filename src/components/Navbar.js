"use client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

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
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/download.png" // Make sure to add your logo file in the public folder
                alt="Sky Fabric Logo"
                width={40}
                height={40}
                className="rounded-md"
              />
              <span className="text-xl font-bold text-gray-900">
                Sky Fabric's
              </span>
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className="text-gray-700 hover:text-gray-900">
              Dashboard
            </Link>
            <Link
              href="/cashbook"
              className="text-gray-700 hover:text-gray-900"
            >
              Cash Book
            </Link>
            <Link
              href="/suppliers"
              className="text-gray-700 hover:text-gray-900"
            >
              Suppliers
            </Link>
            <Link
              href="/inventory"
              className="text-gray-700 hover:text-gray-900"
            >
              Inventory
            </Link>
            <Link
              href="/cashmemo"
              className="text-gray-700 hover:text-gray-900"
            >
              Cash Memo
            </Link>

            <Button>Settings</Button>
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2"
            >
              {isMenuOpen ? "✕" : "☰"}
            </Button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Dashboard
            </Link>
            <Link
              href="/cashbook"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Cash Book
            </Link>
            <Link
              href="/suppliers"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Suppliers
            </Link>
            <Link
              href="/inventory"
              className="block px-3 py-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
            >
              Inventory
            </Link>

            <Button className="w-full justify-start">Settings</Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start"
            >
              Logout
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
