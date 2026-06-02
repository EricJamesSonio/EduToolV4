"use client"

import { useParams } from "next/navigation"
import { PublishedGradesPage } from "@/components/educator/published-grades/PublishedGradesPage"

export default function Page() {
  const { classId } = useParams<{ classId: string }>()
  return <PublishedGradesPage classId={classId} />
}
