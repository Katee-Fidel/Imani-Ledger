const variants = {
  primary: 'bg-navy text-paper-raised hover:bg-ink',
  gold: 'bg-gold text-ink hover:bg-gold-deep hover:text-paper-raised',
  ghost: 'bg-transparent text-navy border border-rule hover:border-navy',
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
