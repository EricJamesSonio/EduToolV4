import type { Class } from "@/types/admin/class.types";
import { formatSchedule } from "../utils/classDetail.utils";

interface ClassInfoCardProps {
  cls: Class;
  enrolledCount: number;
}

interface InfoRowProps {
  label: string;
  children: React.ReactNode;
}

function InfoRow({ label, children }: InfoRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <span className="w-36 text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

export function ClassInfoCard({ cls, enrolledCount }: ClassInfoCardProps): React.JSX.Element {
  const capacity = cls.capacity ?? 0;
  const fillPercent = capacity > 0 ? Math.min((enrolledCount / capacity) * 100, 100) : 0;

  return (
    <div className="rounded-lg border bg-card divide-y">
      <InfoRow label="Subject">
        <span className="font-medium">{cls.subjectName ?? "—"}</span>
      </InfoRow>
      <InfoRow label="Educator">{cls.educatorName ?? "—"}</InfoRow>
      <InfoRow label="Section">{cls.sectionName ?? "—"}</InfoRow>
      <InfoRow label="Semester">{cls.semesterName ?? "—"}</InfoRow>
      <InfoRow label="Schedule">{formatSchedule(cls.schedules)}</InfoRow>
      <div className="flex items-center gap-4 px-4 py-3">
        <span className="w-36 text-sm text-muted-foreground shrink-0">Capacity</span>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums">
            {enrolledCount} / {capacity} enrolled
          </span>
          <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}