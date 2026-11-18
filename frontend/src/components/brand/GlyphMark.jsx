// Just the three interlocking links, cropped from the full lockup — used small,
// in the topbar, where the wordmark is set in type instead.
export default function GlyphMark({ className = '' }) {
  return (
    <svg viewBox="100 40 380 175" className={className} role="img" aria-labelledby="imani-glyph-title">
      <title id="imani-glyph-title">Imani Group mark</title>
      <defs>
        <linearGradient id="g-navy-left" gradientUnits="userSpaceOnUse" x1="108" y1="135" x2="269" y2="135">
          <stop stopColor="#0b142d" />
          <stop offset="1" stopColor="#152f67" />
        </linearGradient>
        <linearGradient id="g-navy-right" gradientUnits="userSpaceOnUse" x1="298" y1="135" x2="459" y2="135">
          <stop stopColor="#0b142d" />
          <stop offset="1" stopColor="#152f67" />
        </linearGradient>
        <linearGradient id="g-gold-mark" gradientUnits="userSpaceOnUse" x1="202" y1="135" x2="363" y2="135">
          <stop stopColor="#e4b745" />
          <stop offset=".52" stopColor="#dda932" />
          <stop offset=".81" stopColor="#ffef9a" />
          <stop offset="1" stopColor="#e6bf59" />
        </linearGradient>
        <clipPath id="g-gold-overlaps" clipPathUnits="userSpaceOnUse">
          <path d="M196 94 283 181V218H196Z M283 50H367V171L283 87Z" />
        </clipPath>
      </defs>
      <g fill="none" strokeWidth="35">
        <path stroke="url(#g-gold-mark)" d="M265.5 79.5Q283 62 300.5 79.5L338 117Q355.5 134.5 338 152L300.5 189.5Q283 207 265.5 189.5L228 152Q210.5 134.5 228 117Z" />
        <path stroke="url(#g-navy-left)" d="M171 79.5Q188.5 62 206 79.5L243.5 117Q261 134.5 243.5 152L206 189.5Q188.5 207 171 189.5L133.5 152Q116 134.5 133.5 117Z" />
        <path stroke="url(#g-navy-right)" d="M361 79.5Q378.5 62 396 79.5L433.5 117Q451 134.5 433.5 152L396 189.5Q378.5 207 361 189.5L323.5 152Q306 134.5 323.5 117Z" />
        <path stroke="url(#g-gold-mark)" clipPath="url(#g-gold-overlaps)" d="M265.5 79.5Q283 62 300.5 79.5L338 117Q355.5 134.5 338 152L300.5 189.5Q283 207 265.5 189.5L228 152Q210.5 134.5 228 117Z" />
      </g>
    </svg>
  );
}
