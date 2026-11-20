const variants = {
  primary: 'bg-navy text-paper-raised hover:bg-ink',
  gold: 'bg-gold text-ink hover:bg-gold-deep hover:text-paper-raised',
  ghost: 'bg-transparent text-navy border border-rule hover:border-navy',
};

const sizes = {
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export default function Button({ variant = 'primary', size = 'md', className = '', ...props }) {
  return (
    <button
      className={`font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
