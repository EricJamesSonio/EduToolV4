"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar } from "lucide-react";

export function CTASection() {
  return (
    <section className="page-container py-16 md:py-24">
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-12 md:p-16 text-center space-y-8">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary-foreground">
            Modernize Educational Operations
          </h2>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Streamline school management with a flexible platform designed for scalable institutions.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="w-full sm:w-auto text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Demo
          </Button>
        </div>
      </div>
    </section>
  );
}