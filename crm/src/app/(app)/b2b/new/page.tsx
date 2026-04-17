import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { B2BForm } from "@/components/B2BForm";
import { createB2BAccount } from "@/lib/actions/b2b";

export default async function NewB2BPage() {
  const managers = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader
        title="Новая компания"
        subtitle="Заполните ключевые поля — остальное добавите позже."
        actions={
          <Link href="/b2b" className="btn-outline">
            Отмена
          </Link>
        }
      />
      <div className="card p-6">
        <B2BForm
          action={createB2BAccount}
          managers={managers}
          submitLabel="Создать"
        />
      </div>
    </>
  );
}
