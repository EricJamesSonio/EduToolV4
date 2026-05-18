// ===== File: frontend/src/app/admin/organization/page.tsx =====
"use client"

import { PageHeader } from "@/components/shared/PageHeader"
import { OrgDetailsCard } from "@/components/admin/organization/OrgDetailsCard"
import { SeederCard } from "@/components/admin/organization/SeederCard"
import { EmailExtensionCard } from "@/components/admin/organization/EmailExtensionCard"

export default function OrganizationPage(): React.JSX.Element {
  return (
    <div className="space-y-8 pb-10">
      <PageHeader title="Organization" />

      {/* ================= DETAILS + EMAIL EXTENSION SIDE BY SIDE ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrgDetailsCard />
        <EmailExtensionCard />
      </div>

      {/* ================= SEEDER FULL WIDTH ================= */}
      <SeederCard />
    </div>
  )
}