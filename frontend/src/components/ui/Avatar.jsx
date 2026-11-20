const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export default function Avatar({ src, name, size = 56 }) {
  const style = { width: size, height: size, fontSize: size * 0.36 };

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s photo` : 'Profile photo'}
        className="rounded-full object-cover border border-rule"
        style={style}
      />
    );
  }

  return (
    <div
      className="rounded-full bg-navy text-gold flex items-center justify-center font-serif border border-rule"
      style={style}
      aria-hidden="true"
    >
      {initialsOf(name) || '?'}
    </div>
  );
}
