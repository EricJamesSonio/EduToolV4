"use client";

import { useEffect, useState } from "react";
import { AtSign, Building2, ImageIcon, Layers } from "lucide-react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { organizationApi } from "@/api/admin/organization.api";
import { useSchoolProfile } from "@/hooks/admin/useSchoolProfile";
import { getOrgLogoUrl } from "@/utils/org.util";
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import { Skeleton } from "@/components/ui/skeleton";
import { OrgScheduleReadOnly } from "./OrgScheduleReadOnly";

const PANEL = "rounded-xl border border-border/60 bg-card";

function OrgDepartmentList(): React.JSX.Element {
  const { data, isLoading } = useSchoolProfile();
  const departments = Array.isArray(data) ? data : [];

  return (
    <div className="mt-6 w-full border-t pt-4">
      <div className="mb-3 flex items-center gap-2">
        <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Available Departments</h3>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ) : departments.length === 0 ? (
        <p className="text-sm text-muted-foreground not-interactive">
          No departments set up yet.
        </p>
      ) : (
        <div className="space-y-1.5">
          {departments.map((dept) => {
            const courses = dept.courses ?? [];
            const strands = dept.strands ?? [];
            const subtext =
              courses.length > 0
                ? courses.map((c) => c.name).join(" · ")
                : strands.length > 0
                  ? strands.map((s) => s.name).join(" · ")
                  : null;
            return (
              <div key={dept.type} className="py-1">
                <p className="text-sm font-medium leading-tight">
                  {PROGRAM_TYPE_LABELS[dept.type] ?? dept.type}
                </p>
                {subtext && (
                  <p className="break-words text-xs leading-snug text-muted-foreground">
                    {subtext}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrgReadOnlyHero({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null | undefined;
}): React.JSX.Element {
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setLogoError(false);
  }, [logoUrl]);

  return (
    <div className={`${PANEL} flex h-full flex-col px-6 pb-6 pt-8`}>
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
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
        <h2 className="mb-1 text-xl font-bold text-foreground">{name}</h2>
      </div>

      <OrgDepartmentList />
    </div>
  );
}

export function OrgReadOnlyCard(): React.JSX.Element {
  const { data: org, isLoading } = useAsyncQuery(
    queryKeys.admin.organization.detail(),
    organizationApi.getOrg,
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className={`${PANEL} flex flex-col items-center px-6 pb-6 pt-8`}>
            <Skeleton className="mb-5 h-28 w-28 rounded-2xl" />
            <Skeleton className="mb-2 h-5 w-32" />
          </div>
        </div>
        <div className="space-y-6 lg:col-span-3">
          <div className={`${PANEL} space-y-4 px-6 py-5`}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className={`${PANEL} px-6 py-5`}>
        <p className="text-sm text-muted-foreground not-interactive">
          This school has no organization yet. Ask an administrator to set it up.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground not-interactive">
          You have read-only access. Only an administrator can change these details.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <OrgReadOnlyHero name={org.name} logoUrl={org.logoUrl} />
        </div>

        <div className="space-y-6 lg:col-span-3">
          <div className={`${PANEL} space-y-4 px-6 py-5`}>
            <h3 className="text-sm font-semibold text-foreground">Details</h3>
            <dl className="space-y-4">
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground not-interactive">Name</dt>
                <dd className="whitespace-pre-wrap text-sm font-medium">{org.name}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-xs text-muted-foreground not-interactive">Description</dt>
                <dd className="whitespace-pre-wrap text-sm font-medium">
                  {org.description || "—"}
                </dd>
              </div>
            </dl>
          </div>

          <div className={`${PANEL} space-y-3 px-6 py-5`}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground not-interactive">
              <AtSign className="h-4 w-4" />
              Email Extension
            </h3>
            <div className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-sm">
              {org.emailExtension ? (
                org.emailExtension
              ) : (
                <span className="italic text-muted-foreground not-interactive">
                  No extension set
                </span>
              )}
            </div>
          </div>

          <OrgScheduleReadOnly />
        </div>
      </div>
    </div>
  );
}