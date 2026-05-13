export default function DataTableShell({
  title,
  count,
  subtitle,
  action,
  children,
}) {
  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
      <div className="flex flex-wrap justify-between items-center gap-3 px-5 py-4 border-b border-border bg-surface-2">
        <div>
          <div className="font-display font-bold text-text">
            {title} ({count})
          </div>
          {subtitle ? (
            <div className="text-xs text-text-subtle mt-1">{subtitle}</div>
          ) : null}
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}
