"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export function Navbar() {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const el = document.getElementById(sectionId);
    if (!el) return;

    document.querySelectorAll(".animate-section-in").forEach((s) => {
      s.classList.remove("animate-section-in");
    });

    el.classList.add("section-targeted");

    el.scrollIntoView({ behavior: "smooth" });

    const checkInView = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.remove("section-targeted");
        el.classList.add("animate-section-in");
      } else {
        requestAnimationFrame(checkInView);
      }
    };
    requestAnimationFrame(checkInView);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-xl">
      <div className="page-container flex items-center justify-between py-5">
        {/* Logo */}
      <Link href="/" className="flex items-center gap-3 group">
        <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
          <img
            src="/edutool.png"
            alt="EduTool logo"
            className="w-full h-full object-cover"
          />
        </div>
        <span className="font-heading font-bold text-xl tracking-tight">EduTool</span>
      </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-10">
          {["Home","Features", "Solutions", "Resources", "Pricing", "Contact", "About"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={(e) => handleNavClick(e, item.toLowerCase())}
              className="relative text-base text-muted-foreground hover:text-foreground transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-200 hover:after:w-full"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right Buttons */}
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline" className="shadow-xs text-base px-5 py-2.5">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button className="shadow-sm text-base px-5 py-2.5">
              Get Started
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
