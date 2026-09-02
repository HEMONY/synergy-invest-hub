import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "تعيين كلمة مرور جديدة | Synergy" },
      {
        name: "description",
        content: "أدخل كلمة مرور جديدة لحسابك في منصة سينرجي بعد طلب استعادة كلمة المرور.",
      },
      { property: "og:title", content: "تعيين كلمة مرور جديدة | Synergy" },
      { property: "og:description", content: "استعادة الدخول إلى حسابك في منصة سينرجي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (password.length < 8) {
      toast.error("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    if (password !== confirm) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("تعذر تحديث كلمة المرور", { description: error.message });
      return;
    }
    toast.success("تم تحديث كلمة المرور بنجاح");
    navigate({ to: "/requests" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Logo size={48} />
        <h1 className="mt-8 text-2xl font-extrabold">تعيين كلمة مرور جديدة</h1>
        {!ready && (
          <p className="mt-2 text-sm text-muted-foreground">
            افتح هذه الصفحة من رابط الاستعادة المرسل إلى بريدك الإلكتروني، ثم أدخل كلمة المرور
            الجديدة.
          </p>
        )}

        <div className="mt-6 space-y-5">
          <div>
            <Label>كلمة المرور الجديدة</Label>
            <Input
              className="mt-2"
              type="password"
              dir="ltr"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>تأكيد كلمة المرور</Label>
            <Input
              className="mt-2"
              type="password"
              dir="ltr"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button variant="gold" size="lg" className="w-full" disabled={loading} onClick={submit}>
            حفظ كلمة المرور
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            <Link to="/auth" className="text-gold">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
