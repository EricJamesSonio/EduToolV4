import type { ProgramType } from "@/types/admin/program.types";
import { PROGRAM_TYPE_LABELS } from "@/types/admin/program.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useSchoolProfileDraft,
} from "@/hooks/admin/useSchoolProfileDraft";
import type {
  DraftSemesterTermConfig,
} from "@/hooks/admin/useSchoolProfileDraft";

type SchoolProfileDraft = ReturnType<typeof useSchoolProfileDraft>;

type SemesterTermsSectionProps = {
  departments: Array<{ type: ProgramType }>;
  draft: SchoolProfileDraft;
  readOnly: boolean;
  saveMutationPending: boolean;
};

export function SchoolProfileSemesterTermsSection({
  departments,
  draft,
  readOnly,
}: SemesterTermsSectionProps) {
  const semesterConfigMap = draft.semesterConfigs as Record<string, DraftSemesterTermConfig>;

  return (
    <div className="space-y-4">
      {departments.map((dept) => {
        const config = semesterConfigMap[dept.type];
        if (!config) return null;

        return (
          <div
            key={dept.type}
            className="rounded-lg border p-4 space-y-3 bg-muted/10"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium">
                {PROGRAM_TYPE_LABELS[dept.type]}
              </span>
              <span className="text-xs text-muted-foreground">
                {config.terms.length} terms
              </span>
            </div>

            <div className="space-y-2">
              {config.terms.map((term, index) => (
                <div
                  key={term.key}
                  className="flex items-center gap-2 rounded-md border bg-background p-2"
                >
                  <span className="text-xs text-muted-foreground w-6 text-center">
                    {index + 1}.
                  </span>
                  <Input
                    value={term.name}
                    disabled={readOnly}
                    onChange={(event) =>
                      draft.renameSemesterTerm(
                        dept.type,
                        term.key,
                        event.target.value,
                      )
                    }
                    placeholder="Term name"
                    className="flex-1 h-7 text-xs"
                  />
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => draft.deleteSemesterTerm(dept.type, term.key)}
                      disabled={config.terms.length <= 1}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  draft.addSemesterTerm(
                    dept.type,
                    `Term ${config.terms.length + 1}`,
                  )
                }
              >
                + Add Term
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
