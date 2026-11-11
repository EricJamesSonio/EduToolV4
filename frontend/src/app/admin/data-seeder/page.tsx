"use client"

import { useRole } from "@/hooks/useRole"
import { DataSeederWorkspace } from "@/components/admin/data-seeder/DataSeederWorkspace"
import { RegistrarSchoolProfileView } from "@/components/admin/school-profile/RegistrarSchoolProfileView"

export default function DataSeederPage(): React.JSX.Element {
  const { isRegistrar } = useRole()

  return isRegistrar ? <RegistrarSchoolProfileView /> : <DataSeederWorkspace />
}