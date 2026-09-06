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
  Trash2,
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useStaff } from "@/hooks/useStaff";
import {
  activityActions,
  commissionNote,
  conditionLabels,
  docTypeLabels,
  documentUrl,
  defaultSiteTagline,
  defaultSiteSubtitle,
  defaultAboutTitle,
  defaultAboutText,
  defaultFooterText,
  defaultNewRequestTitle,
  defaultNewRequestSubtitle,
  defaultOpportunitiesTitle,
  defaultOpportunitiesSubtitle,
  defaultConditionOptionTexts,
  conditionOptions,
  effectiveProgress,
  fetchActivityLogs,
  fetchAllDocuments,
  fetchAllInterests,
  fetchAllProfiles,
  fetchAllRequests,
  fetchSiteTagline,
  fetchSiteSubtitle,
  fetchAboutTitle,
  fetchAboutText,
  fetchFooterText,
  fetchNewRequestTitle,
  fetchNewRequestSubtitle,
  fetchOpportunitiesTitle,
  fetchOpportunitiesSubtitle,
  fetchAllUserRoles,
  fetchConditionOptionTexts,
  formatSAR,
  grantRole,
  hasRole,
  logActivity,
  notifyUser,
  reviewDocument,
  resetSiteTagline,
  resetSiteSubtitle,
  resetAboutTitle,
  resetAboutText,
  resetFooterText,
  resetNewRequestTitle,
  resetNewRequestSubtitle,
  resetOpportunitiesTitle,
  resetOpportunitiesSubtitle,
  resetConditionOptionTexts,
  revokeRole,
  roleLabels,
  saveSiteTagline,
  saveSiteSubtitle,
  saveAboutTitle,
  saveAboutText,
  saveFooterText,
  saveNewRequestTitle,
  saveNewRequestSubtitle,
  saveOpportunitiesTitle,
  saveOpportunitiesSubtitle,
  saveConditionOptionTexts,
  statusLabels,
  timeAgo,
  updateInterest,
  updateProfileVerification,
  updateRequest,
  type PropertyRequest,
  type ConditionOptionTexts,
} from "@/lib/db";
import { deleteUserAccount } from "@/lib/admin.functions";


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
  const { user } = useAuth();
  const { isAdmin } = useStaff();
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: fetchAllProfiles,
  });
  const { data: userRoles = [] } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: fetchAllUserRoles,
  });

  const rolesOf = (id: string) => userRoles.filter((r) => r.user_id === id).map((r) => r.role);

  const mutate = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateProfileVerification(id, status);
      await notifyUser(
        id,
        "verification",
        status === "verified" ? "تم توثيق حسابك" : "تم رفض مستندات التوثيق",
        status === "verified"
          ? "تمت الموافقة على مستنداتك، أصبح حسابك موثقاً."
          : "يرجى إعادة رفع مستندات صحيحة لإتمام التوثيق.",
      );
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      toast.success(v.status === "verified" ? "تم توثيق الحساب" : "تم رفض المستندات");
    },
    onError: (e) => toast.error("تعذر التحديث", { description: (e as Error).message }),
  });

  const roleMutate = useMutation({
    mutationFn: async ({
      id,
      role,
      grant,
    }: {
      id: string;
      role: "admin" | "supervisor";
      grant: boolean;
    }) => {
      if (grant) await grantRole(id, role);
      else await revokeRole(id, role);
      await notifyUser(
        id,
        "verification",
        grant ? "تم تحديث صلاحياتك" : "تم تعديل صلاحياتك",
        grant
          ? `تمت ترقيتك إلى ${roleLabels[role]} في منصة سينرجي.`
          : `تم سحب صلاحية ${roleLabels[role]} من حسابك.`,
      );
      if (user)
        await logActivity({
          actor_id: user.id,
          actor_name: user.email ?? "",
          action: grant ? "grant_role" : "revoke_role",
          entity_type: "user",
          entity_id: id,
          description: `${grant ? "منح" : "سحب"} صلاحية ${roleLabels[role]}`,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["staff-roles"] });
      toast.success("تم تحديث الصلاحيات");
    },
    onError: (e) => toast.error("تعذر تحديث الصلاحيات", { description: (e as Error).message }),
  });

  const removeUser = useMutation({
    mutationFn: async (id: string) => {
      await deleteUserAccount({ data: { userId: id } });
      if (user)
        await logActivity({
          actor_id: user.id,
          actor_name: user.email ?? "",
          action: "delete_user",
          entity_type: "user",
          entity_id: id,
          description: "حذف مستخدم من المنصة",
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
      toast.success("تم حذف المستخدم نهائياً");
    },
    onError: (e) => toast.error("تعذر حذف المستخدم", { description: (e as Error).message }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>;

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <p className="card-surface p-4 text-xs text-muted-foreground">
          ترقية المشرفين وحذف المستخدمين متاحة للمدير فقط.
        </p>
      )}

      <div className="card-surface overflow-x-auto p-2">
        <table className="w-full text-right text-sm">
          <thead className="text-xs text-muted-foreground">
            <tr>
              <th className="p-3">الاسم</th>
              <th className="p-3">النوع</th>
              <th className="p-3">الصلاحية</th>
              <th className="p-3">حالة التوثيق</th>
              <th className="p-3">تاريخ الانضمام</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((u) => {
              const userRolesList = rolesOf(u.id);
              const isUserAdmin = userRolesList.includes("admin");
              const isUserSupervisor = userRolesList.includes("supervisor");
              const isSelf = u.id === user?.id;
              return (
                <tr key={u.id} className="border-t border-border align-top">
                  <td className="p-3 font-semibold">{u.full_name || "بدون اسم"}</td>
                  <td className="p-3 text-muted-foreground">
                    {u.account_type === "investor" ? "شركة عقارية" : "صاحب عقار"}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {isUserAdmin && <Badge className="bg-gold/20 text-gold">مدير</Badge>}
                      {isUserSupervisor && (
                        <Badge className="bg-primary/15 text-primary">مشرف</Badge>
                      )}
                      {!isUserAdmin && !isUserSupervisor && (
                        <span className="text-xs text-muted-foreground">مستخدم</span>
                      )}
                    </div>
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
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => mutate.mutate({ id: u.id, status: "verified" })}
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

                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outlineGold"
                            disabled={roleMutate.isPending}
                            onClick={() =>
                              roleMutate.mutate({
                                id: u.id,
                                role: "supervisor",
                                grant: !isUserSupervisor,
                              })
                            }
                          >
                            {isUserSupervisor ? "خفض من مشرف" : "ترقية لمشرف"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outlineGold"
                            disabled={roleMutate.isPending || isSelf}
                            onClick={() =>
                              roleMutate.mutate({ id: u.id, role: "admin", grant: !isUserAdmin })
                            }
                          >
                            {isUserAdmin ? "خفض من مدير" : "ترقية لمدير"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={removeUser.isPending || isSelf}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `سيتم حذف حساب «${u.full_name || "بدون اسم"}» نهائياً. متابعة؟`,
                                )
                              )
                                removeUser.mutate(u.id);
                            }}
                          >
                            <Trash2 className="size-4" /> إزالة
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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

function num(v: string) {
  const n = Number(v.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function RequestFinancials({
  request,
  privateDetails,
}: {
  request: PropertyRequest;
  privateDetails?: { owner_phone: string; location_details: string; property_details: string };
}) {
  const mutate = useRequestMutation("تم حفظ بيانات المشروع");
  const [form, setForm] = useState({
    estimated_value: String(request.estimated_value ?? 0),
    rehab_cost: String(request.rehab_cost ?? 0),
    funding_needed: String(request.funding_needed ?? 0),
    expected_return: String(request.expected_return ?? 0),
    duration_months: String(request.duration_months ?? 0),
    duration_days: String(request.duration_days ?? 0),
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const patch = {
    estimated_value: num(form.estimated_value),
    rehab_cost: num(form.rehab_cost),
    funding_needed: num(form.funding_needed),
    expected_return: num(form.expected_return),
    duration_months: Math.round(num(form.duration_months)),
    duration_days: Math.round(num(form.duration_days)),
  };

  const missing = [
    patch.estimated_value <= 0 && "القيمة التقديرية",
    patch.rehab_cost <= 0 && "تكلفة المشروع",
    patch.funding_needed <= 0 && "التمويل المطلوب",
    patch.expected_return <= 0 && "العائد المتوقع",
    patch.duration_months <= 0 && patch.duration_days <= 0 && "مدة التنفيذ",
  ].filter(Boolean) as string[];

  const fields: [keyof typeof form, string][] = [
    ["estimated_value", "القيمة التقديرية للعقار"],
    ["rehab_cost", "تكلفة المشروع"],
    ["funding_needed", "التمويل المطلوب"],
    ["expected_return", "العائد المتوقع %"],
    ["duration_months", "المدة (أشهر)"],
    ["duration_days", "المدة (أيام)"],
  ];

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-border p-4">
      {privateDetails && (
        <div className="rounded-lg bg-muted/60 p-3 text-xs leading-6">
          <p className="font-bold text-gold">بيانات خاصة (للإدارة فقط)</p>
          <p>هاتف صاحب الطلب: {privateDetails.owner_phone || "—"}</p>
          <p>الموقع الدقيق: {privateDetails.location_details || "—"}</p>
          <p>وصف العقار: {privateDetails.property_details || "—"}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {fields.map(([key, label]) => (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            <Input
              className="mt-2"
              inputMode="numeric"
              value={form[key]}
              onChange={(e) => set(key)(e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outlineGold"
          onClick={() => mutate.mutate({ request, patch })}
        >
          حفظ البيانات المالية
        </Button>
        <Button
          size="sm"
          variant="gold"
          onClick={() => {
            if (missing.length > 0) {
              toast.error("أكمل البيانات قبل النشر", { description: missing.join("، ") });
              return;
            }
            mutate.mutate({
              request,
              patch: {
                ...patch,
                status: "published",
                stage_index: Math.max(request.stage_index, 2),
              },
              notify: {
                title: "تم اعتماد ونشر طلبك",
                body: `طلبك ${request.code} أصبح متاحاً لشركات القطاع العقاري.`,
              },
            });
          }}
        >
          اعتماد ونشر
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => mutate.mutate({ request, patch: { status: "review" } })}
        >
          إخفاء
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            mutate.mutate({
              request,
              patch: { status: "rejected" },
              notify: {
                title: "تم رفض الطلب",
                body: `للأسف تم رفض الطلب ${request.code} بعد المراجعة.`,
              },
            })
          }
        >
          رفض
        </Button>
      </div>
    </div>
  );
}

function RequestsSection() {
  const { data: requests = [], isLoading } = useRequests();
  const { data: privates = [] } = useQuery({
    queryKey: ["admin-request-private"],
    queryFn: fetchAllRequestPrivateDetails,
  });

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

          <RequestFinancials
            request={o}
            privateDetails={privates.find((p) => p.request_id === o.id)}
          />
        </article>
      ))}
    </div>
  );
}

const matchingFlow: { status: string; label: string; next?: string }[] = [
  { status: "pending", label: "بدء المراجعة", next: "under_review" },
  { status: "under_review", label: "عرض على صاحب المشروع", next: "presented" },
  { status: "owner_approved", label: "اعتماد الربط", next: "approved" },
  { status: "approved", label: "تأكيد سداد العمولة", next: "commission_paid" },
];

function MatchingSection() {
  const queryClient = useQueryClient();
  const { data: interests = [], isLoading } = useQuery({
    queryKey: ["admin-interests"],
    queryFn: fetchAllInterests,
  });
  const { data: privates = [] } = useQuery({
    queryKey: ["admin-request-private"],
    queryFn: fetchAllRequestPrivateDetails,
  });
  const [commission, setCommission] = useState<Record<string, string>>({});

  const mutate = useMutation({
    mutationFn: async ({
      id,
      status,
      requestId,
      ownerId,
      investorId,
      code,
    }: {
      id: string;
      status: string;
      requestId: string;
      ownerId?: string;
      investorId: string;
      code: string;
    }) => {
      await updateInterest(id, status);
      if (status === "presented" && ownerId) {
        await notifyUser(
          ownerId,
          "request",
          "عرض جديد على مشروعك",
          `وصل عرض من شركة عقارية على المشروع ${code} — راجعه من صفحة طلباتي.`,
        );
      }
      if (status === "approved") {
        await updateRequest(requestId, { status: "matched", stage_index: 4 });
        await notifyUser(
          investorId,
          "request",
          "تم اعتماد الربط",
          `تم اعتماد ربطكم بالمشروع ${code} — يرجى سداد عمولة سينرجي.`,
        );
      }
      if (status === "commission_paid") {
        await notifyUser(
          investorId,
          "request",
          "تم تأكيد سداد العمولة",
          `أصبحت بيانات التواصل الخاصة بالمشروع ${code} متاحة لكم.`,
        );
        if (ownerId)
          await notifyUser(
            ownerId,
            "request",
            "يمكنك البدء مع الشركة",
            `تم سداد عمولة سينرجي للمشروع ${code} — بيانات تواصل الشركة متاحة الآن.`,
          );
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
    return <p className="text-sm text-muted-foreground">لا توجد عروض شركات بعد.</p>;

  return (
    <div className="space-y-4">
      {interests.map((i) => {
        const r = i.property_requests;
        const pd = privates.find((p) => p.request_id === i.request_id);
        const step = matchingFlow.find((s) => s.status === i.status);
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
              {interestStatusLabels[i.status] ?? i.status} · {timeAgo(i.created_at)}
            </p>

            <dl className="mt-4 grid gap-2 rounded-xl bg-muted/60 p-4 text-xs leading-6 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">اسم الشركة</dt>
                <dd className="font-bold">{i.company_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">هاتف الشركة</dt>
                <dd className="font-bold">{i.company_phone || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">موقع الشركة</dt>
                <dd>{i.company_location || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">نطاق العمل</dt>
                <dd>{i.scope_of_work || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">الأعمال المقترحة</dt>
                <dd>{i.proposed_works || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">طريقة الدفع</dt>
                <dd>{i.payment_method || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">الضمان</dt>
                <dd>{i.warranty || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">ملاحظات الشركة</dt>
                <dd>{i.company_notes || "—"}</dd>
              </div>
            </dl>

            {pd && (
              <div className="mt-3 rounded-xl border border-border p-3 text-xs leading-6">
                <p className="font-bold text-gold">بيانات صاحب المشروع (للإدارة)</p>
                <p>الهاتف: {pd.owner_phone || "—"}</p>
                <p>الموقع الدقيق: {pd.location_details || "—"}</p>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <div>
                <Label className="text-xs">عمولة سينرجي</Label>
                <Input
                  className="mt-2 w-40"
                  inputMode="numeric"
                  value={commission[i.id] ?? String(i.commission_amount ?? 0)}
                  onChange={(e) =>
                    setCommission((c) => ({ ...c, [i.id]: e.target.value }))
                  }
                />
              </div>
              <Button
                size="sm"
                variant="outlineGold"
                onClick={async () => {
                  try {
                    await setCommissionAmount(
                      i.id,
                      num(commission[i.id] ?? String(i.commission_amount ?? 0)),
                    );
                    queryClient.invalidateQueries({ queryKey: ["admin-interests"] });
                    toast.success("تم حفظ قيمة العمولة");
                  } catch (err) {
                    toast.error("تعذر حفظ العمولة", { description: (err as Error).message });
                  }
                }}
              >
                حفظ العمولة
              </Button>

              {step?.next && (
                <Button
                  size="sm"
                  variant="gold"
                  onClick={() =>
                    mutate.mutate({
                      id: i.id,
                      status: step.next!,
                      requestId: i.request_id,
                      ownerId: r?.owner_id,
                      investorId: i.investor_id,
                      code: r?.code ?? "",
                    })
                  }
                >
                  {step.label}
                </Button>
              )}

              {i.status !== "commission_paid" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    mutate.mutate({
                      id: i.id,
                      status: "rejected",
                      requestId: i.request_id,
                      ownerId: r?.owner_id,
                      investorId: i.investor_id,
                      code: r?.code ?? "",
                    })
                  }
                >
                  رفض العرض
                </Button>
              )}
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
                  stage_index: next === 100 ? 6 : 5,
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

function TextSettingField({
  label,
  hint,
  fetcher,
  queryKey,
  onSave,
  onReset,
  placeholder,
  minHeight = "min-h-24",
}: {
  label: string;
  hint: string;
  fetcher: () => Promise<string>;
  queryKey: string;
  onSave: (value: string) => Promise<void>;
  onReset: () => Promise<void>;
  placeholder: string;
  minHeight?: string;
}) {
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: [queryKey], queryFn: fetcher });
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data !== undefined) setDraft(data);
  }, [data]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: [queryKey] });

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft.trim());
      toast.success("تم الحفظ");
      refresh();
    } catch (err) {
      toast.error("تعذر الحفظ", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      await onReset();
      toast.success("تم حذف التخصيص — رجع النص الافتراضي");
      refresh();
    } catch (err) {
      toast.error("تعذر الحذف", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-base font-bold">{label}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      <Textarea
        className={`mt-4 ${minHeight}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
      />
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="gold" disabled={saving} onClick={save}>
          حفظ
        </Button>
        <Button size="sm" variant="outline" disabled={saving} onClick={reset}>
          حذف (الرجوع للافتراضي)
        </Button>
      </div>
    </div>
  );
}

function ConditionOptionTextsSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["condition-option-texts"],
    queryFn: fetchConditionOptionTexts,
  });
  const [draft, setDraft] = useState<ConditionOptionTexts>(defaultConditionOptionTexts);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const setField = (key: string, field: "label" | "hint", value: string) =>
    setDraft((d) => ({
      ...d,
      [key]: { label: d[key]?.label ?? "", hint: d[key]?.hint ?? "", [field]: value },
    }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveConditionOptionTexts(draft, user.id);
      toast.success("تم الحفظ");
      queryClient.invalidateQueries({ queryKey: ["condition-option-texts"] });
    } catch (err) {
      toast.error("تعذر الحفظ", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    setSaving(true);
    try {
      await resetConditionOptionTexts();
      toast.success("تم حذف التخصيص — رجعت النصوص الافتراضية");
      queryClient.invalidateQueries({ queryKey: ["condition-option-texts"] });
    } catch (err) {
      toast.error("تعذر الحذف", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-base font-bold">خيارات "حالة العقار" في صفحة إضافة عقار</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        العنوان والوصف الظاهرين على كل بطاقة من البطاقات الأربع.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {conditionOptions.map((c) => (
          <div key={c.key} className="rounded-xl border border-border p-3">
            <Label className="text-xs">العنوان</Label>
            <Input
              className="mt-1"
              value={draft[c.key]?.label ?? c.label}
              onChange={(e) => setField(c.key, "label", e.target.value)}
            />
            <Label className="mt-3 block text-xs">الوصف</Label>
            <Input
              className="mt-1"
              value={draft[c.key]?.hint ?? c.hint}
              onChange={(e) => setField(c.key, "hint", e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="gold" disabled={saving} onClick={save}>
          حفظ
        </Button>
        <Button size="sm" variant="outline" disabled={saving} onClick={reset}>
          حذف (الرجوع للافتراضي)
        </Button>
      </div>
    </div>
  );
}

function SiteTaglineSettings() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <section className="card-surface space-y-6 p-6">
      <TextSettingField
        label="الجملة التعريفية للصفحة الرئيسية"
        hint='الجملة الكبيرة الظاهرة أعلى الصفحة الرئيسية للموقع (قبل عبارة "الحل مع سينرجي" الثابتة).'
        queryKey="site-tagline"
        fetcher={fetchSiteTagline}
        onSave={(v) => saveSiteTagline(v, user.id)}
        onReset={resetSiteTagline}
        placeholder={defaultSiteTagline}
      />

      <div className="border-t border-border pt-6">
        <TextSettingField
          label="الفقرة التعريفية أسفل الجملة الرئيسية"
          hint="الفقرة الأصغر التي تشرح المنصة أسفل العنوان الرئيسي مباشرة."
          queryKey="site-subtitle"
          fetcher={fetchSiteSubtitle}
          onSave={(v) => saveSiteSubtitle(v, user.id)}
          onReset={resetSiteSubtitle}
          placeholder={defaultSiteSubtitle}
          minHeight="min-h-32"
        />
      </div>

      <div className="border-t border-border pt-6">
        <TextSettingField
          label='عنوان قسم "عن منصة سينرجي'
          hint="العنوان الظاهر أعلى قسم عن المنصة في الصفحة الرئيسية."
          queryKey="about-title"
          fetcher={fetchAboutTitle}
          onSave={(v) => saveAboutTitle(v, user.id)}
          onReset={resetAboutTitle}
          placeholder={defaultAboutTitle}
        />
      </div>

      <div className="border-t border-border pt-6">
        <TextSettingField
          label='فقرة قسم "عن منصة سينرجي'
          hint="النص التوضيحي أسفل عنوان قسم عن المنصة."
          queryKey="about-text"
          fetcher={fetchAboutText}
          onSave={(v) => saveAboutText(v, user.id)}
          onReset={resetAboutText}
          placeholder={defaultAboutText}
          minHeight="min-h-32"
        />
      </div>

      <div className="border-t border-border pt-6">
        <TextSettingField
          label="فقرة الوصف في الفوتر"
          hint="النص الظاهر أسفل الشعار في تذييل الموقع (الفوتر)."
          queryKey="footer-text"
          fetcher={fetchFooterText}
          onSave={(v) => saveFooterText(v, user.id)}
          onReset={resetFooterText}
          placeholder={defaultFooterText}
          minHeight="min-h-24"
        />
      </div>

      <div className="border-t border-border pt-6">
        <TextSettingField
          label='عنوان صفحة "إضافة عقار"'
          hint="العنوان الظاهر أعلى صفحة إضافة عقار جديد."
          queryKey="new-request-title"
          fetcher={fetchNewRequestTitle}
          onSave={(v) => saveNewRequestTitle(v, user.id)}
          onReset={resetNewRequestTitle}
          placeholder={defaultNewRequestTitle}
        />
      </div>

      <div className="border-t border-border pt-6">
        <TextSettingField
          label='فقرة صفحة "إضافة عقار"'
          hint="النص التوضيحي أسفل عنوان صفحة إضافة عقار جديد."
          queryKey="new-request-subtitle"
          fetcher={fetchNewRequestSubtitle}
          onSave={(v) => saveNewRequestSubtitle(v, user.id)}
          onReset={resetNewRequestSubtitle}
          placeholder={defaultNewRequestSubtitle}
        />
      </div>

      <div className="border-t border-border pt-6">
        <TextSettingField
          label='عنوان صفحة "المشاريع العقارية"'
          hint="العنوان الظاهر أعلى صفحة تصفح المشاريع العقارية."
          queryKey="opportunities-title"
          fetcher={fetchOpportunitiesTitle}
          onSave={(v) => saveOpportunitiesTitle(v, user.id)}
          onReset={resetOpportunitiesTitle}
          placeholder={defaultOpportunitiesTitle}
        />
      </div>

      <div className="border-t border-border pt-6">
        <TextSettingField
          label='فقرة صفحة "المشاريع العقارية"'
          hint="النص التوضيحي أسفل عنوان صفحة المشاريع العقارية."
          queryKey="opportunities-subtitle"
          fetcher={fetchOpportunitiesSubtitle}
          onSave={(v) => saveOpportunitiesSubtitle(v, user.id)}
          onReset={resetOpportunitiesSubtitle}
          placeholder={defaultOpportunitiesSubtitle}
        />
      </div>

      <div className="border-t border-border pt-6">
        <ConditionOptionTextsSettings />
      </div>
    </section>
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
      <SiteTaglineSettings />
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

function FundingCell({ id, value }: { id: string; value: number }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState(String(value || 0));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(String(value || 0));
  }, [value]);

  const save = async () => {
    setSaving(true);
    try {
      await updateRequest(id, { funding_needed: Number(draft) || 0 });
      await queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
      toast.success("تم تحديث قيمة التمويل");
    } catch (err) {
      toast.error("تعذر التحديث", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Input
        className="h-8 w-28"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <Button size="sm" variant="outline" className="h-8 px-2" disabled={saving} onClick={save}>
        حفظ
      </Button>
    </div>
  );
}

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
              <th className="pb-3">ربح المشروع</th>
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
                  <td className="py-3">
                    <FundingCell id={r.id} value={Number(r.funding_needed)} />
                  </td>
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
