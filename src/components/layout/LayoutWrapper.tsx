"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/navbar";
import { ToastProvider } from "@/components/ui/toast";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideNavbar =
    pathname.startsWith("/coach") || pathname.startsWith("/dashboard");

  return (
    <>
      {!hideNavbar && <Navbar />}
      {children}
      <ToastProvider />
    </>
  );
}
