import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱  Seeding database...");

  // Wipe existing data so running seed is idempotent.
  await prisma.note.deleteMany();
  await prisma.task.deleteMany();
  await prisma.b2CClient.deleteMany();
  await prisma.b2BAccount.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Анна Админова",
      email: "admin@demo.io",
      passwordHash,
      role: "admin",
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: "Иван Менеджеров",
      email: "ivan@demo.io",
      passwordHash,
      role: "member",
    },
  });

  // B2C clients
  const b2c1 = await prisma.b2CClient.create({
    data: {
      name: "Мария Кузнецова",
      email: "maria@example.com",
      phone: "+7 915 111-22-33",
      dealStatus: "negotiation",
      revenue: 28000,
      managerId: manager.id,
      nextContactAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      notes: "Интересуется курсом по Python для школьников.",
    },
  });

  const b2c2 = await prisma.b2CClient.create({
    data: {
      name: "Павел Сидоров",
      email: "pavel@example.com",
      phone: "+7 916 222-33-44",
      dealStatus: "paid",
      revenue: 59000,
      managerId: admin.id,
      notes: "Оплатил годовую подписку на курсы.",
    },
  });

  await prisma.b2CClient.create({
    data: {
      name: "Ольга Белова",
      email: "olga@example.com",
      phone: "+7 925 333-44-55",
      dealStatus: "new",
      revenue: 0,
      managerId: manager.id,
      nextContactAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      notes: "Пришла с рекламы, нужно связаться.",
    },
  });

  await prisma.b2CClient.create({
    data: {
      name: "Сергей Чернов",
      email: "sergey@example.com",
      phone: "+7 903 444-55-66",
      dealStatus: "contacted",
      revenue: 0,
      managerId: manager.id,
      notes: "Запросил программу интенсива.",
    },
  });

  // B2B accounts
  const b2b1 = await prisma.b2BAccount.create({
    data: {
      companyName: "Яркий Путь",
      legalEntity: "ООО «Яркий Путь»",
      contactPerson: "Елена Морозова",
      contacts: "elena@yarkiy.ru · +7 495 111-22-33",
      employeeCount: 120,
      decisionMaker: "Андрей Морозов (CEO)",
      recommendationsCollected: true,
      offeredOfflineSchool: false,
      accountStatus: "active",
      managerId: admin.id,
      lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      nextContactAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
      notes: "Пилот 3 месяца, всё хорошо, обсуждаем продление.",
    },
  });

  const b2b2 = await prisma.b2BAccount.create({
    data: {
      companyName: "ТехноШкола",
      legalEntity: "ООО «ТехноШкола»",
      contactPerson: "Дмитрий Волков",
      contacts: "dv@tech-school.ru",
      employeeCount: 45,
      decisionMaker: "Дмитрий Волков",
      recommendationsCollected: false,
      offeredOfflineSchool: true,
      accountStatus: "needs_contact",
      managerId: manager.id,
      lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
      nextContactAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      notes: "Давно не было касаний — срочно связаться.",
    },
  });

  await prisma.b2BAccount.create({
    data: {
      companyName: "EduLab",
      legalEntity: "АНО «ЭдуЛаб»",
      contactPerson: "Ксения Иванова",
      contacts: "k.ivanova@edulab.io",
      employeeCount: 30,
      decisionMaker: "Ксения Иванова",
      recommendationsCollected: true,
      offeredOfflineSchool: true,
      accountStatus: "expansion",
      managerId: admin.id,
      lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      nextContactAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      notes: "Готовы докупить места и подключить очную школу.",
    },
  });

  await prisma.b2BAccount.create({
    data: {
      companyName: "Росатом-Академия",
      legalEntity: "ФГУП «Росатом-Академия»",
      contactPerson: "Николай Петров",
      contacts: "npetrov@rosatom-a.ru",
      employeeCount: 600,
      decisionMaker: "Николай Петров (HRD)",
      recommendationsCollected: false,
      offeredOfflineSchool: false,
      accountStatus: "churn_risk",
      managerId: manager.id,
      lastContactAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
      nextContactAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      notes: "Подписка заканчивается, активности мало — риск оттока.",
    },
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Позвонить Марии по курсу Python",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
        priority: "high",
        assignedToId: manager.id,
        relatedType: "b2c",
        b2cId: b2c1.id,
      },
      {
        title: "Подготовить КП для Яркого Пути",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        priority: "normal",
        assignedToId: admin.id,
        relatedType: "b2b",
        b2bId: b2b1.id,
      },
      {
        title: "Проверить оплату Павла",
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24),
        priority: "low",
        assignedToId: admin.id,
        relatedType: "b2c",
        b2cId: b2c2.id,
      },
      {
        title: "Связаться с ТехноШколой",
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
        priority: "high",
        assignedToId: manager.id,
        relatedType: "b2b",
        b2bId: b2b2.id,
      },
      {
        title: "Собрать рекомендации от EduLab",
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
        priority: "normal",
        assignedToId: admin.id,
      },
    ],
  });

  // Notes
  await prisma.note.createMany({
    data: [
      {
        body: "Запросила программу курса и скидку 10%.",
        authorId: manager.id,
        b2cId: b2c1.id,
      },
      {
        body: "Подтвердил оплату, выставили счёт.",
        authorId: admin.id,
        b2cId: b2c2.id,
      },
      {
        body: "Обсудили кейс: готовы к масштабированию на другие филиалы.",
        authorId: admin.id,
        b2bId: b2b1.id,
      },
    ],
  });

  console.log("✅  Seed complete.");
  console.log("   Admin:   admin@demo.io / demo1234");
  console.log("   Manager: ivan@demo.io  / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
