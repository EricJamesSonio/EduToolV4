import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SubjectType } from "@/types/admin/subject.types";

interface SubjectTabsProps {
  filters: {
    selectedSchoolYearId: string | null;
    activeTab: SubjectType;
  };
  onTabChange?: (tab: SubjectType) => void;
}

export function SubjectTabs({
  filters: { selectedSchoolYearId, activeTab },
  onTabChange,
}: SubjectTabsProps) {
  if (!selectedSchoolYearId) return null;

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange?.(v as SubjectType)}>
      <TabsList className="h-9">
        <TabsTrigger value="major" className="text-sm px-4">
          Major Subjects
        </TabsTrigger>
        <TabsTrigger value="minor" className="text-sm px-4">
          Minor Subjects
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}