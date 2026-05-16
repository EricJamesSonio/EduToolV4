"use client";

import { useAuth } from "@/hooks/useAuth";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/auth.types";

interface TopBarProps {
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getProfilePath(role: Role): string {
  const map: Record<Role, string> = {
    platform_owner: "/platform/profile",
    admin: "/admin/profile",
    educator: "/educator/profile",
    student: "/student/profile",
  };
  return map[role] ?? "/profile";
}

export function TopBar({ className }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between",
        "bg-black text-white border-b border-neutral-800 px-4",
        className
      )}
    >
      {/* Logo / App name */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center border border-white bg-black">
          <span className="text-xs font-bold text-white">E</span>
        </div>
        <span className="text-sm font-semibold tracking-tight text-white">
          EduTool
        </span>
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-2">
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
              "text-white border border-transparent",
              "hover:bg-neutral-900 transition-colors outline-none"
            )}
          >
            <Avatar className="h-7 w-7 border border-white">
              <AvatarFallback className="text-xs bg-black text-white font-semibold">
                {user?.fullName ? getInitials(user.fullName) : "?"}
              </AvatarFallback>
            </Avatar>

            <span className="hidden sm:block font-medium max-w-[140px] truncate text-white">
              {user?.fullName ?? "User"}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-52 bg-black border border-neutral-800 text-white"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-normal text-white">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium truncate text-white">
                    {user?.fullName}
                  </span>
                  <span className="text-xs text-neutral-400 truncate">
                    {user?.email}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-neutral-800" />

            <DropdownMenuGroup>
              <DropdownMenuItem className="hover:bg-neutral-900 cursor-pointer">
                <Link
                  href={user ? getProfilePath(user.role) : "/profile"}
                  className="flex items-center w-full text-white"
                >
                  <User className="mr-2 h-4 w-4 text-white" />
                  My Profile
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-neutral-800" />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={logout}
                className="text-white hover:bg-neutral-900 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4 text-white" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}