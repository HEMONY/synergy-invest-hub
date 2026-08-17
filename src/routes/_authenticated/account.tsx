import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Bell, Download, KeyRound, LifeBuoy, LogOut, Moon, Sun, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteDocument,
  docTypeLabels,
  docTypes,
  documentUrl,
  fetchMyDocuments,
  fetchMyInterests,
  formatSAR,
  timeAgo,
  updateMyProfile,
  uploadDocument,
  type UserDocument,
} from "@/lib/db";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "حسابي | Synergy" },
      {
        name: "description",
        content: "بياناتك الشخصية، حالة توثيق مستنداتك، سجل عملياتك، والدعم الفني.",
      },
      { property: "og:title", content: "حسابي | Synergy" },
      { property: "og:description", content: "إدارة حسابك ومستنداتك في منصة Synergy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AccountPage,
});

const docStatusLabels: Record<string, string> = {
  approved: "موثّق",
  pending: "قيد المراجعة",
  rejected: "مرفوض",
};

const statusStyle: Record<string, string> = {
  approved: "bg-success/15 text-success",
  pending: "bg-warning/20 text-warning",
  rejected: "bg-destructive/15 text-destructive",
};

function AccountPage() {
  const { user, profile, signOut } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [support, setSupport] = useState({ title: "", body: "" });

  const nameValue = fullName ?? profile?.full_name ?? "";
  const phoneValue = phone ?? profile?.phone ?? "";
  const accountLabel =
    profile?.account_type === "investor" ? "شركات القطاع العقاري" : "صاحب عقار";

  const verified = profile?.verification_status === "approved";

  const saveProfile = async () => {
    if (!userId) return;
    setSavingProfile(true);
    try {
      await updateMyProfile(userId, { full_name: nameValue.trim(), phone: phoneValue.trim() });
      toast.success("تم حفظ بياناتك بنجاح");
    } catch (e) {
      toast.error("تعذر الحفظ", { description: (e as Error).message });
    } finally {
      setSavingProfile(false);
    }
  };

  const { data: interests = [] } = useQuery({
    queryKey: ["my-interests", userId],
    queryFn: () => fetchMyInterests(userId),
    enabled: !!userId,
  });

  return (
    <SiteLayout>
      <PageHeader back title="حسابي" subtitle="بياناتي، مستنداتي، عملياتي والدعم الفني." />

      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
        <div className="card-surface mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold-gradient text-xl font-extrabold text-navy">
              {(nameValue || user?.email || "؟").trim().charAt(0)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{nameValue || "مستخدم جديد"}</h2>
              <p className="truncate text-xs text-muted-foreground">
                {accountLabel}
                {user?.email ? ` · ${user.email}` : ""}
              </p>
            </div>
          </div>
          <Badge
            className={`shrink-0 gap-1 ${
              verified ? "bg-success/15 text-success" : "bg-warning/20 text-warning"
            }`}
          >
            <BadgeCheck className="size-4" />
            {verified ? "حساب موثّق" : "بانتظار التوثيق"}
          </Badge>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profile">بياناتي</TabsTrigger>
            <TabsTrigger value="docs">مستنداتي</TabsTrigger>
            <TabsTrigger value="payments">عملياتي</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            <TabsTrigger value="support">الدعم</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="card-surface mt-6 p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>الاسم الكامل</Label>
                <Input
                  className="mt-2"
                  value={nameValue}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="اكتب اسمك الكامل"
                />
              </div>
              <div>
                <Label>رقم الجوال</Label>
                <Input
                  className="mt-2"
                  dir="ltr"
                  value={phoneValue}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                />
              </div>
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input className="mt-2" dir="ltr" value={user?.email ?? ""} readOnly />
              </div>
              <div>
                <Label>نوع الحساب</Label>
                <Input className="mt-2" value={accountLabel} readOnly />
              </div>
            </div>
            <Button variant="gold" className="mt-6" disabled={savingProfile} onClick={saveProfile}>
              {savingProfile ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </Button>
          </TabsContent>

          <TabsContent value="docs" className="mt-6 space-y-3">
            <DocumentsPanel userId={userId} />
          </TabsContent>

          <TabsContent value="payments" className="card-surface mt-6 overflow-x-auto p-2">
            {interests.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                لا توجد عمليات مسجّلة على حسابك بعد.
              </p>
            ) : (
              <table className="w-full text-right text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3">المشروع</th>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {interests.map((i) => (
                    <tr key={i.id} className="border-t border-border">
                      <td className="p-3 font-semibold">
                        {i.property_requests?.title || i.property_requests?.code}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {new Date(i.created_at).toLocaleDateString("en-GB")}
                      </td>
                      <td className="p-3 font-bold text-gold">{formatSAR(Number(i.amount))}</td>
                      <td className="p-3">
                        <Badge className={statusStyle[i.status] ?? "bg-muted"}>
                          {docStatusLabels[i.status] ?? "قيد المراجعة"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <SettingsPanel onSignOut={signOut} />
          </TabsContent>

          <TabsContent value="support" className="card-surface mt-6 p-6">
            <h3 className="flex items-center gap-2 text-base font-bold">
              <LifeBuoy className="size-5 text-gold" /> تذكرة دعم فني
            </h3>
            <div className="mt-4 space-y-4">
              <div>
                <Label>عنوان المشكلة</Label>
                <Input
                  className="mt-2"
                  placeholder="اكتب عنواناً مختصراً"
                  value={support.title}
                  onChange={(e) => setSupport((s) => ({ ...s, title: e.target.value }))}
                />
              </div>
              <div>
                <Label>تفاصيل المشكلة</Label>
                <Textarea
                  className="mt-2"
                  rows={5}
                  placeholder="اشرح المشكلة بالتفصيل..."
                  value={support.body}
                  onChange={(e) => setSupport((s) => ({ ...s, body: e.target.value }))}
                />
              </div>
              <Button
                variant="gold"
                onClick={async () => {
                  if (!support.title.trim()) {
                    toast.error("اكتب عنوان المشكلة");
                    return;
                  }
                  const { notifyUser } = await import("@/lib/db");
                  await notifyUser(
                    userId,
                    "verification",
                    "تم استلام تذكرة الدعم",
                    `تذكرتك «${support.title.trim()}» وصلت لفريق الدعم وسيتم التواصل معك.`,
                  );
                  queryClient.invalidateQueries({ queryKey: ["notifications"] });
                  setSupport({ title: "", body: "" });
                  toast.success("تم إرسال تذكرة الدعم");
                }}
              >
                إرسال التذكرة
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  );
}

function DocumentsPanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<string>("national_id");
  const [uploading, setUploading] = useState(false);

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["my-documents", userId],
    queryFn: () => fetchMyDocuments(userId),
    enabled: !!userId,
  });

  const remove = useMutation({
    mutationFn: (doc: UserDocument) => deleteDocument(doc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-documents", userId] });
      toast.success("تم حذف المستند");
    },
    onError: (e) => toast.error("تعذر الحذف", { description: (e as Error).message }),
  });

  const onFile = async (file: File | undefined) => {
    if (!file || !userId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("حجم الملف كبير", { description: "الحد الأقصى 10 ميجابايت." });
      return;
    }
    setUploading(true);
    try {
      await uploadDocument(userId, docType, file);
      await queryClient.invalidateQueries({ queryKey: ["my-documents", userId] });
      toast.success("تم رفع المستند", { description: "سيراجعه مشرف التوثيق قريباً." });
    } catch (e) {
      toast.error("تعذر رفع المستند", { description: (e as Error).message });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const open = async (doc: UserDocument) => {
    try {
      const url = await documentUrl(doc.file_path);
      window.open(url, "_blank", "noopener");
    } catch (e) {
      toast.error("تعذر فتح الملف", { description: (e as Error).message });
    }
  };

  return (
    <>
      {isLoading && (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">
          جارٍ التحميل...
        </div>
      )}

      {!isLoading && docs.length === 0 && (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">
          لم ترفع أي مستند بعد — ابدأ برفع بطاقة الهوية الوطنية.
        </div>
      )}

      {docs.map((d) => (
        <div
          key={d.id}
          className="card-surface grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5"
        >
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold">
              {docTypeLabels[d.doc_type] ?? d.doc_type}
            </h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {d.name} · {timeAgo(d.created_at)}
              {d.review_note ? ` · ${d.review_note}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className={statusStyle[d.status] ?? "bg-muted"}>
              {docStatusLabels[d.status] ?? d.status}
            </Badge>
            <Button size="icon" variant="ghost" aria-label="عرض المستند" onClick={() => open(d)}>
              <Download className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="حذف المستند"
              onClick={() => remove.mutate(d)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}

      <div className="card-surface grid place-items-center gap-3 border-dashed p-10 text-center">
        <Upload className="size-7 text-gold" strokeWidth={1.5} />
        <p className="text-sm font-semibold">ارفع مستنداً جديداً</p>
        <div className="w-full max-w-xs">
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {docTypes.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          صيغ مدعومة: PDF, JPG, PNG — حتى 10 ميجابايت
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Button
          variant="outlineGold"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? "جارٍ الرفع..." : "اختيار ملف"}
        </Button>
      </div>
    </>
  );
}

function SettingsPanel({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const { theme, toggle } = useTheme();
  const [prefs, setPrefs] = useState({ email: true, projects: true, marketing: false });
  const [password, setPassword] = useState({ next: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const changePassword = async () => {
    if (password.next.length < 8) {
      toast.error("كلمة مرور قصيرة", { description: "الحد الأدنى 8 أحرف." });
      return;
    }
    if (password.next !== password.confirm) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: password.next });
    setSaving(false);
    if (error) toast.error("تعذر تغيير كلمة المرور", { description: error.message });
    else {
      setPassword({ next: "", confirm: "" });
      toast.success("تم تغيير كلمة المرور");
    }
  };

  return (
    <div className="space-y-6">
      <section className="card-surface p-6">
        <h3 className="flex items-center gap-2 text-base font-bold">
          {theme === "dark" ? <Moon className="size-5 text-gold" /> : <Sun className="size-5 text-gold" />}
          مظهر المنصة
        </h3>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">الوضع الداكن</p>
            <p className="text-xs text-muted-foreground">اختر المظهر المريح لعينك.</p>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={toggle} />
        </div>
      </section>

      <section className="card-surface p-6">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <Bell className="size-5 text-gold" /> الإشعارات
        </h3>
        <div className="mt-4 space-y-4">
          {[
            { key: "email" as const, label: "إشعارات البريد الإلكتروني", hint: "تحديثات الحساب والتوثيق" },
            { key: "projects" as const, label: "تحديثات المشاريع", hint: "نسبة الإنجاز وتغير المراحل" },
            { key: "marketing" as const, label: "العروض والأخبار", hint: "مستجدات المنصة" },
          ].map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.hint}</p>
              </div>
              <Switch
                checked={prefs[row.key]}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, [row.key]: v }))}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface p-6">
        <h3 className="flex items-center gap-2 text-base font-bold">
          <KeyRound className="size-5 text-gold" /> الأمان
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label>كلمة المرور الجديدة</Label>
            <Input
              className="mt-2"
              type="password"
              dir="ltr"
              value={password.next}
              onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
            />
          </div>
          <div>
            <Label>تأكيد كلمة المرور</Label>
            <Input
              className="mt-2"
              type="password"
              dir="ltr"
              value={password.confirm}
              onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
            />
          </div>
        </div>
        <Button variant="gold" className="mt-4" disabled={saving} onClick={changePassword}>
          {saving ? "جارٍ الحفظ..." : "تحديث كلمة المرور"}
        </Button>
        <Separator className="my-6" />
        <Button variant="outline" className="gap-2" onClick={() => void onSignOut()}>
          <LogOut className="size-4" /> تسجيل الخروج
        </Button>
      </section>
    </div>
  );
}
