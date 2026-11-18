// Emptiness and failure are moments for direction, not mood — say what's
// true and what to do next, in the ledger's own voice.
export default function EmptyState({ title, body }) {
  return (
    <div className="border border-dashed border-rule py-10 px-6 text-center">
      <p className="font-serif text-lg text-ink">{title}</p>
      {body && <p className="mt-1 text-sm text-ink/60">{body}</p>}
    </div>
  );
}
