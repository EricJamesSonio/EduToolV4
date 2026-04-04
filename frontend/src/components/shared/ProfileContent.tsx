// frontend/src/components/shared/ProfileContent.tsx
"use client";

import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Mail,
  ShieldCheck,
  CalendarDays,
  CircleUser,
  Building2,
} from "lucide-react";
import type { AccountStatus, Role } from "@/types/auth.types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatRole(role: Role): string {
  const map: Record<Role, string> = {
    platform_owner: "Platform Owner",
    admin: "Administrator",
    educator: "Educator",
    student: "Student",
  };
  return map[role] ?? role;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const STATUS_STYLES: Record<AccountStatus, string> = {
  active:      "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending:     "bg-amber-50   text-amber-700   border-amber-200",
  blocked:     "bg-red-50     text-red-700     border-red-200",
  suspended:   "bg-orange-50  text-orange-700  border-orange-200",
  dropped:     "bg-slate-100  text-slate-500   border-slate-200",
  transferred: "bg-blue-50    text-blue-700    border-blue-200",
  graduated:   "bg-purple-50  text-purple-700  border-purple-200",
};

const ROLE_STYLES: Record<Role, string> = {
  platform_owner: "bg-violet-50 text-violet-700 border-violet-200",
  admin:          "bg-indigo-50 text-indigo-700 border-indigo-200",
  educator:       "bg-teal-50   text-teal-700   border-teal-200",
  student:        "bg-sky-50    text-sky-700    border-sky-200",
};

function InfoRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  children?: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {children ?? (
          <p className="text-sm font-medium text-foreground truncate">
            {value ?? "—"}
          </p>
        )}
      </div>
    </div>
  );
}

export function ProfileContent(): React.JSX.Element {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" />
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  const initials = user.fullName ? getInitials(user.fullName) : "?";

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="My Profile" />

      {/* Avatar + name hero */}
      <Card className="border-border/60">
        <CardContent className="pt-6 pb-5 px-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground truncate">
                {user.fullName ?? "Unnamed User"}
              </h2>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge
                  variant="outline"
                  className={cn("text-[11px] font-medium capitalize", ROLE_STYLES[user.role])}
                >
                  {formatRole(user.role)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-[11px] font-medium capitalize", STATUS_STYLES[user.status])}
                >
                  {user.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <Card className="border-border/60">
        <CardContent className="px-6 py-2">
          <InfoRow icon={Mail} label="Email address" value={user.email} />
          <Separator />
          <InfoRow icon={CircleUser} label="Full name" value={user.fullName ?? "—"} />
          <Separator />
          <InfoRow icon={ShieldCheck} label="Role">
            <Badge
              variant="outline"
              className={cn("text-[11px] font-medium capitalize mt-0.5", ROLE_STYLES[user.role])}
            >
              {formatRole(user.role)}
            </Badge>
          </InfoRow>
          <Separator />
          <InfoRow icon={ShieldCheck} label="Account status">
            <Badge
              variant="outline"
              className={cn("text-[11px] font-medium capitalize mt-0.5", STATUS_STYLES[user.status])}
            >
              {user.status}
            </Badge>
          </InfoRow>
          <Separator />
          <InfoRow
            icon={CalendarDays}
            label="Member since"
            value={formatDate(user.createdAt)}
          />
          {user.orgId && (
            <>
              <Separator />
              <InfoRow icon={Building2} label="Organization ID" value={user.orgId} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}