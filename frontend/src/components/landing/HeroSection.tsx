"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation"; // Import the custom hook

export function HeroSection() {
  // Use the custom hook for the left side content
  const { ref: leftSideRef, isInView: leftSideInView } = useScrollAnimation();
  // Use the custom hook for the right side content
  const { ref: rightSideRef, isInView: rightSideInView } = useScrollAnimation();

  return (
    <section
      id="home"
      className="page-container min-h-screen flex items-start pt-20 md:pt-28 lg:pt-32"
    >
      {/* Decorative blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 items-center relative">
        
        {/* LEFT SIDE */}
        {/* Apply the ref and conditionally add animation class */}
        <div 
          ref={leftSideRef} 
          className={`space-y-10 text-center lg:text-left ${leftSideInView ? "animate-fade-in-up" : ""}`}
        >
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl">
              The All-in-One{" "}
              <span className="gradient-text">School Management</span>{" "}
              Platform
            </h1>

            <p className="text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Manage schools, students, teachers, grading, and assessments —
              all from one powerful and simple dashboard.
            </p>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-md">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

  <Link href="#solutions">
  <Button
    size="lg"
    variant="outline"
    className="w-full sm:w-auto text-lg px-8 py-6"
  >
    View Demo
  </Button>
</Link>
          </div>

          {/* Trust badges (kept, but cleaner) */}
          <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-sm text-muted-foreground pt-2">
            {["Multi-tenant", "Secure", "Automated grading", "Video meetings"].map(
              (item) => (
                <span key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                  {item}
                </span>
              )
            )}
          </div>
        </div>

        {/* RIGHT SIDE (RESPONSIVE MOCKUPS) */}
        {/* Apply the ref and conditionally add animation classes */}
        <div 
          ref={rightSideRef} 
          className={`relative ${rightSideInView ? "animate-fade-in-up animate-delay-2" : ""} hidden lg:block`}
        >
          {/* Glow */}
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>

          <div className="relative w-full max-w-[820px] mx-auto">

            {/* DESKTOP */}
            <div className="relative bg-secondary/60 border border-border/60 rounded-2xl overflow-hidden shadow-2xl">
              
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border/40 bg-secondary/80">
                <div className="w-3 h-3 rounded-full bg-red-400/70"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400/70"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400/70"></div>
                <div className="ml-4 flex-1 bg-background/40 rounded-md px-3 py-1 text-xs text-muted-foreground">
                  app.edutool.com
                </div>
              </div>

              {/* Screen (auto height now) */}
              <div className="w-full bg-background/30">
                <img
                  src="/desktop.png"
                  alt="Dashboard preview"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* MOBILE (floating, responsive) */}
            <div className="absolute -bottom-12 -left-10 w-40 md:w-48 bg-secondary/90 border border-border/60 rounded-3xl overflow-hidden shadow-2xl">
              
              <div className="flex justify-center pt-3 pb-2 bg-secondary/90">
                <div className="w-10 h-2 rounded-full bg-border/60"></div>
              </div>

              <div className="w-full bg-background/30">
                <img
                  src="/mobile.png"
                  alt="Mobile preview"
                  className="w-full h-auto object-cover"
                />
              </div>

              <div className="flex justify-center py-2 bg-secondary/90">
                <div className="w-8 h-1.5 rounded-full bg-border/60"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
