import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSAR, opportunities, projects, projectStages } from "@/lib/mock-data";

export const Route = createFileRoute("/requests")({
  head: () => ({
    meta: [
      { title: "طلباتي ومشاريعي | Synergy" },
      {
        name: "description",
        content: "تابع طلبات التمويل التي رفعتها ومشاريعك قيد التنفيذ ونسبة الإنجاز لكل مشروع.",
      },
      { property: "og:title", content: "طلباتي ومشاريعي | Synergy" },
      {
        property: "og:description",
        content: "متابعة مراحل المشروع من الرفع حتى الاكتمال في منصة Synergy.",
      },
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
              done
                ? "border-gold/50 bg-gold/15 text-gold"
                : "border-border text-muted-foreground"
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
  return (
    <SiteLayout>
      <PageHeader
        title="طلباتي"
        subtitle="الطلبات التي رفعتها كصاحب عقار أو موّلتها كمستثمر، ومتابعة حالة كل مشروع."
      />

      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <Tabs defaultValue="requests">
          <TabsList>
            <TabsTrigger value="requests">طلباتي</TabsTrigger>
            <TabsTrigger value="projects">مشاريعي</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Button variant="gold">أضف عقارك</Button>
            </div>
            {opportunities.slice(0, 4).map((o) => (
              <article key={o.id} className="card-surface p-6">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold">
                      {o.type} — {o.city} / {o.district}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">رقم الطلب {o.code}</p>
                  </div>
                  <Badge className="shrink-0 bg-gold/15 text-gold">{o.status}</Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{o.damage}</p>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">تكلفة التأهيل</dt>
                    <dd className="font-bold">{formatSAR(o.rehabCost)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">التمويل المطلوب</dt>
                    <dd className="font-bold text-gold">{formatSAR(o.fundingNeeded)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">مدة التنفيذ</dt>
                    <dd className="font-bold">{o.durationMonths} أشهر</dd>
                  </div>
                </dl>
              </article>
            ))}
          </TabsContent>

          <TabsContent value="projects" className="mt-6 space-y-4">
            {projects.map((p) => (
              <article key={p.id} className="card-surface p-6">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold">{p.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.code} · المشرف {p.supervisor} · آخر تحديث {p.updatedAt}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-gold">
                    {formatSAR(p.funding)}
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
                  <Stepper current={p.stageIndex} />
                </div>
              </article>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}
