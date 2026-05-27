"use client"

import { PageHeader } from "@/components/shared/PageHeader"
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide"
import { OrgDetailsCard } from "@/components/admin/organization/OrgDetailsCard"
import { EmailExtensionCard } from "@/components/admin/organization/EmailExtensionCard"

export default function OrganizationPage(): React.JSX.Element {
  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Organization"
        actions={<HelpGuide slug="admin_organization" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrgDetailsCard />
        <EmailExtensionCard />
      </div>
    </div>
  )
}