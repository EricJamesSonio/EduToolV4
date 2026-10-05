"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClassFormSelectField, type SelectFieldOption } from "./ClassFormSelectField";
import { SemesterTemplateWarning } from "./SemesterTemplateWarning";
import type { CreateClassForm } from "./CreateClassDialog.types";
import type { CreateClassData } from "./hooks/useCreateClassForm";

type StringField = Exclude<keyof CreateClassForm, "schedules">;

interface CreateClassFormFieldsProps {
  schoolYearId: string | null;
  schoolYearName: string | null;
  data: CreateClassData;
  /**
   * Whether the admin picked the department themselves. Until they do, no
   * department-scoped validation or warning is shown — a restored draft must
   * not make "No template assigned" appear before anyone has chosen anything.
   */
  programChosenByUser: boolean;
  /** Department change goes through the hook so the flag can be updated. */
  onProgramChange: (value: string) => void;
  takenSubjectIds: Set<string>;
  subjectAlreadyHasClass: boolean;
  /** Called when the "no semester template" warning asks to leave for Semester Settings. */
  onGoToSemesterSettings: () => void;
}

function formatSemesterRange(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const e = new Date(end).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${s} – ${e}`;
}

export function CreateClassFormFields({
  schoolYearId,
  schoolYearName,
  data,
  programChosenByUser,
  onProgramChange,
  takenSubjectIds,
  subjectAlreadyHasClass,
  onGoToSemesterSettings,
}: CreateClassFormFieldsProps): React.JSX.Element {
  const { watch, setValue } = useFormContext<CreateClassForm>();
  const v = watch();

  const {
    programs,
    tracks,
    hasTrack,
    isCourseTrack,
    levels,
    sections,
    subjects,
    semesters,
    educators,
    programMissingTemplate,
    templateAssignmentsLoading,
  } = data;

  const set = (field: StringField) => (value: string) => setValue(field, value);

  const programOptions: SelectFieldOption[] = programs.map((p) => ({
    value: p.id,
    label: p.name,
  }));

  const semesterOptions: SelectFieldOption[] = semesters.map((s) => ({
    value: s.id,
    label: s.name,
    description: formatSemesterRange(s.startDate, s.endDate),
  }));

  const trackOptions: SelectFieldOption[] = tracks.map((t) => ({ value: t.id, label: t.name }));
  const levelOptions: SelectFieldOption[] = levels.map((l) => ({ value: l.id, label: l.name }));
  const sectionOptions: SelectFieldOption[] = sections.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const subjectOptions: SelectFieldOption[] = subjects.map((s) => {
    const taken = takenSubjectIds.has(s.id);
    return {
      value: s.id,
      label: s.title,
      disabled: taken,
      note: taken ? "(already has a class)" : undefined,
    };
  });

  const educatorOptions: SelectFieldOption[] = educators.map((e) => ({
    value: e.id,
    label: e.fullName,
  }));

  // The semester block is entirely department-scoped, so it stays untouched until
  // the admin has actually chosen one. Without this a restored draft made the
  // "No template assigned" validation fire the moment the dialog opened.
  const semesterStatus = !v.programId || !programChosenByUser
    ? "Select a department first"
    : templateAssignmentsLoading
      ? "Checking template…"
      : programMissingTemplate
        ? "No template assigned"
        : semesters.length === 0
          ? "No semesters available"
          : undefined;

  const trackNoun = isCourseTrack ? "course" : "strand";

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>School Year</Label>
        <Input value={schoolYearName ?? schoolYearId ?? "No school year selected"} disabled />
      </div>

      <ClassFormSelectField
        label="Department"
        value={v.programId}
        onChange={onProgramChange}
        options={programOptions}
        placeholder="Select department"
        emptyMessage="No departments found"
        disabled={!schoolYearId}
      />

      {programChosenByUser && !templateAssignmentsLoading && programMissingTemplate && (
        <SemesterTemplateWarning onGoToSettings={onGoToSemesterSettings} />
      )}

      <ClassFormSelectField
        label="Semester"
        value={v.semesterId}
        onChange={set("semesterId")}
        options={semesterOptions}
        placeholder="Select semester"
        emptyMessage="No semesters for this department"
        statusText={semesterStatus}
        disabled={
          !v.programId ||
          !programChosenByUser ||
          programMissingTemplate ||
          templateAssignmentsLoading
        }
      />

      {hasTrack && (
        <ClassFormSelectField
          label={isCourseTrack ? "Course" : "Strand"}
          value={v.trackId}
          onChange={set("trackId")}
          options={trackOptions}
          placeholder={`Select ${trackNoun}`}
          emptyMessage={`No ${trackNoun}s found`}
          statusText={!v.semesterId ? "Select a semester first" : undefined}
          disabled={!v.programId || !v.semesterId || programMissingTemplate}
        />
      )}

      <ClassFormSelectField
        label="Level"
        value={v.levelId}
        onChange={set("levelId")}
        options={levelOptions}
        placeholder="Select level"
        emptyMessage="No levels found"
        disabled={
          !v.programId ||
          programMissingTemplate ||
          !v.semesterId ||
          (hasTrack && !v.trackId)
        }
      />

      <ClassFormSelectField
        label="Section"
        value={v.sectionId}
        onChange={set("sectionId")}
        options={sectionOptions}
        placeholder="Select section"
        emptyMessage="No sections for this level"
        helperText="Class capacity follows the section's capacity."
        statusText={
          !v.levelId
            ? "Select a level first"
            : sections.length === 0
              ? "This level has no sections yet"
              : undefined
        }
        disabled={
          !v.programId ||
          !programChosenByUser ||
          programMissingTemplate ||
          !v.semesterId ||
          !v.levelId
        }
      />

      <ClassFormSelectField
        label="Subject"
        value={v.subjectId}
        onChange={set("subjectId")}
        options={subjectOptions}
        placeholder="Select subject"
        emptyMessage="No subjects for this level"
        statusText={!v.sectionId ? "Select a section first" : undefined}
        disabled={
          !v.programId ||
          !programChosenByUser ||
          programMissingTemplate ||
          !v.semesterId ||
          !v.levelId ||
          !v.sectionId
        }
        errorText={
          subjectAlreadyHasClass
            ? "This section already has a class for this subject. Edit that class to add more time slots."
            : undefined
        }
      />

      <ClassFormSelectField
        label="Educator"
        value={v.educatorId}
        onChange={set("educatorId")}
        options={educatorOptions}
        placeholder="Select educator"
        emptyMessage="No educators available"
        // The educator is the input to both the conflict check and room
        // availability, so it is the LAST pick. Letting the admin reach it
        // first meant they could jump to the schedule grid from the bottom of
        // the form without ever choosing a section or subject.
        statusText={
          !v.sectionId
            ? "Select a section first"
            : !v.subjectId
              ? "Select a subject first"
              : undefined
        }
        disabled={
          !v.programId ||
          !programChosenByUser ||
          programMissingTemplate ||
          !v.semesterId ||
          !v.levelId ||
          !v.sectionId ||
          !v.subjectId
        }
      />
    </div>
  );
}