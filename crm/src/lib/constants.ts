export const B2C_STATUSES = [
  { value: "new", label: "Новый", tone: "brand" },
  { value: "contacted", label: "Связались", tone: "muted" },
  { value: "negotiation", label: "Переговоры", tone: "warn" },
  { value: "paid", label: "Оплатил", tone: "success" },
  { value: "closed", label: "Неактивен", tone: "danger" },
] as const;

export const B2B_STATUSES = [
  { value: "active", label: "Активный клиент", tone: "success" },
  { value: "paused", label: "На паузе", tone: "muted" },
  { value: "needs_contact", label: "Нужен контакт", tone: "warn" },
  { value: "expansion", label: "Потенциал расширения", tone: "brand" },
  { value: "churn_risk", label: "Риск оттока", tone: "danger" },
] as const;

export const TASK_PRIORITIES = [
  { value: "low", label: "Низкий", tone: "muted" },
  { value: "normal", label: "Обычный", tone: "brand" },
  { value: "high", label: "Высокий", tone: "danger" },
] as const;

export type StatusTone = "brand" | "muted" | "success" | "warn" | "danger";

export function getB2CStatus(value: string) {
  return B2C_STATUSES.find((s) => s.value === value) ?? B2C_STATUSES[0];
}
export function getB2BStatus(value: string) {
  return B2B_STATUSES.find((s) => s.value === value) ?? B2B_STATUSES[0];
}
export function getPriority(value: string) {
  return TASK_PRIORITIES.find((s) => s.value === value) ?? TASK_PRIORITIES[1];
}
