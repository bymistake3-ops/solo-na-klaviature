import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Empty } from "@/components/ui/Empty";
import { B2C_STATUSES, getB2CStatus } from "@/lib/constants";
import {
  formatDate,
  formatMoney,
  relativeDay,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function B2CListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; manager?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const managerId = sp.manager ?? "";

  const where: Prisma.B2CClientWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {},
      status ? { dealStatus: status } : {},
      managerId ? { managerId } : {},
    ],
  };

  const [clients, managers, totalRevenue] = await Promise.all([
    prisma.b2CClient.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { manager: true },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.b2CClient.aggregate({
      _sum: { revenue: true },
      where: { ...where, dealStatus: "paid" },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="B2C клиенты"
        subtitle={`${clients.length} клиентов · Выручка: ${formatMoney(
          totalRevenue._sum.revenue ?? 0,
        )}`}
        actions={
          <Link href="/b2c/new" className="btn-primary">
            + Добавить клиента
          </Link>
        }
      />

      <form className="card p-3 mb-4 flex flex-wrap gap-2 items-center">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск по имени, email или телефону…"
          className="input max-w-md flex-1"
        />
        <select name="status" defaultValue={status} className="input max-w-[200px]">
          <option value="">Все статусы</option>
          {B2C_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          name="manager"
          defaultValue={managerId}
          className="input max-w-[200px]"
        >
          <option value="">Все менеджеры</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button className="btn-outline">Применить</button>
        {(q || status || managerId) && (
          <Link href="/b2c" className="btn-ghost">
            Сбросить
          </Link>
        )}
      </form>

      {clients.length === 0 ? (
        <Empty
          title="Клиентов пока нет"
          description="Добавьте первого клиента — это займёт 10 секунд."
          action={
            <Link href="/b2c/new" className="btn-primary">
              + Добавить клиента
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="text-left">
                  <th className="table-head px-4 py-3">Клиент</th>
                  <th className="table-head px-4 py-3">Статус</th>
                  <th className="table-head px-4 py-3">Выручка</th>
                  <th className="table-head px-4 py-3">Менеджер</th>
                  <th className="table-head px-4 py-3">Следующий контакт</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clients.map((c) => {
                  const s = getB2CStatus(c.dealStatus);
                  const rel = relativeDay(c.nextContactAt);
                  return (
                    <tr key={c.id} className="row-hover">
                      <td className="px-4 py-3">
                        <Link
                          href={`/b2c/${c.id}`}
                          className="flex items-center gap-3 min-w-0"
                        >
                          <Avatar name={c.name} />
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {c.name}
                            </div>
                            <div className="text-xs text-subtle truncate">
                              {c.email ?? c.phone ?? "—"}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={s.tone as never}>{s.label}</Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                        {formatMoney(c.revenue)}
                      </td>
                      <td className="px-4 py-3 text-subtle whitespace-nowrap">
                        {c.manager?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-subtle">
                            {formatDate(c.nextContactAt)}
                          </span>
                          {rel ? (
                            <Badge tone={rel.tone as never}>{rel.label}</Badge>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
