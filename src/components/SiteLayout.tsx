import type { ReactNode } from "react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <section className="border-b border-border bg-navy-gradient">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">{subtitle}</p>}
      </div>
    </section>
  );
}
