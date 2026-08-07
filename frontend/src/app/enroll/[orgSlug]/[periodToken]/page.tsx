"use client";

import { use } from "react";
import { EnrollmentPortal } from "./_components/EnrollmentPortal";

export default function EnrollPage({
  params,
}: {
  params: Promise<{ orgSlug: string; periodToken: string }>;
}) {
  const { orgSlug, periodToken } = use(params);
  return <EnrollmentPortal orgSlug={orgSlug} periodToken={periodToken} />;
}
