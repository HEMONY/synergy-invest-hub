import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock3, MapPin, RotateCcw, Search, SlidersHorizontal, TrendingUp, Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import {
  cities,
  conditionLabels,
  conditionOptions,
  commissionNote,
  costLabel,
  submitCompanyOffer,
  defaultOpportunitiesTitle,
  defaultOpportunitiesSubtitle,
  fetchOpportunities,
  fetchOpportunitiesTitle,
  fetchOpportunitiesSubtitle,
  formatDuration,
  formatSAR,
  propertyTypes,
  statusLabels,
} from "@/lib/db";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "المشاريع العقارية | Synergy" },
      {
        name: "description",
        content:
          "تصفح مالمشاريع العقارية المعتمدة وقارن العائد المتوقع والأرباح التقديرية لكل مشروع.",
      },
      { property: "og:title", content: "المشاريع العقارية | Synergy" },
      {
        property: "og:description",
        content: "مشاريع عقارية معتمدة مع عائد متوقع واضح للشركات العقارية في منصة Synergy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunitiesPage,
});

const defaultFilters = {
  query: "",
  type: "الكل",
  city: "الكل",
  condition: "الكل",
  minReturn: 0,
  maxFunding: 5000000,
  maxDuration: 36,
};

type Filters = typeof defaultFilters;

function OpportunitiesPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: fetchOpportunities,
  });
  const { data: pageTitle } = useQuery({
    queryKey: ["opportunities-title"],
    queryFn: fetchOpportunitiesTitle,
  });
  const { data: pageSubtitle } = useQuery({
    queryKey: ["opportunities-subtitle"],
    queryFn: fetchOpportunitiesSubtitle,
  });

  const [draft, setDraft] = useState<Filters>(defaultFilters);
  const [applied, setApplied] = useState<Filters>(defaultFilters);
  const [pending, setPending] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const setField = <K extends keyof Filters>(k: K, v: Filters[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const results = rows.filter(
    (o) =>
      (applied.type === "الكل" || o.property_type === applied.type) &&
      (applied.city === "الكل" || o.city === applied.city) &&
      (applied.condition === "الكل" ||
        (conditionLabels[o.condition] ?? o.condition) === applied.condition) &&
      Number(o.expected_return) >= applied.minReturn &&
      Number(o.funding_needed) <= applied.maxFunding &&
      o.duration_months <= applied.maxDuration &&
      (o.district + o.city + o.damage_description + o.title).includes(applied.query.trim()),
  );

  const [offerFor, setOfferFor] = useState<{ id: string; code: string; amount: number } | null>(
    null,
  );
  const [offer, setOffer] = useState({
    company_name: "",
    company_phone: "",
    company_location: "",
    scope_of_work: "",
    proposed_works: "",
    payment_method: "",
    warranty: "",
    company_notes: "",
  });
  const setOfferField = (k: keyof typeof offer) => (v: string) =>
    setOffer((o) => ({ ...o, [k]: v }));

  const openOffer = (id: string, amount: number, code: string) => {
    if (!user) {
      toast.info("سجّل الدخول أولاً", { description: "هذه الخدمة للشركات العقارية الموثقة." });
      return;
    }
    setOfferFor({ id, code, amount });
  };

  const submitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !offerFor) return;
    const required: [string, string][] = [
      ["اسم الشركة", offer.company_name],
      ["رقم هاتف الشركة", offer.company_phone],
      ["موقع الشركة", offer.company_location],
      ["نطاق العمل", offer.scope_of_work],
      ["الأعمال المقترحة", offer.proposed_works],
      ["طريقة الدفع", offer.payment_method],
      ["الضمان", offer.warranty],
    ];
    const missing = required.filter(([, v]) => !v.trim()).map(([k]) => k);
    if (missing.length > 0) {
      toast.error("أكمل بيانات العرض", { description: `مطلوب: ${missing.join("، ")}` });
      return;
    }
    setPending(offerFor.id);
    try {
      await submitCompanyOffer({
        request_id: offerFor.id,
        investor_id: user.id,
        amount: offerFor.amount,
        company_name: offer.company_name.trim(),
        company_phone: offer.company_phone.trim(),
        company_location: offer.company_location.trim(),
        scope_of_work: offer.scope_of_work.trim(),
        proposed_works: offer.proposed_works.trim(),
        payment_method: offer.payment_method.trim(),
        warranty: offer.warranty.trim(),
        company_notes: offer.company_notes.trim(),
      });
      await queryClient.invalidateQueries({ queryKey: ["my-interests"] });
      toast.success("تم إرسال عرضكم", {
        description: `ستراجعه سينرجي ثم تعرضه على صاحب المشروع ${offerFor.code}.`,
      });
      setOfferFor(null);
    } catch (err) {
      const message = (err as Error).message;
      toast.error(
        message.includes("duplicate") ? "سبق أن أرسلت عرضاً لهذا المشروع" : "تعذر إرسال العرض",
        { description: message.includes("duplicate") ? undefined : message },
      );
    } finally {
      setPending(null);
    }
  };


  return (
    <SiteLayout>
      <PageHeader
        back
        title={pageTitle ?? defaultOpportunitiesTitle}
        subtitle={pageSubtitle ?? defaultOpportunitiesSubtitle}
      />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[300px_1fr] lg:px-8">
        <Button
          type="button"
          variant="outline"
          className="gap-2 lg:hidden"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="size-4" />
          {showFilters ? "إخفاء البحث" : "بحث عن مشروع"}
        </Button>

        <aside
          className={`card-surface h-fit p-6 lg:sticky lg:top-24 lg:block ${
            showFilters ? "" : "hidden"
          }`}
        >
          <h2 className="text-base font-bold"> بحث عن مشروع</h2>

          <form
            className="mt-5 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setApplied(draft);
            }}
          >
            <div>
              <Label className="text-xs">بحث</Label>
              <div className="relative mt-2">
                <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={draft.query}
                  onChange={(e) => setField("query", e.target.value)}
                  placeholder="مثال: ودنوباوي، تشطيب منزل، امدرمان"
                  className="pr-9"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">حالة العقار</Label>
              <Select
                value={draft.condition}
                onValueChange={(v) => setField("condition", v)}
              >
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["الكل", ...conditionOptions.map((c) => conditionLabels[c.key]!)].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">نوع العقار</Label>
              <Select value={draft.type} onValueChange={(v) => setField("type", v)}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["الكل", ...propertyTypes].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">المدينة</Label>
              <Select value={draft.city} onValueChange={(v) => setField("city", v)}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["الكل", ...cities].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            

            <div className="flex gap-2">
              <Button type="submit" variant="gold" className="flex-1 gap-2">
                <Search className="size-4" /> بحث
              </Button>
              <Button
                type="button"
                variant="outline"
                aria-label="إعادة ضبط الفلاتر"
                onClick={() => {
                  setDraft(defaultFilters);
                  setApplied(defaultFilters);
                }}
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
          </form>
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

                  

                  <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
                   
                    <div>
                      <dt className="text-xs text-muted-foreground">الحالة</dt>
                      <dd className="font-bold">{statusLabels[o.status] ?? o.status}</dd>
                    </div>
                  </dl>

                  <Button
                    variant="gold"
                    className="mt-5 w-full"
                    disabled={pending === o.id}
                    onClick={() => openOffer(o.id, Number(o.funding_needed), o.code)}
                  >
                    {pending === o.id ? "جارٍ الإرسال..." : "نريد العمل على هذا المشروع"}
                  </Button>
                  
                </article>
              );
            })}
          </div>

          {isLoading && (
            <div className="card-surface p-12 text-center text-sm text-muted-foreground">
              جارٍ تحميل المشاريع...
            </div>
          )}

          {!isLoading && results.length === 0 && (
            <div className="card-surface p-12 text-center text-sm text-muted-foreground">
              لا توجد مشاريع مطابقة لمعايير البحث الحالية.
            </div>
          )}
        </section>
      </div>

      <Dialog open={!!offerFor} onOpenChange={(open) => !open && setOfferFor(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>عرض العمل على المشروع {offerFor?.code}</DialogTitle>
            <DialogDescription>
              أكمل بيانات شركتكم وتفاصيل العرض. تراجعه سينرجي ثم تعرضه على صاحب المشروع.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-3" onSubmit={submitOffer}>
            <div>
              <Label className="text-xs">اسم الشركة</Label>
              <Input
                className="mt-2"
                value={offer.company_name}
                onChange={(e) => setOfferField("company_name")(e.target.value)}
                placeholder="شركة النور للمقاولات"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">رقم هاتف الشركة</Label>
                <Input
                  className="mt-2"
                  inputMode="tel"
                  value={offer.company_phone}
                  onChange={(e) => setOfferField("company_phone")(e.target.value)}
                  placeholder="0912345678"
                />
              </div>
              <div>
                <Label className="text-xs">موقع الشركة الدقيق</Label>
                <Input
                  className="mt-2"
                  value={offer.company_location}
                  onChange={(e) => setOfferField("company_location")(e.target.value)}
                  placeholder="الخرطوم — شارع الستين، عمارة رقم 4"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">نطاق العمل</Label>
              <Input
                className="mt-2"
                value={offer.scope_of_work}
                onChange={(e) => setOfferField("scope_of_work")(e.target.value)}
                placeholder="إعادة تأهيل العقار بالكامل"
              />
            </div>
            <div>
              <Label className="text-xs">الأعمال المقترحة</Label>
              <Textarea
                className="mt-2 min-h-20"
                value={offer.proposed_works}
                onChange={(e) => setOfferField("proposed_works")(e.target.value)}
                placeholder="ترميم، كهرباء، سباكة وتشطيبات"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs">طريقة الدفع</Label>
                <Input
                  className="mt-2"
                  value={offer.payment_method}
                  onChange={(e) => setOfferField("payment_method")(e.target.value)}
                  placeholder="دفعات حسب مراحل الإنجاز"
                />
              </div>
              <div>
                <Label className="text-xs">الضمان</Label>
                <Input
                  className="mt-2"
                  value={offer.warranty}
                  onChange={(e) => setOfferField("warranty")(e.target.value)}
                  placeholder="ضمان سنة"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">ملاحظات الشركة (اختياري)</Label>
              <Textarea
                className="mt-2 min-h-16"
                value={offer.company_notes}
                onChange={(e) => setOfferField("company_notes")(e.target.value)}
                placeholder="أي أعمال إضافية يتم الاتفاق عليها مسبقاً"
              />
            </div>
            <p className="text-[11px] leading-5 text-muted-foreground">{commissionNote}</p>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOfferFor(null)}>
                إلغاء
              </Button>
              <Button type="submit" variant="gold" disabled={pending === offerFor?.id}>
                {pending === offerFor?.id ? "جارٍ الإرسال..." : "إرسال العرض"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SiteLayout>

  );
}
