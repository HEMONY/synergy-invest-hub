import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, TrendingUp, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب | Synergy" },
      {
        name: "description",
        content: "سجّل كصاحب عقار أو مستثمر وارفع مستندات التوثيق للحصول على حساب موثّق.",
      },
      { property: "og:title", content: "إنشاء حساب | Synergy" },
      { property: "og:description", content: "انضم إلى منصة Synergy للوساطة الاستثمارية العقارية." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [role, setRole] = useState<"owner" | "investor">("owner");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy-gradient p-12 lg:flex">
        <Logo size={56} />
        <div>
          <h2 className="text-3xl leading-relaxed font-extrabold text-white">
            من عقار متضرر
            <br />
            <span className="text-gold-gradient">إلى فرصة استثمارية</span>
          </h2>
          <p className="mt-4 max-w-md text-sm leading-8 text-white/70">
            انضم إلى شبكة موثوقة من أصحاب العقارات والمستثمرين، بإشراف كامل من إدارة المنصة على كل
            مرحلة من مراحل المشروع.
          </p>
        </div>
        <p className="text-xs text-white/40">© 2026 Synergy</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo size={48} />
          </div>

          <Tabs defaultValue="signup">
            <TabsList className="w-full">
              <TabsTrigger value="signup" className="flex-1">
                إنشاء حساب
              </TabsTrigger>
              <TabsTrigger value="login" className="flex-1">
                تسجيل الدخول
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="mt-6 space-y-5">
              <div>
                <Label className="text-xs">نوع الحساب</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {(
                    [
                      { key: "owner", label: "صاحب عقار", icon: Building2 },
                      { key: "investor", label: "مستثمر / ممول", icon: TrendingUp },
                    ] as const
                  ).map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key)}
                      className={`rounded-2xl border p-4 text-center transition-all ${
                        role === r.key
                          ? "border-gold bg-gold/10 text-gold shadow-gold"
                          : "border-border text-muted-foreground hover:border-gold/40"
                      }`}
                    >
                      <r.icon className="mx-auto size-6" strokeWidth={1.5} />
                      <span className="mt-2 block text-sm font-bold">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label>الاسم الكامل</Label>
                <Input className="mt-2" placeholder="الاسم كما في الهوية" />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input className="mt-2" type="email" dir="ltr" placeholder="name@example.com" />
              </div>
              <div>
                <Label>كلمة المرور</Label>
                <Input className="mt-2" type="password" dir="ltr" placeholder="••••••••" />
              </div>

              <div className="rounded-2xl border border-dashed border-border p-5 text-center">
                <Upload className="mx-auto size-6 text-gold" strokeWidth={1.5} />
                <p className="mt-2 text-sm font-semibold">
                  {role === "owner" ? "هوية رسمية + وثيقة ملكية العقار" : "هوية رسمية + إثبات مالي"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  ترفع المستندات لمراجعة الإدارة قبل تفعيل التوثيق
                </p>
                <Button variant="outlineGold" size="sm" className="mt-3">
                  رفع المستندات
                </Button>
              </div>

              <Button
                variant="gold"
                className="w-full"
                size="lg"
                onClick={() => toast.success("تم إنشاء الحساب — بانتظار مراجعة الإدارة")}
              >
                إنشاء الحساب
              </Button>
            </TabsContent>

            <TabsContent value="login" className="mt-6 space-y-5">
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input className="mt-2" type="email" dir="ltr" placeholder="name@example.com" />
              </div>
              <div>
                <Label>كلمة المرور</Label>
                <Input className="mt-2" type="password" dir="ltr" placeholder="••••••••" />
              </div>
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                onClick={() => toast.info("سيتم تفعيل تسجيل الدخول عند ربط قاعدة البيانات")}
              >
                تسجيل الدخول
              </Button>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            <Link to="/" className="text-gold">
              العودة للصفحة الرئيسية
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
