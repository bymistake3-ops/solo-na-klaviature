import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { inviteUser, removeUser } from "@/lib/actions/team";
import { formatDate } from "@/lib/utils";

export default async function TeamPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: { b2cClients: true, b2bAccounts: true, tasks: true },
      },
    },
  });

  return (
    <>
      <PageHeader
        title="Команда"
        subtitle={`${users.length} участников · общая база для всех`}
      />

      {isAdmin && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold mb-3">Добавить участника</h2>
          <form action={inviteUser} className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input
              name="name"
              required
              placeholder="Имя"
              className="input md:col-span-1"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="email"
              className="input md:col-span-2"
            />
            <input
              name="password"
              required
              minLength={6}
              placeholder="Пароль (мин. 6)"
              className="input"
            />
            <div className="flex gap-2">
              <select name="role" defaultValue="member" className="input">
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
              <button className="btn-primary shrink-0">Пригласить</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr className="text-left">
              <th className="table-head px-4 py-3">Участник</th>
              <th className="table-head px-4 py-3">Роль</th>
              <th className="table-head px-4 py-3">B2C</th>
              <th className="table-head px-4 py-3">B2B</th>
              <th className="table-head px-4 py-3">Задачи</th>
              <th className="table-head px-4 py-3">Присоединился</th>
              {isAdmin && <th className="table-head px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="row-hover">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} />
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-subtle">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={u.role === "admin" ? "brand" : "muted"}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3 tabular-nums">{u._count.b2cClients}</td>
                <td className="px-4 py-3 tabular-nums">
                  {u._count.b2bAccounts}
                </td>
                <td className="px-4 py-3 tabular-nums">{u._count.tasks}</td>
                <td className="px-4 py-3 text-subtle whitespace-nowrap">
                  {formatDate(u.createdAt)}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    {session?.user?.id !== u.id ? (
                      <form
                        action={async () => {
                          "use server";
                          await removeUser(u.id);
                        }}
                      >
                        <button className="text-xs text-subtle hover:text-red-600">
                          Удалить
                        </button>
                      </form>
                    ) : (
                      <span className="text-xs text-subtle">это вы</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
