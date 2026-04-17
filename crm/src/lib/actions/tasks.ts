"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

function parseDate(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function createTask(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const relatedType = String(formData.get("relatedType") ?? "") || null;
  const relatedId = String(formData.get("relatedId") ?? "") || null;

  await prisma.task.create({
    data: {
      title,
      description:
        String(formData.get("description") ?? "").trim() || null,
      dueDate: parseDate(formData.get("dueDate")),
      priority: String(formData.get("priority") ?? "normal"),
      assignedToId:
        String(formData.get("assignedToId") ?? "") || session.user.id,
      relatedType,
      b2cId: relatedType === "b2c" ? relatedId : null,
      b2bId: relatedType === "b2b" ? relatedId : null,
    },
  });

  revalidatePath("/tasks");
  revalidatePath("/");
  if (relatedType === "b2c" && relatedId)
    revalidatePath(`/b2c/${relatedId}`);
  if (relatedType === "b2b" && relatedId)
    revalidatePath(`/b2b/${relatedId}`);
}

export async function toggleTask(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return;
  await prisma.task.update({
    where: { id },
    data: { status: task.status === "done" ? "open" : "done" },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
  if (task.b2cId) revalidatePath(`/b2c/${task.b2cId}`);
  if (task.b2bId) revalidatePath(`/b2b/${task.b2bId}`);
}

export async function deleteTask(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const task = await prisma.task.findUnique({ where: { id } });
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
  revalidatePath("/");
  if (task?.b2cId) revalidatePath(`/b2c/${task.b2cId}`);
  if (task?.b2bId) revalidatePath(`/b2b/${task.b2bId}`);
}
