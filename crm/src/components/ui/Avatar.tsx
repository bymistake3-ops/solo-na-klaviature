import { initialsOf } from "@/lib/utils";

const COLORS = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-cyan-100 text-cyan-700",
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const color = COLORS[hash(name) % COLORS.length];
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${color}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      title={name}
    >
      {initialsOf(name) || "—"}
    </span>
  );
}
