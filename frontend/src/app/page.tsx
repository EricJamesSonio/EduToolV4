import type { ReactNode } from "react";

import { LandingRedirect } from "@/components/landing/LandingRedirect";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";

import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { SolutionSection } from "@/components/landing/SolutionSection";
import { ResourcesSection } from "@/components/landing/ResourcesSection";
import { AnalyticsPreviewSection } from "@/components/landing/AnalyticsPreviewSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { ContactAdminSection } from "@/components/landing/Contactadminsection";
import { Footer } from "@/components/landing/Footer";

/**
 * Public landing page. Kept as a Server Component so the static marketing
 * sections ship zero JS; only the navbar, hero, solution carousel and analytics
 * preview are client boundaries. Auth redirect lives in `LandingRedirect` so
 * guests are not blocked on the `/auth/refresh` bootstrap.
 */
export default function RootPage(): ReactNode {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingRedirect />
      <Navbar />
      <HeroSection />
      <AnalyticsPreviewSection />
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
