"use client"

import { School } from "lucide-react"
import { PageHeader } from "@/components/shared/PageHeader"
import { EmptyState } from "@/components/shared/EmptyState"
import { Skeleton } from "@/components/ui/skeleton"
import { useSchoolProfile } from "@/hooks/admin/useSchoolProfile"
import { SchoolProfileReadOnlyView } from "./SchoolProfileReadOnlyView"

export function RegistrarSchoolProfileView(): React.JSX.Element {
  const { data, isLoading } = useSchoolProfile()
  const departments = Array.isArray(data) ? data : []

  return (
    <div className="space-y-6">
      <PageHeader
        title="School Profile"
        description="Departments, levels, sections and subjects this school offers. Only an administrator can change them."
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      ) : departments.length === 0 ? (
        <EmptyState
          icon={School}
          title="No departments configured yet"
          description="An administrator has not set up the school profile yet."
        />
      ) : (
        <SchoolProfileReadOnlyView departments={departments} />
      )}
    </div>
  )
}