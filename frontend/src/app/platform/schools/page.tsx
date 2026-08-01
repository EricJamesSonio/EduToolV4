"use client";

import { useState } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/SearchInput";
import { Pagination } from "@/components/shared/Pagination";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { platformApi, type SchoolOrg } from "@/api/platform.api";
import { getOrgLogoUrl } from "@/utils/org.util";

const adminStatusBadge: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  suspended: "bg-destructive/10 text-destructive",
};

function SchoolDetailDialog({
  school,
  onClose,
}: {
  school: SchoolOrg | null;
  onClose: () => void;
}) {
  if (!school) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl border shadow-lg w-full max-w-md p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-lg border border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {school.logoUrl ? (
              <img
                src={getOrgLogoUrl(school.logoUrl)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-xs text-muted-foreground">Logo</div>
            )}
          </div>

          <div className="space-y-1 min-w-0">
            <h2 className="text-lg font-semibold">{school.name}</h2>
            <p className="text-sm text-muted-foreground">
              {school.description ?? "No description provided."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/30 p-4 text-sm">
          <div className="flex flex-col gap-0.5">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Email Extension
            </p>
            <p className="text-foreground">{school.emailExtension ?? "—"}</p>
          </div>
          <div className="flex flex-col gap-0.5 col-span-2">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Admin
            </p>
            {school.admin ? (
              <div className="space-y-0.5">
                <p className="text-foreground">
                  {school.admin.fullName ?? "—"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {school.admin.email}
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    adminStatusBadge[school.admin.status] ?? ""
                  }`}
                >
                  {school.admin.status}
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">No admin assigned</p>
            )}
          </div>
        </div>

        <button
          className="w-full rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function PlatformSchoolsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<SchoolOrg | null>(null);

  const { data, isLoading } = useAsyncQuery(
    queryKeys.platform.schools.list({ search, page, limit }),
    () => platformApi.getSchools({ search: search || undefined, page, limit }),
  );

  const schools = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Schools" />

      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by name or email extension..."
          className="max-w-sm"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>School Name</TableHead>
              <TableHead>Email Extension</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Admin Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : schools.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground py-8"
                >
                  No schools found
                </TableCell>
              </TableRow>
            ) : (
              schools.map((school) => (
                <TableRow
                  key={school.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelected(school)}
                >
                  <TableCell>
                    <div className="h-8 w-8 rounded border border-border bg-muted flex items-center justify-center overflow-hidden">
                      {school.logoUrl ? (
                        <img
                          src={getOrgLogoUrl(school.logoUrl)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-[10px] text-muted-foreground">Logo</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {school.emailExtension ?? "—"}
                  </TableCell>
                  <TableCell>
                    {school.admin ? (
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {school.admin.fullName ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {school.admin.email}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {school.admin ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          adminStatusBadge[school.admin.status] ?? ""
                        }`}
                      >
                        {school.admin.status}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total > 0 && (
        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      )}

      <SchoolDetailDialog school={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
