# EduCRM — компактная CRM для EdTech-стартапа

Простая, аккуратная и быстрая CRM для маленькой команды. Объединяет два потока клиентов — **B2C** и **B2B** — в одной базе, с задачами, напоминаниями и командным доступом.

Главный приоритет — **простота, удобство и чистый UI**. Никакого «комбайна»: только то, что реально нужно каждый день.

---

## Что умеет

### Основное
- 📊 **Дашборд** — B2C/B2B/задачи/напоминания на сегодня, выручка, блок «требует внимания»
- 👥 **B2C клиенты** — список, поиск, фильтры (статус, менеджер), CRUD, заметки, задачи
- 🏢 **B2B аккаунты** — карточки компаний, ЛПР, статус, рекомендации ✓/—, очная школа ✓/—, даты контактов
- ✅ **Задачи и напоминания** — просрочено / сегодня / скоро / без даты, привязка к B2C/B2B
- 👤 **Команда** — список, роли admin/member, приглашение пользователей, статистика по каждому
- 🔐 **Авторизация** — Auth.js (credentials), общий доступ к единой базе, роли

### UX-детали
- Быстрые кнопки «+ B2C» / «+ Компания» на дашборде и в списках
- Inline-статусы (цветные бейджи)
- Relative-даты (`Сегодня`, `Завтра`, `Просрочено на 3 дн.`)
- Чекбоксы переключения задач одним кликом (через server actions, без JS-библиотек)
- Пустые состояния и подсказки
- Адаптивный layout с десктопным сайдбаром и мобильным табом навигации

---

## Стек

| Слой      | Решение |
|-----------|---------|
| Frontend  | Next.js 15 App Router · React 19 · TypeScript |
| Стили     | Tailwind CSS · собственные shadcn-style компоненты (без отдельной CLI) |
| Бэкенд    | Next.js server actions |
| БД        | **SQLite** (dev, zero-setup) · при желании переключается на PostgreSQL одной строчкой |
| ORM       | Prisma 5 |
| Auth      | Auth.js v5 (next-auth beta) · JWT-сессии · bcrypt |

### Почему SQLite для MVP
Быстрый старт без поднятия контейнеров. Схема полностью совместима с PostgreSQL —
чтобы перейти на прод-БД, нужно только:

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

и поменять `DATABASE_URL` на строку Postgres.

---

## Быстрый старт

Требуется Node.js 20+.

```bash
cd crm
cp .env.example .env
npm install
npm run setup      # prisma db push + сиды (демо-пользователи и данные)
npm run dev        # http://localhost:3001
```

### Демо-доступ

| Роль   | Email           | Пароль     |
|--------|-----------------|------------|
| admin  | admin@demo.io   | demo1234   |
| member | ivan@demo.io    | demo1234   |

### Полезные команды

```bash
npm run dev         # dev-сервер на :3001
npm run build       # production-билд
npm run start       # запуск production-билда
npm run db:push     # применить schema.prisma к БД
npm run db:seed     # засеять демо-данные
npm run db:studio   # Prisma Studio (GUI для БД)
```

---

## Структура проекта

