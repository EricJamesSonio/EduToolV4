// frontend/src/components/layout/TopBar.tsx
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

export function TopBar({ className }: TopBarProps) {
  const { user, logout } = useAuth();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4",
        className
      )}
    >
      {/* Logo / App name */}
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <span className="text-xs font-bold text-primary-foreground">E</span>
        </div>
        <span className="text-sm font-semibold tracking-tight">EduTool</span>
      </div>

      {/* Right: notifications + user menu */}
      <div className="flex items-center gap-1">
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors outline-none">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                {user?.fullName ? getInitials(user.fullName) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:block font-medium max-w-[140px] truncate">
              {user?.fullName ?? "User"}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            {/* Label must be inside a Group — Base UI requirement */}
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
                <Link href="/profile" className="flex items-center cursor-pointer w-full">
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
    </header>
  );
}