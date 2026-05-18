"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { getRoleHomePath } from "@/utils/role.util";

import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { ArchitectureSection } from "@/components/landing/ArchitectureSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { AcademicFlexibilitySection } from "@/components/landing/AcademicFlexibilitySection";
import { ReusableComponentsSection } from "@/components/landing/ReusableComponentsSection";
import { WorkflowSection } from "@/components/landing/WorkflowSection";
import { AnalyticsPreviewSection } from "@/components/landing/AnalyticsPreviewSection";
import { CTASection } from "@/components/landing/CTASection";
import { ContactAdminSection } from "@/components/landing/Contactadminsection";
import { Footer } from "@/components/landing/Footer";

export default function RootPage(): React.ReactNode {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Only redirect authenticated users
    if (user) {
      router.replace(getRoleHomePath(user.role));
    }
  }, [user, isLoading, router]);

  // Prevent landing page flash during redirect
  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Guests see landing page
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <ArchitectureSection />
      <FeaturesSection />
      <AcademicFlexibilitySection />
      <ReusableComponentsSection />
      <WorkflowSection />
      <AnalyticsPreviewSection />
      <CTASection />
      <ContactAdminSection />
      <Footer />
    </div>
  );
}