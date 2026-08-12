import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  FileCheck2,
  Handshake,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  adminUsers,
  formatSAR,
  monthlyFunding,
  opportunities,
  projects,
} from "@/lib/mock-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم الإدارة | Synergy" },
      {
        name: "description",
        content: "إدارة المستخدمين والتوثيق والطلبات والربط المالي والمشاريع والتقارير.",
      },
      { property: "og:title", content: "لوحة تحكم الإدارة | Synergy" },
      { property: "og:description", content: "لوحة تحكم المشرفين في منصة Synergy." },
    ],
  }),
  component: AdminPage,
});

const sections = [
  { key: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { key: "users", label: "إدارة المستخدمين", icon: Users },
  { key: "requests", label: "الطلبات والفرص", icon: FileCheck2 },
  { key: "matching", label: "الربط والوساطة", icon: Handshake },
  { key: "projects", label: "المشاريع الجارية", icon: BarChart3 },
  { key: "roles", label: "الصلاحيات", icon: ShieldCheck },
  { key: "audit", label: "سجل النشاطات", icon: Activity },
] as const;

const statusStyle: Record<string, string> = {
  "موثّق": "bg-success/15 text-success",
  "قيد المراجعة": "bg-warning/20 text-warning",
  "مرفوض": "bg-destructive/15 text-destructive",
  "معلّق": "bg-muted text-muted-foreground",
};

const auditLog = [
  { who: "م. خالد العتيبي", what: "وافق على مستندات المستخدم #u1", when: "قبل 20 دقيقة" },
  { who: "Super Admin", what: "أنشأ مشرفاً مالياً جديداً", when: "قبل ساعتين" },
  { who: "م. سارة الحربي", what: "حدّثت نسبة إنجاز المشروع #1263 إلى 25%", when: "أمس" },
  { who: "م. فهد القحطاني", what: "وثّق استلام مبلغ 750,000 ر.س", when: "قبل 3 أيام" },
];

const roles = [
  { name: "Super Admin", perms: ["كل الصلاحيات"] },
  { name: "مشرف التوثيق", perms: ["مراجعة المستندات", "قبول/رفض الحسابات"] },
  { name: "مشرف المشاريع", perms: ["تحديث حالة المشاريع", "رفع صور التقدم"] },
  { name: "مشرف مالي", perms: ["توثيق التحويلات", "رفع الإيصالات"] },
];

function AdminPage() {
  const [active, setActive] = useState<(typeof sections)[number]["key"]>("overview");

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-l border-sidebar-border bg-sidebar p-4 lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <Logo size={36} showWord={false} />
          <span className="brand-wordmark text-xs text-sidebar-foreground">Synergy</span>
        </Link>
        <nav className="space-y-1">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active === s.key
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60"
              }`}
            >
              <s.icon className="size-4" />
              {s.label}
            </button>
          ))}
        </nav>
        <Button asChild variant="outlineGold" size="sm" className="mt-auto">
          <Link to="/">عودة للموقع</Link>
        </Button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-4 py-4 backdrop-blur lg:px-8">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <h1 className="truncate text-lg font-extrabold">
              {sections.find((s) => s.key === active)?.label}
            </h1>
            <Badge className="shrink-0 bg-gold/15 text-gold">Super Admin</Badge>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {sections.map((s) => (
              <Button
                key={s.key}
                size="sm"
                variant={active === s.key ? "gold" : "outline"}
                onClick={() => setActive(s.key)}
              >
                {s.label}
              </Button>
            ))}
          </div>
        </header>

        <div className="p-4 lg:p-8">
          {active === "overview" && <Overview />}
          {active === "users" && <UsersSection />}
          {active === "requests" && <RequestsSection />}
          {active === "matching" && <MatchingSection />}
          {active === "projects" && <ProjectsSection />}
          {active === "roles" && <RolesSection />}
          {active === "audit" && <AuditSection />}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) {
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-5 text-gold" strokeWidth={1.6} />
      </div>
      <p className="mt-3 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function Overview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="إجمالي المستخدمين" value="1,284" icon={Users} />
        <Stat label="طلبات العقارات" value="342" icon={FileCheck2} />
        <Stat label="إجمالي التمويل" value="14.2M ر.س" icon={Wallet} />
        <Stat label="مشاريع جارية" value="37" icon={BarChart3} />
      </div>

      <div className="card-surface p-6">
        <h2 className="text-base font-bold">التمويل الشهري (بالألف ر.س)</h2>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyFunding}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
              <YAxis tick={{ fontSize: 12 }} stroke="var(--color-muted-foreground)" />
              <RTooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="value" fill="var(--color-gold)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function UsersSection() {
  return (
    <div className="card-surface overflow-x-auto p-2">
      <table className="w-full text-right text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="p-3">الاسم</th>
            <th className="p-3">الدور</th>
            <th className="p-3">حالة التوثيق</th>
            <th className="p-3">تاريخ الانضمام</th>
            <th className="p-3">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {adminUsers.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3 font-semibold">{u.name}</td>
              <td className="p-3 text-muted-foreground">{u.role}</td>
              <td className="p-3">
                <Badge className={statusStyle[u.status]}>{u.status}</Badge>
              </td>
              <td className="p-3 text-muted-foreground">{u.joined}</td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="gold" onClick={() => toast.success("تم توثيق الحساب")}>
                    توثيق
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.error("تم رفض المستندات — يلزم إدخال سبب الرفض")}
                  >
                    رفض
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RequestsSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {opportunities.map((o) => (
        <article key={o.id} className="card-surface p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <h3 className="truncate text-sm font-bold">
              {o.type} — {o.city} / {o.district}
            </h3>
            <Badge className="shrink-0 bg-gold/15 text-gold">{o.code}</Badge>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{o.damage}</p>
          <p className="mt-3 text-sm font-bold text-gold">{formatSAR(o.fundingNeeded)}</p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="gold" onClick={() => toast.success("تم اعتماد نشر الطلب")}>
              اعتماد ونشر
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast("تم إخفاء الطلب")}>
              إخفاء
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

const matchingSteps = ["قبول المستثمر", "استلام المبلغ", "صرف للمالك", "متابعة التنفيذ"];

function MatchingSection() {
  return (
    <div className="space-y-4">
      {projects.slice(0, 2).map((p, idx) => (
        <article key={p.id} className="card-surface p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <h3 className="truncate text-sm font-bold">{p.title}</h3>
            <span className="shrink-0 text-sm font-bold text-gold">{formatSAR(p.funding)}</span>
          </div>
          <ol className="mt-5 flex flex-wrap gap-2">
            {matchingSteps.map((s, i) => (
              <li
                key={s}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                  i <= idx + 1
                    ? "border-gold/50 bg-gold/15 text-gold"
                    : "border-border text-muted-foreground"
                }`}
              >
                {s}
              </li>
            ))}
          </ol>
          <Button
            size="sm"
            variant="gold"
            className="mt-5"
            onClick={() => toast.success("تم رفع إثبات التحويل")}
          >
            رفع إيصال تحويل
          </Button>
        </article>
      ))}
    </div>
  );
}

