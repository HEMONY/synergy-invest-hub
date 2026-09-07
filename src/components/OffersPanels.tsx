import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchMyInterests,
  fetchOffersForMyRequests,
  fetchRequestPrivateDetails,
  reportCommissionPayment,
  formatSAR,
  interestStatusLabels,
  notifyUser,
  timeAgo,
  updateInterest,
} from "@/lib/db";

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
  warranty: string;
  company_notes: string;
  commission_amount: number;
};

function OfferDetails({ offer, showContact }: { offer: OfferRow; showContact: boolean }) {
  return (
    <dl className="mt-4 grid gap-2 rounded-xl bg-muted/60 p-4 text-xs leading-6 sm:grid-cols-2">
      <div>
        <dt className="text-muted-foreground">الشركة</dt>
        <dd className="font-bold">
          {showContact ? offer.company_name || "—" : "شركة عقارية موثوقة (تُكشف بعد فتح التواصل)"}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">نطاق العمل</dt>
        <dd>{offer.scope_of_work || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">الأعمال المقترحة</dt>
        <dd>{offer.proposed_works || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">طريقة الدفع</dt>
        <dd>{offer.payment_method || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">الضمان</dt>
        <dd>{offer.warranty || "—"}</dd>
      </div>
      <div>
        <dt className="text-muted-foreground">ملاحظات الشركة</dt>
        <dd>{offer.company_notes || "—"}</dd>
      </div>
      {showContact && (
        <div className="sm:col-span-2 rounded-lg border border-gold/40 bg-gold/5 p-3">
          <p className="font-bold text-gold">بيانات التواصل مع الشركة</p>
          <p>الهاتف: {offer.company_phone || "—"}</p>
          <p>الموقع: {offer.company_location || "—"}</p>
        </div>
      )}
    </dl>
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
              <Badge className="shrink-0 bg-gold/15 text-gold">{formatSAR(Number(o.amount))}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {interestStatusLabels[o.status] ?? o.status} · {timeAgo(o.created_at)}
            </p>

            <OfferDetails offer={offer} showContact={o.status === "commission_paid"} />

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
        </article>
      ))}
    </>
  );
}
