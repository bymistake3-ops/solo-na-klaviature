"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function inviteUser(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "admin") throw new Error("Forbidden");

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "member");

  if (!name || !email || password.length < 6)
    throw new Error("Проверьте имя, email и пароль (мин. 6 символов)");

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { name, email, passwordHash, role: role === "admin" ? "admin" : "member" },
  });
  revalidatePath("/team");
}

export async function removeUser(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (session.user.role !== "admin") throw new Error("Forbidden");
  if (session.user.id === id) throw new Error("Нельзя удалить самого себя");

  await prisma.user.delete({ where: { id } });
  revalidatePath("/team");
}
