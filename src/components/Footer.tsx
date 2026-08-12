import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-card/60">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo size={48} />
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            منصة وساطة استثمارية عقارية تربط أصحاب العقارات المتضررة بالمستثمرين، بإشراف كامل من
            إدارة المنصة.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gold">المنصة</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/opportunities">الفرص الاستثمارية</Link>
            </li>
            <li>
              <Link to="/requests">طلباتي ومشاريعي</Link>
            </li>
            <li>
              <Link to="/account">حسابي ومستنداتي</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gold">الإدارة</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/admin">لوحة التحكم</Link>
            </li>
            <li>
              <Link to="/account">الدعم الفني</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gold">تواصل معنا</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>support@synergy.com</li>
            <li dir="ltr" className="text-end">
              +249 96 780 7618
              <br />
              +249 11 930 2923
            </li>
            <li>الخرطوم-امدرمان-بحري، السودان</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 Synergy — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
