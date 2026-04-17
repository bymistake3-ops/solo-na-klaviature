import { cn } from "@/lib/utils";

export function Empty({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed border-border bg-white/60",
        className,
      )}
    >
      <div className="h-10 w-10 rounded-full bg-muted mb-4" aria-hidden />
      <div className="text-sm font-semibold text-fg">{title}</div>
      {description ? (
        <div className="mt-1 text-sm text-subtle max-w-md">{description}</div>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
