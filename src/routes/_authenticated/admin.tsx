import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BarChart3,
  FileCheck2,
  FileText,
  Handshake,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import {
  activityActions,
  commissionNote,
  conditionLabels,
  docTypeLabels,
  documentUrl,
  effectiveProgress,
  fetchActivityLogs,
  fetchAllDocuments,
  fetchAllInterests,
  fetchAllProfiles,
  fetchAllRequests,
  formatSAR,
  hasRole,
  logActivity,
  notifyUser,
  projectStages,
  reviewDocument,
  statusLabels,
  timeAgo,
  updateInterest,
  updateProfileVerification,
  updateRequest,
  type PropertyRequest,
} from "@/lib/db";


export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم الإدارة | Synergy" },
      {
        name: "description",
        content: "إدارة المستخدمين والتوثيق والطلبات والربط المالي والمشاريع والتقارير.",
      },
      { property: "og:title", content: "لوحة تحكم الإدارة | Synergy" },
      { property: "og:description", content: "لوحة تحكم المشرفين في منصة Synergy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

const sections = [
  { key: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { key: "users", label: "إدارة المستخدمين والشركات", icon: Users },
  { key: "requests", label: "إدارة الطلبات والمشاريع", icon: FileCheck2 },
  { key: "matching", label: "الربط والوساطة", icon: Handshake },
  { key: "projects", label: "المشاريع الجارية", icon: BarChart3 },
  { key: "docs", label: "توثيق المستندات", icon: FileText },
  { key: "roles", label: "الصلاحيات", icon: ShieldCheck },
  { key: "payments", label: "المدفوعات والعمولات", icon: Receipt },
  { key: "settings", label: "إعدادات المنصة", icon: Settings },
  { key: "activity", label: "سجل النشاط", icon: Activity },
] as const;


const verificationLabels: Record<string, string> = {
  approved: "موثّق",
  pending: "قيد المراجعة",
  rejected: "مرفوض",
};

const statusStyle: Record<string, string> = {
  approved: "bg-success/15 text-success",
  pending: "bg-warning/20 text-warning",
  rejected: "bg-destructive/15 text-destructive",
};

const roles = [
  { name: "Super Admin", perms: ["كل الصلاحيات"] },
  { name: "مشرف التوثيق", perms: ["مراجعة المستندات", "قبول/رفض الحسابات"] },
  { name: "مشرف المشاريع", perms: ["تحديث حالة المشاريع", "رفع صور التقدم"] },
  { name: "مشرف مالي", perms: ["توثيق التحويلات", "رفع الإيصالات"] },
];

function AdminPage() {
  const { user } = useAuth();
  const [active, setActive] = useState<(typeof sections)[number]["key"]>("overview");

  const { data: isAdmin, isLoading: checkingRole } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () =>
      (await hasRole(user!.id, "admin")) || (await hasRole(user!.id, "supervisor")),
    enabled: !!user?.id,
  });

  if (!checkingRole && isAdmin === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center">
        <div className="card-surface max-w-md p-10">
          <ShieldCheck className="mx-auto size-10 text-gold" strokeWidth={1.6} />
          <h1 className="mt-4 text-lg font-extrabold">هذه الصفحة للإدارة والمشرفين فقط</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            حسابك لا يملك صلاحية الوصول للوحة التحكم.
          </p>
          <Button asChild variant="gold" className="mt-6">
            <Link to="/">عودة للموقع</Link>
          </Button>
        </div>
      </div>
    );
  }

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
            <Badge className="shrink-0 bg-gold/15 text-gold">لوحة الإدارة</Badge>
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
          {active === "docs" && <DocumentsSection />}
          {active === "roles" && <RolesSection />}
          {active === "payments" && <PaymentsSection />}
          {active === "settings" && <SettingsSection />}
          {active === "activity" && <ActivitySection />}

        </div>
      </div>
    </div>
  );
}

function useRequests() {
  return useQuery({ queryKey: ["admin-requests"], queryFn: fetchAllRequests });
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
  const { data: requests = [] } = useRequests();
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: fetchAllProfiles,
  });

  const totalFunding = requests.reduce((s, r) => s + Number(r.funding_needed), 0);
  const running = requests.filter((r) =>
    ["matched", "in_progress"].includes(r.status),
  ).length;

  const byMonth = new Map<string, number>();
  for (const r of requests) {
    const key = new Date(r.created_at).toLocaleDateString("ar-EG", { month: "long" });
    byMonth.set(key, (byMonth.get(key) ?? 0) + Number(r.funding_needed) / 1000);
  }
  const chart = [...byMonth.entries()].map(([month, value]) => ({ month, value }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="إجمالي المستخدمين" value={String(profiles.length)} icon={Users} />
        <Stat label="طلبات العقارات" value={String(requests.length)} icon={FileCheck2} />
        <Stat label="مشاريع جارية" value={String(running)} icon={BarChart3} />
      </div>

      
    </div>
  );
}

