import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const params = await searchParams;

  async function login(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-muted px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-8 w-8 rounded-lg bg-brand text-brand-fg grid place-items-center font-bold">
            E
          </div>
          <div className="text-lg font-semibold tracking-tight">EduCRM</div>
        </div>

        <div className="card p-6">
          <h1 className="text-lg font-semibold">Войти в CRM</h1>
          <p className="mt-1 text-sm text-subtle">
            Демо-доступ:{" "}
            <span className="font-medium text-fg">admin@demo.io</span> /
            <span className="font-medium text-fg"> demo1234</span>
          </p>

          <form action={login} className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <label className="label" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue="admin@demo.io"
                className="input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="label" htmlFor="password">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                defaultValue="demo1234"
                className="input"
              />
            </div>

            {params.error ? (
              <div className="rounded-lg bg-red-50 text-red-700 ring-1 ring-red-200 px-3 py-2 text-sm">
                Неверный email или пароль.
              </div>
            ) : null}

            <button type="submit" className="btn-primary w-full mt-2">
              Войти
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-subtle">
          EdTech CRM · простая и быстрая
        </p>
      </div>
    </div>
  );
}
