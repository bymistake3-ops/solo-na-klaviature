"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { doSignOut } from "@/lib/actions/session";

const NAV = [
  { href: "/", label: "Дашборд", icon: DashIcon },
  { href: "/b2c", label: "B2C клиенты", icon: UserIcon },
  { href: "/b2b", label: "B2B аккаунты", icon: BriefcaseIcon },
  { href: "/tasks", label: "Задачи", icon: CheckIcon },
  { href: "/team", label: "Команда", icon: TeamIcon },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-60 flex-col bg-white border-r border-border h-screen sticky top-0">
      <div className="px-5 h-14 flex items-center gap-2 border-b border-border">
        <div className="h-7 w-7 rounded-lg bg-brand text-brand-fg grid place-items-center font-bold text-sm">
          E
        </div>
        <div className="text-sm font-semibold tracking-tight">EduCRM</div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-3 h-9 rounded-lg text-[13.5px] font-medium transition",
                active
                  ? "bg-brand-soft text-brand"
                  : "text-fg/70 hover:bg-muted hover:text-fg",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="px-2 py-1.5 text-xs text-subtle truncate">
          {userName}
        </div>
        <form action={doSignOut} className="mt-1">
          <button className="btn-ghost w-full justify-start text-[13px]" type="submit">
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}

function DashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20c1-4 4.5-6 8-6s7 2 8 6" />
    </svg>
  );
}
function BriefcaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}
function TeamIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="9" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M3 19c0-3 3-5 6-5s6 2 6 5" />
      <path d="M15 19c0-2 2-3.5 4-3.5s2.5 1 2.5 3" />
    </svg>
  );
}
