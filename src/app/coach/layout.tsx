"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useRequireRole } from "@/hooks/useRequireRole";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Dumbbell,
  UtensilsCrossed,
  LogOut,
  Menu,
  Loader2,
  BadgeDollarSign,
  X,
  ChevronRight,
  Layers,
  Megaphone,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ToastProvider } from "@/components/ui/toast";

const menuItems = [
  {
    name: "Dashboard",
    href: "/coach",
    icon: LayoutDashboard,
    group: "Overview",
  },
  { name: "Clients", href: "/coach/clients", icon: Users, group: "Management" },
  {
    name: "Applicants",
    href: "/coach/applicants",
    icon: Users,
    group: "Management",
  },
  {
    name: "Broadcasts",
    href: "/coach/broadcasts",
    icon: Megaphone,
    group: "Marketing",
  },
  {
    name: "Check-ins",
    href: "/coach/checkins",
    icon: ClipboardCheck,
    group: "Management",
  },
  {
    name: "Workouts",
    href: "/coach/workouts",
    icon: Dumbbell,
    group: "Content",
  },
  {
    name: "Meal Plans",
    href: "/coach/mealplans",
    icon: UtensilsCrossed,
    group: "Content",
  },
  { name: "Programs", href: "/coach/programs", icon: Layers, group: "Content" },
  {
    name: "Pricing",
    href: "/coach/pricing",
    icon: BadgeDollarSign,
    group: "Settings",
  },
];

const groups = ["Overview", "Management", "Content", "Marketing", "Settings"];

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { checking } = useRequireRole("coach");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-[#D4AF37] mx-auto" />
          <p className="text-white/30 text-sm">Loading coach portal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <ToastProvider />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-[68px] border-b border-white/5 bg-black/95 backdrop-blur-xl z-50">
        <div className="h-full flex items-center justify-between px-4 md:px-6">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition"
              aria-label="Open navigation menu"
            >
              <Menu size={22} />
            </button>
            <Link href="/coach" className="flex items-center gap-2.5">
              <Image
                src="/images/logo1.png"
                alt="Neo Coaching"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <div className="hidden sm:block">
                <p className="font-black text-base leading-tight">
                  <span className="text-[#D4AF37]">Neo</span>Coaching
                </p>
                <p className="text-[10px] text-white/30 leading-tight tracking-wider uppercase">
                  Coach Portal
                </p>
              </div>
            </Link>
          </div>

          {/* Right: search + avatar */}
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search clients…"
              className="hidden md:block field-premium w-60 text-sm py-2 px-4"
            />
            <div className="w-9 h-9 rounded-full gold-gradient-bg flex items-center justify-center font-black text-black text-sm">
              N
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-[68px] h-[calc(100vh-68px)] w-64 border-r border-white/5 bg-[#050505] z-50 flex flex-col transform transition-transform duration-300 md:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Mobile close */}
          <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-white/5">
            <span className="text-sm font-semibold text-white/40 uppercase tracking-wider">
              Navigation
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-white/40 hover:text-white transition"
            >
              <X size={16} />
            </button>
          </div>

          {/* Nav grouped */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto">
            {groups.map((group) => {
              const items = menuItems.filter((m) => m.group === group);
              if (!items.length) return null;
              return (
                <div key={group} className="mb-4">
                  <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest px-3 mb-1.5">
                    {group}
                  </p>
                  <div className="space-y-0.5">
                    {items.map(({ name, href, icon: Icon }) => {
                      const active =
                        pathname === href ||
                        (href !== "/coach" && pathname.startsWith(href));
                      return (
                        <Link
                          key={name}
                          href={href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                            active
                              ? "bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/15"
                              : "text-white/45 hover:text-white hover:bg-white/4"
                          }`}
                        >
                          <Icon
                            size={16}
                            className={active ? "text-[#D4AF37]" : ""}
                          />
                          <span className="flex-1">{name}</span>
                          {active ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                          ) : (
                            <ChevronRight
                              size={12}
                              className="opacity-0 group-hover:opacity-30 transition"
                            />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-white/5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all duration-200"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="w-full md:ml-64 pt-[68px] min-h-screen">
          <div className="px-4 md:px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
