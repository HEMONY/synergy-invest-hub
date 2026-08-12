import { Link } from "@tanstack/react-router";
import { Bell, Briefcase, Home, LineChart, Menu, Moon, Sun, User, X } from "lucide-react";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { notifications } from "@/lib/mock-data";

const links = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/opportunities", label: "الفرص", icon: LineChart },
  { to: "/requests", label: "طلباتي", icon: Briefcase },
  { to: "/notifications", label: "الإشعارات", icon: Bell },
  { to: "/account", label: "حسابي", icon: User },
] as const;

export function Navbar() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <nav className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 lg:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <Logo size={38} />
        </Link>

        <ul className="hidden items-center justify-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-gold border-gold/60 bg-accent/60" }}
                inactiveProps={{ className: "text-muted-foreground border-transparent" }}
                className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors hover:text-gold"
              >
                <l.icon className="size-4" />
                <span>{l.label}</span>
                {l.to === "/notifications" && unread > 0 && (
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gold-gradient text-[11px] font-bold text-navy">
                    {unread}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="تبديل الوضع" onClick={toggle}>
            {theme === "dark" ? <Sun className="text-gold" /> : <Moon className="text-navy" />}
          </Button>
          <Button asChild variant="gold" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">إنشاء حساب</Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="القائمة"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      {open && (
        <ul className="border-t border-border bg-card px-4 py-3 lg:hidden">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: l.to === "/" }}
                activeProps={{ className: "text-gold" }}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold"
              >
                <l.icon className="size-4" />
                {l.label}
              </Link>
            </li>
          ))}
          <li className="mt-2">
            <Button asChild variant="gold" className="w-full">
              <Link to="/auth" onClick={() => setOpen(false)}>
                إنشاء حساب
              </Link>
            </Button>
          </li>
        </ul>
      )}
    </header>
  );
}
