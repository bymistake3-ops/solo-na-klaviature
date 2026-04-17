import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  formatDate,
  formatMoney,
  relativeDay,
} from "@/lib/utils";
import {
  getB2BStatus,
  getB2CStatus,
} from "@/lib/constants";

export default async function DashboardPage() {
  const now = new Date();
  const in7 = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  const [
    b2cCount,
    b2bCount,
    openTasks,
    todayTasks,
    revenueAgg,
    upcomingB2C,
    upcomingB2B,
    attention,
  ] = await Promise.all([
    prisma.b2CClient.count(),
    prisma.b2BAccount.count(),
    prisma.task.count({ where: { status: "open" } }),
    prisma.task.count({
      where: {
        status: "open",
        dueDate: {
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.b2CClient.aggregate({
      _sum: { revenue: true },
      where: { dealStatus: "paid" },
    }),
    prisma.b2CClient.findMany({
      where: { nextContactAt: { not: null, lte: in7 } },
      orderBy: { nextContactAt: "asc" },
      include: { manager: true },
      take: 5,
    }),
    prisma.b2BAccount.findMany({
      where: { nextContactAt: { not: null, lte: in7 } },
      orderBy: { nextContactAt: "asc" },
      include: { manager: true },
      take: 5,
    }),
    prisma.b2BAccount.findMany({
      where: {
        OR: [
          { accountStatus: "needs_contact" },
          { accountStatus: "churn_risk" },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const metrics = [
    { label: "B2C клиентов", value: b2cCount, href: "/b2c" },
    { label: "B2B аккаунтов", value: b2bCount, href: "/b2b" },
    { label: "Активных задач", value: openTasks, href: "/tasks" },
    { label: "На сегодня", value: todayTasks, href: "/tasks" },
    {
      label: "Выручка B2C",
      value: formatMoney(revenueAgg._sum.revenue ?? 0),
      href: "/b2c",
    },
  ];

  return (
    <>
      <PageHeader
        title="Дашборд"
        subtitle={`Обзор работы · ${formatDate(now)}`}
        actions={
          <>
            <Link href="/b2c/new" className="btn-outline">
              + B2C
            </Link>
            <Link href="/b2b/new" className="btn-primary">
              + Компания
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="card p-4 hover:shadow-pop transition"
          >
            <div className="text-[12px] text-subtle uppercase tracking-wide">
              {m.label}
            </div>
            <div className="mt-2 text-xl font-semibold tracking-tight">
              {m.value}
            </div>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Ближайшие follow-up · B2C</h2>
            <Link href="/b2c" className="text-xs text-brand hover:underline">
              Все клиенты
            </Link>
          </div>
          {upcomingB2C.length === 0 ? (
            <p className="text-sm text-subtle py-4">
              Нет запланированных касаний.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {upcomingB2C.map((c) => {
                const status = getB2CStatus(c.dealStatus);
                const rel = relativeDay(c.nextContactAt);
                return (
                  <li key={c.id} className="py-2.5">
                    <Link
                      href={`/b2c/${c.id}`}
                      className="flex items-center justify-between gap-3 row-hover rounded-lg -mx-2 px-2 py-1"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={c.name} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {c.name}
                          </div>
                          <div className="text-xs text-subtle truncate">
                            {c.manager?.name ?? "Без ответственного"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge tone={status.tone as never}>
                          {status.label}
                        </Badge>
                        {rel ? (
                          <Badge tone={rel.tone as never}>{rel.label}</Badge>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Ближайшие follow-up · B2B</h2>
            <Link href="/b2b" className="text-xs text-brand hover:underline">
              Все компании
            </Link>
          </div>
          {upcomingB2B.length === 0 ? (
            <p className="text-sm text-subtle py-4">
              Нет запланированных касаний.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {upcomingB2B.map((a) => {
                const status = getB2BStatus(a.accountStatus);
                const rel = relativeDay(a.nextContactAt);
                return (
                  <li key={a.id} className="py-2.5">
                    <Link
                      href={`/b2b/${a.id}`}
                      className="flex items-center justify-between gap-3 row-hover rounded-lg -mx-2 px-2 py-1"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {a.companyName}
                        </div>
                        <div className="text-xs text-subtle truncate">
                          {a.manager?.name ?? "Без ответственного"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge tone={status.tone as never}>
                          {status.label}
                        </Badge>
                        {rel ? (
                          <Badge tone={rel.tone as never}>{rel.label}</Badge>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Требует внимания</h2>
            <Link href="/b2b" className="text-xs text-brand hover:underline">
              Все
            </Link>
          </div>
          {attention.length === 0 ? (
            <p className="text-sm text-subtle py-4">
              Всё спокойно — ни одного аккаунта с риском.
            </p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {attention.map((a) => {
                const status = getB2BStatus(a.accountStatus);
                return (
                  <li key={a.id}>
                    <Link
                      href={`/b2b/${a.id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-white hover:bg-muted/60 transition"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {a.companyName}
                        </div>
                        <div className="text-xs text-subtle">
                          Последний контакт: {formatDate(a.lastContactAt)}
                        </div>
                      </div>
                      <Badge tone={status.tone as never}>{status.label}</Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
