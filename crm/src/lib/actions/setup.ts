"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";

export async function createFirstAdmin(formData: FormData) {
  const count = await prisma.user.count();
  if (count > 0) {
    throw new Error("Админ уже создан — используйте обычный вход.");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name) throw new Error("Введите имя");
  if (!email.includes("@")) throw new Error("Введите корректный email");
  if (password.length < 6)
    throw new Error("Пароль должен быть не короче 6 символов");

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email, passwordHash, role: "admin" },
  });

  await signIn("credentials", { email, password, redirectTo: "/" });
}
