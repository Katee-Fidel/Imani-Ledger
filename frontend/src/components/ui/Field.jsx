export default function Field({ label, error, children }) {
  return (
    <label className="flex flex-col gap-2 text-base">
      <span className="text-ink/80">{label}</span>
      {children}
      {error && <span className="text-rust text-xs">{error}</span>}
    </label>
  );
}

export function inputClass(hasError) {
  return `border px-4 py-3 text-base bg-paper-raised text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep ${
    hasError ? 'border-rust' : 'border-rule'
  }`;
}
