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

export async function createB2BAccount(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const companyName = String(formData.get("companyName") ?? "").trim();
  if (!companyName) throw new Error("Название компании обязательно");

  const account = await prisma.b2BAccount.create({
    data: {
      companyName,
      legalEntity: String(formData.get("legalEntity") ?? "").trim() || null,
      contactPerson:
        String(formData.get("contactPerson") ?? "").trim() || null,
      contacts: String(formData.get("contacts") ?? "").trim() || null,
      employeeCount: Number(formData.get("employeeCount") ?? 0) || null,
      decisionMaker:
        String(formData.get("decisionMaker") ?? "").trim() || null,
      recommendationsCollected:
        formData.get("recommendationsCollected") === "on",
      offeredOfflineSchool: formData.get("offeredOfflineSchool") === "on",
      accountStatus: String(formData.get("accountStatus") ?? "active"),
      managerId: String(formData.get("managerId") ?? "") || session.user.id,
      lastContactAt: parseDate(formData.get("lastContactAt")),
      nextContactAt: parseDate(formData.get("nextContactAt")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath("/b2b");
  revalidatePath("/");
  redirect(`/b2b/${account.id}`);
}

export async function updateB2BAccount(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.b2BAccount.update({
    where: { id },
    data: {
      companyName: String(formData.get("companyName") ?? "").trim(),
      legalEntity: String(formData.get("legalEntity") ?? "").trim() || null,
      contactPerson:
        String(formData.get("contactPerson") ?? "").trim() || null,
      contacts: String(formData.get("contacts") ?? "").trim() || null,
      employeeCount: Number(formData.get("employeeCount") ?? 0) || null,
      decisionMaker:
        String(formData.get("decisionMaker") ?? "").trim() || null,
      recommendationsCollected:
        formData.get("recommendationsCollected") === "on",
      offeredOfflineSchool: formData.get("offeredOfflineSchool") === "on",
      accountStatus: String(formData.get("accountStatus") ?? "active"),
      managerId: String(formData.get("managerId") ?? "") || null,
      lastContactAt: parseDate(formData.get("lastContactAt")),
      nextContactAt: parseDate(formData.get("nextContactAt")),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  revalidatePath("/b2b");
  revalidatePath(`/b2b/${id}`);
  revalidatePath("/");
}

export async function deleteB2BAccount(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  await prisma.b2BAccount.delete({ where: { id } });
  revalidatePath("/b2b");
  revalidatePath("/");
  redirect("/b2b");
}

export async function addB2BNote(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  await prisma.note.create({
    data: {
      body,
      authorId: session.user.id,
      b2bId: id,
    },
  });
  revalidatePath(`/b2b/${id}`);
}
