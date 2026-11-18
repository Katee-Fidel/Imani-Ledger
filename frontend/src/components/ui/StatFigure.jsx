// A single ledger figure: label, then the amount set like currency, with a
// gold rule beneath it standing in for a card border/shadow.
export default function StatFigure({ label, value, tone = 'ink' }) {
  const toneClass = tone === 'rust' ? 'text-rust' : 'text-ink';
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm text-ink/60">{label}</span>
      <span className={`font-serif text-3xl ledger-figures ${toneClass}`}>{value}</span>
      <span className="h-[3px] w-10 bg-gold" />
    </div>
  );
}
