import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CompanyOffersPanel, OwnerOffersPanel } from "@/components/OffersPanels";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  cancelMyRequest,
  commissionNote,
  conditionLabels,
  costLabel,
  effectiveProgress,
  fetchMyRequests,
  formatDuration,
  formatSAR,
  projectStages,
  statusLabels,
  timeAgo,
  updateMyRequest,
  type PropertyRequest,
} from "@/lib/db";

export const Route = createFileRoute("/_authenticated/requests")({
  head: () => ({
    meta: [
      { title: "طلباتي ومشاريعي | Synergy" },
      {
        name: "description",
        content: "تابع الطلبات التي رفعتها ومشاريعك قيد التنفيذ ونسبة الإنجاز لكل مشروع.",
      },
      { property: "og:title", content: "طلباتي ومشاريعي | Synergy" },
      {
        property: "og:description",
        content: "متابعة مراحل المشروع من الرفع حتى الاكتمال في منصة Synergy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RequestsPage,
});

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap gap-2">
      {projectStages.map((stage, i) => {
        const done = i <= current;
        return (
          <li
            key={stage}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              done ? "border-gold/50 bg-gold/15 text-gold" : "border-border text-muted-foreground"
            }`}
          >
            {done && <Check className="size-3" />}
            {stage}
          </li>
        );
      })}
    </ol>
  );
}

function EditRequestForm({
  request,
  onCancel,
  onSaved,
}: {
  request: PropertyRequest;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: request.title ?? "",
    city: request.city,
    district: request.district,
    damage_description: request.damage_description,
  });

  const save = async () => {
    setSaving(true);
    try {
      await updateMyRequest(request.id, {
        title: form.title.trim(),
        city: form.city.trim(),
        district: form.district.trim(),
        damage_description: form.damage_description.trim(),
      });
      toast.success("تم تحديث الطلب");
      onSaved();
    } catch (err) {
      toast.error("تعذر تحديث الطلب", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-gold/40 bg-gold/5 p-4">
      <div>
        <Label className="text-xs">عنوان الطلب</Label>
        <Input
          className="mt-2"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-xs">المدينة</Label>
          <Input
            className="mt-2"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </div>
        <div>
          <Label className="text-xs">الحي</Label>
          <Input
            className="mt-2"
            value={form.district}
            onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
          />
        </div>
      </div>
      <div>
        <Label className="text-xs">الوصف</Label>
        <Textarea
          className="mt-2 min-h-24"
          value={form.damage_description}
          onChange={(e) => setForm((f) => ({ ...f, damage_description: e.target.value }))}
        />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="gold" disabled={saving} onClick={save}>
          {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          تراجع
        </Button>
      </div>
    </div>
  );
}

function RequestsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-requests", userId],
    queryFn: () => fetchMyRequests(userId),
    enabled: !!userId,
  });

  const projects = requests.filter((r) =>
    ["matched", "in_progress", "completed"].includes(r.status),
  );

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["my-requests", userId] });
  };

  const cancelRequest = async (id: string, code: string) => {
    if (!window.confirm(`هل تريد بالتأكيد إلغاء الطلب ${code}؟ لا يمكن التراجع عن هذا الإجراء.`)) {
      return;
    }
    setCancellingId(id);
    try {
      await cancelMyRequest(id);
      toast.success("تم إلغاء الطلب");
      refresh();
    } catch (err) {
      toast.error("تعذر إلغاء الطلب", { description: (err as Error).message });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        back
        title="طلباتي"
        subtitle="الطلبات التي رفعتها ومتابعة حالة كل مشروع."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <Tabs defaultValue="requests">
          <TabsList>
            
            <TabsTrigger value="commissions">مدفوعاتي</TabsTrigger>
            <TabsTrigger value="projects">مشاريعي</TabsTrigger>
            <TabsTrigger value="offers">العروض</TabsTrigger>
            <TabsTrigger value="requests">طلباتي</TabsTrigger>
            
          </TabsList>

          <TabsContent value="offers" className="mt-6 space-y-4">
            {user && (
              <>
                <h3 className="text-sm font-bold text-muted-foreground">
                  عروض الشركات على مشاريعي
                </h3>
                <OwnerOffersPanel ownerId={user.id} />
                <h3 className="pt-4 text-sm font-bold text-muted-foreground">
                  العروض التي قدّمتها كشركة عقارية
                </h3>
                <CompanyOffersPanel userId={user.id} />
              </>
            )}
          </TabsContent>

          <TabsContent value="commissions" className="mt-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              عمولات سينرجي المستحقة على عروضك المعتمدة — بعد السداد وتأكيده يتم فتح التواصل مع صاحب
              المشروع.
            </p>
            {user && <CompanyOffersPanel userId={user.id} />}
          </TabsContent>

          <TabsContent value="requests" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button asChild variant="gold" className="gap-2">
                <Link to="/new-request">
                  <Plus className="size-4" />
                  أضف عقارك
                </Link>
              </Button>
            </div>

            {isLoading && (
              <div className="card-surface p-10 text-center text-sm text-muted-foreground">
                جارٍ التحميل...
              </div>
            )}

            {!isLoading && requests.length === 0 && (
              <div className="card-surface p-10 text-center text-sm text-muted-foreground">
                لم ترفع أي عقار بعد — ابدأ بإضافة عقارك.
              </div>
            )}

            {requests.map((o) => (
              <article key={o.id} className="card-surface p-6">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold">
                      {o.title || `${o.property_type} — ${o.city} / ${o.district}`}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      رقم الطلب {o.code} · {conditionLabels[o.condition] ?? o.condition} ·{" "}
                      {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <Badge className="shrink-0 bg-gold/15 text-gold">
                    {statusLabels[o.status] ?? o.status}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {o.damage_description}
                </p>
               

                {editingId === o.id ? (
                  <EditRequestForm
                    request={o}
                    onCancel={() => setEditingId(null)}
                    onSaved={() => {
                      setEditingId(null);
                      refresh();
                    }}
                  />
                ) : (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button size="sm" variant="gold" onClick={() => setEditingId(o.id)}>
                      تعديل الطلب
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={cancellingId === o.id}
                      onClick={() => cancelRequest(o.id, o.code)}
                    >
                      {cancellingId === o.id ? "جارٍ الإلغاء..." : "إلغاء الطلب"}
                    </Button>
                  </div>
                )}
              </article>
            ))}
          </TabsContent>

          <TabsContent value="projects" className="mt-6 space-y-4">
            {projects.length === 0 && (
              <div className="card-surface p-10 text-center text-sm text-muted-foreground">
                لا توجد مشاريع قيد التنفيذ حالياً.
              </div>
            )}
            {projects.map((p) => (
              <article key={p.id} className="card-surface p-6">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold">
                      {p.title || `${p.property_type} — ${p.city} / ${p.district}`}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.code} · آخر تحديث {timeAgo(p.updated_at)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-gold">
                    {formatSAR(Number(p.funding_needed))}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span>نسبة الإنجاز</span>
                    <span className="text-gold">
                      {effectiveProgress(p.progress, p.stage_index)}%
                    </span>
                  </div>
                  <Progress
                    value={effectiveProgress(p.progress, p.stage_index)}
                    className="mt-2 h-2.5"
                  />
                  <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                    المرحلة الحالية: {projectStages[p.stage_index] ?? projectStages[0]} · {commissionNote}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">حالة المشروع</p>
                  <Stepper current={p.stage_index} />
                </div>
              </article>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}
