"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="page-container flex items-center justify-between py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="text-primary-foreground font-bold text-lg">ET</span>
          </div>
          <span className="font-heading font-bold text-lg hidden sm:inline">EduTool</span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#home" className="text-sm hover:text-primary transition-colors">Home</a>
          <a href="#features" className="text-sm hover:text-primary transition-colors">Features</a>
          <a href="#solutions" className="text-sm hover:text-primary transition-colors">Solutions</a>
          <a href="#resources" className="text-sm hover:text-primary transition-colors">Resources</a>
          <a href="#about" className="text-sm hover:text-primary transition-colors">About</a>
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}