"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";

export function CTASection() {
  return (
    <section className="page-container py-6 md:py-10">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent rounded-2xl p-12 md:p-16 text-center space-y-8 shadow-lg">
        {/* Decorative elements */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:24px_24px] pointer-events-none"></div>

        <div className="relative space-y-6">
          <h2 className="font-bold text-white">
            Modernize Educational Operations
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Streamline school management with a flexible platform designed for scalable institutions.
          </p>
        </div>

        {/* Buttons */}
        <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto shadow-sm bg-white/20 text-white border border-white/20 hover:bg-white/30 hover:text-white backdrop-blur-sm">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="secondary" className="w-full sm:w-auto shadow-sm bg-white/20 text-white border border-white/20 hover:bg-white/30 hover:text-white backdrop-blur-sm">
            Schedule Demo
            <Calendar className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
