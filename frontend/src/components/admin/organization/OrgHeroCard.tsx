"use client";

import { useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { toast } from "sonner";
import { Camera, ImageIcon, Layers, Loader2 } from "lucide-react";
import { organizationApi } from "@/api/admin/organization.api";
import { getOrgLogoUrl } from "@/utils/org.util";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useSchoolProfile } from "@/hooks/admin/useSchoolProfile";
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import type { SchoolProfileDepartment } from "@/types/admin/school-profile.types";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

interface OrgHeroCardProps {
  name: string;
  logoUrl: string | null | undefined;
}

export function OrgHeroCard({ name, logoUrl }: OrgHeroCardProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [logoUrl]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE) {
      toast.error("Logo file is too large. Please upload an image under 2MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      await organizationApi.uploadOrgLogo(file);
      toast.success("Organization logo updated.");
    } catch (err) {
      const message = (err as AxiosError<{ message?: string | string[] }>)
        ?.response?.data?.message;
      const serverMessage = Array.isArray(message)
        ? message.join(", ")
        : message;
      toast.error(serverMessage || "Failed to upload logo.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const { data: departmentsData, isLoading: deptLoading } = useSchoolProfile();
  // Defensive: previous cache collision between useSchoolProfile (array) and
  // useSchoolProfileData (object) could poison the cache with { departments: [...] }.
  // Guard so OrgHeroCard never crashes on departments.map even with stale data.
  const departments: SchoolProfileDepartment[] = Array.isArray(departmentsData)
    ? departmentsData
    : Array.isArray((departmentsData as unknown as { departments?: unknown })?.departments)
      ? ((departmentsData as unknown as { departments: SchoolProfileDepartment[] }).departments as SchoolProfileDepartment[])
      : [];

  return (
    <Card className="border-border/60 h-full">
      <CardContent className="flex flex-col pt-8 pb-6 px-6">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
              {!logoUrl || logoError ? (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <ImageIcon className="h-9 w-9" />
                  <span className="text-xs">No logo</span>
                </div>
              ) : (
                <img
                  src={getOrgLogoUrl(logoUrl)}
                  alt="Organization logo"
                  className="h-full w-full object-contain p-3"
                  onError={() => setLogoError(true)}
                />
              )}
            </div>

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

          <h2 className="text-xl font-bold text-foreground mb-1">{name}</h2>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF or WEBP · Max 2MB
          </p>
        </div>

        {/* Available Departments — fills remaining vertical space in desktop so card uses full height */}
        <div className="mt-6 w-full">
          <Separator className="mb-4" />
          <div className="flex items-center gap-2 mb-3">
            <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <h3 className="text-sm font-semibold">Available Departments</h3>
          </div>

          {deptLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : departments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No departments set up yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {departments.map((dept) => {
                const label =
                  PROGRAM_TYPE_LABELS[dept.type as keyof typeof PROGRAM_TYPE_LABELS] ?? dept.type;
                const courses = Array.isArray((dept as unknown as { courses?: unknown })?.courses)
                  ? (dept.courses as unknown as Array<{ name: string }>)
                  : [];
                const strands = Array.isArray((dept as unknown as { strands?: unknown })?.strands)
                  ? (dept.strands as unknown as Array<{ name: string }>)
                  : [];
                const subtext =
                  courses.length > 0
                    ? courses.map((c) => c.name).join(" · ")
                    : strands.length > 0
                      ? strands.map((s) => s.name).join(" · ")
                      : null;

                return (
                  <div key={dept.type} className="py-1">
                    <p className="text-sm font-medium leading-tight">{label}</p>
                    {subtext && (
                      <p className="text-xs text-muted-foreground leading-snug break-words">
                        {subtext}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}