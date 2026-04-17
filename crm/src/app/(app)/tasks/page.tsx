import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { createTask, toggleTask, deleteTask } from "@/lib/actions/tasks";
import { formatDate, relativeDay } from "@/lib/utils";
import { getPriority, TASK_PRIORITIES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ assignee?: string; show?: string }>;
}) {
  const sp = await searchParams;
  const assignee = sp.assignee ?? "";
  const show = sp.show ?? "open"; // open | all | done

  const where: {
    assignedToId?: string;
    status?: string;
  } = {};
  if (assignee) where.assignedToId = assignee;
  if (show === "open") where.status = "open";
  if (show === "done") where.status = "done";

  const [tasks, managers] = await Promise.all([
    prisma.task.findMany({
      where,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: { assignedTo: true, b2c: true, b2b: true },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  const now = new Date();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const overdue = tasks.filter(
    (t) => t.status === "open" && t.dueDate && t.dueDate < now,
  );
  const todayTasks = tasks.filter(
    (t) =>
      t.status === "open" &&
      t.dueDate &&
      t.dueDate >= now &&
      t.dueDate <= today,
  );
  const upcoming = tasks.filter(
    (t) => t.status === "open" && t.dueDate && t.dueDate > today,
  );
  const noDate = tasks.filter((t) => t.status === "open" && !t.dueDate);
  const done = tasks.filter((t) => t.status === "done");

  return (
    <>
      <PageHeader
        title="Задачи и напоминания"
        subtitle={`${tasks.filter((t) => t.status === "open").length} открытых задач`}
      />

      <div className="card p-5 mb-6">
        <form action={createTask} className="flex flex-wrap gap-2">
          <input
            name="title"
            placeholder="Новая задача…"
            className="input flex-1 min-w-[240px]"
            required
          />
          <input name="dueDate" type="date" className="input max-w-[180px]" />
          <select name="priority" defaultValue="normal" className="input max-w-[160px]">
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select name="assignedToId" defaultValue="" className="input max-w-[200px]">
            <option value="">Автор как ответственный</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button className="btn-primary">Добавить задачу</button>
        </form>
      </div>

      <form className="flex flex-wrap gap-2 mb-6">
        <select name="assignee" defaultValue={assignee} className="input max-w-[220px]">
          <option value="">Все ответственные</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <select name="show" defaultValue={show} className="input max-w-[180px]">
          <option value="open">Только открытые</option>
          <option value="all">Все</option>
          <option value="done">Выполненные</option>
        </select>
        <button className="btn-outline">Применить</button>
        {(assignee || show !== "open") && (
          <Link href="/tasks" className="btn-ghost">
            Сбросить
          </Link>
        )}
      </form>

      {tasks.length === 0 ? (
        <Empty
          title="Задач пока нет"
          description="Создайте первую задачу — она появится здесь и в карточке клиента."
        />
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <Group title="Просрочено" tone="danger" tasks={overdue} />
          )}
          {todayTasks.length > 0 && (
            <Group title="Сегодня" tone="warn" tasks={todayTasks} />
          )}
          {upcoming.length > 0 && (
            <Group title="Скоро" tone="brand" tasks={upcoming} />
          )}
          {noDate.length > 0 && (
            <Group title="Без даты" tone="muted" tasks={noDate} />
          )}
          {show !== "open" && done.length > 0 && (
            <Group title="Выполнено" tone="success" tasks={done} />
          )}
        </div>
      )}
    </>
  );
}

type TaskWithRefs = {
  id: string;
  title: string;
  status: string;
  dueDate: Date | null;
  priority: string;
  assignedTo: { name: string } | null;
  b2c: { id: string; name: string } | null;
  b2b: { id: string; companyName: string } | null;
};

function Group({
  title,
  tone,
  tasks,
}: {
  title: string;
  tone: "brand" | "muted" | "success" | "warn" | "danger";
  tasks: TaskWithRefs[];
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold text-fg">{title}</h2>
        <Badge tone={tone}>{tasks.length}</Badge>
      </div>
      <div className="card divide-y divide-border">
        {tasks.map((t) => {
          const p = getPriority(t.priority);
          const rel = relativeDay(t.dueDate);
          return (
            <div key={t.id} className="flex items-center gap-3 px-4 py-3">
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
                  aria-label="Переключить"
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
                <div className="text-xs text-subtle mt-0.5 flex flex-wrap items-center gap-2">
                  {t.dueDate ? <span>{formatDate(t.dueDate)}</span> : null}
                  {rel ? <Badge tone={rel.tone as never}>{rel.label}</Badge> : null}
                  {t.assignedTo ? <span>· {t.assignedTo.name}</span> : null}
                  {t.b2c ? (
                    <Link
                      href={`/b2c/${t.b2c.id}`}
                      className="text-brand hover:underline"
                    >
                      · B2C: {t.b2c.name}
                    </Link>
                  ) : null}
                  {t.b2b ? (
                    <Link
                      href={`/b2b/${t.b2b.id}`}
                      className="text-brand hover:underline"
                    >
                      · B2B: {t.b2b.companyName}
                    </Link>
                  ) : null}
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
