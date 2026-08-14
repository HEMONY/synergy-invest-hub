import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { createRequest, formatSAR, propertyTypes } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/new-request")({
  head: () => ({
    meta: [
      { title: "إضافة عقار جديد | Synergy" },
      {
        name: "description",
        content:
          "أضف عقاراً متضرراً أو عقاراً غير متضرر للتطوير، وحدد التمويل المطلوب والعائد المتوقع للمستثمرين.",
      },
      { property: "og:title", content: "إضافة عقار جديد | Synergy" },
      {
        property: "og:description",
        content: "ارفع طلب تمويل عقارك في منصة Synergy خلال دقائق.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewRequestPage,
});

function NewRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [condition, setCondition] = useState<"damaged" | "intact">("damaged");
  const [form, setForm] = useState({
    title: "",
    property_type: "سكني",
    city: "",
    district: "",
    area_sqm: "",
    estimated_value: "",
    damage_description: "",
    rehab_cost: "",
    duration_months: "6",
    funding_needed: "",
    expected_return: "",
    return_notes: "",
  });

  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.city.trim() || !form.district.trim()) {
      toast.error("أكمل البيانات الأساسية", { description: "العنوان والمدينة والحي مطلوبة." });
      return;
    }
    setSaving(true);
    try {
      await createRequest({
        owner_id: user.id,
        title: form.title.trim(),
        condition,
        property_type: form.property_type,
        city: form.city.trim(),
        district: form.district.trim(),
        area_sqm: num(form.area_sqm),
        estimated_value: num(form.estimated_value),
        damage_description: form.damage_description.trim(),
        rehab_cost: num(form.rehab_cost),
        duration_months: num(form.duration_months) || 6,
        funding_needed: num(form.funding_needed),
        expected_return: num(form.expected_return),
        return_notes: form.return_notes.trim(),
      });
      toast.success("تم رفع الطلب بنجاح", {
        description: "سيراجع فريق المنصة الطلب قبل نشره للمستثمرين.",
      });
      navigate({ to: "/requests" });
    } catch (err) {
      toast.error("تعذر حفظ الطلب", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const damaged = condition === "damaged";

  return (
    <SiteLayout>
      <PageHeader
        title="إضافة عقار"
        subtitle="ارفع عقاراً متضرراً بحاجة لتأهيل، أو عقاراً غير متضرر بحاجة لتمويل تطوير أو تشغيل."
      />

      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
        <form onSubmit={submit} className="card-surface space-y-6 p-6">
          <div>
            <Label className="text-xs">حالة العقار</Label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(
                [
                  { key: "damaged", label: "عقار متضرر", hint: "يحتاج ترميم وتأهيل" },
                  { key: "intact", label: "عقار غير متضرر", hint: "تطوير أو استثمار مباشر" },
                ] as const
              ).map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCondition(c.key)}
                  className={`rounded-xl border p-4 text-right transition-colors ${
                    condition === c.key
                      ? "border-gold/60 bg-gold/10 text-gold"
                      : "border-border text-muted-foreground hover:border-gold/40"
                  }`}
                >
                  <span className="block text-sm font-bold">{c.label}</span>
                  <span className="mt-1 block text-xs">{c.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs">عنوان الطلب</Label>
              <Input
                className="mt-2"
                value={form.title}
                onChange={(e) => set("title")(e.target.value)}
                placeholder="مثال: تطوير فيلا سكنية — حي النرجس"
              />
            </div>

            <div>
              <Label className="text-xs">نوع العقار</Label>
              <Select value={form.property_type} onValueChange={set("property_type")}>
                <SelectTrigger className="mt-2 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">المساحة (م²)</Label>
              <Input
                className="mt-2"
                inputMode="numeric"
                value={form.area_sqm}
                onChange={(e) => set("area_sqm")(e.target.value)}
                placeholder="400"
              />
            </div>

            <div>
              <Label className="text-xs">المدينة</Label>
              <Input
                className="mt-2"
                value={form.city}
                onChange={(e) => set("city")(e.target.value)}
                placeholder="الرياض"
              />
            </div>

            <div>
              <Label className="text-xs">الحي</Label>
              <Input
                className="mt-2"
                value={form.district}
                onChange={(e) => set("district")(e.target.value)}
                placeholder="حي النرجس"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs">
                {damaged ? "وصف الأضرار" : "وصف العقار وخطة التطوير"}
              </Label>
              <Textarea
                className="mt-2 min-h-28"
                value={form.damage_description}
                onChange={(e) => set("damage_description")(e.target.value)}
                placeholder={
                  damaged
                    ? "تصدعات في الجدران وتلف في التمديدات..."
                    : "عقار جاهز بحاجة لتمويل تشطيب/تأثيث أو تطوير دور إضافي..."
                }
              />
            </div>

            <div>
              <Label className="text-xs">القيمة التقديرية للعقار</Label>
              <Input
                className="mt-2"
                inputMode="numeric"
                value={form.estimated_value}
                onChange={(e) => set("estimated_value")(e.target.value)}
                placeholder="1200000"
              />
            </div>

            <div>
              <Label className="text-xs">{damaged ? "تكلفة التأهيل" : "تكلفة التطوير"}</Label>
              <Input
                className="mt-2"
                inputMode="numeric"
                value={form.rehab_cost}
                onChange={(e) => set("rehab_cost")(e.target.value)}
                placeholder="250000"
              />
            </div>

            <div>
              <Label className="text-xs">التمويل المطلوب</Label>
              <Input
                className="mt-2"
                inputMode="numeric"
                value={form.funding_needed}
                onChange={(e) => set("funding_needed")(e.target.value)}
                placeholder="200000"
              />
              {form.funding_needed && (
                <p className="mt-1 text-xs text-gold">{formatSAR(num(form.funding_needed))}</p>
              )}
            </div>

            <div>
              <Label className="text-xs">مدة التنفيذ (بالأشهر)</Label>
              <Input
                className="mt-2"
                inputMode="numeric"
                value={form.duration_months}
                onChange={(e) => set("duration_months")(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs">العائد المتوقع للمستثمر (%)</Label>
              <Input
                className="mt-2"
                inputMode="numeric"
                value={form.expected_return}
                onChange={(e) => set("expected_return")(e.target.value)}
                placeholder="18"
              />
            </div>

            <div>
              <Label className="text-xs">أرباح المستثمر التقديرية</Label>
              <div className="mt-2 grid h-9 items-center rounded-md border border-border bg-muted/50 px-3 text-sm font-bold text-gold">
                {formatSAR((num(form.funding_needed) * num(form.expected_return)) / 100)}
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs">تفاصيل العائد وآلية السداد (اختياري)</Label>
              <Textarea
                className="mt-2"
                value={form.return_notes}
                onChange={(e) => set("return_notes")(e.target.value)}
                placeholder="مثال: يُسدد رأس المال والعائد دفعة واحدة عند البيع خلال 8 أشهر."
              />
            </div>
          </div>

          <Button type="submit" variant="gold" className="w-full" disabled={saving}>
            {saving ? "جارٍ الحفظ..." : "رفع الطلب للمراجعة"}
          </Button>
        </form>
      </div>
    </SiteLayout>
  );
}
