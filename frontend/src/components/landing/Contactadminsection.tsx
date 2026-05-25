"use client";

import { Mail, Phone, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const contactMethods = [
  { icon: Mail, title: "Email", desc: "Send us a detailed request", action: "admin@edutool.com", href: "mailto:admin@edutool.com", color: "bg-blue-500/10 text-blue-500" },
  { icon: Phone, title: "Phone", desc: "Call us for immediate support", action: "+1 (234) 567-890", href: "tel:+1234567890", color: "bg-emerald-500/10 text-emerald-500" },
  { icon: MessageSquare, title: "Contact Form", desc: "Fill out our contact form", action: "Get in Touch", href: "#", color: "bg-purple-500/10 text-purple-500" },
];

const checklist = [
  "Institution Name: Your school, college, or educational organization name",
  "Your Role: Your position in the institution (e.g., Principal, IT Director)",
  "Student Count: Approximate number of students in your institution",
  "Programs/Departments: Number of programs or departments you manage",
  "Specific Needs: Any custom features or integrations you require",
];

export function ContactAdminSection() {
  return (
    <section id="contact" className="page-container py-20 md:py-28 space-y-14">
      {/* Header */}
      <div className="text-center space-y-5 max-w-2xl mx-auto">
        <div className="flex justify-center">
          <div className="section-accent"></div>
        </div>
        <h2 className="font-bold">
          Ready to Manage Your Institution?
        </h2>
        <p className="text-lg text-muted-foreground">
          Get a dedicated admin account and take control of your educational operations with EduTool.
        </p>
      </div>

      {/* Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {contactMethods.map((method, index) => {
          const Icon = method.icon;
          return (
            <div key={index} className="card-landing p-6 space-y-4">
              <div className={`icon-container ${method.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-heading font-semibold text-xl">{method.title}</h3>
                <p className="text-base text-muted-foreground">{method.desc}</p>
                <a
                  href={method.href}
                  className="inline-flex items-center text-primary hover:text-accent transition-colors text-sm font-medium gap-1.5"
                >
                  {method.action}
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="card-landing p-8 max-w-2xl mx-auto space-y-5">
        <h3 className="font-heading font-semibold text-lg">What to Include in Your Request</h3>
        <ul className="space-y-3">
          {checklist.map((item, index) => (
            <li key={index} className="flex gap-3 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center space-y-5 max-w-xl mx-auto">
        <p className="text-muted-foreground">
          Our team will review your request and contact you within 24-48 hours to set up your admin account.
        </p>
        <Button size="lg" className="gap-2 shadow-sm">
          <Mail className="h-4 w-4" />
          Request Admin Account
        </Button>
      </div>
    </section>
  );
}
