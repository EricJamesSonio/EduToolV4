"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/context/SidebarContext";
import { NotificationDropdown } from "@/components/shared/NotificationDropdown";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/utils/profile.util";
import { LogOut, Menu, User } from "lucide-react";

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
  const { user, logout } = useAuth();
  const { toggleMobileOpen } = useSidebar();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left: hamburger (mobile) + logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleMobileOpen}
            className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
              <img
                src="/edutool.png"
                alt="EduTool logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-heading font-bold text-xl tracking-tight">EduTool</span>
          </Link>
        </div>

        {/* Right: notifications + user menu */}
        <div className="flex items-center gap-1">
          <NotificationDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors outline-none">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.profileImage ? getProfileImageUrl(user.profileImage) : undefined} alt={user?.fullName ?? ""} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                  {user?.fullName ? getInitials(user.fullName) : "?"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block font-medium max-w-[140px] truncate">
                {user?.fullName ?? "User"}
              </span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium truncate">{user?.fullName}</span>
                    <span className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <Link href={PROFILE_ROUTES[user?.role ?? ""] ?? "/"} className="flex items-center cursor-pointer w-full">
                    <User className="mr-2 h-4 w-4" />
                    My Profile
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem
                  onClick={logout}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
