import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PropertyRequest = Tables<"property_requests">;
export type FundingInterest = Tables<"funding_interests">;
export type DbNotification = Tables<"notifications">;

export const propertyTypes = ["سكني", "تجاري", "صناعي", "إداري", "أرض"] as const;

export const cities = ["الخرطوم", "أمدرمان", "بحري"] as const;

export const projectStages = [
  "تم الرفع",
  "قيد المراجعة",
  "موافقة",
  "بحث عن شركة عقارية",
  "تم الربط",
  "قيد التنفيذ",
  "مكتمل",
] as const;

export const statusLabels: Record<string, string> = {
  review: "قيد المراجعة",
  published: "منشورة",
  matched: "تم الربط",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  rejected: "مرفوض",
};

export const conditionLabels: Record<string, string> = {
  damaged: "عقار يحتاج تأهيل وترميم",
  finishing: "عقار يحتاج تشطيب",
  newbuild: "بناء عقار جديد",
  // legacy value
  intact: "عقار يحتاج تشطيب",
};

export const conditionOptions = [
  { key: "damaged", label: "عقار متضرر", hint: "يحتاج تأهيل وترميم" },
  { key: "finishing", label: "عقار غير متضرر", hint: "يحتاج تشطيب" },
  { key: "newbuild", label: "بناء عقار جديد", hint: "تشييد وبناء عقار جديد" },
  { key: "redevelopment", label: "تمليك عقار جديد", hint: "ارغب في تملك عقار جديد" }
] as const;

export type ConditionKey = (typeof conditionOptions)[number]["key"];

export const costLabel = (condition: string) =>
  condition === "damaged"
    ? "تكلفة إعادة التأهيل"
    : condition === "newbuild"
      ? "تكلفة البناء"
      : "تكلفة التشطيب";

export const notificationKinds: Record<string, string> = {
  request: "طلب",
  project: "مشروع",
  verification: "توثيق",
  finance: "مالي",
};

export const docTypes = [
  { key: "property_photo", label: "صورة العقار" },
  { key: "national_id", label: "بطاقة الهوية الوطنية" },
  { key: "ownership", label: "وثيقة ملكية العقار" },
  { key: "ownership_proof", label: "إثبات ملكية العقار" },
  { key: "other", label: "مستند آخر" },
] as const;

export const docTypeLabels: Record<string, string> = Object.fromEntries(
  docTypes.map((d) => [d.key, d.label]),
);

/** مدة التنفيذ بصيغة عربية سليمة: «2 أشهر» / «15 يوم». */
export function formatDuration(months: number, days = 0) {
  const parts: string[] = [];
  const m = Number(months) || 0;
  const d = Number(days) || 0;
  if (m > 0) parts.push(`${m} ${m === 1 ? "شهر" : m === 2 ? "شهرين" : m <= 10 ? "أشهر" : "شهر"}`);
  if (d > 0) parts.push(`${d} ${d === 1 ? "يوم" : d === 2 ? "يومين" : "يوم"}`);
  return parts.length ? parts.join(" و ") : "غير محددة";
}

/** نسبة إنجاز محسوبة من مرحلة المشروع حتى لو لم تُحدَّث النسبة يدوياً. */
export function effectiveProgress(progress: number, stageIndex: number) {
  const fromStage = Math.round(
    (Math.min(Math.max(stageIndex, 0), projectStages.length - 1) / (projectStages.length - 1)) * 100,
  );
  return Math.max(Number(progress) || 0, fromStage);
}

/** آلية تحصيل عمولة المنصة. */
export const commissionNote =
  "عمولة المنصة تُحصَّل من الشركة العقارية بنظام الأقساط الشهرية حسب نسبة الإنجاز.";

export const formatSAR = (n: number) => `${Number(n || 0).toLocaleString("en-US")} ج.س`;

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "الآن";
  if (m < 60) return `قبل ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `قبل ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `قبل ${d} يوم`;
}

