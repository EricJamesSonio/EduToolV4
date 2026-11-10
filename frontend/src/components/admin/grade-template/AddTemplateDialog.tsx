"use client";

import { useEffect, useState } from "react";

import { DialogForm } from "@/components/shared/DialogForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  gradeTemplateApi,
  readErrorMessage,
  type ProgramOption,
  type TemplateAnalysis,
} from "@/api/grade-template.api";

const SELECT =
  "w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary";

export function AddTemplateDialog({
  open,
  onClose,
  schoolYearId,
  schoolYearName,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  schoolYearId: string;
  schoolYearName: string;
  onUploaded: (result: {
    id: string;
    name: string;
    analysis: TemplateAnalysis;
  }) => void;
}): React.ReactElement {
  const [name, setName] = useState("");
  const [programId, setProgramId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [replace, setReplace] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    gradeTemplateApi
      .programs(schoolYearId)
      .then(setPrograms)
      .catch(() => setPrograms([]));
  }, [open, schoolYearId]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Enter a name for the template.");
      return;
    }
    if (!file) {
      setError("Select the .xlsx file.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await gradeTemplateApi.upload({
        file,
        schoolYearId,
        programId: programId || undefined,
        name: name.trim(),
        replace,
      });
      onUploaded(res);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 409) setConflict(true);
      setError(await readErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogForm
      open={open}
      onClose={onClose}
      title="Add Template"
      description={`Add a CHED / DepEd grade workbook for ${schoolYearName}. Educators receive a copy filtered to their own classes.`}
      size="lg"
      onSubmit={() => void submit()}
      isSaving={saving}
      saveLabel="Upload"
      error={error}
    >
      <div className="space-y-1.5">
        <Label htmlFor="gt-name">Template name</Label>
        <Input
          id="gt-name"
          placeholder="e.g. CHED Grade Sheet — 1st Semester"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gt-dept">Department</Label>
        <select
          id="gt-dept"
          className={SELECT}
          value={programId}
          onChange={(e) => {
            setProgramId(e.target.value);
            setConflict(false);
            setReplace(false);
          }}
          disabled={saving}
        >
          <option value="">All departments</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="gt-file">Workbook (.xlsx, up to 10 MB)</Label>
        <input
          id="gt-file"
          type="file"
          accept=".xlsx"
          className={SELECT}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          disabled={saving}
        />
      </div>

      {conflict && (
        <label className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={replace}
            onChange={(e) => setReplace(e.target.checked)}
          />
          <span>
            Replace the existing template for this year and department. Grades
            already collected in it will be lost.
          </span>
        </label>
      )}
    </DialogForm>
  );
}