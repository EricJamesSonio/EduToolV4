"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { getRoleHomePath } from "@/utils/role.util";

import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";

import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { ResourcesSection } from "@/components/landing/ResourcesSection";
//import { AnalyticsPreviewSection } from "@/components/landing/AnalyticsPreviewSection";
import { PricingSection } from "@/components/landing/PricingSection";
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
      
      <FeaturesSection />
      <SolutionSection />
      <ResourcesSection />
      
      <PricingSection />
      <CTASection />
      <ContactAdminSection />
      <Footer />
    </div>
  );
}