export default function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink/80">{label}</span>
      {children}
      {error && <span className="text-rust text-xs">{error}</span>}
    </label>
  );
}

export function inputClass(hasError) {
  return `border px-3 py-2 bg-paper-raised text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep ${
    hasError ? 'border-rust' : 'border-rule'
  }`;
}
