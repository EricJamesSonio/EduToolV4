"use client"

import { PageHeader } from "@/components/shared/PageHeader"
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide"
import { OrgDetailsCard } from "@/components/admin/organization/OrgDetailsCard"

export default function OrganizationPage(): React.JSX.Element {
  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Organization"
        actions={<HelpGuide slug="admin_organization" />}
      />

      <OrgDetailsCard />
    </div>
  )
}