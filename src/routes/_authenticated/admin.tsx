import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useAuth } from "@/hooks/useAuth";
import {
  conditionLabels,
  fetchAllInterests,
  fetchAllProfiles,
  fetchAllRequests,
  formatSAR,
  hasRole,
  notifyUser,
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
  { key: "users", label: "إدارة المستخدمين", icon: Users },
  { key: "requests", label: "الطلبات والفرص", icon: FileCheck2 },
  { key: "matching", label: "الربط والوساطة", icon: Handshake },
  { key: "projects", label: "المشاريع الجارية", icon: BarChart3 },
  { key: "roles", label: "الصلاحيات", icon: ShieldCheck },
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
          {active === "roles" && <RolesSection />}
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
        <Stat label="إجمالي التمويل المطلوب" value={formatSAR(totalFunding)} icon={Wallet} />
        <Stat label="مشاريع جارية" value={String(running)} icon={BarChart3} />
      </div>

      <div className="card-surface p-6">
        <h2 className="text-base font-bold">التمويل حسب الشهر (بالألف ر.س)</h2>
        <div className="mt-6 h-72">
          {chart.length === 0 ? (
            <p className="pt-20 text-center text-sm text-muted-foreground">لا توجد بيانات بعد.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="var(--color-muted-foreground)"
                />
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
          )}
        </div>
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
                {u.account_type === "investor" ? "مستثمر" : "صاحب عقار"}
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
                    body: `طلبك ${o.code} أصبح متاحاً للمستثمرين في صفحة الفرص.`,
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
            <span className="text-gold">{p.progress}%</span>
          </div>
          <Progress value={p.progress} className="mt-2 h-2.5" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="gold"
              onClick={() => {
                const next = Math.min(100, p.progress + 10);
                mutate.mutate({
                  request: p,
                  patch: {
                    progress: next,
                    status: next === 100 ? "completed" : "in_progress",
                    stage_index: next === 100 ? 6 : 5,
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
              إنهاء المشروع
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
