"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Check,
  CopyCheck,
  Loader2,
  Save,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";

import {
  useTeachableSubjects,
  useSetTeachableSubjects,
  useCarryOverTeachableSubjects,
} from "@/hooks/admin/useEducators";
import { useSubjects } from "@/hooks/admin/useSubject";
import { useSchoolYears } from "@/hooks/admin/useSchoolYears";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AxiosError } from "axios";

interface EducatorTeachableSubjectsCardProps {
  educatorId: string;
  schoolYearId?: string;
}

/** Groups subjects by department, then level, for a scannable picker. */
function groupKey(s: {
  programName: string | null;
  levelName: string | null;
}): string {
  return `${s.programName ?? "Unassigned"} › ${s.levelName ?? "—"}`;
}

interface UnmatchedLink {
  educatorId: string;
  subjectName: string;
  reason: string;
}

export function EducatorTeachableSubjectsCard({
  educatorId,
  schoolYearId,
}: EducatorTeachableSubjectsCardProps): React.JSX.Element {
  const { data: assigned, isLoading } = useTeachableSubjects(educatorId);
  const { data: allSubjects = [] } = useSubjects(
    schoolYearId ? { schoolYearId } : undefined,
  );
  const { data: schoolYears = [] } = useSchoolYears();
  const saveMutation = useSetTeachableSubjects();
  const carryMutation = useCarryOverTeachableSubjects();

  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [unmatched, setUnmatched] = useState<UnmatchedLink[]>([]);
  const [showUnmatched, setShowUnmatched] = useState(false);

  useEffect(() => {
    setSelected((assigned ?? []).map((s) => s.id));
  }, [assigned]);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? allSubjects.filter((s) => s.title.toLowerCase().includes(q))
      : allSubjects;
    const map = new Map<string, typeof filtered>();
    for (const s of filtered) {
      const key = groupKey(s);
      const list = map.get(key);
      if (list) list.push(s);
      else map.set(key, [s]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [allSubjects, search]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const dirty =
    JSON.stringify([...selected].sort()) !==
    JSON.stringify((assigned ?? []).map((s) => s.id).sort());

  const errMessage = (err: unknown, fallback: string) => {
    const ax = err as AxiosError<{ message?: string }>;
    return ax.response?.data?.message ?? fallback;
  };

  const save = () => {
    saveMutation.mutate(
      { educatorId, subjectIds: selected },
      {
        onError: (err: unknown) =>
          toast.error(errMessage(err, "Failed to save teachable subjects.")),
      },
    );
    setOpen(false);
  };
  const runCarryOver = () => {
    // Copy from the year immediately AFTER the one being viewed: schoolYears
    // is newest-first, so the previous year is the next entry.
    const index = schoolYears.findIndex((y: { id: string }) => y.id === schoolYearId);
    const from = schoolYears[index + 1];
    if (!from) {
      toast.error("There is no earlier school year to copy from.");
      return;
    }
    carryMutation.mutate(
      { fromSchoolYearId: from.id, toSchoolYearId: schoolYearId! },
      {
        onSuccess: (result) => {
          setUnmatched(result.unmatched);
          setShowUnmatched(result.unmatched.length > 0);
        },
        onError: (err: unknown) =>
          toast.error(errMessage(err, "Failed to copy subjects.")),
      },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold not-interactive">
            <BookOpen className="h-4 w-4" />
            Teachable subjects
          </h2>
          <p className="text-xs text-muted-foreground">
            Subjects this educator is able to teach. The class generator assigns
            only from this list.
          </p>
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-40" />
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runCarryOver}
              disabled={
                carryMutation.isPending || !schoolYearId || schoolYears.length < 2
              }
              title="Copy teachable subjects from the previous school year"
            >
              {carryMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <CopyCheck className="h-3.5 w-3.5 mr-1.5" />
              )}
              Copy from previous year
            </Button>
            <Button size="sm" onClick={save} disabled={saveMutation.isPending || !dirty}>
              {saveMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1.5" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        {/* Base UI's PopoverTrigger renders its own <button> and does not take
            button props or children — it is a controlled peer of the
            Popover root, so the label lives beside it. */}
        <div className="flex items-center gap-2">
          <PopoverTrigger className="border rounded-md px-3 py-1.5 text-xs font-medium bg-background">
            <Search className="h-3.5 w-3.5" />
          </PopoverTrigger>
          <span className="text-xs text-muted-foreground">
            {selected.length === 0
              ? "No subjects selected"
              : `${selected.length} subject${selected.length === 1 ? "" : "s"} selected`}
          </span>
        </div>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="border-b p-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects..."
              className="h-8"
            />
          </div>
          <ScrollArea className="h-64">
            {grouped.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">
                No subjects found for this school year.
              </p>
            ) : (
              grouped.map(([group, subjects]) => (
                <div key={group} className="p-1">
                  <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">
                    {group}
                  </p>
                  {subjects.map((s) => {
                    const on = selected.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggle(s.id)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted"
                      >
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            on
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border"
                          }`}
                        >
                          {on ? <Check className="h-3 w-3" /> : null}
                        </span>
                        <span className="truncate">{s.title}</span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </ScrollArea>
          <div className="flex items-center justify-between border-t p-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected([])}>
              Clear all
            </Button>
            <Button size="sm" onClick={save} disabled={!dirty}>
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {assigned && assigned.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {assigned.map((s) => (
            <Badge key={s.id} variant="outline" className="text-xs font-normal">
              {s.name}
              {s.levelName ? (
                <span className="text-muted-foreground"> � {s.levelName}</span>
              ) : null}
              <button
                type="button"
                aria-label={`Remove ${s.name}`}
                onClick={() => {
                  const next = selected.filter((x) => x !== s.id);
                  setSelected(next);
                  saveMutation.mutate({ educatorId, subjectIds: next });
                }}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No subjects set. This educator will not be eligible for automatic
          class generation.
        </p>
      )}

      {unmatched.length > 0 && (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <TriangleAlert className="h-3.5 w-3.5" />
              {unmatched.length} subject link(s) could not be matched
            </p>
            <button
              type="button"
              onClick={() => setShowUnmatched((v) => !v)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              {showUnmatched ? "Hide" : "Show"}
            </button>
          </div>
          {showUnmatched ? (
            <ul className="mt-2 space-y-1">
              {unmatched.map((u, i) => (
                <li key={i} className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">{u.subjectName}</span>
                  {" "}� {u.reason}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </div>
  );
};
