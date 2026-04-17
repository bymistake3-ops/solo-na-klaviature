import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { B2BForm } from "@/components/B2BForm";
import {
  updateB2BAccount,
  deleteB2BAccount,
  addB2BNote,
} from "@/lib/actions/b2b";
import { createTask, toggleTask, deleteTask } from "@/lib/actions/tasks";
import {
  formatDate,
  formatDateTime,
  relativeDay,
} from "@/lib/utils";
import { getB2BStatus, getPriority, TASK_PRIORITIES } from "@/lib/constants";

export default async function B2BDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const account = await prisma.b2BAccount.findUnique({
    where: { id },
    include: {
      manager: true,
      noteItems: { orderBy: { createdAt: "desc" }, include: { author: true } },
      tasks: {
        orderBy: [{ status: "asc" }, { dueDate: "asc" }],
        include: { assignedTo: true },
      },
    },
  });
  if (!account) notFound();

  const managers = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const status = getB2BStatus(account.accountStatus);
  const rel = relativeDay(account.nextContactAt);

  return (
    <>
      <PageHeader
        title={account.companyName}
        subtitle={account.legalEntity ?? "—"}
        actions={
          <>
            <Link href="/b2b" className="btn-ghost">
              ← К списку
            </Link>
            <form
              action={async () => {
                "use server";
                await deleteB2BAccount(id);
              }}
            >
              <button className="btn-danger" type="submit">
                Удалить
              </button>
            </form>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Badge tone={status.tone as never}>{status.label}</Badge>
        {account.recommendationsCollected ? (
          <Badge tone="success">Рекомендации ✓</Badge>
        ) : (
          <Badge tone="muted">Рекомендации —</Badge>
        )}
        {account.offeredOfflineSchool ? (
          <Badge tone="success">Очная школа ✓</Badge>
        ) : (
          <Badge tone="muted">Очная школа —</Badge>
        )}
        {rel ? <Badge tone={rel.tone as never}>{rel.label}</Badge> : null}
        {account.manager ? (
          <span className="inline-flex items-center gap-2 text-sm text-subtle">
            <Avatar name={account.manager.name} size={22} />
            {account.manager.name}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-semibold mb-4">Основная информация</h2>
            <B2BForm
              action={async (fd) => {
                "use server";
                await updateB2BAccount(id, fd);
              }}
              managers={managers}
              account={account}
              submitLabel="Сохранить изменения"
            />
          </section>

          <section className="card p-6">
            <h2 className="font-semibold mb-4">Задачи</h2>
            <form
              action={async (fd) => {
                "use server";
                fd.set("relatedType", "b2b");
                fd.set("relatedId", id);
                await createTask(fd);
              }}
              className="flex flex-wrap gap-2 mb-4"
            >
              <input
                name="title"
                placeholder="Добавить задачу по компании…"
                className="input flex-1 min-w-[200px]"
                required
              />
              <input
                name="dueDate"
                type="date"
                className="input max-w-[180px]"
              />
              <select
                name="priority"
                defaultValue="normal"
                className="input max-w-[160px]"
              >
                {TASK_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              <button className="btn-outline">Добавить</button>
            </form>
            {account.tasks.length === 0 ? (
              <p className="text-sm text-subtle">Задач пока нет.</p>
            ) : (
              <ul className="divide-y divide-border">
                {account.tasks.map((t) => {
                  const p = getPriority(t.priority);
                  const r = relativeDay(t.dueDate);
                  return (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <form
                        action={async () => {
                          "use server";
                          await toggleTask(t.id);
                        }}
                      >
                        <button
                          className={`h-5 w-5 rounded-md border grid place-items-center transition ${
                            t.status === "done"
                              ? "bg-brand border-brand text-white"
                              : "bg-white border-border hover:border-brand/60"
                          }`}
                        >
                          {t.status === "done" ? (
                            <svg viewBox="0 0 20 20" className="h-3 w-3 fill-none stroke-current" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 10l4 4 8-9" />
                            </svg>
                          ) : null}
                        </button>
                      </form>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-sm ${
                            t.status === "done"
                              ? "line-through text-subtle"
                              : "text-fg"
                          }`}
                        >
                          {t.title}
                        </div>
                        <div className="text-xs text-subtle mt-0.5 flex items-center gap-2">
                          {t.dueDate ? <span>{formatDate(t.dueDate)}</span> : null}
                          {r ? <Badge tone={r.tone as never}>{r.label}</Badge> : null}
                          {t.assignedTo ? <span>· {t.assignedTo.name}</span> : null}
                        </div>
                      </div>
                      <Badge tone={p.tone as never}>{p.label}</Badge>
                      <form
                        action={async () => {
                          "use server";
                          await deleteTask(t.id);
                        }}
                      >
                        <button className="text-subtle hover:text-red-600 text-xs px-2">×</button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="font-semibold mb-3">Контакты</h2>
            <dl className="text-sm space-y-2">
              <Row label="Ответственный">{account.contactPerson ?? "—"}</Row>
              <Row label="Контакты">{account.contacts ?? "—"}</Row>
              <Row label="ЛПР">{account.decisionMaker ?? "—"}</Row>
              <Row label="Сотрудников">{account.employeeCount ?? "—"}</Row>
              <Row label="Последний контакт">
                {formatDate(account.lastContactAt)}
              </Row>
              <Row label="Следующий контакт">
                {formatDate(account.nextContactAt)}
              </Row>
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="font-semibold mb-3">Заметки</h2>
            <form
              action={async (fd) => {
                "use server";
                await addB2BNote(id, fd);
              }}
              className="space-y-2 mb-4"
            >
              <textarea
                name="body"
                className="textarea"
                rows={3}
                required
                placeholder="Записать краткую заметку по компании…"
              />
              <div className="flex justify-end">
                <button className="btn-outline">Добавить заметку</button>
              </div>
            </form>
            {account.noteItems.length === 0 ? (
              <p className="text-sm text-subtle">Заметок пока нет.</p>
            ) : (
              <ul className="space-y-3">
                {account.noteItems.map((n) => (
                  <li
                    key={n.id}
                    className="border border-border rounded-lg p-3 bg-white"
                  >
                    <div className="text-sm whitespace-pre-wrap">{n.body}</div>
                    <div className="mt-1.5 text-xs text-subtle">
                      {n.author?.name ?? "—"} · {formatDateTime(n.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-subtle shrink-0">{label}</dt>
      <dd className="text-right text-fg truncate">{children}</dd>
    </div>
  );
}
