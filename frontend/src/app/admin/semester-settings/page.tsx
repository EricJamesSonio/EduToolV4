"use client";

import { useSemesters, useDeleteSemester } from "@/hooks/admin/useSemester";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { useState } from "react";

export default function SemestersPage() {
  const { data, isLoading, error } = useSemesters();
  const deleteMutation = useDeleteSemester();

  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading semesters</div>;

  return (
    <div className="space-y-6">
        <PageHeader
        title="Semesters"
        description="Manage semesters and academic terms"
        actions={<Button>+ Create Semester</Button>}
        />

      {!data || data.length === 0 ? (
        <EmptyState title="No semesters yet" />
      ) : (
        <div className="grid gap-4">
          {data.map((semester) => (
            <Card key={semester.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {semester.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {semester.startDate} → {semester.endDate}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteId(semester.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {/* TERMS */}
                <div className="border-t pt-3">
                  <p className="text-sm font-medium mb-2">Terms</p>

                  <div className="grid gap-2">
                    {semester.terms.map((term) => (
                      <div
                        key={term.id}
                        className="flex justify-between text-sm bg-muted p-2 rounded"
                      >
                        <span>
                          {term.orderIndex}. {term.name}
                        </span>
                        <span className="text-muted-foreground">
                          {term.startDate} → {term.endDate}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* DELETE CONFIRM */}
    <ConfirmDialog
    open={!!deleteId}
    onOpenChange={() => setDeleteId(null)}
    title="Delete Semester"
    message="Are you sure you want to delete this semester?"
    onConfirm={() => {
        if (deleteId) {
        deleteMutation.mutate(deleteId);
        setDeleteId(null);
        }
    }}
    destructive
    />
    </div>
  );
}