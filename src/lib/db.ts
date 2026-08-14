import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type PropertyRequest = Tables<"property_requests">;
export type FundingInterest = Tables<"funding_interests">;
export type DbNotification = Tables<"notifications">;

export const propertyTypes = ["سكني", "تجاري", "أرض", "مبنى إداري"] as const;

export const projectStages = [
  "تم الرفع",
  "قيد المراجعة",
  "موافقة",
  "بحث ممول",
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
  damaged: "عقار متضرر",
  intact: "عقار غير متضرر",
};

export const notificationKinds: Record<string, string> = {
  request: "طلب",
  project: "مشروع",
  verification: "توثيق",
  finance: "مالي",
};

export const formatSAR = (n: number) => `${Number(n || 0).toLocaleString("en-US")} ر.س`;

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
  condition: "damaged" | "intact";
  property_type: string;
  city: string;
  district: string;
  area_sqm: number;
  estimated_value: number;
  damage_description: string;
  rehab_cost: number;
  duration_months: number;
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
