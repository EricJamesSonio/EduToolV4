import { redirect } from "next/navigation";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function AdminPage() {
  redirect("/admin/dashboard");
}