```
crm/
├── prisma/
│   ├── schema.prisma           # User, B2CClient, B2BAccount, Task, Note
│   └── seed.ts                 # демо-данные (2 юзера, 4 B2C, 4 B2B, 5 задач)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # корневой layout
│   │   ├── globals.css         # Tailwind + компонентный слой (input, btn, card…)
│   │   ├── login/page.tsx      # экран входа
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   └── (app)/              # все экраны под авторизацией
│   │       ├── layout.tsx      # sidebar + mobile nav + guard
│   │       ├── page.tsx        # Dashboard
│   │       ├── b2c/
│   │       │   ├── page.tsx           # список
│   │       │   ├── new/page.tsx       # создание
│   │       │   └── [id]/page.tsx      # карточка + задачи + заметки
│   │       ├── b2b/
│   │       │   ├── page.tsx
│   │       │   ├── new/page.tsx
│   │       │   └── [id]/page.tsx
│   │       ├── tasks/page.tsx  # Задачи/напоминания (единый экран)
│   │       └── team/page.tsx   # Команда + приглашения (admin)
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── MobileNav.tsx
│   │   ├── B2CForm.tsx
│   │   ├── B2BForm.tsx
│   │   └── ui/ (Badge, Avatar, Empty, PageHeader)
│   ├── lib/
│   │   ├── auth.ts             # NextAuth (Node runtime, с Prisma)
│   │   ├── auth.config.ts      # edge-safe конфиг для middleware
│   │   ├── db.ts               # Prisma client (singleton)
│   │   ├── utils.ts            # formatMoney/formatDate/relativeDay/…
│   │   ├── constants.ts        # статусы сделок/аккаунтов, тона бейджей
│   │   └── actions/
│   │       ├── b2c.ts          # create/update/delete/addNote
│   │       ├── b2b.ts
│   │       ├── tasks.ts        # create/toggle/delete
│   │       ├── team.ts         # invite/remove (admin only)
│   │       └── session.ts      # signOut
│   └── types/next-auth.d.ts
├── middleware.ts               # защита всех роутов, кроме /login и /api/auth
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── .env.example
└── package.json
```

---

## Модель данных

```
User (id, name, email, passwordHash, role)
  ├─ B2CClient[]     managerId → User
  ├─ B2BAccount[]    managerId → User
  ├─ Task[]          assignedToId → User
  └─ Note[]          authorId → User

B2CClient (name, email, phone, dealStatus, revenue, nextContactAt, notes)
  ├─ Note[]
  └─ Task[]

B2BAccount (companyName, legalEntity, contactPerson, contacts, employeeCount,
            decisionMaker, recommendationsCollected, offeredOfflineSchool,
            accountStatus, lastContactAt, nextContactAt, notes)
  ├─ Note[]
  └─ Task[]

Task (title, description, dueDate, status, priority, relatedType: b2c|b2b, b2cId?, b2bId?)
Note (body, authorId, b2cId?, b2bId?)
```

### Статусы сделки B2C
`new · contacted · negotiation · paid · closed`

### Статусы аккаунта B2B
`active · paused · needs_contact · expansion · churn_risk`

### Приоритеты задач
`low · normal · high`

---

## Реализованные функции

- [x] Auth (Auth.js credentials + JWT + bcrypt)
- [x] Роли admin / member, охрана маршрутов
- [x] Dashboard с метриками и follow-up секциями
- [x] B2C: список, поиск, фильтры, CRUD, заметки, задачи
- [x] B2B: список, поиск, фильтры, CRUD, заметки, задачи, yes/no для рекомендаций и очной школы
- [x] Единый экран задач: просрочено / сегодня / скоро / без даты / выполнено
- [x] Быстрое создание задач (глобально + в контексте клиента)
- [x] Единая база: любой пользователь видит всех клиентов и задачи
- [x] Команда: список, инвайт (admin), удаление
- [x] Seed-данные, пустые состояния, валидация, адаптивный UI
- [x] Production-билд проходит без ошибок TypeScript/Linting

---

## Что можно сделать на втором этапе

1. **Импорт клиентов из CSV** — мгновенная ценность для онбординга существующих данных
2. **Email-уведомления о напоминаниях** (cron + Resend/SES)
3. **История изменений** (audit log) по карточкам клиентов
4. **Канбан-вид для B2C воронки** (drag-and-drop по статусам)
5. **Kommunication-log**: учёт звонков/писем с привязкой к карточке
6. **Интеграции**: Telegram-бот для напоминаний, Google Calendar для follow-up
7. **Базовая аналитика**: конверсия по воронке, средний чек, sales-cycle
8. **Мульти-тенантность** (если понадобятся несколько команд в одной инсталляции)
9. **API-токены** для интеграций с Tilda-формами / landing-ами
10. **Мобильная PWA** с оффлайн-заметками по встречам

---

## Лицензия

Внутренний инструмент. Лицензия по договоренности команды.