/** Public marketplace listing (published or matched requests). */
export async function fetchOpportunities() {
  const { data, error } = await supabase
    .from("property_requests")
    .select("*")
    .in("status", ["published", "matched"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyRequests(userId: string) {
  const { data, error } = await supabase
    .from("property_requests")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyInterests(userId: string) {
  const { data, error } = await supabase
    .from("funding_interests")
    .select("*, property_requests(*)")
    .eq("investor_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchNotifications(userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markAllRead(userId: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  if (error) throw error;
}

export type NewRequestInput = {
  owner_id: string;
  title: string;
  condition: ConditionKey;
  property_type: string;
  city: string;
  district: string;
  area_sqm: number;
  estimated_value: number;
  damage_description: string;
  rehab_cost: number;
  duration_months: number;
  duration_days: number;
  funding_needed: number;
  expected_return: number;
  return_notes: string;
};

export async function createRequest(input: NewRequestInput) {
  const { data, error } = await supabase
    .from("property_requests")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createInterest(input: {
  request_id: string;
  investor_id: string;
  amount: number;
  message: string;
}) {
  const { error } = await supabase.from("funding_interests").insert(input);
  if (error) throw error;
}

/* ---------- Profile ---------- */

export async function updateMyProfile(
  id: string,
  patch: { full_name?: string; phone?: string },
) {
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}

/* ---------- Documents ---------- */

export type UserDocument = Tables<"documents">;

export async function fetchMyDocuments(userId: string) {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllDocuments() {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function uploadDocument(userId: string, docType: string, file: File) {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from("documents").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (upErr) throw upErr;

  const { error } = await supabase.from("documents").insert({
    user_id: userId,
    doc_type: docType,
    name: file.name,
    file_path: path,
    mime_type: file.type || "",
    size_bytes: file.size,
  });
  if (error) throw error;
}

export async function documentUrl(path: string) {
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteDocument(doc: UserDocument) {
  await supabase.storage.from("documents").remove([doc.file_path]);
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw error;
}

export async function reviewDocument(id: string, status: string, review_note = "") {
  const { error } = await supabase.from("documents").update({ status, review_note }).eq("id", id);
  if (error) throw error;
}

/* ---------- Activity log ---------- */

export type ActivityLog = Tables<"activity_logs">;

export async function logActivity(input: {
  actor_id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  description?: string;
}) {
  await supabase.from("activity_logs").insert({
    actor_id: input.actor_id,
    actor_name: input.actor_name,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? "",
    description: input.description ?? "",
  });
}

export async function fetchActivityLogs() {
  const { data, error } = await supabase
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

export const activityActions: Record<string, string> = {
  publish_request: "اعتماد ونشر طلب",
  hide_request: "إخفاء طلب",
  reject_request: "رفض طلب",
  verify_user: "توثيق مستخدم",
  reject_user: "رفض توثيق مستخدم",
  approve_match: "اعتماد ربط",
  reject_match: "رفض ربط",
  update_progress: "تحديث نسبة الإنجاز",
  complete_project: "إنهاء مشروع",
  approve_document: "قبول مستند",
  reject_document: "رفض مستند",
};

/* ---------- Admin / supervisor ---------- */

export async function hasRole(userId: string, role: "admin" | "supervisor") {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: role });
  if (error) return false;
  return Boolean(data);
}

export async function isStaff(userId: string) {
  return (await hasRole(userId, "admin")) || (await hasRole(userId, "supervisor"));
}

export async function fetchAllRequests() {
  const { data, error } = await supabase
    .from("property_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllInterests() {
  const { data, error } = await supabase
    .from("funding_interests")
    .select("*, property_requests(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateRequest(
  id: string,
  patch: Partial<{ status: string; stage_index: number; progress: number }>,
) {
  const { error } = await supabase.from("property_requests").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateProfileVerification(id: string, verification_status: string) {
  const { error } = await supabase.from("profiles").update({ verification_status }).eq("id", id);
  if (error) throw error;
}

export async function updateInterest(id: string, status: string) {
  const { error } = await supabase.from("funding_interests").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function notifyUser(userId: string, kind: string, title: string, body: string) {
  await supabase.from("notifications").insert({ user_id: userId, kind, title, body });
}
