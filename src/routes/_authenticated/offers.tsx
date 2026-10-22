import { createFileRoute } from "@tanstack/react-router";

import { CompanyOffersPanel, OwnerOffersPanel } from "@/components/OffersPanels";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/_authenticated/offers")({
  head: () => ({ meta: [{ title: "العروض | Synergy" }] }),
  component: OffersPage,
});

function OffersPage() {
  const { user } = useAuth();
  return (
    <SiteLayout>
      <PageHeader back title="العروض" subtitle="عروض الشركات على مشاريعك والعروض التي قدّمتها." />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-10 lg:px-8">
        {user && (
          <>
            <h3 className="text-sm font-bold text-muted-foreground">عروض الشركات على مشاريعي</h3>
            <OwnerOffersPanel ownerId={user.id} />
            <h3 className="pt-4 text-sm font-bold text-muted-foreground">العروض التي قدّمتها كشركة عقارية</h3>
            <CompanyOffersPanel userId={user.id} />
          </>
        )}
      </div>
    </SiteLayout>
  );
}