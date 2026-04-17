"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

function parseDate(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function createB2CClient(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Имя обязательно");

  const client = await prisma.b2CClient.create({
    data: {
      name,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      dealStatus: String(formData.get("dealStatus") ?? "new"),
      revenue: Number(formData.get("revenue") ?? 0) || 0,
      managerId: String(formData.get("managerId") ?? "") || session.user.id,
      nextContactAt: parseDate(formData.get("nextContactAt")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath("/b2c");
  revalidatePath("/");
  redirect(`/b2c/${client.id}`);
}

export async function updateB2CClient(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.b2CClient.update({
    where: { id },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      dealStatus: String(formData.get("dealStatus") ?? "new"),
      revenue: Number(formData.get("revenue") ?? 0) || 0,
      managerId: String(formData.get("managerId") ?? "") || null,
      nextContactAt: parseDate(formData.get("nextContactAt")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath("/b2c");
  revalidatePath(`/b2c/${id}`);
  revalidatePath("/");
}

export async function deleteB2CClient(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.b2CClient.delete({ where: { id } });
  revalidatePath("/b2c");
  revalidatePath("/");
  redirect("/b2c");
}

export async function addB2CNote(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await prisma.note.create({
    data: {
      body,
      authorId: session.user.id,
      b2cId: id,
    },
  });
  revalidatePath(`/b2c/${id}`);
}