function UsersSection() {
  const queryClient = useQueryClient();
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: fetchAllProfiles,
  });

  const mutate = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateProfileVerification(id, status);
      await notifyUser(
        id,
        "verification",
        status === "approved" ? "تم توثيق حسابك" : "تم رفض مستندات التوثيق",
        status === "approved"
          ? "تمت الموافقة على مستنداتك، أصبح حسابك موثقاً."
          : "يرجى إعادة رفع مستندات صحيحة لإتمام التوثيق.",
      );
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success(v.status === "approved" ? "تم توثيق الحساب" : "تم رفض المستندات");
    },
    onError: (e) => toast.error("تعذر التحديث", { description: (e as Error).message }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>;

  return (
    <div className="card-surface overflow-x-auto p-2">
      <table className="w-full text-right text-sm">
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="p-3">الاسم</th>
            <th className="p-3">النوع</th>
            <th className="p-3">حالة التوثيق</th>
            <th className="p-3">تاريخ الانضمام</th>
            <th className="p-3">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((u) => (
            <tr key={u.id} className="border-t border-border">
              <td className="p-3 font-semibold">{u.full_name || "بدون اسم"}</td>
              <td className="p-3 text-muted-foreground">
                {u.account_type === "investor" ? "شركة عقارية" : "صاحب عقار"}
              </td>
              <td className="p-3">
                <Badge className={statusStyle[u.verification_status] ?? "bg-muted"}>
                  {verificationLabels[u.verification_status] ?? u.verification_status}
                </Badge>
              </td>
              <td className="p-3 text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString("en-GB")}
              </td>
              <td className="p-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={() => mutate.mutate({ id: u.id, status: "approved" })}
                  >
                    توثيق
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => mutate.mutate({ id: u.id, status: "rejected" })}
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

function useRequestMutation(successMessage: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      request,
      patch,
      notify,
    }: {
      request: PropertyRequest;
      patch: Parameters<typeof updateRequest>[1];
      notify?: { title: string; body: string };
    }) => {
      await updateRequest(request.id, patch);
      if (notify) await notifyUser(request.owner_id, "project", notify.title, notify.body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["my-requests"] });
      toast.success(successMessage);
    },
    onError: (e) => toast.error("تعذر التحديث", { description: (e as Error).message }),
  });
}

