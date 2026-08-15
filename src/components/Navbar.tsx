import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  Briefcase,
  Home,
  LineChart,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";
import { useStaff } from "@/hooks/useStaff";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/opportunities", label: "مشاريع التطوير العقاري", icon: LineChart },
  { to: "/requests", label: "طلباتي", icon: Briefcase },
  { to: "/notifications", label: "الإشعارات", icon: Bell },
  { to: "/account", label: "حسابي", icon: User },
] as const;

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { user, signOut } = useAuth();
  const { isStaff } = useStaff();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);


  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let active = true;
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .then(({ count }) => {
        if (active) setUnread(count ?? 0);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate({ to: "/", replace: true });
  };

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
          {user ? (
            <>
              {isStaff && (
                <Button asChild variant="gold" size="sm" className="hidden gap-1.5 sm:inline-flex">
                  <Link to="/admin">
                    <ShieldCheck className="size-4" /> لوحة الإدارة
                  </Link>
                </Button>
              )}
              <Button asChild variant="outlineGold" size="sm" className="hidden sm:inline-flex">
                <Link to="/account">حسابي</Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                aria-label="تسجيل الخروج"
                className="hidden sm:inline-flex"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="gold" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">إنشاء حساب</Link>
            </Button>
          )}
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
          {user && isStaff && (
            <li className="mt-2">
              <Button asChild variant="gold" className="w-full gap-2">
                <Link to="/admin" onClick={() => setOpen(false)}>
                  <ShieldCheck className="size-4" /> لوحة الإدارة
                </Link>
              </Button>
            </li>
          )}
          <li className="mt-2">

            {user ? (
              <Button variant="outlineGold" className="w-full gap-2" onClick={handleSignOut}>
                <LogOut className="size-4" />
                تسجيل الخروج
              </Button>
            ) : (
              <Button asChild variant="gold" className="w-full">
                <Link to="/auth" onClick={() => setOpen(false)}>
                  إنشاء حساب
                </Link>
              </Button>
            )}
          </li>
        </ul>
      )}
    </header>
  );
}
