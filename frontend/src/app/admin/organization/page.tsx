"use client"

import { PageHeader } from "@/components/shared/PageHeader"
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide"
import { OrgDetailsCard } from "@/components/admin/organization/OrgDetailsCard"
import { OrgReadOnlyCard } from "@/components/admin/organization/OrgReadOnlyCard"
import { useRole } from "@/hooks/useRole"

export default function OrganizationPage(): React.JSX.Element {
  const { isRegistrar } = useRole()

  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Organization"
        actions={<HelpGuide slug="admin_organization" />}
      />

      {isRegistrar ? <OrgReadOnlyCard /> : <OrgDetailsCard />}
    </div>
  )
}