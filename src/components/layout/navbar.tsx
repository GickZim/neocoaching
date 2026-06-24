"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Programs", href: "#programs" },
  { label: "Results",  href: "#transformations" },
  { label: "About",    href: "#about" },
  { label: "FAQ",      href: "#faq" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    // Smooth scroll to section
    const id = href.replace("#", "");
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/95 backdrop-blur-xl border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/images/logo1.png"
              alt="NeoCoaching"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="font-black text-xl tracking-tight">
              <span className="text-[#D4AF37]">Neo</span>
              <span className="text-white">Coaching</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.href)}
                className="nav-link text-white/70 hover:text-white text-sm font-medium tracking-wide transition-colors duration-200"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-white/60 hover:text-white transition-colors font-medium px-4 py-2"
            >
              Client Login
            </Link>
            <Link
              href="/apply"
              className="btn-gold text-sm px-5 py-2.5"
            >
              Apply Now
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-[#080808] border-l border-white/5 z-[60] flex flex-col transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <span className="font-black text-lg">
            <span className="text-[#D4AF37]">Neo</span>
            <span>Coaching</span>
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNavClick(link.href)}
              className="w-full text-left px-4 py-3.5 rounded-xl text-white/70 hover:text-white hover:bg-white/5 font-medium transition-colors text-base"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Mobile CTA */}
        <div className="px-4 py-6 border-t border-white/5 space-y-3">
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="block w-full text-center px-4 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition text-sm font-medium"
          >
            Client Login
          </Link>
          <Link
            href="/apply"
            onClick={() => setMobileOpen(false)}
            className="btn-gold block w-full text-center text-sm"
          >
            Apply Now
          </Link>
        </div>
      </div>
    </>
  );
}
