// frontend/src/components/student/class/overview/ClassInfoCard.tsx
import { User, Clock, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSchedule } from "@/utils/classes.utils";
import type { StudentClassItem } from "@/api/student/class.api";

interface ClassInfoCardProps {
  data: StudentClassItem;
}

export function ClassInfoCard({ data }: ClassInfoCardProps): React.JSX.Element {
  const { class: cls } = data;
  const schedule = formatSchedule(cls.schedules);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Class Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row icon={BookOpen} label="Subject" value={cls.subjectName ?? "—"} />
        <Row icon={User}     label="Educator" value={cls.educatorName ?? "—"} />
        <Row icon={Clock}    label="Schedule" value={schedule} />
      </CardContent>
    </Card>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}): React.JSX.Element {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
          {label}
        </p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}