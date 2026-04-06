"use client"

import { PageHeader }    from "@/components/shared/PageHeader"
import { OrgDetailsCard } from "@/components/admin/organization/OrgDetailsCard"
import { SeederCard }     from "@/components/admin/organization/SeederCard"

export default function OrganizationPage(): React.JSX.Element {
  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader title="Organization" />
      <OrgDetailsCard />
      <SeederCard />
    </div>
  )
}