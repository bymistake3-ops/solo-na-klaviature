"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Дашборд" },
  { href: "/b2c", label: "B2C" },
  { href: "/b2b", label: "B2B" },
  { href: "/tasks", label: "Задачи" },
  { href: "/team", label: "Команда" },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden border-b border-border bg-white">
      <div className="flex overflow-x-auto gap-1 px-3 py-2 no-scrollbar">
        {NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "shrink-0 px-3 h-8 inline-flex items-center rounded-full text-[13px] font-medium",
                active
                  ? "bg-brand-soft text-brand"
                  : "text-subtle hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
