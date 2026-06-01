"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getProfileImageUrl } from "@/utils/profile.util";
import apiClient from "@/api/client";
import { toast } from "sonner";
import {
  Mail,
  ShieldCheck,
  CalendarDays,
  CircleUser,
  Building2,
  Loader2,
  Camera,
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

const ICON_STYLES: Record<string, string> = {
  mail:     "bg-blue-100 text-blue-600",
  user:     "bg-violet-100 text-violet-600",
  role:     "bg-teal-100 text-teal-600",
  status:   "bg-amber-100 text-amber-600",
  calendar: "bg-rose-100 text-rose-600",
  building: "bg-slate-100 text-slate-600",
};

interface InfoRowProps {
  icon:      React.ElementType;
  label:     string;
  value?:    string;
  iconStyle: string;
  children?: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value, iconStyle, children }: InfoRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-4 py-4">
      <div className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
        iconStyle,
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        {children ?? (
          <p className="text-sm font-semibold text-foreground">
            {value ?? "—"}
          </p>
        )}
      </div>
    </div>
  );
}

export function ProfileContent(): React.JSX.Element {
  const { user } = useAuth();
  const setUser = useAuthStore((s) => s.setUser);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Profile" />
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  const initials = user.fullName ? getInitials(user.fullName) : "?";
  const profileImageUrl = getProfileImageUrl(user.profileImage);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await apiClient.post<{ path: string }>(
        "/uploads/profile",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      setUser({ ...user, profileImage: data.path });
      toast.success("Profile photo updated");
    } catch {
      toast.error("Failed to upload profile photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Profile" />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Avatar hero card */}
        <div className="lg:col-span-2">
          <Card className="border-border/60 h-full">
            <CardContent className="flex flex-col items-center text-center pt-8 pb-6 px-6">
              <div className="relative mb-5">
                <Avatar className="h-28 w-28">
                  <AvatarImage
                    src={profileImageUrl}
                    alt={user.fullName ?? ""}
                  />
                  <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1">
                {user.fullName ?? "Unnamed User"}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>

              <div className="flex items-center gap-2 flex-wrap justify-center">
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium capitalize px-3 py-1", ROLE_STYLES[user.role])}
                >
                  {formatRole(user.role)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium capitalize px-3 py-1", STATUS_STYLES[user.status])}
                >
                  {user.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Details card */}
        <div className="lg:col-span-3">
          <Card className="border-border/60 h-full">
            <CardContent className="px-6 py-2">
              <InfoRow icon={Mail} label="Email address" value={user.email} iconStyle={ICON_STYLES.mail} />
              <Separator />
              <InfoRow icon={CircleUser} label="Full name" value={user.fullName ?? "—"} iconStyle={ICON_STYLES.user} />
              <Separator />
              <InfoRow icon={ShieldCheck} label="Role" iconStyle={ICON_STYLES.role}>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium capitalize mt-0.5", ROLE_STYLES[user.role])}
                >
                  {formatRole(user.role)}
                </Badge>
              </InfoRow>
              <Separator />
              <InfoRow icon={ShieldCheck} label="Account status" iconStyle={ICON_STYLES.status}>
                <Badge
                  variant="outline"
                  className={cn("text-xs font-medium capitalize mt-0.5", STATUS_STYLES[user.status])}
                >
                  {user.status}
                </Badge>
              </InfoRow>
              <Separator />
              <InfoRow
                icon={CalendarDays}
                label="Member since"
                value={formatDate(user.createdAt)}
                iconStyle={ICON_STYLES.calendar}
              />
              {user.orgId && (
                <>
                  <Separator />
                  <InfoRow icon={Building2} label="Organization ID" value={user.orgId} iconStyle={ICON_STYLES.building} />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
