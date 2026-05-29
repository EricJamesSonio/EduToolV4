import { User, Clock, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { formatSchedule } from "@/utils/classes.utils";
import type { StudentClassItem } from "@/api/student/class.api";

interface ClassInfoCardProps {
  data: StudentClassItem;
}

interface DetailItem {
  icon: React.ElementType;
  label: string;
  value: string;
}

export function ClassInfoCard({ data }: ClassInfoCardProps): React.JSX.Element {
  const { class: cls } = data;
  const schedule = formatSchedule(cls.schedules);

  const items: DetailItem[] = [
    { icon: BookOpen, label: "Subject", value: cls.subjectName ?? "—" },
    { icon: User,     label: "Educator", value: cls.educatorName ?? "—" },
    { icon: Clock,    label: "Schedule", value: schedule },
  ];

  return (
    <div className="rounded-lg border bg-card p-6">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-3">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
