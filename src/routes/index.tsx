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
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold">
              <CheckCircle2 className="size-3.5" /> وساطة استثمارية بإشراف كامل
            </span>
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

      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold">آخر تحديث</h2>
            <p className="mt-2 text-sm text-muted-foreground">أحدث ما جرى على حسابك ومشاريعك.</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/notifications">
              <Bell className="size-4" /> كل الإشعارات
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {projects.map((p) => (
            <article key={p.id} className="card-surface p-6">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold">{p.title}</h3>
                <span className="shrink-0 rounded-lg bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                  {p.code}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                المشرف: {p.supervisor} · {p.updatedAt}
              </p>
              <div className="mt-5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>نسبة الإنجاز</span>
                  <span className="text-gold">{p.progress}%</span>
                </div>
                <Progress value={p.progress} className="mt-2 h-2" />
              </div>
              <p className="mt-4 text-sm font-bold text-gold">{formatSAR(p.funding)}</p>
            </article>
          ))}
        </div>
      </section>

      <PageHeader
        title="فرص استثمارية مختارة"
        subtitle="طلبات تأهيل معتمدة من الإدارة وجاهزة للتمويل من المستثمرين الموثقين."
      />

      <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {opportunities.slice(0, 3).map((o) => (
            <article key={o.id} className="card-surface overflow-hidden p-6">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-gold/15 px-3 py-1 text-xs font-bold text-gold">
                  {o.type}
                </span>
                <span className="text-xs text-muted-foreground">{o.code}</span>
              </div>
              <h3 className="mt-4 text-base font-bold">
                {o.city} — {o.district}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{o.damage}</p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">التمويل المطلوب</dt>
                  <dd className="font-bold text-gold">{formatSAR(o.fundingNeeded)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">مدة التنفيذ</dt>
                  <dd className="font-bold">{o.durationMonths} أشهر</dd>
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
