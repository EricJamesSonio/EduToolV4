"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, ModalFooter } from "@/components/shared/Modal";
import { SubjectHierarchyGraph } from "@/components/admin/subject/hierarchy/SubjectHierarchyGraph";
import { SubjectHierarchyLegend } from "@/components/admin/subject/hierarchy/SubjectHierarchyLegend";
import { useSubjectHierarchy, useHierarchyStatuses } from "@/hooks/admin/useSubjectHierarchy";
import type { HierarchyScope } from "@/api/admin/subject-hierarchy.api";

interface Props {
  open: boolean;
  onClose: () => void;
  scope: HierarchyScope;
  scopeLabel?: string;
  studentId?: string | null;
  focusSubjectId?: string | null;
  title?: string;
}

/**
 * Reusable hierarchy viewer: same graph as the Subjects page, optionally
 * overlaid with a student's ✓ completed / ○ pending statuses.
 */
export function SubjectHierarchyModal({
  open,
  onClose,
  scope,
  scopeLabel,
  studentId,
  focusSubjectId,
  title,
}: Props): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | null>(focusSubjectId ?? null);
  const { data, isLoading } = useSubjectHierarchy(scope, open);

  const nodeIds = useMemo(() => (data?.nodes ?? []).map((n) => n.id), [data]);
  const { data: statuses } = useHierarchyStatuses(studentId ?? null, nodeIds, open && !!studentId);

  const ranks = useMemo(() => (data?.levels ?? []).map((l) => l.rank), [data]);
  const levelNameOf = useMemo(() => {
    const map = new Map((data?.levels ?? []).map((l) => [l.rank, l.name]));
    return (rank: number): string => map.get(rank) ?? `Year ${rank}`;
  }, [data]);

  if (!open) return <></>;

  return (
    <Modal open={open} onClose={onClose} title={title ?? "Subject Hierarchy"} size="full">
      <div className="space-y-3">
        {scopeLabel && <p className="text-xs text-muted-foreground">{scopeLabel}</p>}
        {data && <SubjectHierarchyLegend ranks={ranks} levelNameOf={levelNameOf} />}
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-10 text-center">Loading hierarchy…</p>
        ) : data ? (
          <>
            <SubjectHierarchyGraph
              nodes={data.nodes}
              edges={data.edges}
              statuses={statuses ?? undefined}
              selectedId={selectedId}
              onSelect={(s) => setSelectedId(s.id)}
              levelNameOf={levelNameOf}
            />
            <p className="text-xs text-muted-foreground">
              {data.nodes.length} subjects · {data.edges.length} prerequisite links
              {studentId ? " · ✓ = completed (record or passing grade)" : ""}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground py-10 text-center">No hierarchy available.</p>
        )}
      </div>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </ModalFooter>
    </Modal>
  );
}
