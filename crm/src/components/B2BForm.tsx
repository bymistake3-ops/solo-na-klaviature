import { B2B_STATUSES } from "@/lib/constants";
import { toInputDate } from "@/lib/utils";

type Manager = { id: string; name: string };
type Account = {
  id?: string;
  companyName?: string | null;
  legalEntity?: string | null;
  contactPerson?: string | null;
  contacts?: string | null;
  employeeCount?: number | null;
  decisionMaker?: string | null;
  recommendationsCollected?: boolean;
  offeredOfflineSchool?: boolean;
  accountStatus?: string;
  managerId?: string | null;
  lastContactAt?: Date | string | null;
  nextContactAt?: Date | string | null;
  notes?: string | null;
};

export function B2BForm({
  action,
  managers,
  account,
  submitLabel = "Сохранить",
}: {
  action: (formData: FormData) => void | Promise<void>;
  managers: Manager[];
  account?: Account;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Название компании" required>
          <input
            name="companyName"
            required
            defaultValue={account?.companyName ?? ""}
            className="input"
            placeholder="Яркий Путь"
          />
        </Field>
        <Field label="Статус аккаунта">
          <select
            name="accountStatus"
            defaultValue={account?.accountStatus ?? "active"}
            className="input"
          >
            {B2B_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Юрлицо">
          <input
            name="legalEntity"
            defaultValue={account?.legalEntity ?? ""}
            className="input"
            placeholder="ООО «…»"
          />
        </Field>
        <Field label="Ответственное лицо">
          <input
            name="contactPerson"
            defaultValue={account?.contactPerson ?? ""}
            className="input"
          />
        </Field>

        <Field label="Контакты">
          <input
            name="contacts"
            defaultValue={account?.contacts ?? ""}
            className="input"
            placeholder="email · телефон · Telegram"
          />
        </Field>
        <Field label="Кол-во сотрудников">
          <input
            name="employeeCount"
            type="number"
            min={0}
            defaultValue={account?.employeeCount ?? ""}
            className="input"
          />
        </Field>

        <Field label="ЛПР">
          <input
            name="decisionMaker"
            defaultValue={account?.decisionMaker ?? ""}
            className="input"
          />
        </Field>
        <Field label="Ответственный менеджер">
          <select
            name="managerId"
            defaultValue={account?.managerId ?? ""}
            className="input"
          >
            <option value="">Не назначен</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Последний контакт">
          <input
            name="lastContactAt"
            type="date"
            defaultValue={toInputDate(account?.lastContactAt ?? null)}
            className="input"
          />
        </Field>
        <Field label="Следующий контакт">
          <input
            name="nextContactAt"
            type="date"
            defaultValue={toInputDate(account?.nextContactAt ?? null)}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Checkbox
          name="recommendationsCollected"
          label="Собрали рекомендации"
          defaultChecked={account?.recommendationsCollected ?? false}
        />
        <Checkbox
          name="offeredOfflineSchool"
          label="Предложили очную школу"
          defaultChecked={account?.offeredOfflineSchool ?? false}
        />
      </div>

      <Field label="Заметки / комментарии">
        <textarea
          name="notes"
          defaultValue={account?.notes ?? ""}
          className="textarea"
          rows={4}
          placeholder="Контекст аккаунта, договорённости, риски…"
        />
      </Field>

      <div className="flex justify-end gap-2">
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="label">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function Checkbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 rounded-lg border border-border bg-white px-3 h-10 cursor-pointer hover:bg-muted/50 transition">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-4 w-4 rounded border-border accent-[hsl(222,89%,55%)]"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}
