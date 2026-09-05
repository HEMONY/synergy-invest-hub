import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
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
import {
  cities,
  conditionOptions,
  costLabel,
  commissionNote,
  createRequest,
  defaultConditionOptionTexts,
  defaultNewRequestTitle,
  defaultNewRequestSubtitle,
  fetchConditionOptionTexts,
  fetchNewRequestTitle,
  fetchNewRequestSubtitle,
  formatDuration,
  formatSAR,
  uploadDocument,
  propertyTypes,
  type ConditionKey,
} from "@/lib/db";

export const Route = createFileRoute("/_authenticated/new-request")({
  head: () => ({
    meta: [
      { title: "إضافة عقار جديد | Synergy" },
      {
        name: "description",
        content:
          "أضف عقاراً متضرراً بحاجة لإعادة تأهيل، أو عقاراً يحتاج تشطيب، أو بناء عقار جديد، وحدد التمويل المطلوب والعائد المتوقع للشركة العقارية.",
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

const requiredDocs = [
  { key: "property_photo", label: "صورة العقار", accept: "image/*" },
  { key: "national_id", label: "بطاقة الهوية الوطنية", accept: "image/*,application/pdf" },
  { key: "ownership", label: "وثيقة ملكية العقار", accept: "image/*,application/pdf" },
] as const;

function FilePicker({
  label,
  accept,
  file,
  onPick,
}: {
  label: string;
  accept: string;
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="truncate text-xs text-muted-foreground">
          {file ? file.name : "لم يتم اختيار ملف بعد"}
        </p>
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
      <Button type="button" size="sm" variant={file ? "outline" : "gold"} onClick={() => ref.current?.click()}>
        {file ? "تغيير" : "اختيار ملف"}
      </Button>
    </div>
  );
}

function NewRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [condition, setCondition] = useState<ConditionKey>("damaged");
  const [form, setForm] = useState({
    title: "",
    property_type: "سكني",
    city: "الخرطوم",
    district: "",
    area_sqm: "",
    estimated_value: "",
    damage_description: "",
    rehab_cost: "",
    duration_months: "6",
    duration_days: "0",
    funding_needed: "",
    expected_return: "",
    return_notes: "",
    owner_phone: "",
    location_details: "",
    property_details: "",
  });


  const [files, setFiles] = useState<Record<string, File | null>>({
    property_photo: null,
    national_id: null,
    ownership: null,
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
    const phone = form.owner_phone.replace(/[^\d+]/g, "");
    if (phone.length < 9) {
      toast.error("رقم الهاتف غير صحيح", {
        description: "أدخل رقم هاتف صحيح للتواصل — لن يظهر للعامة.",
      });
      return;
    }
    if (form.location_details.trim().length < 10) {
      toast.error("الموقع الدقيق مطلوب", {
        description: "اكتب وصفاً واضحاً لموقع العقار (لا يظهر للعامة).",
      });
      return;
    }
    const missing = requiredDocs.filter((d) => !files[d.key]);
    if (missing.length > 0) {
      toast.error("المرفقات إجبارية", {
        description: `مطلوب رفع: ${missing.map((d) => d.label).join("، ")}`,
      });
      return;
    }
    setSaving(true);
    try {
      const created = await createRequest({
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
        duration_months: num(form.duration_months),
        duration_days: num(form.duration_days),
        funding_needed: num(form.funding_needed),
        expected_return: num(form.expected_return),
        return_notes: form.return_notes.trim(),
      });
      await saveRequestPrivateDetails({
        request_id: created.id,
        owner_phone: phone,
        location_details: form.location_details.trim(),
        property_details: form.property_details.trim(),
      });
      for (const d of requiredDocs) {
        const file = files[d.key];
        if (file) await uploadDocument(user.id, d.key, file);
      }
      toast.success("تم رفع الطلب بنجاح", {
        description: "سيراجع فريق المنصة الطلب قبل نشره للشركات العقارية.",
      });

      navigate({ to: "/requests" });
    } catch (err) {
      toast.error("تعذر حفظ الطلب", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  const damaged = condition === "damaged";
  const { data: pageTitle } = useQuery({
    queryKey: ["new-request-title"],
    queryFn: fetchNewRequestTitle,
  });
  const { data: pageSubtitle } = useQuery({
    queryKey: ["new-request-subtitle"],
    queryFn: fetchNewRequestSubtitle,
  });
  const { data: conditionTexts = defaultConditionOptionTexts } = useQuery({
    queryKey: ["condition-option-texts"],
    queryFn: fetchConditionOptionTexts,
  });

  return (
    <SiteLayout>
      <PageHeader
        title={pageTitle ?? defaultNewRequestTitle}
        back
        subtitle={pageSubtitle ?? defaultNewRequestSubtitle}
      />

      <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
        <form onSubmit={submit} className="card-surface space-y-6 p-6">
          <div>
            <Label className="text-xs">حالة العقار</Label>
            <div className="mt-2 grid gap-3 sm:grid-cols-3">
              {conditionOptions.map((c) => (
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
                  <span className="block text-sm font-bold">
                    {conditionTexts[c.key]?.label ?? c.label}
                  </span>
                  <span className="mt-1 block text-xs">
                    {conditionTexts[c.key]?.hint ?? c.hint}
                  </span>
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
                placeholder="مثال: تشطيب منزل — ودنوباوي"
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
              <Select value={form.city} onValueChange={set("city")}>
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
              <Label className="text-xs">الحي</Label>
              <Input
                className="mt-2"
                value={form.district}
                onChange={(e) => set("district")(e.target.value)}
                placeholder="ودنوباوي"
              />
            </div>

            <div className="sm:col-span-2">
              <Label className="text-xs">
                {damaged ? "وصف الأضرار" : "وصف العقار وخطة العمل"}
              </Label>
              <Textarea
                className="mt-2 min-h-28"
                value={form.damage_description}
                onChange={(e) => set("damage_description")(e.target.value)}
                placeholder={
                  damaged
                    ? "تصدعات في الجدران وتلف في التمديدات..."
                    : condition === "newbuild"
                      ? "أرض جاهزة للبناء، المطلوب بناء منزل من طابقين..."
                      : "المبنى جاهز ويحتاج تشطيب كامل: أرضيات، دهانات، كهرباء وسباكة..."
                }
              />
            </div>

            
          </div>

          <div className="rounded-xl border border-gold/40 bg-gold/5 p-4">
            <h3 className="text-sm font-bold">المرفقات المطلوبة (إجبارية)</h3>
            <p className="mt-1 text-xs text-muted-foreground">{commissionNote}</p>
            <div className="mt-4 space-y-3">
              {requiredDocs.map((d) => (
                <FilePicker
                  key={d.key}
                  label={d.label}
                  accept={d.accept}
                  file={files[d.key] ?? null}
                  onPick={(f) => setFiles((prev) => ({ ...prev, [d.key]: f }))}
                />
              ))}
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
