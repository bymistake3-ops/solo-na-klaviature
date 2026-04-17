import { B2C_STATUSES } from "@/lib/constants";
import { toInputDate } from "@/lib/utils";

type Manager = { id: string; name: string };
type Client = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  dealStatus?: string;
  revenue?: number;
  managerId?: string | null;
  nextContactAt?: Date | string | null;
  notes?: string | null;
};

export function B2CForm({
  action,
  managers,
  client,
  submitLabel = "Сохранить",
}: {
  action: (formData: FormData) => void | Promise<void>;
  managers: Manager[];
  client?: Client;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid gap-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Имя" required>
          <input
            name="name"
            required
            defaultValue={client?.name ?? ""}
            className="input"
            placeholder="Мария Кузнецова"
          />
        </Field>
        <Field label="Статус сделки">
          <select
            name="dealStatus"
            defaultValue={client?.dealStatus ?? "new"}
            className="input"
          >
            {B2C_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Email">
          <input
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            className="input"
            placeholder="name@example.com"
          />
        </Field>
        <Field label="Телефон">
          <input
            name="phone"
            defaultValue={client?.phone ?? ""}
            className="input"
            placeholder="+7 ..."
          />
        </Field>

        <Field label="Выручка, ₽">
          <input
            name="revenue"
            type="number"
            min={0}
            step={100}
            defaultValue={client?.revenue ?? 0}
            className="input"
          />
        </Field>
        <Field label="Ответственный менеджер">
          <select
            name="managerId"
            defaultValue={client?.managerId ?? ""}
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

        <Field label="Связаться (напоминание)">
          <input
            name="nextContactAt"
            type="date"
            defaultValue={toInputDate(client?.nextContactAt ?? null)}
            className="input"
          />
        </Field>
      </div>

      <Field label="Комментарий / заметки">
        <textarea
          name="notes"
          defaultValue={client?.notes ?? ""}
          className="textarea"
          rows={4}
          placeholder="Что обсудили, что важно помнить…"
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
