"use client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Package,
  Receipt,
  Bell,
  TrendingUp,
} from "lucide-react";
import { UserNav } from "./UserNav";
import { MobileNav } from "./MobileNav";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/customers",
    label: "Customers",
    icon: Users,
  },
  {
    href: "/cashbook",
    label: "Cash Book",
    icon: BookOpen,
  },
  {
    href: "/suppliers",
    label: "Suppliers",
    icon: Package,
  },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Package,
  },
  {
    href: "/inventory-profit",
    label: "Inventory Profit",
    icon: TrendingUp,
  },
  {
    href: "/cashmemo",
    label: "Cash Memo",
    icon: Receipt,
  },
];

import { useData } from "@/app/data-context";

export function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { settings } = useData();

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem("isAuthenticated");
      setIsAuthenticated(auth === "true");
      if (auth !== "true" && pathname !== "/login") {
        router.push("/login");
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    router.push("/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src={settings.store.logo || "/download.png"}
                alt={`${settings.store.storeName} Logo`}
                width={40}
                height={40}
                className="rounded-md"
              />
              <span className="ml-2 text-xl md:text-2xl font-semibold text-gray-800">
                {settings.store.storeName || "Sky Fabric's"}
              </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <DesktopNavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden md:flex items-center space-x-2">
              <NotificationMenu notifications={notifications} />
              <UserNav handleLogout={handleLogout} router={router} />
            </div>
            <div className="md:hidden">
              <MobileNav
                handleLogout={handleLogout}
                router={router}
                pathname={pathname}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

const DesktopNavLink = ({ item, pathname }) => {
  const isActive = pathname === item.href;
  return (
    <Link
      href={item.href}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <item.icon className="h-4 w-4 mr-2" />
      {item.label}
    </Link>
  );
};

const NotificationMenu = ({ notifications }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-80">
      <DropdownMenuLabel>Notifications</DropdownMenuLabel>
      <DropdownMenuSeparator />
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <DropdownMenuItem key={notification.id}>
            {notification.message}
          </DropdownMenuItem>
        ))
      ) : (
        <div className="p-4 text-center text-sm text-muted-foreground">
          No new notifications
        </div>
      )}
    </DropdownMenuContent>
  </DropdownMenu>
);