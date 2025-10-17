"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MapPin,
  Plane,
  Package,
  Calendar,
  BarChart3,
  Settings,
  CreditCard,
  Activity,
  Menu,
  X,
  Percent,
  LogOut
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "Tours",
    href: "/admin/tours",
    icon: Package
  },
  {
    title: "Flights",
    href: "/admin/flights",
    icon: Plane
  },
  {
    title: "Activities",
    href: "/admin/activities",
    icon: Activity
  },
  {
    title: "Destinations",
    href: "/admin/destinations",
    icon: MapPin
  },
  {
    title: "Bookings",
    href: "/admin/bookings",
    icon: Calendar
  },
  {
    title: "Discounts",
    href: "/admin/discounts",
    icon: Percent
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings
  }
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center border-b px-6 py-5">
        <Link href="/admin" className="flex items-center space-x-2">
          <img
            src="/images/logo/logo-lutrip.png"
            alt="LuTrip Logo"
            className="h-12 w-auto"
          />
          <span className="text-xl font-bold">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {sidebarItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center space-x-3 rounded-lg bg-muted/50 p-3 cursor-pointer hover:bg-muted transition-colors">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName || "User Avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    {user?.fullName
                      ? user.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                      : "AD"}
                  </>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {user?.fullName || "Admin User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "admin@lutrip.com"}
                </p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {user?.fullName || "Admin User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email || "admin@lutrip.com"}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex md:w-64 md:flex-col", className)}>
        <div className="flex flex-col h-full border-r bg-background">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    </>
  );
}
