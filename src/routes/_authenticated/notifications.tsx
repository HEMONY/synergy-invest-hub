import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Building2, FileCheck2, Wallet } from "lucide-react";
import { useState } from "react";

import { PageHeader, SiteLayout } from "@/components/SiteLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchNotifications, markAllRead, notificationKinds, timeAgo } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات | Synergy" },
      {
        name: "description",
        content: "تحديثات الطلبات والمشاريع والتوثيق والمدفوعات في مكان واحد.",
      },
      { property: "og:title", content: "الإشعارات | Synergy" },
      { property: "og:description", content: "كل تحديثات حسابك ومشاريعك في منصة Synergy." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

const icons: Record<string, typeof Bell> = {
  request: FileCheck2,
  project: Building2,
  verification: Bell,
  finance: Wallet,
};

const filters = ["الكل", "طلب", "مشروع", "توثيق"] as const;

function NotificationsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<(typeof filters)[number]>("الكل");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => fetchNotifications(userId),
    enabled: !!userId,
  });

  const readAll = useMutation({
    mutationFn: () => markAllRead(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const list = rows.filter(
    (n) => filter === "الكل" || (notificationKinds[n.kind] ?? n.kind) === filter,
  );

  return (
    <SiteLayout>
      <PageHeader title="الإشعارات" subtitle="تحديثات الطلب وتحديثات المشروع أولاً بأول." />

      <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
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
          <Button
            size="sm"
            variant="outlineGold"
            className="ms-auto"
            disabled={readAll.isPending || rows.every((n) => n.is_read)}
            onClick={() => readAll.mutate()}
          >
            تعليم الكل كمقروء
          </Button>
        </div>

        {isLoading && (
          <div className="card-surface mt-6 p-10 text-center text-sm text-muted-foreground">
            جارٍ التحميل...
          </div>
        )}

        {!isLoading && list.length === 0 && (
          <div className="card-surface mt-6 p-10 text-center text-sm text-muted-foreground">
            لا توجد إشعارات حالياً.
          </div>
        )}

        <ul className="mt-6 space-y-3">
          {list.map((n) => {
            const Icon = icons[n.kind] ?? Bell;
            return (
              <li key={n.id} className="card-surface flex items-start gap-4 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold/15">
                  <Icon className="size-5 text-gold" strokeWidth={1.6} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-bold">{n.title}</h3>
                    {!n.is_read && <span className="size-2 shrink-0 rounded-full bg-gold" />}
                  </div>
                  <p className="mt-1 text-sm leading-7 text-muted-foreground">{n.body}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {notificationKinds[n.kind] ?? n.kind} · {timeAgo(n.created_at)}
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
