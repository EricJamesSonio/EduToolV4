import { User, Clock, BookOpen, Hash } from "lucide-react";
import { formatScheduleLines } from "@/utils/classes.utils";
import type { StudentClassItem } from "@/api/student/class.api";

interface ClassInfoCardProps {
  data: StudentClassItem;
}

interface DetailItem {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}

export function ClassInfoCard({ data }: ClassInfoCardProps): React.JSX.Element {
  const { class: cls } = data;
  const scheduleLines = formatScheduleLines(cls.schedules);
  const capacityLabel = cls.capacity === 0 ? "Unlimited" : String(cls.capacity);

  const items: DetailItem[] = [
    { icon: BookOpen, label: "Subject", value: cls.subjectName ?? "—" },
    { icon: User,     label: "Educator", value: cls.educatorName ?? "—" },
    {
      icon: Hash,
      label: "Capacity",
      value:
        typeof cls.enrolledCount === "number" ? (
          <span>
            <span className="text-foreground">{cls.enrolledCount}</span>
            <span className="text-muted-foreground"> / {capacityLabel} enrolled</span>
          </span>
        ) : (
          capacityLabel
        ),
    },
    {
      icon: Clock,
      label: "Schedule",
      value:
        scheduleLines.length > 0 ? (
          <span className="block space-y-0.5">
            {scheduleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </span>
        ) : (
          "—"
        ),
    },
  ];

  return (
    <div className="rounded-lg border bg-card p-6">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <div className="text-sm font-medium">{value}</div>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}