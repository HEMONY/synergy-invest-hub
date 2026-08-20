import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Building2, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

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

const signupSchema = z.object({
  fullName: z.string().trim().min(3, "الاسم قصير جداً").max(100, "الاسم طويل جداً"),
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").max(255),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل").max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email("البريد الإلكتروني غير صحيح").max(255),
  password: z.string().min(1, "أدخل كلمة المرور").max(72),
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"owner" | "investor">("owner");
  const [loading, setLoading] = useState(false);
  const [signup, setSignup] = useState({ fullName: "", email: "", password: "" });
  const [login, setLogin] = useState({ email: "", password: "" });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/requests", replace: true });
    });
  }, [navigate]);

  const handleSignup = async () => {
    const parsed = signupSchema.safeParse(signup);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "تحقق من البيانات المدخلة");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: parsed.data.fullName, account_type: role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "هذا البريد مسجّل مسبقاً، سجّل الدخول"
          : error.message,
      );
      return;
    }
    toast.success("تم إنشاء الحساب — تحقق من بريدك لتأكيد التسجيل");
  };

  const handleLogin = async () => {
    const parsed = loginSchema.safeParse(login);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "تحقق من البيانات المدخلة");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast.error("بيانات الدخول غير صحيحة");
      return;
    }
    toast.success("تم تسجيل الدخول");
    navigate({ to: "/requests" });
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/requests` },
    });
    if (error) {
      setLoading(false);
      toast.error("تعذّر تسجيل الدخول عبر Google");
      return;
    }
    // On success, Supabase redirects the browser to Google, then back to
    // redirectTo above — nothing else to do here.
  };

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
                      { key: "investor", label: "شركة القطاع العقاري", icon: TrendingUp },
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
                <Input
                  className="mt-2"
                  placeholder="الاسم كما في الهوية"
                  value={signup.fullName}
                  onChange={(e) => setSignup((s) => ({ ...s, fullName: e.target.value }))}
                />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input
                  className="mt-2"
                  type="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  value={signup.email}
                  onChange={(e) => setSignup((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>كلمة المرور</Label>
                <Input
                  className="mt-2"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={signup.password}
                  onChange={(e) => setSignup((s) => ({ ...s, password: e.target.value }))}
                />
              </div>

              <p className="rounded-2xl border border-dashed border-border p-4 text-xs leading-6 text-muted-foreground">
                بعد إنشاء الحساب يمكنك رفع مستندات التوثيق من صفحة «حسابي»
                {role === "owner" ? " (هوية رسمية + وثيقة ملكية)" : " (هوية رسمية + إثبات مالي)"}،
                وتقوم الإدارة بمراجعتها لتفعيل التوثيق.
              </p>

              <Button
                variant="gold"
                className="w-full"
                size="lg"
                disabled={loading}
                onClick={handleSignup}
              >
                إنشاء الحساب
              </Button>

              <Button
                variant="outlineGold"
                className="w-full gap-2"
                size="lg"
                disabled={loading}
                onClick={handleGoogle}
              >
                <GoogleIcon />
                المتابعة عبر Google
              </Button>
            </TabsContent>

            <TabsContent value="login" className="mt-6 space-y-5">
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input
                  className="mt-2"
                  type="email"
                  dir="ltr"
                  placeholder="name@example.com"
                  value={login.email}
                  onChange={(e) => setLogin((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div>
                <Label>كلمة المرور</Label>
                <Input
                  className="mt-2"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={login.password}
                  onChange={(e) => setLogin((s) => ({ ...s, password: e.target.value }))}
                />
              </div>
              <Button
                variant="gold"
                size="lg"
                className="w-full"
                disabled={loading}
                onClick={handleLogin}
              >
                تسجيل الدخول
              </Button>
              <Button
                variant="outlineGold"
                className="w-full gap-2"
                size="lg"
                disabled={loading}
                onClick={handleGoogle}
              >
                <GoogleIcon />
                المتابعة عبر Google
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
