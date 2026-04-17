import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { B2B_STATUSES, getB2BStatus } from "@/lib/constants";
import { formatDate, relativeDay } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function B2BListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; manager?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = sp.status ?? "";
  const managerId = sp.manager ?? "";

  const where: Prisma.B2BAccountWhereInput = {
    AND: [
      q
        ? {
            OR: [
              { companyName: { contains: q } },
              { legalEntity: { contains: q } },
              { contactPerson: { contains: q } },
              { contacts: { contains: q } },
            ],
          }
        : {},
      status ? { accountStatus: status } : {},
      managerId ? { managerId } : {},
    ],
  };

  const [accounts, managers] = await Promise.all([
    prisma.b2BAccount.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: { manager: true },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader
        title="B2B аккаунты"
        subtitle={`${accounts.length} компаний`}
        actions={
          <Link href="/b2b/new" className="btn-primary">
            + Добавить компанию
          </Link>
        }
      />

      <form className="card p-3 mb-4 flex flex-wrap gap-2 items-center">
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск по компании, юрлицу, контакту…"
          className="input max-w-md flex-1"
        />
        <select name="status" defaultValue={status} className="input max-w-[220px]">
          <option value="">Все статусы</option>
          {B2B_STATUSES.map((s) => (
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
          <Link href="/b2b" className="btn-ghost">
            Сбросить
          </Link>
        )}
      </form>

      {accounts.length === 0 ? (
        <Empty
          title="Компаний пока нет"
          description="Добавьте первый аккаунт."
          action={
            <Link href="/b2b/new" className="btn-primary">
              + Добавить компанию
            </Link>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr className="text-left">
                  <th className="table-head px-4 py-3">Компания</th>
                  <th className="table-head px-4 py-3">Статус</th>
                  <th className="table-head px-4 py-3">Менеджер</th>
                  <th className="table-head px-4 py-3">Последний контакт</th>
                  <th className="table-head px-4 py-3">Следующий контакт</th>
                  <th className="table-head px-4 py-3 text-center">Реком.</th>
                  <th className="table-head px-4 py-3 text-center">Очная</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {accounts.map((a) => {
                  const s = getB2BStatus(a.accountStatus);
                  const rel = relativeDay(a.nextContactAt);
                  return (
                    <tr key={a.id} className="row-hover">
                      <td className="px-4 py-3">
                        <Link href={`/b2b/${a.id}`} className="block min-w-0">
                          <div className="font-medium truncate">
                            {a.companyName}
                          </div>
                          <div className="text-xs text-subtle truncate">
                            {a.contactPerson ?? a.legalEntity ?? "—"}
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={s.tone as never}>{s.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-subtle whitespace-nowrap">
                        {a.manager?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-subtle whitespace-nowrap">
                        {formatDate(a.lastContactAt)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-subtle">
                            {formatDate(a.nextContactAt)}
                          </span>
                          {rel ? (
                            <Badge tone={rel.tone as never}>{rel.label}</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {a.recommendationsCollected ? "✓" : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {a.offeredOfflineSchool ? "✓" : "—"}
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
