import { User, Clock, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { WEEK_COLORS } from "@/lib/palette";
import { formatSchedule } from "@/utils/classes.utils";
import type { StudentClassItem } from "@/api/student/class.api";

interface ClassInfoCardProps {
  data: StudentClassItem;
}

const LABEL_COLORS: Record<string, string> = {
  Subject:  WEEK_COLORS[0],
  Educator: WEEK_COLORS[1],
  Schedule: WEEK_COLORS[2],
};

export function ClassInfoCard({ data }: ClassInfoCardProps): React.JSX.Element {
  const { class: cls } = data;
  const schedule = formatSchedule(cls.schedules);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={cn("inline-block rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wider", WEEK_COLORS[3])}>
          Class Info
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row icon={BookOpen} label="Subject"  value={cls.subjectName ?? "—"} />
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
        <p className={cn("inline-block rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", LABEL_COLORS[label] ?? "text-muted-foreground/60")}>
          {label}
        </p>
        <p className="text-sm font-medium text-foreground truncate mt-0.5">{value}</p>
      </div>
    </div>
  );
}
