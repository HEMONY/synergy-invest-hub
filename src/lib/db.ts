import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

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
  redevelopment: "تمليك عقار جديد",
  // legacy value
  intact: "عقار يحتاج تشطيب",
};

export const conditionOptions = [
  { key: "damaged", label: "عقار متضرر", hint: "يحتاج تأهيل وترميم" },
  { key: "finishing", label: "عقار غير متضرر", hint: "يحتاج تشطيب" },
  { key: "newbuild", label: "بناء عقار جديد", hint: "تشييد وبناء عقار جديد" },
  { key: "redevelopment", label: "تمليك عقار جديد", hint: "ارغب في تملك عقار جديد" }
] as const;

export type ConditionOptionTexts = Record<string, { label: string; hint: string }>;

/** القيم الافتراضية لعناوين ووصف بطاقات "حالة العقار" — تُستخدم كـ placeholder ولو لم يوجد تخصيص. */
export const defaultConditionOptionTexts: ConditionOptionTexts = Object.fromEntries(
  conditionOptions.map((c) => [c.key, { label: c.label, hint: c.hint }]),
);

/** جلب نصوص بطاقات "حالة العقار" مع دمج أي تخصيص محفوظ من لوحة الإدارة فوق الافتراضي. */
export async function fetchConditionOptionTexts(): Promise<ConditionOptionTexts> {
  const raw = await fetchSetting("condition_options_texts", "");
  if (!raw) return defaultConditionOptionTexts;
  try {
    return { ...defaultConditionOptionTexts, ...(JSON.parse(raw) as ConditionOptionTexts) };
  } catch {
    return defaultConditionOptionTexts;
  }
}

export async function saveConditionOptionTexts(value: ConditionOptionTexts, userId: string) {
  await saveSetting("condition_options_texts", JSON.stringify(value), userId);
}

/** حذف كل التخصيصات والرجوع للنصوص الافتراضية. */
export const resetConditionOptionTexts = () => resetSetting("condition_options_texts");

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

