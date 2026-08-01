"use client"

import { PageHeader } from "@/components/shared/PageHeader"
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide"
import { SeederCard } from "@/components/admin/data-seeder/SeederCard"

export default function DataSeederPage(): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Seeder"
        description="Generate sample academic data to explore the platform."
        actions={<HelpGuide slug="admin_data_seeder" />}
      />
      <SeederCard />
    </div>
  )
}
