import { createFileRoute } from "@tanstack/react-router";
import { BadgeCheck, LifeBuoy, Upload } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatSAR } from "@/lib/mock-data";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "حسابي | Synergy" },
      {
        name: "description",
        content: "بياناتك الشخصية، حالة توثيق مستنداتك، سجل مدفوعاتك، والدعم الفني.",
      },
      { property: "og:title", content: "حسابي | Synergy" },
      { property: "og:description", content: "إدارة حسابك ومستنداتك في منصة Synergy." },
    ],
  }),
  component: AccountPage,
});

const documents = [
  { name: "بطاقة الهوية الوطنية", status: "موثّق", note: "تمت الموافقة بتاريخ 2026/04/02" },
  { name: "وثيقة ملكية العقار", status: "قيد المراجعة", note: "قيد مراجعة مشرف التوثيق" },
  { name: "إثبات القدرة المالية", status: "مرفوض", note: "سبب الرفض: الصورة غير واضحة" },
];

const payments = [
  { id: "TR-3391", date: "2026/06/12", amount: 200000, kind: "تحويل تمويل", state: "مكتمل" },
  { id: "TR-3402", date: "2026/07/01", amount: 5000, kind: "عمولة منصة", state: "مكتمل" },
  { id: "TR-3418", date: "2026/08/03", amount: 400000, kind: "تحويل تمويل", state: "قيد التوثيق" },
];

const statusStyle: Record<string, string> = {
  "موثّق": "bg-success/15 text-success",
  "قيد المراجعة": "bg-warning/20 text-warning",
  "مرفوض": "bg-destructive/15 text-destructive",
  مكتمل: "bg-success/15 text-success",
  "قيد التوثيق": "bg-warning/20 text-warning",
};

function AccountPage() {
  return (
    <SiteLayout>
      <PageHeader title="حسابي" subtitle="بياناتي، مستنداتي، مدفوعاتي والدعم الفني." />

      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <div className="card-surface mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold-gradient text-xl font-extrabold text-navy">
              ع
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">عبدالله الشمري</h2>
              <p className="text-xs text-muted-foreground">صاحب عقار · عضو منذ 2026/03/12</p>
            </div>
          </div>
          <Badge className="shrink-0 gap-1 bg-success/15 text-success">
            <BadgeCheck className="size-4" /> حساب موثّق
          </Badge>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profile">بياناتي</TabsTrigger>
            <TabsTrigger value="docs">مستنداتي</TabsTrigger>
            <TabsTrigger value="payments">مدفوعاتي</TabsTrigger>
            <TabsTrigger value="support">الدعم</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="card-surface mt-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>الاسم الكامل</Label>
                <Input className="mt-2" defaultValue="عبدالله الشمري" />
              </div>
              <div>
                <Label>رقم الجوال</Label>
                <Input className="mt-2" defaultValue="0500000000" dir="ltr" />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input className="mt-2" defaultValue="abdullah@example.com" dir="ltr" />
              </div>
              <div>
                <Label>المدينة</Label>
                <Input className="mt-2" defaultValue="الرياض" />
              </div>
            </div>
            <Button
              variant="gold"
              className="mt-6"
              onClick={() => toast.success("تم حفظ بياناتك بنجاح")}
            >
              حفظ التعديلات
            </Button>
          </TabsContent>

          <TabsContent value="docs" className="mt-6 space-y-3">
            {documents.map((d) => (
              <div key={d.name} className="card-surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold">{d.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{d.note}</p>
                </div>
                <Badge className={`shrink-0 ${statusStyle[d.status]}`}>{d.status}</Badge>
              </div>
            ))}
            <div className="card-surface grid place-items-center gap-3 border-dashed p-10 text-center">
              <Upload className="size-7 text-gold" strokeWidth={1.5} />
              <p className="text-sm font-semibold">ارفع مستنداً جديداً</p>
              <p className="text-xs text-muted-foreground">
                صيغ مدعومة: PDF, JPG, PNG — حتى 10 ميجابايت
              </p>
              <Button variant="outlineGold" size="sm">
                اختيار ملف
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="card-surface mt-6 overflow-x-auto p-2">
            <table className="w-full text-right text-sm">
              <thead className="text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">المرجع</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">النوع</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{p.id}</td>
                    <td className="p-3">{p.date}</td>
                    <td className="p-3">{p.kind}</td>
                    <td className="p-3 font-bold text-gold">{formatSAR(p.amount)}</td>
                    <td className="p-3">
                      <Badge className={statusStyle[p.state]}>{p.state}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          <TabsContent value="support" className="card-surface mt-6 p-6">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <LifeBuoy className="size-5 text-gold" /> تذكرة دعم فني
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <Label>عنوان المشكلة</Label>
                <Input className="mt-2" placeholder="اكتب عنواناً مختصراً" />
              </div>
              <div>
                <Label>تفاصيل المشكلة</Label>
                <Textarea className="mt-2" rows={5} placeholder="اشرح المشكلة بالتفصيل..." />
              </div>
              <Button variant="gold" onClick={() => toast.success("تم إرسال تذكرة الدعم")}>
                إرسال التذكرة
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}
