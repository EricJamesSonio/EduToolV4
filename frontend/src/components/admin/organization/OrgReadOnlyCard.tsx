"use client";

import { Building2 } from "lucide-react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { organizationApi } from "@/api/admin/organization.api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrgReadOnlyCard(): React.JSX.Element {
  const { data: org, isLoading } = useAsyncQuery(
    queryKeys.admin.organization.detail(),
    organizationApi.getOrg,
  );

  if (isLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="space-y-4 px-6 py-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!org) {
    return (
      <Card className="border-border/60">
        <CardContent className="px-6 py-5">
          <p className="text-sm text-muted-foreground not-interactive">
            This school has no organization yet. Ask an administrator to set it up.
          </p>
        </CardContent>
      </Card>
    );
  }

  const fields = [
    { label: "Name", value: org.name },
    { label: "Description", value: org.description || "—" },
    { label: "Email extension", value: org.emailExtension || "—" },
  ];

  return (
    <Card className="border-border/60">
      <CardContent className="space-y-5 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground not-interactive">
            You have read-only access. Only an administrator can change these details.
          </p>
        </div>

        <dl className="space-y-4">
          {fields.map((field) => (
            <div key={field.label} className="space-y-1">
              <dt className="text-xs text-muted-foreground not-interactive">
                {field.label}
              </dt>
              <dd className="whitespace-pre-wrap text-sm font-medium">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}