"use client";

import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "@/types/auth.types";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getProfileImageUrl } from "@/utils/profile.util";
import apiClient from "@/api/client";
import { profileApi } from "@/api/profile.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Mail,
  ShieldCheck,
  CalendarDays,
  Building2,
  Loader2,
  Camera,
  Save,
  UserRound,
  AtSign,
  Send,
  KeyRound,
} from "lucide-react";
import type { AccountStatus, Role } from "@/types/auth.types";

const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;

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
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [changeStep, setChangeStep] = useState<"enter-email" | "enter-code">("enter-email");
  const [newEmail, setNewEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [changeBusy, setChangeBusy] = useState(false);
  const [changeError, setChangeError] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? "");
      setPersonalEmail(user.personalEmail ?? "");
    }
  }, [user]);

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

  function publishUser(next: AuthUser): void {
    setFullName(next.fullName ?? "");
    setPersonalEmail(next.personalEmail ?? "");
    setUser(next);
    queryClient.setQueryData(queryKeys.auth.me(), next);
  }

  const getBackendError = (err: unknown): string => {
    const message = (err as any)?.response?.data?.message;
    if (Array.isArray(message)) return message.join(", ");
    return message ?? "Something went wrong. Please try again.";
  };

  async function handleSendEmailChangeCode() {
    setChangeError("");
    const trimmed = newEmail.trim();

    if (!GMAIL_RE.test(trimmed)) {
      setChangeError("Please enter a valid Gmail address (e.g. jane@gmail.com).");
      return;
    }
    if (trimmed.toLowerCase() === (personalEmail ?? "").toLowerCase()) {
      setChangeError("That email is already your current personal email.");
      return;
    }

    setChangeBusy(true);
    try {
      const res = await profileApi.changePersonalEmailRequest(trimmed);
      toast.success(res.message);
      setOtpCode("");
      setChangeStep("enter-code");
    } catch (err) {
      setChangeError(getBackendError(err));
    } finally {
      setChangeBusy(false);
    }
  }

  async function handleVerifyEmailChange() {
    setChangeError("");
    if (otpCode.length !== 6) {
      setChangeError("Please enter your 6-digit verification code.");
      return;
    }

    setChangeBusy(true);
    try {
      await profileApi.changePersonalEmailVerify(newEmail.trim(), otpCode);
      publishUser({ ...user, personalEmail: newEmail.trim() });
      toast.success("Personal email updated");
      setChangingEmail(false);
      setChangeStep("enter-email");
      setNewEmail("");
      setOtpCode("");
    } catch (err) {
      setChangeError(getBackendError(err));
    } finally {
      setChangeBusy(false);
    }
  }

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

      const updated = await profileApi.updateProfile({ profileImage: data.path });
      publishUser(updated);
      toast.success("Profile photo updated");
    } catch {
      toast.error("Failed to upload profile photo");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await profileApi.updateProfile({
        fullName,
      });
      publishUser(updated);
      toast.success("Profile updated");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  const hasChanges =
    (fullName ?? "") !== (user.fullName ?? "");

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

        {/* Right: Details + edit card */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/60">
            <CardContent className="px-6 py-2">
              <InfoRow icon={Mail} label="Email address" value={user.email} iconStyle={ICON_STYLES.mail} />
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

          {/* Editable fields */}
          <Card className="border-border/60">
            <CardContent className="px-6 py-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Edit details</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs text-muted-foreground">
                    Full name
                  </Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="full-name"
                      className="pl-9"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your full name"
                      maxLength={200}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving || !hasChanges}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Personal email (change via OTP) */}
          <Card className="border-border/60">
            <CardContent className="px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Personal email</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-sm">
                    Used for your own contact details. Changing it requires a
                    verification code sent to the new Gmail address.
                  </p>
                </div>
                {!changingEmail && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setChangingEmail(true);
                      setChangeStep("enter-email");
                      setChangeError("");
                      setNewEmail("");
                      setOtpCode("");
                    }}
                  >
                    Change
                  </Button>
                )}
              </div>

              {!changingEmail ? (
                <p className="text-sm font-semibold text-foreground mt-4">
                  {personalEmail || <span className="text-muted-foreground font-normal">Not set</span>}
                </p>
              ) : changeStep === "enter-email" ? (
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      className="pl-9"
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        setChangeError("");
                      }}
                      placeholder="you@gmail.com"
                    />
                  </div>
                  {changeError && (
                    <p className="text-xs text-red-600">{changeError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleSendEmailChangeCode}
                      disabled={changeBusy}
                    >
                      {changeBusy ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send code
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setChangingEmail(false)}
                      disabled={changeBusy}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      className="pl-9"
                      value={otpCode}
                      onChange={(e) => {
                        setOtpCode(e.target.value.replace(/\D/g, ""));
                        setChangeError("");
                      }}
                      placeholder="6-digit code sent to your new email"
                    />
                  </div>
                  {changeError && (
                    <p className="text-xs text-red-600">{changeError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleVerifyEmailChange}
                      disabled={changeBusy}
                    >
                      {changeBusy ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Verify &amp; save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setChangingEmail(false);
                        setChangeError("");
                      }}
                      disabled={changeBusy}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}