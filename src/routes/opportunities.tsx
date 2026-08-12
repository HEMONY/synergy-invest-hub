import { createFileRoute } from "@tanstack/react-router";
import { Clock3, MapPin, Search, Wallet } from "lucide-react";
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
import { formatSAR, opportunities } from "@/lib/mock-data";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "الفرص الاستثمارية | Synergy" },
      {
        name: "description",
        content: "تصفح طلبات تأهيل العقارات المعتمدة وفلترها حسب النوع والموقع والتمويل المطلوب.",
      },
      { property: "og:title", content: "الفرص الاستثمارية | Synergy" },
      {
        property: "og:description",
        content: "فرص تمويل عقارات متضررة معتمدة من إدارة منصة Synergy.",
      },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("الكل");
  const [city, setCity] = useState("الكل");
  const [maxFunding, setMaxFunding] = useState(1000000);
  const [maxDuration, setMaxDuration] = useState(12);

  const cities = useMemo(() => ["الكل", ...new Set(opportunities.map((o) => o.city))], []);
  const types = useMemo(() => ["الكل", ...new Set(opportunities.map((o) => o.type))], []);

  const results = opportunities.filter(
    (o) =>
      (type === "الكل" || o.type === type) &&
      (city === "الكل" || o.city === city) &&
      o.fundingNeeded <= maxFunding &&
      o.durationMonths <= maxDuration &&
      (o.district + o.city + o.damage).includes(query.trim()),
  );

  return (
    <SiteLayout>
      <PageHeader
        title="الفرص"
        subtitle="طلبات العقارات المتضررة المعتمدة من الإدارة — متاحة للمستثمرين الموثقين فقط."
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
                التمويل المطلوب حتى <span className="text-gold">{formatSAR(maxFunding)}</span>
              </Label>
              <Slider
                className="mt-4"
                value={[maxFunding]}
                min={100000}
                max={1000000}
                step={50000}
                onValueChange={([v]) => setMaxFunding(v)}
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
                max={12}
                step={1}
                onValueChange={([v]) => setMaxDuration(v)}
              />
            </div>
          </div>
        </aside>

        <section>
          <p className="mb-4 text-sm text-muted-foreground">
            عدد النتائج: <span className="font-bold text-gold">{results.length}</span>
          </p>

          <div className="grid gap-5 md:grid-cols-2">
            {results.map((o) => (
              <article key={o.id} className="card-surface flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-gold/15 px-3 py-1 text-xs font-bold text-gold">
                    {o.type}
                  </span>
                  <span className="text-xs text-muted-foreground">{o.code}</span>
                </div>

                <h3 className="mt-4 flex items-center gap-2 text-base font-bold">
                  <MapPin className="size-4 text-gold" /> {o.city} — {o.district}
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="grid aspect-4/3 place-items-center rounded-xl bg-muted text-[10px] text-muted-foreground"
                    >
                      صورة {i + 1}
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-7 text-muted-foreground">{o.damage}</p>

                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">تكلفة التأهيل</dt>
                    <dd className="font-bold">{formatSAR(o.rehabCost)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="size-3" /> مدة التنفيذ
                    </dt>
                    <dd className="font-bold">{o.durationMonths} أشهر</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Wallet className="size-3" /> التمويل المطلوب
                    </dt>
                    <dd className="font-bold text-gold">{formatSAR(o.fundingNeeded)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">العائد المتوقع</dt>
                    <dd className="font-bold text-gold">{o.expectedReturn}%</dd>
                  </div>
                </dl>

                <Button
                  variant="gold"
                  className="mt-5 w-full"
                  onClick={() =>
                    toast.success("تم إرسال رغبتك بالتمويل", {
                      description: `سيتواصل معك مشرف المنصة لمراجعة ربط الطلب ${o.code}.`,
                    })
                  }
                >
                  أريد تمويل هذا العقار
                </Button>
              </article>
            ))}
          </div>

          {results.length === 0 && (
            <div className="card-surface p-12 text-center text-sm text-muted-foreground">
              لا توجد فرص مطابقة لمعايير البحث الحالية.
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}