/** نسبة الإنجاز الفعلية — تُقرأ من الحقل المُخزَّن مباشرة، بلا تقريب لمراحل ثابتة. */
export function effectiveProgress(progress: number, _stageIndex: number) {
  return Math.max(0, Math.min(100, Number(progress) || 0));
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

export async function updateMyRequest(id: string, patch: Partial<NewRequestInput>) {
  const { error } = await supabase.from("property_requests").update(patch).eq("id", id);
  if (error) throw error;
}

/** الجملة التعريفية الافتراضية المعروضة على الصفحة الرئيسية لو لم يحدّدها الأدمن. */
export const defaultSiteTagline =
  "لو عندك عقار عايز تأهيل وترميم أو عايز تشطيب أو ترغب في إمتلاك عقار جديد وما عندك كاش";

/** الفقرة التعريفية الافتراضية أسفل الجملة الرئيسية. */
export const defaultSiteSubtitle =
  "منصة وساطة عقارية تربط بين أصحاب العقارات التي تريد إعادة تأهيل وترميم، أو أصحاب العقارات التي تريد تشطيب، أو الذين يريدون بناء عقار جديد أو الراغبين في إمتلاك عقار جديد، بأفضل شركات القطاع العقاري بالأقساط المريحة — بإشراف كامل من إدارة المنصة.";

async function fetchSetting(key: string, fallback: string) {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data?.value || fallback;
}

async function saveSetting(key: string, value: string, userId: string) {
  const { error } = await supabase
    .from("platform_settings")
    .upsert({ key, value, updated_by: userId, updated_at: new Date().toISOString() });
  if (error) throw error;
}

async function resetSetting(key: string) {
  const { error } = await supabase.from("platform_settings").delete().eq("key", key);
  if (error) throw error;
}

export const fetchSiteTagline = () => fetchSetting("site_tagline", defaultSiteTagline);
export const saveSiteTagline = (value: string, userId: string) =>
  saveSetting("site_tagline", value, userId);
/** حذف التخصيص والرجوع للجملة الافتراضية. */
export const resetSiteTagline = () => resetSetting("site_tagline");

export const fetchSiteSubtitle = () => fetchSetting("site_subtitle", defaultSiteSubtitle);
export const saveSiteSubtitle = (value: string, userId: string) =>
  saveSetting("site_subtitle", value, userId);
/** حذف التخصيص والرجوع للفقرة الافتراضية. */
export const resetSiteSubtitle = () => resetSetting("site_subtitle");

/** فقرة الوصف الافتراضية في الفوتر (تحت الشعار). */
export const defaultFooterText =
  "منصة وساطة عقارية تربط أصحاب العقارات التي تريد تأهيل وترميم أو تشطيب أو بناء أو الراغبين في إمتلاك عقار جديد مع أفضل شركات القطاع العقاري ، بإشراف كامل من إدارة المنصة";

export const fetchFooterText = () => fetchSetting("footer_text", defaultFooterText);
export const saveFooterText = (value: string, userId: string) =>
  saveSetting("footer_text", value, userId);
/** حذف التخصيص والرجوع لفقرة الفوتر الافتراضية. */
export const resetFooterText = () => resetSetting("footer_text");

/** عنوان وفقرة قسم "عن منصة سينرجي" في الصفحة الرئيسية. */
export const defaultAboutTitle = "عن منصة سينرجي";
export const defaultAboutText =
  "لو عندك عقار عايز تأهيل وترميم أو عايز تشطيب أو عايز تبني أو ترغب في امتلاك عقار جديد، في سينرجي نحن نربط بين أصحاب العقارات التي تريد إعادة تأهيل، أو العقارات التي تريد تشطيب، أو الراغبين في إمتلاك عقار جديد، مع أفضل الشركات التي تعمل في مجال القطاع العقاري بنظام الدفع بالأقساط المريحة.";

export const fetchAboutTitle = () => fetchSetting("about_title", defaultAboutTitle);
export const saveAboutTitle = (value: string, userId: string) =>
  saveSetting("about_title", value, userId);
export const resetAboutTitle = () => resetSetting("about_title");

export const fetchAboutText = () => fetchSetting("about_text", defaultAboutText);
export const saveAboutText = (value: string, userId: string) =>
  saveSetting("about_text", value, userId);
/** حذف التخصيص والرجوع لنص القسم الافتراضي. */
export const resetAboutText = () => resetSetting("about_text");

/** عنوان وفقرة عنوان صفحة "إضافة عقار". */
export const defaultNewRequestTitle = "إضافة عقار";
export const defaultNewRequestSubtitle =
  "أرفع عقار بحاجة لإعادة تأهيل، أو عقار يحتاج تشطيب، أو بناء عقار جديد.";

export const fetchNewRequestTitle = () => fetchSetting("new_request_title", defaultNewRequestTitle);
export const saveNewRequestTitle = (value: string, userId: string) =>
  saveSetting("new_request_title", value, userId);
export const resetNewRequestTitle = () => resetSetting("new_request_title");

export const fetchNewRequestSubtitle = () =>
  fetchSetting("new_request_subtitle", defaultNewRequestSubtitle);
export const saveNewRequestSubtitle = (value: string, userId: string) =>
  saveSetting("new_request_subtitle", value, userId);
export const resetNewRequestSubtitle = () => resetSetting("new_request_subtitle");

/** عنوان وفقرة عنوان صفحة "المشاريع العقارية". */
export const defaultOpportunitiesTitle = "المشاريع العقارية";
export const defaultOpportunitiesSubtitle =
  "مشاريع معتمدة من الإدارة — إعادة تأهيل وترميم، تشطيب، أو بناء، او تمليك جديد — مع العائد المتوقع لكل مشروع.";

export const fetchOpportunitiesTitle = () =>
  fetchSetting("opportunities_title", defaultOpportunitiesTitle);
export const saveOpportunitiesTitle = (value: string, userId: string) =>
  saveSetting("opportunities_title", value, userId);
export const resetOpportunitiesTitle = () => resetSetting("opportunities_title");

export const fetchOpportunitiesSubtitle = () =>
  fetchSetting("opportunities_subtitle", defaultOpportunitiesSubtitle);
export const saveOpportunitiesSubtitle = (value: string, userId: string) =>
  saveSetting("opportunities_subtitle", value, userId);
export const resetOpportunitiesSubtitle = () => resetSetting("opportunities_subtitle");


export async function cancelMyRequest(id: string) {
  const { error } = await supabase.from("property_requests").delete().eq("id", id);
  if (error) throw error;
}

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
  patch: Partial<{ status: string; stage_index: number; progress: number; funding_needed: number }>,
) {
  const { error } = await supabase.from("property_requests").update(patch).eq("id", id);
  if (error) throw error;
}

