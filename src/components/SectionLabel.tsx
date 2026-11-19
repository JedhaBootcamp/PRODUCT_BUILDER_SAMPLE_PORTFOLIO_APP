export function SectionLabel({ id, index, title }: { id: string; index: string; title: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-3 border-t border-line pt-6">
      <span className="font-mono text-xs text-accent">{index}</span>
      <h2 id={id} className="text-sm font-semibold uppercase tracking-[0.12em]">{title}</h2>
    </div>
  );
}
