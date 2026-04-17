import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { B2CForm } from "@/components/B2CForm";
import {
  updateB2CClient,
  deleteB2CClient,
  addB2CNote,
} from "@/lib/actions/b2c";
import { createTask, toggleTask, deleteTask } from "@/lib/actions/tasks";
import {
  formatDate,
  formatDateTime,
  formatMoney,
  relativeDay,
} from "@/lib/utils";
import { getB2CStatus, getPriority, TASK_PRIORITIES } from "@/lib/constants";

export default async function B2CDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await prisma.b2CClient.findUnique({
    where: { id },
    include: {
      manager: true,
      noteItems: { orderBy: { createdAt: "desc" }, include: { author: true } },
      tasks: { orderBy: [{ status: "asc" }, { dueDate: "asc" }], include: { assignedTo: true } },
    },
  });
  if (!client) notFound();

  const managers = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const status = getB2CStatus(client.dealStatus);
  const rel = relativeDay(client.nextContactAt);

  return (
    <>
      <PageHeader
        title={client.name}
        subtitle={`Создан ${formatDate(client.createdAt)} · Обновлён ${formatDate(
          client.updatedAt,
        )}`}
        actions={
          <>
            <Link href="/b2c" className="btn-ghost">
              ← К списку
            </Link>
            <form
              action={async () => {
                "use server";
                await deleteB2CClient(id);
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
        <Badge tone="muted">Выручка: {formatMoney(client.revenue)}</Badge>
        {rel ? <Badge tone={rel.tone as never}>{rel.label}</Badge> : null}
        {client.manager ? (
          <span className="inline-flex items-center gap-2 text-sm text-subtle">
            <Avatar name={client.manager.name} size={22} />
            {client.manager.name}
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="font-semibold mb-4">Основная информация</h2>
            <B2CForm
              action={async (fd) => {
                "use server";
                await updateB2CClient(id, fd);
              }}
              managers={managers}
              client={client}
              submitLabel="Сохранить изменения"
            />
          </section>

          <section className="card p-6">
            <h2 className="font-semibold mb-4">Задачи</h2>
            <form
              action={async (fd) => {
                "use server";
                fd.set("relatedType", "b2c");
                fd.set("relatedId", id);
                await createTask(fd);
              }}
              className="flex flex-wrap gap-2 mb-4"
            >
              <input
                name="title"
                placeholder="Добавить задачу…"
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
            <TaskList tasks={client.tasks} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="font-semibold mb-3">Заметки</h2>
            <form
              action={async (fd) => {
                "use server";
                await addB2CNote(id, fd);
              }}
              className="space-y-2 mb-4"
            >
              <textarea
                name="body"
                className="textarea"
                rows={3}
                required
                placeholder="Записать краткую заметку по клиенту…"
              />
              <div className="flex justify-end">
                <button className="btn-outline">Добавить заметку</button>
              </div>
            </form>

            {client.noteItems.length === 0 ? (
              <p className="text-sm text-subtle">Заметок пока нет.</p>
            ) : (
              <ul className="space-y-3">
                {client.noteItems.map((n) => (
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

function TaskList({
  tasks,
}: {
  tasks: {
    id: string;
    title: string;
    status: string;
    dueDate: Date | null;
    priority: string;
    assignedTo: { name: string } | null;
  }[];
}) {
  if (tasks.length === 0)
    return <p className="text-sm text-subtle">Задач пока нет.</p>;

  return (
    <ul className="divide-y divide-border">
      {tasks.map((t) => {
        const p = getPriority(t.priority);
        const rel = relativeDay(t.dueDate);
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
                aria-label="Переключить задачу"
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
                {rel ? <Badge tone={rel.tone as never}>{rel.label}</Badge> : null}
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
              <button className="text-subtle hover:text-red-600 text-xs px-2" title="Удалить">
                ×
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
