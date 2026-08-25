"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/context/SidebarContext";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/utils/profile.util";
import { Menu } from "lucide-react";

const PROFILE_ROUTES: Record<string, string> = {
  student: "/student/profile",
  educator: "/educator/profile",
  admin: "/admin/profile",
  platform_owner: "/admin/profile",
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PortalNavbar() {
  const { user } = useAuth();
  const { toggleMobileOpen } = useSidebar();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-sidebar-border bg-secondary text-secondary-foreground shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileOpen}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
              <img
                src="/edutool-yellow.png"
                alt="Relief-ED logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight text-white">Relief-ED</span>
          </Link>
        </div>

        {/* Right: notifications + user menu */}
        <div className="flex items-center gap-1 text-white">
          <NotificationDropdown />

          <Link
            href={PROFILE_ROUTES[user?.role ?? ""] ?? "/"}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-white hover:bg-white/10 transition-colors outline-none"
          >
            <Avatar className="h-7 w-7">
              <AvatarImage src={user?.profileImage ? getProfileImageUrl(user.profileImage) : undefined} alt={user?.fullName ?? ""} />
              <AvatarFallback className="text-xs bg-white/15 text-white font-semibold">
                {user?.fullName ? getInitials(user.fullName) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block font-medium max-w-[140px] truncate">
              {user?.fullName ?? "User"}
            </span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
