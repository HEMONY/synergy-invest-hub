import { createFileRoute } from "@tanstack/react-router";
import { Bell, Building2, FileCheck2, Wallet } from "lucide-react";
import { useState } from "react";

import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { notifications, type Notification } from "@/lib/mock-data";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | Synergy" },
      {
        name: "description",
        content: "تحديثات الطلبات والمشاريع والتوثيق والمدفوعات في مكان واحد.",
      },
      { property: "og:title", content: "الإشعارات | Synergy" },
      { property: "og:description", content: "كل تحديثات حسابك ومشاريعك في منصة Synergy." },
    ],
  }),
  component: NotificationsPage,
});

const icons: Record<Notification["kind"], typeof Bell> = {
  طلب: FileCheck2,
  مشروع: Building2,
  توثيق: Bell,
  مالي: Wallet,
};

const filters = ["الكل", "طلب", "مشروع", "توثيق", "مالي"] as const;

function NotificationsPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("الكل");
  const list = notifications.filter((n) => filter === "الكل" || n.kind === filter);

  return (
    <SiteLayout>
      <PageHeader title="الإشعارات" subtitle="تحديثات الطلب وتحديثات المشروع أولاً بأول." />

      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "gold" : "outline"}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>

        <ul className="mt-6 space-y-3">
          {list.map((n) => {
            const Icon = icons[n.kind];
            return (
              <li key={n.id} className="card-surface flex items-start gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/15">
                  <Icon className="size-5 text-gold" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold">{n.title}</h3>
                    {n.unread && <span className="size-2 shrink-0 rounded-full bg-gold" />}
                  </div>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">{n.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {n.kind} · {n.time}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </SiteLayout>
  );
}
