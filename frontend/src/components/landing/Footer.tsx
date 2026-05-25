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
          {/* Brand - wider column */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading font-bold text-lg tracking-tight">EduTool</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
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
              <h4 className="font-heading font-semibold text-sm">{title}</h4>
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

        {/* Newsletter */}
        <div className="max-w-md mx-auto text-center space-y-3">
          <p className="text-sm font-medium">Stay updated with product news</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
              Subscribe
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border/60"></div>

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2026 EduTool. All rights reserved.</p>
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