export async function updateProfileVerification(id: string, verification_status: string) {
  const { error } = await supabase.from("profiles").update({ verification_status }).eq("id", id);
  if (error) throw error;
}

export async function updateInterest(id: string, status: string) {
  const patch: TablesUpdate<"funding_interests"> = { status };
  if (status === "commission_paid") patch.commission_paid_at = new Date().toISOString();
  const { error } = await supabase.from("funding_interests").update(patch).eq("id", id);
  if (error) throw error;
}

/* ---------- بيانات التواصل الخاصة بالطلب ---------- */

export type RequestPrivateDetails = Tables<"request_private_details">;

export async function saveRequestPrivateDetails(input: {
  request_id: string;
  owner_phone: string;
  location_details: string;
  property_details: string;
}) {
  const { error } = await supabase.from("request_private_details").upsert(input);
  if (error) throw error;
}

export async function fetchRequestPrivateDetails(requestId: string) {
  const { data, error } = await supabase
    .from("request_private_details")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllRequestPrivateDetails() {
  const { data, error } = await supabase.from("request_private_details").select("*");
  if (error) throw error;
  return data ?? [];
}

/* ---------- عروض الشركات العقارية ---------- */

/** مراحل الربط بالترتيب من تقديم العرض حتى بدء العمل. */
export const interestStatusLabels: Record<string, string> = {
  pending: "عرض جديد — بانتظار مراجعة سينرجي",
  under_review: "قيد مراجعة سينرجي",
  presented: "معروض على صاحب المشروع",
  owner_approved: "وافق صاحب المشروع",
  owner_rejected: "رفضه صاحب المشروع",
  approved: "تم اعتماد الربط — بانتظار سداد العمولة",
  commission_paid: "تم سداد العمولة — بيانات التواصل متاحة",
  rejected: "مرفوض",
};

export type CompanyOfferInput = {
  request_id: string;
  investor_id: string;
  amount: number;
  company_name: string;
  company_phone: string;
  company_location: string;
  scope_of_work: string;
  proposed_works: string;
  payment_method: string;
  warranty: string;
  company_notes: string;
};

export async function submitCompanyOffer(input: CompanyOfferInput) {
  const { error } = await supabase
    .from("funding_interests")
    .insert({ ...input, message: input.scope_of_work, status: "pending" });
  if (error) throw error;
}

/** العروض المقدمة على مشاريع صاحب الحساب (يراها بعد أن تعرضها الإدارة عليه). */
export async function fetchOffersForMyRequests(ownerId: string) {
  const { data: requests, error: reqErr } = await supabase
    .from("property_requests")
    .select("id, code, title, city, district")
    .eq("owner_id", ownerId);
  if (reqErr) throw reqErr;
  const ids = (requests ?? []).map((r) => r.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("funding_interests")
    .select("*")
    .in("request_id", ids)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((i) => ({
    ...i,
    request: (requests ?? []).find((r) => r.id === i.request_id) ?? null,
  }));
}

export async function setCommissionAmount(id: string, amount: number) {
  const { error } = await supabase
    .from("funding_interests")
    .update({ commission_amount: amount })
    .eq("id", id);
  if (error) throw error;
}



export async function notifyUser(userId: string, kind: string, title: string, body: string) {
  await supabase.from("notifications").insert({ user_id: userId, kind, title, body });
}

/* ---------- إدارة الصلاحيات والمستخدمين (للمدير) ---------- */

export type AppRole = "admin" | "supervisor" | "owner" | "investor";

export async function fetchAllUserRoles() {
  const { data, error } = await supabase.from("user_roles").select("user_id, role");
  if (error) throw error;
  return data ?? [];
}

export async function grantRole(userId: string, role: AppRole) {
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function revokeRole(userId: string, role: AppRole) {
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role", role);
  if (error) throw error;
}

export const roleLabels: Record<string, string> = {
  admin: "مدير",
  supervisor: "مشرف",
  owner: "صاحب عقار",
  investor: "شركة عقارية",
};
