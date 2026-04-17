import Link from "next/link";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { B2CForm } from "@/components/B2CForm";
import { createB2CClient } from "@/lib/actions/b2c";

export default async function NewB2CPage() {
  const managers = await prisma.user.findMany({ orderBy: { name: "asc" } });
  return (
    <>
      <PageHeader
        title="Новый B2C клиент"
        subtitle="Заполните только то, что уже известно — остальное добавите потом."
        actions={
          <Link href="/b2c" className="btn-outline">
            Отмена
          </Link>
        }
      />
      <div className="card p-6">
        <B2CForm
          action={createB2CClient}
          managers={managers}
          submitLabel="Создать"
        />
      </div>
    </>
  );
}
