"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getRoleHomePath } from "@/utils/role.util";

export default function RootPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace(getRoleHomePath(user.role));
    } else {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  // Render nothing — this page is purely a redirect
  return null;
}