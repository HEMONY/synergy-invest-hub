import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Bell, Building2, ShieldCheck, Users } from "lucide-react";

import heroImage from "@/assets/hero-property.jpg";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { conditionLabels, fetchOpportunities, formatSAR } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Synergy | حلول تمويل وتطوير عقاري بالأقساط المريحة" },
      {
        name: "description",
        content:
          "منصة Synergy تربط أصحاب العقارات المتضررة أو التي تحتاج تشطيب أو بناء جديد بأفضل شركات القطاع العقاري بنظام الدفع بالأقساط المريحة.",
      },
      { property: "og:title", content: "Synergy | حلول تمويل وتطوير عقاري بالأقساط المريحة" },
      {
        property: "og:description",
        content: "وساطة عقارية موثوقة بإشراف كامل من إدارة المنصة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ShieldCheck, title: "موثوق وآمن", body: "جميع التعاملات موثقة وشفافة" },
  { icon: Users, title: "شبكة واسعة", body: "شبكة واسعة من شركات القطاع العقاري" },
  { icon: BarChart3, title: "أقساط مريحة", body: "خطط سداد ميسّرة تناسبك" },
  { icon: Building2, title: "إدارة متكاملة", body: "متابعة جميع مراحل المشروع" },
];

function Index() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["opportunities"],
    queryFn: fetchOpportunities,
  });
  const featured = rows.slice(0, 3);

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-navy-gradient">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <h1 className="mt-6 text-3xl leading-[1.45] font-extrabold text-white sm:text-4xl">
              لو عندك عقار عايز تأهيل وترميم أو عايز تشطيب أو عايز تبني أو ترغب في إمتلاك عقار جديد وما عندك كاش
              <br />
              <span className="text-gold-gradient">الحل مع سينرجي</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-white/70">
              منصة وساطة عقارية تربط بين أصحاب العقارات التي تريد إعادة تأهيل وترميم، أو
              أصحاب العقارات التي تريد تشطيب، أو الذين يريدون بناء عقار جديد أو الراغبين في إمتلاك  عقار جديد، بأفضل
              شركات القطاع العقاري بالأقساط المريحة — بإشراف كامل من إدارة المنصة.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link to="/new-request">أضف عقارك</Link>
              </Button>
              <Button asChild variant="outlineGold" size="lg">
                <Link to="/opportunities">أبحث عن مشروع</Link>
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-gold/25 shadow-gold">
              <img
                src={heroImage}
                alt="عقار تمت إعادة تأهيله عبر منصة Synergy"
                width={1200}
                height={900}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-14 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center transition-colors hover:border-gold/50"
              >
                <f.icon className="mx-auto size-7 text-gold" strokeWidth={1.5} />
                <h3 className="mt-3 text-sm font-bold text-white">{f.title}</h3>
                <p className="mt-1 text-xs leading-6 text-white/60">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageHeader
        title="عن منصة سينرجي"
        subtitle="لو عندك عقار عايز تأهيل وترميم أو عايز تشطيب أو عايز تبني أو ترغب في امتلاك عقار جديد، في سينرجي نحن نربط بين أصحاب العقارات التي تريد إعادة تأهيل، أو العقارات التي تريد تشطيب، أو الراغبين في إمتلاك عقار جديد، مع أفضل الشركات التي تعمل في مجال القطاع العقاري بنظام الدفع بالأقساط المريحة."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">أحدث المشاريع العقارية على المنصة.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/notifications">
              <Bell className="size-4" /> كل الإشعارات
            </Link>
          </Button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>}

        {!isLoading && featured.length === 0 && (
          <div className="card-surface p-12 text-center text-sm text-muted-foreground">
            لا توجد مشاريع منشورة حالياً — كن أول من يضيف عقاره.
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((o) => (
            <article key={o.id} className="card-surface overflow-hidden p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-gold/15 px-3 py-1 text-xs font-bold text-gold">
                  {o.property_type}
                </span>
                <span className="text-xs text-muted-foreground">{o.code}</span>
              </div>
              <h3 className="mt-4 text-base font-bold">
                {o.city} — {o.district}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {conditionLabels[o.condition] ?? o.condition}
              </p>
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
                {o.damage_description}
              </p>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 px-4 py-3">
                <span className="text-xs text-muted-foreground">العائد المتوقع</span>
                <span className="text-xl font-extrabold text-gold">{o.expected_return}%</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                
                <div>
                  <dt className="text-xs text-muted-foreground">مدة التنفيذ</dt>
                  <dd className="font-bold">{o.duration_months} أشهر</dd>
                </div>
              </dl>
              <Button asChild variant="gold" className="mt-5 w-full">
                <Link to="/opportunities">نريد العمل على هذا المشروع</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