function RequestsSection() {
  const { data: requests = [], isLoading } = useRequests();
  const mutate = useRequestMutation("تم تحديث حالة الطلب");

  if (isLoading) return <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>;
  if (requests.length === 0)
    return <p className="text-sm text-muted-foreground">لا توجد طلبات بعد.</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {requests.map((o) => (
        <article key={o.id} className="card-surface p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <h3 className="truncate text-sm font-bold">
              {o.title || `${o.property_type} — ${o.city} / ${o.district}`}
            </h3>
            <Badge className="shrink-0 bg-gold/15 text-gold">{o.code}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {conditionLabels[o.condition] ?? o.condition} · {statusLabels[o.status] ?? o.status} ·{" "}
            {timeAgo(o.created_at)}
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
            {o.damage_description}
          </p>
          <p className="mt-3 text-sm font-bold text-gold">
            {formatSAR(Number(o.funding_needed))} · عائد {o.expected_return}%
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="gold"
              onClick={() =>
                mutate.mutate({
                  request: o,
                  patch: { status: "published", stage_index: Math.max(o.stage_index, 2) },
                  notify: {
                    title: "تم اعتماد ونشر طلبك",
                    body: `طلبك ${o.code} أصبح متاحاً للشركات العقارية في صفحة الفرص.`,
                  },
                })
              }
            >
              اعتماد ونشر
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => mutate.mutate({ request: o, patch: { status: "review" } })}
            >
              إخفاء
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                mutate.mutate({
                  request: o,
                  patch: { status: "rejected" },
                  notify: {
                    title: "تم رفض الطلب",
                    body: `للأسف تم رفض الطلب ${o.code} بعد المراجعة.`,
                  },
                })
              }
            >
              رفض
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

function MatchingSection() {
  const queryClient = useQueryClient();
  const { data: interests = [], isLoading } = useQuery({
    queryKey: ["admin-interests"],
    queryFn: fetchAllInterests,
  });

  const mutate = useMutation({
    mutationFn: async ({
      id,
      status,
      requestId,
    }: {
      id: string;
      status: string;
      requestId: string;
    }) => {
      await updateInterest(id, status);
      if (status === "approved") {
        await updateRequest(requestId, { status: "matched", stage_index: 4 });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-interests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("تم تحديث حالة الربط");
    },
    onError: (e) => toast.error("تعذر التحديث", { description: (e as Error).message }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>;
  if (interests.length === 0)
    return <p className="text-sm text-muted-foreground">لا توجد رغبات تمويل بعد.</p>;

  return (
    <div className="space-y-4">
      {interests.map((i) => {
        const r = i.property_requests;
        return (
          <article key={i.id} className="card-surface p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <h3 className="truncate text-sm font-bold">
                {r?.title || `${r?.property_type} — ${r?.city}`} · {r?.code}
              </h3>
              <span className="shrink-0 text-sm font-bold text-gold">
                {formatSAR(Number(i.amount))}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              حالة الربط: {i.status === "pending" ? "قيد المراجعة" : i.status} · {timeAgo(i.created_at)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="gold"
                onClick={() =>
                  mutate.mutate({ id: i.id, status: "approved", requestId: i.request_id })
                }
              >
                اعتماد الربط
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  mutate.mutate({ id: i.id, status: "rejected", requestId: i.request_id })
                }
              >
                رفض
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProjectsSection() {
  const { data: requests = [] } = useRequests();
  const mutate = useRequestMutation("تم تحديث المشروع وإشعار المالك");
  const projects = requests.filter((r) =>
    ["matched", "in_progress", "completed"].includes(r.status),
  );

  if (projects.length === 0)
    return <p className="text-sm text-muted-foreground">لا توجد مشاريع جارية.</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {projects.map((p) => (
        <article key={p.id} className="card-surface p-6">
          <h3 className="truncate text-sm font-bold">
            {p.title || `${p.property_type} — ${p.city}`}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {p.code} · {statusLabels[p.status] ?? p.status}
          </p>
          <div className="mt-4 flex justify-between text-xs font-semibold">
            <span>نسبة الإنجاز</span>
            <span className="text-gold">{effectiveProgress(p.progress, p.stage_index)}%</span>
          </div>
          <Progress value={effectiveProgress(p.progress, p.stage_index)} className="mt-2 h-2.5" />
          <ProgressControl
            value={effectiveProgress(p.progress, p.stage_index)}
            onSave={(next) =>
              mutate.mutate({
                request: p,
                patch: {
                  progress: next,
                  status: next === 100 ? "completed" : "in_progress",
                  stage_index:
                    next === 100 ? 6 : Math.round((next / 100) * (projectStages.length - 1)),
                },
                notify: {
                  title: "تحديث نسبة الإنجاز",
                  body: `وصل مشروع ${p.code} إلى نسبة إنجاز ${next}%.`,
                },
              })
            }
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="gold"
              onClick={() => {
                const next = Math.min(100, effectiveProgress(p.progress, p.stage_index) + 10);
                mutate.mutate({
                  request: p,
                  patch: {
                    progress: next,
                    status: next === 100 ? "completed" : "in_progress",
                    stage_index:
                      next === 100 ? 6 : Math.round((next / 100) * (projectStages.length - 1)),
                  },
                  notify: {
                    title: "تحديث نسبة الإنجاز",
                    body: `وصل مشروع ${p.code} إلى نسبة إنجاز ${next}%.`,
                  },
                });
              }}
            >
              +10% إنجاز
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                mutate.mutate({
                  request: p,
                  patch: { progress: 100, status: "completed", stage_index: 6 },
                  notify: {
                    title: "اكتمال المشروع",
                    body: `تم إنهاء مشروع ${p.code} بنجاح.`,
                  },
                })
              }
            >
              إكتمل المشروع
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
      <p className="card-surface p-6 text-sm text-muted-foreground sm:col-span-2">
        <Activity className="mb-2 size-4 text-gold" />
        تُمنح صلاحيات المدير والمشرف من إدارة المنصة مباشرة في قاعدة البيانات لضمان الأمان.
      </p>
    </div>
  );
}

function ProgressControl({ value, onSave }: { value: number; onSave: (n: number) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <div className="mt-4 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span>تحديد نسبة الإنجاز يدوياً</span>
        <span className="text-gold">{draft}%</span>
      </div>
      <Slider
        className="mt-3"
        value={[draft]}
        min={0}
        max={100}
        step={5}
        onValueChange={(v) => setDraft(v[0] ?? 0)}
      />
      <Button
        size="sm"
        variant="outlineGold"
        className="mt-3"
        disabled={draft === value}
        onClick={() => onSave(draft)}
      >
        حفظ النسبة
      </Button>
    </div>
  );
}

const settingsKey = "synergy-admin-settings";

function SettingsSection() {
  const [settings, setSettings] = useState({
    commissionRate: "5",
    installmentMonths: "12",
    minFunding: "50000",
    autoPublish: false,
    requireDocs: true,
    emailAlerts: true,
  });

  useEffect(() => {
    const raw = window.localStorage.getItem(settingsKey);
    if (raw) {
      try {
        setSettings((s) => ({ ...s, ...JSON.parse(raw) }));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const save = () => {
    window.localStorage.setItem(settingsKey, JSON.stringify(settings));
    toast.success("تم حفظ إعدادات المنصة");
  };

  const field = (k: keyof typeof settings) => (v: string) =>
    setSettings((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-6">
      <section className="card-surface p-6">
        <h3 className="text-base font-bold">إعدادات العمولة والسداد</h3>
        <p className="mt-1 text-xs text-muted-foreground">{commissionNote}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <Label className="text-xs">نسبة عمولة المنصة (%)</Label>
            <Input
              className="mt-2"
              inputMode="numeric"
              value={settings.commissionRate}
              onChange={(e) => field("commissionRate")(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">عدد أقساط تحصيل العمولة (شهر)</Label>
            <Input
              className="mt-2"
              inputMode="numeric"
              value={settings.installmentMonths}
              onChange={(e) => field("installmentMonths")(e.target.value)}
            />
          </div>
          
        </div>
      </section>

      <section className="card-surface p-6">
        <h3 className="text-base font-bold">سياسات المنصة</h3>
        <div className="mt-4 space-y-4">
          {[
            {
              key: "autoPublish" as const,
              label: "نشر الطلبات تلقائياً بعد التوثيق",
              hint: "بدون مراجعة يدوية إضافية",
            },
            {
              key: "requireDocs" as const,
              label: "إلزام المستندات قبل قبول الطلب",
              hint: "صورة العقار، الهوية، وثيقة الملكية",
            },
            {
              key: "emailAlerts" as const,
              label: "تنبيهات البريد للمشرفين",
              hint: "عند وصول طلب أو مستند جديد",
            },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.hint}</p>
              </div>
              <Switch
                checked={settings[row.key]}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, [row.key]: v }))}
              />
            </div>
          ))}
        </div>
        <Button variant="gold" className="mt-6" onClick={save}>
          حفظ الإعدادات
        </Button>
      </section>
    </div>
  );
}

/* ---------- توثيق المستندات ---------- */

function DocumentsSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: docs = [] } = useQuery({ queryKey: ["admin-docs"], queryFn: fetchAllDocuments });
  const { data: profiles = [] } = useQuery({ queryKey: ["admin-profiles"], queryFn: fetchAllProfiles });

  const review = useMutation({
    mutationFn: async ({ id, status, name }: { id: string; status: string; name: string }) => {
      await reviewDocument(id, status);
      if (user)
        await logActivity({
          actor_id: user.id,
          actor_name: user.email ?? "",
          action: status === "approved" ? "approve_document" : "reject_document",
          entity_type: "document",
          entity_id: id,
          description: name,
        });
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة المستند");
      void queryClient.invalidateQueries({ queryKey: ["admin-docs"] });
    },
    onError: (e: Error) => toast.error("تعذر التحديث", { description: e.message }),
  });

  const nameOf = (id: string) =>
    profiles.find((p) => p.id === id)?.full_name || "مستخدم";

  const open = async (path: string) => {
    try {
      window.open(await documentUrl(path), "_blank", "noopener");
    } catch (e) {
      toast.error("تعذر فتح الملف", { description: (e as Error).message });
    }
  };

  return (
    <div className="space-y-3">
      {docs.length === 0 && (
        <p className="card-surface p-6 text-sm text-muted-foreground">لا توجد مستندات بعد.</p>
      )}
      {docs.map((d) => (
        <div key={d.id} className="card-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {docTypeLabels[d.doc_type] ?? d.doc_type} — {nameOf(d.user_id)}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {d.name} · {timeAgo(d.created_at)}
              </p>
            </div>
            <Badge className={statusStyle[d.status] ?? ""}>
              {verificationLabels[d.status] ?? d.status}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => void open(d.file_path)}>
              عرض الملف
            </Button>
            <Button
              size="sm"
              variant="gold"
              onClick={() => review.mutate({ id: d.id, status: "approved", name: d.name })}
            >
              قبول
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => review.mutate({ id: d.id, status: "rejected", name: d.name })}
            >
              رفض
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- المدفوعات والعمولات ---------- */

function PaymentsSection() {
  const { data: requests = [] } = useRequests();
  const [rate, setRate] = useState(() => {
    if (typeof window === "undefined") return 5;
    const raw = window.localStorage.getItem(settingsKey);
    try {
      return Number(raw ? (JSON.parse(raw).commissionRate ?? 5) : 5) || 5;
    } catch {
      return 5;
    }
  });

  const active = requests.filter((r) => ["matched", "in_progress", "completed"].includes(r.status));
  const totalFunding = active.reduce((s, r) => s + Number(r.funding_needed || 0), 0);
  const totalCommission = (totalFunding * rate) / 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="إجمالي التمويل المرتبط" value={formatSAR(totalFunding)} icon={Wallet} />
        <Stat label={`عمولة المنصة (${rate}%)`} value={formatSAR(totalCommission)} icon={Receipt} />
        <Stat label="مشاريع نشطة" value={String(active.length)} icon={BarChart3} />
      </div>

      <section className="card-surface p-6">
        <h3 className="text-base font-bold">حاسبة العمولة</h3>
        <p className="mt-1 text-xs text-muted-foreground">{commissionNote}</p>
        <div className="mt-4 max-w-xs">
          <Label className="text-xs">نسبة العمولة (%)</Label>
          <Input
            className="mt-2"
            inputMode="numeric"
            value={String(rate)}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
          />
        </div>
      </section>

      <section className="card-surface overflow-x-auto p-6">
        <h3 className="mb-4 text-base font-bold">تفاصيل المشاريع</h3>
        <table className="w-full min-w-[560px] text-right text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="pb-3">المشروع</th>
              <th className="pb-3">التمويل</th>
              <th className="pb-3">العمولة</th>
              <th className="pb-3">القسط الشهري</th>
            </tr>
          </thead>
          <tbody>
            {active.map((r) => {
              const commission = (Number(r.funding_needed || 0) * rate) / 100;
              const months = Math.max(Number(r.duration_months || 1), 1);
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-3">{r.title || r.code}</td>
                  <td className="py-3">{formatSAR(Number(r.funding_needed))}</td>
                  <td className="py-3">{formatSAR(commission)}</td>
                  <td className="py-3">{formatSAR(commission / months)}</td>
                </tr>
              );
            })}
            {active.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-muted-foreground">
                  لا توجد مشاريع مرتبطة بعد.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

/* ---------- سجل النشاط ---------- */

function ActivitySection() {
  const { data: logs = [] } = useQuery({ queryKey: ["admin-activity"], queryFn: fetchActivityLogs });
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(
    () =>
      logs.filter((l) => {
        const text = `${l.actor_name} ${l.description} ${l.entity_id}`.toLowerCase();
        if (q && !text.includes(q.toLowerCase())) return false;
        if (action !== "all" && l.action !== action) return false;
        const t = new Date(l.created_at).getTime();
        if (from && t < new Date(from).getTime()) return false;
        if (to && t > new Date(to).getTime() + 86400000) return false;
        return true;
      }),
    [logs, q, action, from, to],
  );

  const usedActions = Array.from(new Set(logs.map((l) => l.action)));

  return (
    <div className="space-y-6">
      <section className="card-surface grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Label className="text-xs">بحث بالمستخدم أو الوصف</Label>
          <Input className="mt-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثال: أحمد" />
        </div>
        <div>
          <Label className="text-xs">نوع العملية</Label>
          <select
            className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="all">كل العمليات</option>
            {usedActions.map((a) => (
              <option key={a} value={a}>
                {activityActions[a] ?? a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">من تاريخ</Label>
          <Input className="mt-2" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">إلى تاريخ</Label>
          <Input className="mt-2" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </section>

      <section className="card-surface p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold">النتائج ({filtered.length})</h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setQ("");
              setAction("all");
              setFrom("");
              setTo("");
            }}
          >
            مسح الفلاتر
          </Button>
        </div>
        <div className="space-y-3">
          {filtered.map((l) => (
            <div key={l.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {activityActions[l.action] ?? l.action} — {l.actor_name || "مستخدم"}
                </p>
                <span className="text-xs text-muted-foreground">{timeAgo(l.created_at)}</span>
              </div>
              {l.description && (
                <p className="mt-1 text-xs text-muted-foreground">{l.description}</p>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة.</p>
          )}
        </div>
      </section>
    </div>
  );
}