function ProjectsSection() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {projects.map((p) => (
        <article key={p.id} className="card-surface p-6">
          <h3 className="truncate text-sm font-bold">{p.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">المشرف المسؤول: {p.supervisor}</p>
          <div className="mt-4 flex justify-between text-xs font-semibold">
            <span>نسبة الإنجاز</span>
            <span className="text-gold">{p.progress}%</span>
          </div>
          <Progress value={p.progress} className="mt-2 h-2.5" />
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="gold"
              onClick={() => toast.success("تم تحديث نسبة الإنجاز وإشعار الطرفين")}
            >
              تحديث النسبة
            </Button>
            <Button size="sm" variant="outline" onClick={() => toast("تم إضافة صور التقدم")}>
              إضافة صور تقدم
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function RolesSection() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {roles.map((r) => (
        <div key={r.name} className="card-surface p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="size-4 text-gold" /> {r.name}
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {r.perms.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        </div>
      ))}
      <Button
        variant="gold"
        className="sm:col-span-2"
        onClick={() => toast.success("تم إنشاء مشرف جديد")}
      >
        إنشاء مشرف جديد
      </Button>
    </div>
  );
}

function AuditSection() {
  return (
    <ul className="space-y-3">
      {auditLog.map((a, i) => (
        <li key={i} className="card-surface flex items-start gap-4 p-5">
          <Activity className="mt-0.5 size-5 shrink-0 text-gold" strokeWidth={1.6} />
          <div className="min-w-0">
            <p className="text-sm font-semibold">{a.who}</p>
            <p className="mt-1 text-sm text-muted-foreground">{a.what}</p>
            <p className="mt-1 text-xs text-muted-foreground">{a.when}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
