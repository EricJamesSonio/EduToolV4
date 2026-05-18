"use client";

import { Mail, Phone, MessageSquare, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactAdminSection() {
  return (
    <section id="contact" className="page-container py-16 md:py-24 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-heading font-bold">
          Ready to Manage Your Institution?
        </h2>
        <p className="text-lg text-muted-foreground">
          Get a dedicated admin account and take control of your educational operations with EduTool.
        </p>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {/* Email */}
        <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4 hover:border-primary transition-colors">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-semibold">Email</h3>
            <p className="text-sm text-muted-foreground">Send us a detailed request</p>
            <a
              href="mailto:admin@edutool.com"
              className="inline-flex items-center text-primary hover:opacity-80 transition-opacity text-sm font-medium"
            >
              admin@edutool.com
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Phone */}
        <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4 hover:border-primary transition-colors">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Phone className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-semibold">Phone</h3>
            <p className="text-sm text-muted-foreground">Call us for immediate support</p>
            <a
              href="tel:+1234567890"
              className="inline-flex items-center text-primary hover:opacity-80 transition-opacity text-sm font-medium"
            >
              +1 (234) 567-890
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Form */}
        <div className="bg-card border-2 border-border rounded-lg p-6 space-y-4 hover:border-primary transition-colors">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-heading font-semibold">Contact Form</h3>
            <p className="text-sm text-muted-foreground">Fill out our contact form</p>
            <button className="inline-flex items-center text-primary hover:opacity-80 transition-opacity text-sm font-medium">
              Get in Touch
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-secondary/30 border-2 border-border rounded-lg p-8 max-w-2xl mx-auto space-y-4">
        <h3 className="font-heading font-semibold text-lg">What to Include in Your Request</h3>
        <ul className="space-y-3 text-sm">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></span>
            <span><strong>Institution Name:</strong> Your school, college, or educational organization name</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></span>
            <span><strong>Your Role:</strong> Your position in the institution (e.g., Principal, IT Director)</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></span>
            <span><strong>Student Count:</strong> Approximate number of students in your institution</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></span>
            <span><strong>Programs/Departments:</strong> Number of programs or departments you manage</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></span>
            <span><strong>Specific Needs:</strong> Any custom features or integrations you require</span>
          </li>
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center space-y-4 max-w-xl mx-auto">
        <p className="text-muted-foreground">
          Our team will review your request and contact you within 24-48 hours to set up your admin account.
        </p>
        <Button size="lg" className="gap-2">
          <Mail className="h-4 w-4" />
          Request Admin Account
        </Button>
      </div>
    </section>
  );
}