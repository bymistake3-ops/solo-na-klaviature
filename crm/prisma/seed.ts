import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const day = (offset: number) =>
  new Date(Date.now() + offset * 1000 * 60 * 60 * 24);

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

  // -------------------- B2C заявки --------------------
  const b2cSeed = [
    {
      name: "Мария Кузнецова",
      email: "maria.k@gmail.com",
      phone: "+7 915 111-22-33",
      dealStatus: "negotiation",
      revenue: 28000,
      managerId: manager.id,
      nextContactAt: day(1),
      notes:
        "Источник: Instagram Ads. Интересуется курсом Python для школьника (13 лет). Просила программу и пример урока.",
    },
    {
      name: "Павел Сидоров",
      email: "pavel.sidorov@yandex.ru",
      phone: "+7 916 222-33-44",
      dealStatus: "paid",
      revenue: 59000,
      managerId: admin.id,
      notes: "Оплатил годовую подписку на курсы. Счёт закрыт 12 апреля.",
    },
    {
      name: "Ольга Белова",
      email: "olga.belova@mail.ru",
      phone: "+7 925 333-44-55",
      dealStatus: "new",
      revenue: 0,
      managerId: manager.id,
      nextContactAt: day(-1),
      notes:
        "Источник: таргет ВК. Оставила заявку вчера вечером, нужно перезвонить сегодня.",
    },
    {
      name: "Сергей Чернов",
      email: "sergey.chernov@gmail.com",
      phone: "+7 903 444-55-66",
      dealStatus: "contacted",
      revenue: 0,
      managerId: manager.id,
      nextContactAt: day(2),
      notes:
        "Запросил программу интенсива по веб-разработке. Отправил PDF, ждёт обратной связи.",
    },
    {
      name: "Екатерина Смирнова",
      email: "e.smirnova@list.ru",
      phone: "+7 967 555-66-77",
      dealStatus: "new",
      revenue: 0,
      managerId: admin.id,
      nextContactAt: day(0),
      notes:
        "Заявка с лендинга. Хочет узнать про курс для дочери 10 лет. Позвонить сегодня до 18:00.",
    },
    {
      name: "Алексей Фёдоров",
      email: "alexey.fedorov@outlook.com",
      phone: "+7 985 666-77-88",
      dealStatus: "negotiation",
      revenue: 45000,
      managerId: admin.id,
      nextContactAt: day(3),
      notes:
        "Выбирает между нашим курсом и конкурентом. Нужна финальная встреча с демо-уроком.",
    },
    {
      name: "Наталья Попова",
      email: "natalia.popova@gmail.com",
      phone: "+7 926 777-88-99",
      dealStatus: "paid",
      revenue: 72000,
      managerId: manager.id,
      notes:
        "Оплатила 2 курса (для двух детей) — скидка 10% применена. Рекомендовала знакомым.",
    },
    {
      name: "Дмитрий Орлов",
      email: "orlov.d@gmail.com",
      phone: "+7 999 888-99-00",
      dealStatus: "contacted",
      revenue: 0,
      managerId: manager.id,
      nextContactAt: day(5),
      notes:
        "Пришёл с вебинара 10 апреля. Отправили материалы, договорились созвониться на следующей неделе.",
    },
    {
      name: "Ирина Лебедева",
      email: "irina.lebedeva@yandex.ru",
      phone: "+7 910 123-45-67",
      dealStatus: "new",
      revenue: 0,
      managerId: manager.id,
      nextContactAt: day(-2),
      notes:
        "⚠ Просроченная заявка с формы «Пробный урок». Уже 2 дня без связи — сегодня приоритет.",
    },
    {
      name: "Владимир Макаров",
      email: "v.makarov@gmail.com",
      phone: "+7 977 234-56-78",
      dealStatus: "closed",
      revenue: 0,
      managerId: admin.id,
      notes:
        "Отказался — выбрал формат очного обучения в другой школе. Предложить оффлайн-школу, когда запустим.",
    },
    {
      name: "Татьяна Зайцева",
      email: "tatiana.z@mail.ru",
      phone: "+7 905 345-67-89",
      dealStatus: "paid",
      revenue: 39000,
      managerId: manager.id,
      notes:
        "Оплатила базовый курс. Потенциал апсейла до продвинутого через 2 месяца.",
    },
    {
      name: "Артём Новиков",
      email: "artem.novikov@gmail.com",
      phone: "+7 962 456-78-90",
      dealStatus: "negotiation",
      revenue: 35000,
      managerId: admin.id,
      nextContactAt: day(1),
      notes:
        "Обсуждаем рассрочку на 3 платежа. Завтра отправить реквизиты и договор.",
    },
    {
      name: "Юлия Соколова",
      email: "yulia.sokolova@icloud.com",
      phone: "+7 919 567-89-01",
      dealStatus: "contacted",
      revenue: 0,
      managerId: manager.id,
      nextContactAt: day(7),
      notes:
        "Уточняла расписание на осень. Вернётся в августе — поставили долгий follow-up.",
    },
    {
      name: "Михаил Громов",
      email: "mikhail.gromov@yandex.ru",
      phone: "+7 906 678-90-12",
      dealStatus: "closed",
      revenue: 0,
      managerId: manager.id,
      notes: "Не дошёл до оплаты — пропал после трёх попыток связи.",
    },
  ];

  const createdB2C = await Promise.all(
    b2cSeed.map((data) => prisma.b2CClient.create({ data })),
  );

  // -------------------- B2B заявки --------------------
  const b2bSeed = [
    {
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
      lastContactAt: day(-3),
      nextContactAt: day(4),
      notes:
        "Пилот 3 месяца, 40 сотрудников. Результаты хорошие, обсуждаем продление на год и расширение.",
    },
    {
      companyName: "ТехноШкола",
      legalEntity: "ООО «ТехноШкола»",
      contactPerson: "Дмитрий Волков",
      contacts: "dv@tech-school.ru · +7 812 222-33-44",
      employeeCount: 45,
      decisionMaker: "Дмитрий Волков (основатель)",
      recommendationsCollected: false,
      offeredOfflineSchool: true,
      accountStatus: "needs_contact",
      managerId: manager.id,
      lastContactAt: day(-14),
      nextContactAt: day(-2),
      notes:
        "⚠ Давно не было касаний — срочно связаться. Интересовались онбордингом преподавателей.",
    },
    {
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
      lastContactAt: day(-2),
      nextContactAt: day(10),
      notes:
        "Готовы докупить 20 мест и подключить очную школу. Отправили КП, ждём решения совета.",
    },
    {
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
      lastContactAt: day(-30),
      nextContactAt: day(1),
      notes:
        "Подписка заканчивается через 40 дней, активности мало. Готовим план удержания.",
    },
    {
      companyName: "Skillbox Corporate",
      legalEntity: "ООО «Скиллбокс Корп»",
      contactPerson: "Анастасия Жукова",
      contacts: "a.zhukova@sb-corp.ru · +7 495 888-77-66",
      employeeCount: 250,
      decisionMaker: "Анастасия Жукова (L&D Lead)",
      recommendationsCollected: false,
      offeredOfflineSchool: false,
      accountStatus: "needs_contact",
      managerId: admin.id,
      lastContactAt: day(-5),
      nextContactAt: day(0),
      notes:
        "Новая входящая заявка через LinkedIn. Запросили демо-доступ — сегодня назначить встречу.",
    },
    {
      companyName: "IT Академия Самсунг",
      legalEntity: "ООО «Самсунг Электроникс Рус»",
      contactPerson: "Олег Соловьёв",
      contacts: "oleg.solovev@samsung.ru",
      employeeCount: 180,
      decisionMaker: "Департамент HR + IT",
      recommendationsCollected: true,
      offeredOfflineSchool: true,
      accountStatus: "active",
      managerId: admin.id,
      lastContactAt: day(-7),
      nextContactAt: day(14),
      notes:
        "Второй год работы. Всё стабильно, ежемесячные отчёты вовремя. NPS = 9.",
    },
    {
      companyName: "Школа 21",
      legalEntity: "АНО «Школа 21»",
      contactPerson: "Ирина Белова",
      contacts: "i.belova@21-school.ru",
      employeeCount: 90,
      decisionMaker: "Ирина Белова (методист)",
      recommendationsCollected: false,
      offeredOfflineSchool: true,
      accountStatus: "expansion",
      managerId: manager.id,
      lastContactAt: day(-1),
      nextContactAt: day(6),
      notes:
        "Обсуждаем совместный оффлайн-модуль для их кампуса. Нужно КП на след. неделю.",
    },
    {
      companyName: "Центр «Наука и Дети»",
      legalEntity: "ЧОУ «Наука и Дети»",
      contactPerson: "Марина Фомина",
      contacts: "mf@nauka-deti.ru · @marina_nauka",
      employeeCount: 25,
      decisionMaker: "Марина Фомина (директор)",
      recommendationsCollected: false,
      offeredOfflineSchool: false,
      accountStatus: "paused",
      managerId: manager.id,
      lastContactAt: day(-20),
      nextContactAt: day(30),
      notes:
        "Взяли паузу до сентября — летние каникулы. Запланированный ре-кик после лета.",
    },
    {
      companyName: "Газпром Учебный Центр",
      legalEntity: "ООО «Газпром УЦ»",
      contactPerson: "Виктор Смирнов",
      contacts: "vsmirnov@gazprom-uc.ru · +7 495 999-88-77",
      employeeCount: 400,
      decisionMaker: "Тендерная комиссия",
      recommendationsCollected: false,
      offeredOfflineSchool: false,
      accountStatus: "needs_contact",
      managerId: admin.id,
      lastContactAt: day(-10),
      nextContactAt: day(3),
      notes:
        "Заявка через тендерную площадку. Подготовить пакет документов и коммерческое.",
    },
    {
      companyName: "Yandex Practicum B2B",
      legalEntity: "ООО «Яндекс.Практикум»",
      contactPerson: "Елена Карпова",
      contacts: "e.karpova@practicum.yandex.ru",
      employeeCount: 350,
      decisionMaker: "Команда партнёрств",
      recommendationsCollected: true,
      offeredOfflineSchool: false,
      accountStatus: "active",
      managerId: admin.id,
      lastContactAt: day(-4),
      nextContactAt: day(20),
      notes: "Партнёрство: совместный курс для корпоративных клиентов.",
    },
    {
      companyName: "HSE Lyceum",
      legalEntity: "НИУ ВШЭ — Лицей",
      contactPerson: "Павел Жуков",
      contacts: "pzhukov@hse.ru",
      employeeCount: 80,
      decisionMaker: "Совет лицея",
      recommendationsCollected: false,
      offeredOfflineSchool: true,
      accountStatus: "expansion",
      managerId: manager.id,
      lastContactAt: day(-3),
      nextContactAt: day(8),
      notes:
        "Пилот прошёл успешно, обсуждаем масштабирование на 3 класса + летнюю школу.",
    },
    {
      companyName: "Учи.ру Enterprise",
      legalEntity: "ООО «УЧИ.РУ»",
      contactPerson: "Денис Баранов",
      contacts: "d.baranov@uchi.ru · +7 495 777-66-55",
      employeeCount: 500,
      decisionMaker: "Product + BizDev",
      recommendationsCollected: false,
      offeredOfflineSchool: false,
      accountStatus: "churn_risk",
      managerId: admin.id,
      lastContactAt: day(-45),
      nextContactAt: day(2),
      notes:
        "⚠ Очень холодно: 45 дней без контакта. Готовим план реактивации и NPS-опрос.",
    },
  ];

  const createdB2B = await Promise.all(
    b2bSeed.map((data) => prisma.b2BAccount.create({ data })),
  );

  // Карта для привязки задач и заметок
  const b2c = Object.fromEntries(createdB2C.map((c) => [c.name, c]));
  const b2b = Object.fromEntries(
    createdB2B.map((a) => [a.companyName, a]),
  );

  // -------------------- Задачи --------------------
  await prisma.task.createMany({
    data: [
      {
        title: "Позвонить Марии по курсу Python",
        dueDate: day(1),
        priority: "high",
        assignedToId: manager.id,
        relatedType: "b2c",
        b2cId: b2c["Мария Кузнецова"].id,
      },
      {
        title: "Перезвонить Ольге — заявка вчера",
        dueDate: day(0),
        priority: "high",
        assignedToId: manager.id,
        relatedType: "b2c",
        b2cId: b2c["Ольга Белова"].id,
      },
      {
        title: "Отправить договор Артёму (рассрочка)",
        dueDate: day(1),
        priority: "high",
        assignedToId: admin.id,
        relatedType: "b2c",
        b2cId: b2c["Артём Новиков"].id,
      },
      {
        title: "Перезвонить Ирине (просрочено 2 дня)",
        dueDate: day(-2),
        priority: "high",
        assignedToId: manager.id,
        relatedType: "b2c",
        b2cId: b2c["Ирина Лебедева"].id,
      },
      {
        title: "Демо-урок для Алексея Фёдорова",
        dueDate: day(3),
        priority: "normal",
        assignedToId: admin.id,
        relatedType: "b2c",
        b2cId: b2c["Алексей Фёдоров"].id,
      },
      {
        title: "Предложить апсейл Татьяне",
        dueDate: day(14),
        priority: "low",
        assignedToId: manager.id,
        relatedType: "b2c",
        b2cId: b2c["Татьяна Зайцева"].id,
      },
      {
        title: "Созвон с Екатериной (лидом с лендинга)",
        dueDate: day(0),
        priority: "high",
        assignedToId: admin.id,
        relatedType: "b2c",
        b2cId: b2c["Екатерина Смирнова"].id,
      },
      {
        title: "Подготовить КП для Яркого Пути",
        dueDate: day(2),
        priority: "normal",
        assignedToId: admin.id,
        relatedType: "b2b",
        b2bId: b2b["Яркий Путь"].id,
      },
      {
        title: "Срочно связаться с ТехноШколой",
        dueDate: day(-2),
        priority: "high",
        assignedToId: manager.id,
        relatedType: "b2b",
        b2bId: b2b["ТехноШкола"].id,
      },
      {
        title: "Собрать рекомендации от EduLab",
        dueDate: day(5),
        priority: "normal",
        assignedToId: admin.id,
        relatedType: "b2b",
        b2bId: b2b["EduLab"].id,
      },
      {
        title: "План удержания Росатом-Академии",
        dueDate: day(1),
        priority: "high",
        assignedToId: manager.id,
        relatedType: "b2b",
        b2bId: b2b["Росатом-Академия"].id,
      },
      {
        title: "Демо Skillbox Corporate",
        dueDate: day(0),
        priority: "high",
        assignedToId: admin.id,
        relatedType: "b2b",
        b2bId: b2b["Skillbox Corporate"].id,
      },
      {
        title: "Документы для тендера Газпром УЦ",
        dueDate: day(3),
        priority: "high",
        assignedToId: admin.id,
        relatedType: "b2b",
        b2bId: b2b["Газпром Учебный Центр"].id,
      },
      {
        title: "КП по оффлайн-модулю Школе 21",
        dueDate: day(6),
        priority: "normal",
        assignedToId: manager.id,
        relatedType: "b2b",
        b2bId: b2b["Школа 21"].id,
      },
      {
        title: "Реактивация Учи.ру — план + NPS",
        dueDate: day(2),
        priority: "high",
        assignedToId: admin.id,
        relatedType: "b2b",
        b2bId: b2b["Учи.ру Enterprise"].id,
      },
      {
        title: "Еженедельный синк по воронке",
        dueDate: day(2),
        priority: "normal",
        assignedToId: admin.id,
      },
      {
        title: "Проверить оплату Павла",
        dueDate: day(-1),
        priority: "low",
        assignedToId: admin.id,
        relatedType: "b2c",
        b2cId: b2c["Павел Сидоров"].id,
        status: "done",
      },
    ],
  });

  // -------------------- Заметки --------------------
  await prisma.note.createMany({
    data: [
      {
        body: "Запросила программу курса и скидку 10%. Ребёнку 13 лет, уровень — начинающий.",
        authorId: manager.id,
        b2cId: b2c["Мария Кузнецова"].id,
      },
      {
        body: "Подтвердил оплату, выставили счёт на 59 000 ₽. Доступ выдан.",
        authorId: admin.id,
        b2cId: b2c["Павел Сидоров"].id,
      },
      {
        body: "Готова рекомендовать знакомым — обсудили реферальную программу.",
        authorId: manager.id,
        b2cId: b2c["Наталья Попова"].id,
      },
      {
        body: "Сравнивает с конкурентом «Алгоритмика». Нужен сильный аргумент по методике.",
        authorId: admin.id,
        b2cId: b2c["Алексей Фёдоров"].id,
      },
      {
        body: "Обсудили кейс: готовы к масштабированию на другие филиалы.",
        authorId: admin.id,
        b2bId: b2b["Яркий Путь"].id,
      },
      {
        body: "Запросили отчёт по прогрессу сотрудников за 3 месяца — отправили PDF.",
        authorId: admin.id,
        b2bId: b2b["IT Академия Самсунг"].id,
      },
      {
        body: "Тендер закрыт: бюджет 2.4 млн на год, 5 конкурентов. Сильный кейс с Яндексом.",
        authorId: admin.id,
        b2bId: b2b["Газпром Учебный Центр"].id,
      },
      {
        body: "После звонка — готовы докупить 20 мест. Ждут КП до конца недели.",
        authorId: admin.id,
        b2bId: b2b["EduLab"].id,
      },
      {
        body: "Последние 6 недель активность упала на 60%. Запросили NPS-опрос у команды клиента.",
        authorId: admin.id,
        b2bId: b2b["Учи.ру Enterprise"].id,
      },
    ],
  });

  console.log(`✅  Seed complete.`);
  console.log(
    `   Users:        2 (admin + member)`,
  );
  console.log(`   B2C заявок:   ${createdB2C.length}`);
  console.log(`   B2B аккаунтов: ${createdB2B.length}`);
  console.log(`   Admin:   admin@demo.io / demo1234`);
  console.log(`   Manager: ivan@demo.io  / demo1234`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
