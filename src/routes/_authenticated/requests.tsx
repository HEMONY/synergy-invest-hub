import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  conditionLabels,
  costLabel,
  createInterest,
  fetchMyRequests,
  formatSAR,
  projectStages,
  statusLabels,
  timeAgo,
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

function RequestsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["my-requests", userId],
    queryFn: () => fetchMyRequests(userId),
    enabled: !!userId,
  });

  const projects = requests.filter((r) =>
    ["matched", "in_progress", "completed"].includes(r.status),
  );

  const applyToWork = async (id: string, amount: number, code: string) => {
    if (!userId) return;
    setPending(id);
    try {
      await createInterest({
        request_id: id,
        investor_id: userId,
        amount,
        message: "نريد العمل على هذا المشروع",
      });
      await queryClient.invalidateQueries({ queryKey: ["my-interests", userId] });
      toast.success("تم إرسال طلبك", {
        description: `سيتواصل معك مشرف المنصة بخصوص المشروع ${code}.`,
      });
    } catch (err) {
      const message = (err as Error).message;
      toast.error(
        message.includes("duplicate") ? "سبق أن أرسلت طلباً لهذا المشروع" : "تعذر إرسال الطلب",
        { description: message.includes("duplicate") ? undefined : message },
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        title="طلباتي"
        subtitle="الطلبات التي رفعتها ومتابعة حالة كل مشروع."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">طلباتي</TabsTrigger>
            <TabsTrigger value="projects">مشاريعي</TabsTrigger>
          </TabsList>

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
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-xs text-muted-foreground">{costLabel(o.condition)}</dt>
                    <dd className="font-bold">{formatSAR(Number(o.rehab_cost))}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">التمويل المطلوب</dt>
                    <dd className="font-bold text-gold">{formatSAR(Number(o.funding_needed))}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">العائد المتوقع</dt>
                    <dd className="font-bold text-gold">{o.expected_return}%</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">مدة التنفيذ</dt>
                    <dd className="font-bold">{o.duration_months} أشهر</dd>
                  </div>
                </dl>

                <Button
                  variant="gold"
                  className="mt-5 w-full sm:w-auto"
                  disabled={pending === o.id}
                  onClick={() => applyToWork(o.id, Number(o.funding_needed), o.code)}
                >
                  {pending === o.id ? "جارٍ الإرسال..." : "نريد العمل على هذا المشروع"}
                </Button>
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
                    <span className="text-gold">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="mt-2 h-2.5" />
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
