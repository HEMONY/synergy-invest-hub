import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, MapPin, Search, TrendingUp, Wallet } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  conditionLabels,
  createInterest,
  fetchOpportunities,
  formatSAR,
  statusLabels,
} from "@/lib/db";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "الفرص الاستثمارية | Synergy" },
      {
        name: "description",
        content: "تصفح فرص العقارات المعتمدة وقارن العائد المتوقع والأرباح التقديرية لكل فرصة.",
      },
      { property: "og:title", content: "الفرص الاستثمارية | Synergy" },
      {
        property: "og:description",
        content: "فرص تمويل عقارية معتمدة مع عائد متوقع واضح في منصة Synergy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: fetchOpportunities,
  });

  const [query, setQuery] = useState("");
  const [type, setType] = useState("الكل");
  const [city, setCity] = useState("الكل");
  const [condition, setCondition] = useState("الكل");
  const [minReturn, setMinReturn] = useState(0);
  const [maxFunding, setMaxFunding] = useState(1000000);
  const [maxDuration, setMaxDuration] = useState(12);
  const [pending, setPending] = useState<string | null>(null);

  const cities = useMemo(() => ["الكل", ...new Set(rows.map((o) => o.city))], [rows]);
  const types = useMemo(() => ["الكل", ...new Set(rows.map((o) => o.property_type))], [rows]);

  const results = rows.filter(
    (o) =>
      (type === "الكل" || o.property_type === type) &&
      (city === "الكل" || o.city === city) &&
      (condition === "الكل" || conditionLabels[o.condition] === condition) &&
      Number(o.expected_return) >= minReturn &&
      Number(o.funding_needed) <= maxFunding &&
      o.duration_months <= maxDuration &&
      (o.district + o.city + o.damage_description + o.title).includes(query.trim()),
  );

  const handleInterest = async (id: string, amount: number, code: string) => {
    if (!user) {
      toast.info("سجّل الدخول أولاً", { description: "التمويل متاح للمستثمرين الموثقين فقط." });
      return;
    }
    setPending(id);
    try {
      await createInterest({
        request_id: id,
        investor_id: user.id,
        amount,
        message: "رغبة تمويل عبر صفحة الفرص",
      });
      await queryClient.invalidateQueries({ queryKey: ["my-interests"] });
      toast.success("تم إرسال رغبتك بالتمويل", {
        description: `سيتواصل معك مشرف المنصة لمراجعة ربط الطلب ${code}.`,
      });
    } catch (err) {
      const message = (err as Error).message;
      toast.error(
        message.includes("duplicate") ? "سبق أن أبديت رغبتك في هذه الفرصة" : "تعذر إرسال الطلب",
        { description: message.includes("duplicate") ? undefined : message },
      );
    } finally {
      setPending(null);
    }
  };

  return (
    <SiteLayout>
      <PageHeader
        title="الفرص"
        subtitle="فرص عقارية معتمدة من الإدارة — متضررة وغير متضررة — مع العائد المتوقع لكل فرصة."
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[300px_1fr] lg:px-8">
        <aside className="card-surface h-fit p-6 lg:sticky lg:top-24">
          <h2 className="text-base font-bold">فلاتر البحث</h2>

          <div className="mt-5 space-y-5">
            <div>
              <Label className="text-xs">بحث</Label>
              <div className="relative mt-2">
                <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ابحث عن فرصة..."
                  className="pr-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">حالة العقار</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["الكل", "عقار متضرر", "عقار غير متضرر"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">نوع العقار</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">المدينة</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">
                العائد المتوقع لا يقل عن <span className="text-gold">{minReturn}%</span>
              </Label>
              <Slider
                className="mt-4"
                value={[minReturn]}
                min={0}
                max={40}
                step={1}
                onValueChange={(v) => setMinReturn(v[0] ?? 0)}
              />
            </div>

            <div>
              <Label className="text-xs">
                التمويل المطلوب حتى <span className="text-gold">{formatSAR(maxFunding)}</span>
              </Label>
              <Slider
                className="mt-4"
                value={[maxFunding]}
                min={50000}
                max={5000000}
                step={50000}
                onValueChange={(v) => setMaxFunding(v[0] ?? 0)}
              />
            </div>

            <div>
              <Label className="text-xs">
                مدة التنفيذ حتى <span className="text-gold">{maxDuration} شهر</span>
              </Label>
              <Slider
                className="mt-4"
                value={[maxDuration]}
                min={1}
                max={36}
                step={1}
                onValueChange={(v) => setMaxDuration(v[0] ?? 1)}
              />
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              عدد النتائج: <span className="font-bold text-gold">{results.length}</span>
            </p>
            <Button asChild variant="gold" size="sm">
              <Link to="/new-request">أضف عقارك</Link>
            </Button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {results.map((o) => {
              const profit = (Number(o.funding_needed) * Number(o.expected_return)) / 100;
              return (
                <article key={o.id} className="card-surface flex flex-col p-6">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg bg-gold/15 px-3 py-1 text-xs font-bold text-gold">
                        {o.property_type}
                      </span>
                      <span className="rounded-lg bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                        {conditionLabels[o.condition] ?? o.condition}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">{o.code}</span>
                  </div>

                  <h3 className="mt-4 flex items-center gap-2 text-base font-bold">
                    <MapPin className="size-4 text-gold" /> {o.city} — {o.district}
                  </h3>
                  {o.title && (
                    <p className="mt-1 text-sm font-semibold text-muted-foreground">{o.title}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 p-4">
                    <div>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <TrendingUp className="size-3.5 text-gold" /> العائد المتوقع
                      </p>
                      <p className="text-2xl font-extrabold text-gold">{o.expected_return}%</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground">أرباح تقديرية</p>
                      <p className="text-sm font-bold text-gold">{formatSAR(profit)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        خلال {o.duration_months} أشهر
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 line-clamp-3 text-sm leading-7 text-muted-foreground">
                    {o.damage_description}
                  </p>
                  {o.return_notes && (
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">{o.return_notes}</p>
                  )}

                  <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
                    <div>
                      <dt className="text-xs text-muted-foreground">
                        {o.condition === "damaged" ? "تكلفة التأهيل" : "تكلفة التطوير"}
                      </dt>
                      <dd className="font-bold">{formatSAR(Number(o.rehab_cost))}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="size-3" /> مدة التنفيذ
                      </dt>
                      <dd className="font-bold">{o.duration_months} أشهر</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Wallet className="size-3" /> التمويل المطلوب
                      </dt>
                      <dd className="font-bold text-gold">{formatSAR(Number(o.funding_needed))}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">الحالة</dt>
                      <dd className="font-bold">{statusLabels[o.status] ?? o.status}</dd>
                    </div>
                  </dl>

                  <Button
                    variant="gold"
                    className="mt-5 w-full"
                    disabled={pending === o.id}
                    onClick={() => handleInterest(o.id, Number(o.funding_needed), o.code)}
                  >
                    {pending === o.id ? "جارٍ الإرسال..." : "أريد تمويل هذا العقار"}
                  </Button>
                </article>
              );
            })}
          </div>

          {isLoading && (
            <div className="card-surface p-12 text-center text-sm text-muted-foreground">
              جارٍ تحميل الفرص...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="card-surface p-12 text-center text-sm text-muted-foreground">
              لا توجد فرص مطابقة لمعايير البحث الحالية.
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}
