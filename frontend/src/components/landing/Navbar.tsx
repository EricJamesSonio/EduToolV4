"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export function Navbar() {
  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
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
    <nav className="sticky top-0 z-50 border-b border-border bg-secondary text-secondary-foreground shadow-sm">
      <div className="page-container flex items-center justify-between py-5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-11 h-11 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
            <img
              src="/edutool-yellow.png"
              alt="Relief-ED logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-heading font-bold text-xl tracking-tight text-white">
            Relief-ED
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-10">
          {[
            "Home",
            "Features",
            "Solutions",
            "Resources",
            "Pricing",
            "Contact",
            "About",
          ].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              onClick={(e) => handleNavClick(e, item.toLowerCase())}
              className="relative text-base text-secondary-foreground/80 hover:text-secondary-foreground transition-colors duration-200 after:absolute after:bottom-[-2px] after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-200 hover:after:w-full"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right button — Sign in (accent yellow, stands out on navy navbar) */}
        <div>
          <Link href="/login">
            <Button className="bg-accent-soft text-accent-soft-foreground hover:bg-accent-soft/90 shadow-sm text-base px-5 py-2.5 font-semibold">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
