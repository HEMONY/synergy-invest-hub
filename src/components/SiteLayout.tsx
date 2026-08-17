import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) router.history.back();
        else router.navigate({ to: "/" });
      }}
    >
      <ArrowRight className="size-4" />
      رجوع
    </Button>
  );
}

export function PageHeader({
  title,
  subtitle,
  back = false,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
}) {
  return (
    <section className="border-b border-border bg-navy-gradient">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {back && (
          <div className="mb-4">
            <BackButton className="border-white/30 bg-white/10 text-white hover:bg-white/20" />
          </div>
        )}
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">{subtitle}</p>}
      </div>
    </section>
  );
}
