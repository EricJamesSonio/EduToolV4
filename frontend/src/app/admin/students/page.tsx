"use client";

import { Suspense, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Download } from "lucide-react";
import { useRouter } from "next/navigation";

import { studentApi }  from "@/api/admin/student.api";
import type { Student } from "@/types/admin/student.types";
import type { GetStudentsQuery } from "@/api/admin/student.api";

import { PageHeader }    from "@/components/shared/PageHeader";
import { EmptyState }    from "@/components/shared/EmptyState";
import { Skeleton }      from "@/components/ui/skeleton";
import { Button }        from "@/components/ui/button";

import { StudentFilterBar }    from "@/components/admin/student/StudentFilterBar";
import { StudentTable }        from "@/components/admin/student/StudentTable";
import { CreateStudentDialog } from "@/components/admin/student/CreateStudentDialog";

function StudentsPageInner(): React.JSX.Element {
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters]       = useState<GetStudentsQuery>({});

  const { data: studentsRaw, isLoading } = useQuery({
    queryKey: ["admin", "students", filters],
    queryFn:  () => studentApi.getAll(filters),
  });

  const students: Student[] = studentsRaw ?? [];

  const handleDownloadCredentials = () => {
    window.open(studentApi.downloadCredentials(), "_blank");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadCredentials}>
              <Download className="mr-1.5 h-4 w-4" />
              Download Credentials
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin/students/import")}
            >
              Import CSV
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Student
            </Button>
          </div>
        }
      />

      <StudentFilterBar filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description="Create your first student or adjust your filters."
          action={{ label: "New Student", onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <StudentTable
          data={students}
          onView={(s) => router.push(`/admin/students/${s.id}`)}
        />
      )}

      {createOpen && (
        <CreateStudentDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["admin", "students"] });
          }}
        />
      )}
    </div>
  );
}

export default function StudentsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <StudentsPageInner />
    </Suspense>
  );
}