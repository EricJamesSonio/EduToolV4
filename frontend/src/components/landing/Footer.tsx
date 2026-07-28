"use client";

import Link from "next/link";
import { GraduationCap, Globe, MessageCircle, Link2, Mail } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "Security"],
  Resources: ["Documentation", "API Reference", "Support"],
  Company: ["About", "Blog", "Contact"],
};

export function Footer() {
  return (
    <footer id="about" className="border-t border-border/60 bg-gradient-to-b from-secondary/30 to-secondary/10">
      <div className="page-container py-16 space-y-12">
        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-bold text-lg tracking-tight not-interactive">Relief-ED</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed not-interactive">
              Flexible school management for modern educational institutions.
            </p>
            <div className="flex items-center gap-3">
              {[Globe, MessageCircle, Link2, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-secondary/80 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title} className="space-y-4">
              <h4 className="font-heading font-semibold text-sm not-interactive">{title}</h4>
              <ul className="space-y-3 text-sm">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-border/60"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="not-interactive">© 2026 Relief-ED. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Cookies"].map((item) => (
              <a key={item} href="#" className="hover:text-foreground transition-colors duration-200">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}