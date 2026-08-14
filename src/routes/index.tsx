import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Bell, Building2, CheckCircle2, ShieldCheck, Users } from "lucide-react";

import heroImage from "@/assets/hero-property.jpg";
import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatSAR, opportunities, projects } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Synergy | من عقار متضرر إلى فرصة استثمارية" },
      {
        name: "description",
        content:
          "منصة Synergy تربط أصحاب العقارات المتضررة بالمستثمرين والمقاولين لإعادة تأهيل العقارات وتحقيق أعلى عائد استثماري.",
      },
      { property: "og:title", content: "Synergy | من عقار متضرر إلى فرصة استثمارية" },
      {
        property: "og:description",
        content: "وساطة استثمارية عقارية موثوقة بإشراف كامل من إدارة المنصة.",
      },
    ],
  }),
  component: Index,
});

const features = [
  { icon: ShieldCheck, title: "موثوق وآمن", body: "جميع التعاملات موثقة وشفافة" },
  { icon: Users, title: "مستثمرون موثوقون", body: "شبكة واسعة من المستثمرين" },
  { icon: BarChart3, title: "أعلى عائد استثماري", body: "تحقيق أفضل عوائد على الاستثمار" },
  { icon: Building2, title: "إدارة متكاملة", body: "متابعة جميع مراحل المشروع" },
];

function Index() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-navy-gradient">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            
            <h1 className="mt-6 text-4xl leading-[1.25] font-extrabold text-white sm:text-5xl">
              من عقار متضرر
              <br />
              <span className="text-gold-gradient">إلى فرصة استثمارية</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-8 text-white/70">
              نحن نربط بين أصحاب العقارات والمستثمرين والمقاولين لإعادة تأهيل العقارات وتحقيق أعلى
              عائد استثماري.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link to="/requests">أضف عقارك</Link>
              </Button>
              <Button asChild variant="outlineGold" size="lg">
                <Link to="/opportunities">أريد الاستثمار</Link>
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
        title="فرص استثمارية مختارة"
        subtitle="طلبات معتمدة من الإدارة وجاهزة للتمويل، مع العائد المتوقع لكل فرصة."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">أحدث الفرص المنشورة على المنصة.</p>
          <Button asChild variant="outline" size="sm">
            <Link to="/notifications">
              <Bell className="size-4" /> كل الإشعارات
            </Link>
          </Button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">جارٍ التحميل...</p>}

        {!isLoading && featured.length === 0 && (
          <div className="card-surface p-12 text-center text-sm text-muted-foreground">
            لا توجد فرص منشورة حالياً — كن أول من يضيف عقاره.
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
                  <dt className="text-xs text-muted-foreground">التمويل المطلوب</dt>
                  <dd className="font-bold text-gold">{formatSAR(Number(o.funding_needed))}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">مدة التنفيذ</dt>
                  <dd className="font-bold">{o.duration_months} أشهر</dd>
                </div>
              </dl>
              <Button asChild variant="gold" className="mt-5 w-full">
                <Link to="/opportunities">أريد تمويل هذا العقار</Link>
              </Button>
            </article>
          ))}
        </div>
      </section>

    </SiteLayout>
  );
}
