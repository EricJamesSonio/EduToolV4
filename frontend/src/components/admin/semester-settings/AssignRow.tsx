import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Circle } from "lucide-react";
import type { AxiosError } from "axios";
import type {
  SemesterTemplate,
  TemplateAssignment,
} from "@/types/admin/semester-template.types";
import {
  useAssignTemplate,
  useRemoveTemplateAssignment,
} from "@/hooks/admin/useSemesterTemplate";

interface Program {
  id: string;
  name: string;
  type: string;
  school_year_id: string;
  semesterAssignment: TemplateAssignment | null;
}

interface AssignRowProps {
  program: Program;
  templates: SemesterTemplate[];
}

const errMsg = (e: unknown) =>
  (e as AxiosError<{ message: string }>)?.response?.data?.message ??
  "Something went wrong.";

export function AssignRow({
  program,
  templates,
}: AssignRowProps): React.JSX.Element {
  const assignMutation = useAssignTemplate();
  const removeMutation = useRemoveTemplateAssignment();
  const isPending = assignMutation.isPending || removeMutation.isPending;
  const compatible = templates;
  const current = program.semesterAssignment;

  const handleChange = (templateId: string | null) => {
    if (templateId === null) return;
    if (templateId === "none") {
      if (!current) return;
      removeMutation.mutate(program.id, {
        onSuccess: () => toast.success("Assignment removed."),
        onError: (e) => toast.error(errMsg(e)),
      });
    } else {
      assignMutation.mutate(
        { programId: program.id, templateId },
        {
          onSuccess: () => toast.success("Template assigned."),
          onError: (e) => toast.error(errMsg(e)),
        }
      );
    }
  };

  return (
    <div className="flex items-center gap-3 py-2.5 px-1">
      {current ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
      )}
      <span className="text-sm font-medium min-w-0 flex-1 truncate">
        {program.name}
      </span>
      <div className="w-52 shrink-0">
        {compatible.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-1">
            No compatible templates
          </p>
        ) : (
          <Select
            value={current?.template_id ?? "none"}
            onValueChange={handleChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Assign template…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none" className="text-xs text-muted-foreground">
                — None —
              </SelectItem>
              {compatible.map((t) => (
                <SelectItem key={t.id} value={t.id} className="text-xs">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}