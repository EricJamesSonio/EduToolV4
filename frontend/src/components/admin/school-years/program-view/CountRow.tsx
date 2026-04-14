// frontend\src\components\admin\enrollment\program-view\CountRow.tsx
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CountRowProps {
  label:   string;
  count:   number;
  icon?:   React.ReactNode;
  onClick: () => void;
}

export function CountRow({ label, count, icon, onClick }: CountRowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left group"
    >
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <span className="flex-1 text-sm font-medium truncate">{label}</span>
      <Badge variant="secondary" className="text-xs font-normal shrink-0">
        {count} {count === 1 ? "student" : "students"}
      </Badge>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </button>
  );
}