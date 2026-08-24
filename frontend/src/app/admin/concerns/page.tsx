// ===== File: frontend\src\app\admin\concerns\page.tsx =====
"use client";

import { useEffect, useMemo, useState } from "react";
import { Tag } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { Button } from "@/components/ui/button";

import { CategoryManagerDialog } from "@/components/admin/concern/CategoryManagerDialog";
import { ConcernStudentDetailsDialog } from "@/components/admin/concern/ConcernStudentDetailsDialog";
import { ConcernFilterBar, type ConcernFilters } from "@/components/admin/concern/ConcernFilterBar";
import { ConcernListPanel } from "@/components/admin/concern/ConcernListPanel";
import { ConcernThreadPanel } from "@/components/admin/concern/ConcernThreadPanel";

import { useStaffConcerns, useStaffConcernThread } from "@/hooks/admin/useConcerns";
import { useConcernCategories } from "@/hooks/admin/useConcernCategories";
import { useConcernColumns } from "@/hooks/admin/useConcernColumns";

import type { ListStaffFilters, ConcernCategoryItem } from "@/api/admin/concern.api";

const DEFAULT_PAGE_SIZE = 20;
const ALL_FILTERS: ConcernFilters = { status: "all", categoryId: "all", senderRole: "all" };

export default function AdminConcernsPage(): React.JSX.Element {
  const { user: currentUser } = useAuth();
  const [filters, setFilters] = useState<ConcernFilters>(ALL_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string>();
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [studentDetailsOpen, setStudentDetailsOpen] = useState(false);

  const request: ListStaffFilters = useMemo(() => {
    return {
      status: filters.status !== "all" ? filters.status : undefined,
      categoryId: filters.categoryId !== "all" ? filters.categoryId : undefined,
      senderRole: filters.senderRole !== "all" ? filters.senderRole : undefined,
      page,
      limit,
    };
  }, [filters, page, limit]);

  const listQuery = useStaffConcerns(request);
  const threadQuery = useStaffConcernThread(selectedId);
  const { data: categories = [], isPending: categoriesLoading } = useConcernCategories();
  const columns = useConcernColumns();

  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.meta?.total ?? 0;
  const totalPages = listQuery.data?.meta?.totalPages ?? 1;
  const thread = threadQuery.data;

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages));
  }, [page, totalPages]);

  const handleFilterChange = (key: keyof ConcernFilters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-10">
      <PageHeader
        title="Concerns"
        description="Review, reply to, and resolve student concerns."
        actions={<HelpGuide slug="admin_concerns" />}
      />

    <div className="flex items-center justify-end gap-2">
      <Button size="sm" onClick={() => setCategoryManagerOpen(true)}>
        <Tag className="mr-1.5 h-4 w-4" />
        Manage Categories
      </Button>
    </div>

      <ConcernFilterBar
        filters={filters}
        categories={categories}
        categoriesLoading={categoriesLoading}
        onFilterChange={handleFilterChange}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <ConcernListPanel
          columns={columns}
          rows={rows}
          isLoading={listQuery.isPending}
          page={page}
          limit={limit}
          total={total}
          onRowSelect={setSelectedId}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />

        <ConcernThreadPanel
          thread={thread}
          isLoading={threadQuery.isPending}
          selectedId={selectedId}
          currentUserId={currentUser?.id}
          onOpenStudentDetails={() => setStudentDetailsOpen(true)}
        />
      </div>

      <CategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />

      <ConcernStudentDetailsDialog
        studentId={thread?.sender_account_id ?? null}
        open={studentDetailsOpen}
        onClose={() => setStudentDetailsOpen(false)}
      />
    </div>
  );
}

export type { ConcernCategoryItem };