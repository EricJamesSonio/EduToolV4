"use client"

import { PageHeader } from "@/components/shared/PageHeader"
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide"
import { OrgDetailsCard } from "@/components/admin/organization/OrgDetailsCard"
import { OrgScheduleTab } from "@/components/admin/organization/OrgScheduleTab"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function OrganizationPage(): React.JSX.Element {
  return (
    <div className="space-y-8 pb-10">
      <PageHeader
        title="Organization"
        actions={<HelpGuide slug="admin_organization" />}
      />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>
        <TabsContent value="details">
          <OrgDetailsCard />
        </TabsContent>
        <TabsContent value="schedule">
          <OrgScheduleTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}