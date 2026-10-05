import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SubjectTab } from "@/types/admin/subject.types";

interface SubjectTabsProps {
  filters: {
    selectedSchoolYearId: string | null;
    activeTab: SubjectTab;
  };
  onTabChange?: (tab: SubjectTab) => void;
}

export function SubjectTabs({
  filters: { selectedSchoolYearId, activeTab },
  onTabChange,
}: SubjectTabsProps) {
  if (!selectedSchoolYearId) return null;

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange?.(v as SubjectTab)}>
      <TabsList className="h-9">
        <TabsTrigger value="major" className="text-sm px-4">
          Major Subjects
        </TabsTrigger>
        <TabsTrigger value="minor" className="text-sm px-4">
          Minor Subjects
        </TabsTrigger>
        <TabsTrigger value="archived" className="text-sm px-4">
          Archived
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}