import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchMyInterests,
  fetchOffersForMyRequests,////////
  fetchRequestPrivateDetails,
  fetchProjectPayments,
  payProjectInstallment,
  createRefundRequest,
  reportCommissionPayment,
  bankakAccount,
  uploadPaymentReceipt,
  fetchAllUserRoles,
  formatDuration,
  formatSAR,
  interestStatusLabels,
  notifyUser,
  timeAgo,
  updateInterest,
  type PaymentScheduleItem,
} from "@/lib/db";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
type OfferRow = {
  id: string;
  request_id: string;
  investor_id: string;
  amount: number;
  status: string;
  created_at: string;
  company_name: string;
  company_phone: string;
  company_location: string;
  scope_of_work: string;
  proposed_works: string;
  payment_method: string;
  duration_months: number;
  duration_days: number;
  payment_schedule: PaymentScheduleItem[];
  presented_installment_amount: number | null;
  warranty: string;
  company_notes: string;
  commission_amount: number;
};

function OfferDetails({ offer }: { offer: OfferRow }) {
  return (
    <dl className="mt-4 grid gap-2 rounded-xl bg-muted/60 p-4 text-xs leading-6 sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">الشركة</dt>
        <dd className="font-bold">{offer.company_name || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">قيمة العرض</dt>
        <dd className="font-bold text-gold">{formatSAR(Number(offer.amount))}</dd>
      </div>
      {offer.presented_installment_amount != null && (
        <div>
          <dt className="text-muted-foreground">مبلغ الدفعة</dt>
          <dd className="font-bold">{formatSAR(Number(offer.presented_installment_amount))}</dd>
        </div>
      )}
      <div className="sm:col-span-2 space-y-1">
        <p><span className="text-muted-foreground">نطاق العمل: </span>{offer.scope_of_work || "—"}</p>
        <p><span className="text-muted-foreground">مدة التنفيذ: </span>{formatDuration(offer.duration_months, offer.duration_days)}</p>
      </div>
      <div>
        <dt className="text-muted-foreground">الأعمال المقترحة</dt>
        <dd>{offer.proposed_works || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">طريقة الدفع</dt>
        <dd>{offer.payment_method || "—"}</dd>
      </div>
      {offer.payment_method === "على دفعات" && offer.payment_schedule?.length > 0 && (
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">جدول الدفعات</dt>
          <dd className="mt-1 space-y-1">
            {offer.payment_schedule.map((s, i) => (
              <p key={i}>
                • {s.percentage}% — {s.stage}
              </p>
            ))}
          </dd>
        </div>
      )}
      <div>
        <dt className="text-muted-foreground">الضمان</dt>
        <dd>{offer.warranty || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">ملاحظات الشركة</dt>
        <dd>{offer.company_notes || "—"}</dd>
      </div>
      
    </dl>
  );
}

function RemainingNotice({ requestId }: { requestId: string }) {
  const { data: payments = [] } = useQuery({
    queryKey: ["offer-payments", requestId],
    queryFn: () => fetchProjectPayments(requestId),
  });
  const last = [...payments].reverse().find((p) => p.remaining_sent_at && Number(p.remaining_amount) > 0);
  if (!last) return null;
  return (
    <p className="mt-3 rounded-xl border border-gold/40 bg-gold/5 p-3 text-xs font-bold text-gold">
      المبلغ المتبقي لاعتماد الدفعة {formatSAR(Number(last.remaining_amount))}
    </p>
  );
}
function OfferPaymentAndRefund({ offer, ownerId, code }: { offer: OfferRow; ownerId: string; code: string }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"idle" | "pay" | "refund">("idle");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: payments = [] } = useQuery({
    queryKey: ["offer-payments", offer.request_id],
    queryFn: () => fetchProjectPayments(offer.request_id),
  });

  const pay = async () => {
    if (!receipt) {
      toast.error("أرفق إشعار التحويل البنكي");
      return;
    }
    setLoading(true);
    try {
      const receipt_path = await uploadPaymentReceipt(ownerId, receipt);
      await payProjectInstallment({
        request_id: offer.request_id,
        amount: Number(offer.amount),
        payment_method: "تحويل بنكي (بنكك)",
        owner_id: ownerId,
        receipt_path,
      });
      const staff = await fetchAllUserRoles();
      const staffIds = [...new Set(
        staff.filter((r) => r.role === "admin" || r.role === "supervisor").map((r) => r.user_id),
      )];
      await Promise.all(
        staffIds.map((id) =>
          notifyUser(
            id,
            "payment",
            "دفعة جديدة بانتظار التأكيد",
            `وصلت دفعة على المشروع ${code} — راجع الإشعار البنكي من «إدارة الطلبات والمشاريع».`,
          ),
        ),
      );
      toast.success("تم إرسال إشعار الدفع", {
        description: "سيتم تأكيد استلام المبلغ من إدارة سينرجي.",
      });
      setMode("idle");
      setReceipt(null);
      queryClient.invalidateQueries({ queryKey: ["offer-payments", offer.request_id] });
    } catch (err) {
      toast.error("تعذر الدفع", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const refund = async () => {
    if (payments.length === 0) {
      toast.error("لا توجد دفعة مسجلة لاستردادها");
      return;
    }
    if (!reason.trim()) {
      toast.error("اذكر سبب الاسترداد");
      return;
    }
    const last = payments[payments.length - 1];
    setLoading(true);
    try {
      await createRefundRequest({
        payment_id: last.id,
        request_id: offer.request_id,
        amount: Number(last.amount),
        reason: reason.trim(),
        requested_by: ownerId,
      });
      toast.success("تم إرسال طلب الاسترداد", {
        description: "ستراجعه إدارة سينرجي من «إدارة الطلبات والمشاريع».",
      });
      setMode("idle");
      setReason("");
    } catch (err) {
      toast.error("تعذر إرسال الطلب", { description: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };

  if (mode === "pay") {
    return (
      <div className="mt-4 rounded-xl border border-gold/30 p-4">
        <p className="text-xs font-bold text-gold">الدفع عبر بنكك</p>
        <div className="mt-3 rounded-lg bg-muted/60 p-3 text-xs leading-6">
          <p>حساب: {bankakAccount.bankName}</p>
          <p>رقم الحساب: {bankakAccount.accountNumber}</p>
          <p>اسم صاحب الحساب: {bankakAccount.accountHolder}</p>
        </div>
        <div className="mt-3">
          <Label className="text-xs">إرفاق إشعار بنكك</Label>
          <Input
            className="mt-2"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="gold" disabled={loading} onClick={pay}>
            {loading ? "جارٍ الإرسال..." : "تأكيد الدفع"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>إلغاء</Button>
        </div>
      </div>
    );
  }

  if (mode === "refund") {
    return (
      <div className="mt-4 rounded-xl border border-border p-4">
        <p className="text-xs font-bold">طلب استرداد المبلغ</p>
        <Input
          className="mt-3"
          placeholder="سبب الاسترداد"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outlineGold" disabled={loading} onClick={refund}>
            {loading ? "جارٍ الإرسال..." : "إرسال الطلب"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setMode("idle")}>إلغاء</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 flex gap-2">
      <Button size="sm" variant="gold" onClick={() => setMode("pay")}>الدفع</Button>
      <Button size="sm" variant="outline" onClick={() => setMode("refund")}>طلب استرداد المبلغ</Button>
    </div>
  );
}
/** العروض المقدمة على مشاريع صاحب الحساب. */
export function OwnerOffersPanel({ ownerId }: { ownerId: string }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<string | null>(null);
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["owner-offers", ownerId],
    queryFn: () => fetchOffersForMyRequests(ownerId),
    enabled: !!ownerId,
  });

  const visible = offers.filter((o) => o.status !== "pending" && o.status !== "under_review");

  const decide = async (offer: OfferRow, approve: boolean, code: string) => {
    setPending(offer.id);
    try {
      await updateInterest(offer.id, approve ? "owner_approved" : "owner_rejected");
      await notifyUser(
        offer.investor_id,
        "request",
        approve ? "وافق صاحب المشروع على عرضكم" : "لم يُقبل عرضكم",
        approve
          ? `وافق صاحب المشروع ${code} على عرضكم — بانتظار اعتماد سينرجي للربط.`
          : `اعتذر صاحب المشروع ${code} عن قبول عرضكم.`,
      );
      queryClient.invalidateQueries({ queryKey: ["owner-offers", ownerId] });
      toast.success(approve ? "تم قبول العرض" : "تم رفض العرض");
    } catch (err) {
      toast.error("تعذر تحديث العرض", { description: (err as Error).message });
    } finally {
      setPending(null);
    }
  };

  if (isLoading)
    return (
      <div className="card-surface p-10 text-center text-sm text-muted-foreground">
        جارٍ التحميل...
      </div>
    );

  if (visible.length === 0)
    return (
      <div className="card-surface p-10 text-center text-sm text-muted-foreground">
        لا توجد عروض معروضة عليك حالياً — تراجع سينرجي العروض قبل عرضها عليك.
      </div>
    );

  return (
    <>
      {visible.map((o) => {
        const offer = o as unknown as OfferRow;
        const code = o.request?.code ?? "";
        return (
          <article key={o.id} className="card-surface p-6">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <h3 className="truncate text-base font-bold">
                {o.request?.title || `${o.request?.city} — ${o.request?.district}`} · {code}
              </h3>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {interestStatusLabels[o.status] ?? o.status} · {timeAgo(o.created_at)}
            </p>

            <OfferDetails offer={offer} />
            <RemainingNotice requestId={offer.request_id} />
            {o.status === "owner_approved" && (
              <OfferPaymentAndRefund offer={offer} ownerId={ownerId} code={code} />
            )}

            {o.status === "presented" && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="gold"
                  disabled={pending === o.id}
                  onClick={() => decide(offer, true, code)}
                >
                  موافقة على العرض
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pending === o.id}
                  onClick={() => decide(offer, false, code)}
                >
                  رفض العرض
                </Button>
              </div>
            )}
          </article>
        );
      })}
    </>
  );
}

function CompanyPaymentsTable({ requestId }: { requestId: string }) {
  const { data: all = [] } = useQuery({
    queryKey: ["company-payments", requestId],
    queryFn: () => fetchProjectPayments(requestId),
  });
  const payments = all.filter((p) => p.sent_to_company);
  if (payments.length === 0) return null;
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border p-3">
      <table className="w-full text-right text-xs">
        <thead className="text-muted-foreground">
          <tr>
            <th className="p-2">رقم الدفعة</th><th className="p-2">مبلغ الدفعة</th>
            <th className="p-2">عمولة سينرجي</th><th className="p-2">مبلغ الشركة</th>
            <th className="p-2">تاريخ الدفع</th><th className="p-2">عدد الدفعات</th>
            <th className="p-2">صرف الشركة</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((p) => (
            <tr key={p.id} className="border-t border-border">
              <td className="p-2 font-bold">#{p.payment_number}</td>
              <td className="p-2">{formatSAR(Number(p.amount))}</td>
              <td className="p-2">{formatSAR(Number(p.commission_amount))}</td>
              <td className="p-2 font-semibold">{formatSAR(Number(p.company_amount))}</td>
              <td className="p-2">{new Date(p.paid_at).toLocaleDateString("en-GB")}</td>
              <td className="p-2">{payments.length}</td>
              <td className="p-2">{p.payout_status === "released" ? "تم الصرف" : "بانتظار الصرف"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** العروض التي قدّمتها الشركة العقارية. */
export function CompanyOffersPanel({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ["my-interests", userId],
    queryFn: () => fetchMyInterests(userId),
    enabled: !!userId,
  });
  const [contact, setContact] = useState<Record<string, string>>({});

  const showContact = async (requestId: string) => {
    try {
      const pd = await fetchRequestPrivateDetails(requestId);
      setContact((c) => ({
        ...c,
        [requestId]: pd
          ? `الهاتف: ${pd.owner_phone || "—"} · الموقع: ${pd.location_details || "—"}`
          : "غير متاح بعد",
      }));
    } catch (err) {
      toast.error("تعذر عرض بيانات التواصل", { description: (err as Error).message });
    }
  };

  if (isLoading)
    return (
      <div className="card-surface p-10 text-center text-sm text-muted-foreground">
        جارٍ التحميل...
      </div>
    );

  if (offers.length === 0)
    return (
      <div className="card-surface p-10 text-center text-sm text-muted-foreground">
        لم تقدّم أي عرض بعد — تصفّح المشاريع العقارية وقدّم عرضك.
      </div>
    );

  return (
    <>
      {offers.map((o) => (
        <article key={o.id} className="card-surface p-6">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <h3 className="truncate text-base font-bold">
              {o.property_requests?.title || o.property_requests?.city} ·{" "}
              {o.property_requests?.code}
            </h3>
            <Badge className="shrink-0 bg-gold/15 text-gold">{formatSAR(Number(o.amount))}</Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {interestStatusLabels[o.status] ?? o.status} · {timeAgo(o.created_at)}
          </p>
          {Number(o.commission_amount) > 0 && (
            <p className="mt-2 text-xs font-semibold text-gold">
              عمولة سينرجي: {formatSAR(Number(o.commission_amount))}
            </p>
          )}

          {o.status === "approved" && (
            <div className="mt-4 rounded-xl border border-gold/40 bg-gold/5 p-3 text-xs leading-6">
              <p className="font-bold text-gold">عمولة مستحقة</p>
              <p>
                وافق صاحب المشروع واعتمدت سينرجي الربط — سدّد العمولة ثم أبلغنا لتأكيد الدفع وفتح
                التواصل.
              </p>
              <Button
                className="mt-3"
                size="sm"
                variant="gold"
                onClick={async () => {
                  try {
                    await reportCommissionPayment(o.id);
                    await notifyUser(
                      userId,
                      "payment",
                      "تم إرسال إشعار السداد",
                      "سيتم تأكيد الدفع من سينرجي ثم فتح التواصل.",
                    );
                    queryClient.invalidateQueries({ queryKey: ["my-interests", userId] });
                    toast.success("تم إبلاغ سينرجي بالسداد");
                  } catch (err) {
                    toast.error("تعذر إرسال الإشعار", { description: (err as Error).message });
                  }
                }}
              >
                دفعت العمولة — إبلاغ سينرجي
              </Button>
            </div>
          )}

          {(o.status === "commission_reported" || o.status === "commission_confirmed") && (
            <p className="mt-4 rounded-xl border border-border p-3 text-xs leading-6 text-muted-foreground">
              {o.status === "commission_reported"
                ? "بانتظار تأكيد سينرجي لاستلام العمولة."
                : "تم تأكيد السداد — سيتم فتح التواصل قريباً."}
            </p>
          )}

          {o.status === "commission_paid" && (
            <div className="mt-4">
              <Button size="sm" variant="outlineGold" onClick={() => showContact(o.request_id)}>
                عرض بيانات تواصل صاحب المشروع
              </Button>
              {contact[o.request_id] && (
                <p className="mt-2 rounded-lg border border-gold/40 bg-gold/5 p-3 text-xs leading-6">
                  {contact[o.request_id]}
                </p>
              )}
            </div>
          )}
          <CompanyPaymentsTable requestId={o.request_id} />
        </article>
      ))}
    </>
  );
}