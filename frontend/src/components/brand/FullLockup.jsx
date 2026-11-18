// The Imani Group mark: three interlocking links (navy, gold, navy) with the
// IMANI / GROUP wordmark. Used once, large, on the login screen.
export default function FullLockup({ className = '' }) {
  return (
    <svg
      viewBox="89 35 389 368"
      className={className}
      role="img"
      aria-labelledby="imani-full-title"
    >
      <title id="imani-full-title">Imani Group</title>
      <defs>
        <linearGradient id="navy-left" gradientUnits="userSpaceOnUse" x1="108" y1="135" x2="269" y2="135">
          <stop stopColor="#0b142d" />
          <stop offset="1" stopColor="#152f67" />
        </linearGradient>
        <linearGradient id="navy-right" gradientUnits="userSpaceOnUse" x1="298" y1="135" x2="459" y2="135">
          <stop stopColor="#0b142d" />
          <stop offset="1" stopColor="#152f67" />
        </linearGradient>
        <linearGradient id="gold-mark" gradientUnits="userSpaceOnUse" x1="202" y1="135" x2="363" y2="135">
          <stop stopColor="#e4b745" />
          <stop offset=".52" stopColor="#dda932" />
          <stop offset=".81" stopColor="#ffef9a" />
          <stop offset="1" stopColor="#e6bf59" />
        </linearGradient>
        <linearGradient id="navy-type" gradientUnits="userSpaceOnUse" x1="171" y1="282" x2="396" y2="282">
          <stop stopColor="#0d1935" />
          <stop offset=".55" stopColor="#142c5c" />
          <stop offset="1" stopColor="#102144" />
        </linearGradient>
        <linearGradient id="gold-type" gradientUnits="userSpaceOnUse" x1="146" y1="358" x2="422" y2="358">
          <stop stopColor="#e6ba4a" />
          <stop offset=".51" stopColor="#dca735" />
          <stop offset="1" stopColor="#e9bd50" />
        </linearGradient>
        <clipPath id="gold-overlaps" clipPathUnits="userSpaceOnUse">
          <path d="M196 94 283 181V218H196Z M283 50H367V171L283 87Z" />
        </clipPath>
      </defs>
      <g fill="none" strokeWidth="35">
        <path stroke="url(#gold-mark)" d="M265.5 79.5Q283 62 300.5 79.5L338 117Q355.5 134.5 338 152L300.5 189.5Q283 207 265.5 189.5L228 152Q210.5 134.5 228 117Z" />
        <path stroke="url(#navy-left)" d="M171 79.5Q188.5 62 206 79.5L243.5 117Q261 134.5 243.5 152L206 189.5Q188.5 207 171 189.5L133.5 152Q116 134.5 133.5 117Z" />
        <path stroke="url(#navy-right)" d="M361 79.5Q378.5 62 396 79.5L433.5 117Q451 134.5 433.5 152L396 189.5Q378.5 207 361 189.5L323.5 152Q306 134.5 323.5 117Z" />
        <path stroke="url(#gold-mark)" clipPath="url(#gold-overlaps)" d="M265.5 79.5Q283 62 300.5 79.5L338 117Q355.5 134.5 338 152L300.5 189.5Q283 207 265.5 189.5L228 152Q210.5 134.5 228 117Z" />
      </g>
      <g fill="url(#navy-type)" fillRule="evenodd" aria-label="IMANI">
        <path d="M171 257H187.5V308H171Z" />
        <path d="M198 257H219.4L227.1 286.3 234.9 257H255.6V308H242.4V269.9L232.3 308H221.7L211.3 269.9V308H198Z" />
        <path d="M278.7 257H296.4L315.3 308H298.1L295.6 299.7H279.2L276.7 308H260.1ZM282.7 288.6H292.3L287.5 272.2Z" />
        <path d="M320 257H335.2L353.2 284V257H368.5V308H353.2L335.2 281.2V308H320Z" />
        <path d="M379.5 257H396V308H379.5Z" />
      </g>
      <g fill="url(#gold-type)" fillRule="evenodd" aria-label="GROUP">
        <path d="M195.5 346.3 180.1 349Q178.3 343.2 171.7 343.2C164.6 343.2 161.5 348.5 161.5 358.2 161.5 368.3 164.9 373.2 172.9 373.2 176.7 373.2 180 372.1 182.8 370.2V365.5H172.8V354.9H197V376.5C189.2 382 182 384.4 172.2 384.4 154.5 384.4 145.6 375 145.6 358.1 145.6 341.4 155 331.1 172.4 331.1 185.8 331.1 192.5 335.4 195.5 346.3Z" />
        <path d="M207 332H233.9C246.2 332 252 336.9 252 346.6 252 354.1 248.1 358.6 241.1 360.2 245.4 361.5 247.7 364.2 250.1 368.8L257.6 383.3H239.7L231.2 368.1C229.1 364.1 227.3 362.8 223.1 362.8V383.3H207ZM223.1 342.5V352.8H229.7C234 352.8 236.2 350.8 236.2 347.6 236.2 344.1 234.2 342.5 230 342.5Z" />
        <path d="M285.2 331.1C302.4 331.1 311.6 340.4 311.6 357.3 311.6 374.5 302.9 384.4 285.5 384.4 268.3 384.4 258.5 375.1 258.5 357.7 258.5 340.5 268.1 331.1 285.2 331.1ZM285.1 343.2C278.1 343.2 274.5 348.2 274.5 357.8 274.5 367.6 278.1 372.4 285.2 372.4 292.6 372.4 295.6 367.4 295.6 357.5 295.6 347.9 292 343.2 285.1 343.2Z" />
        <path d="M320.2 332H336.3V363.2C336.3 369.2 339.4 372.1 344.7 372.1 350.2 372.1 353 369.1 353 363.2V332H369.2V362.6C369.2 376.9 360.9 384.4 345.2 384.4 328.8 384.4 320.2 378.1 320.2 362.6Z" />
        <path d="M379.7 332H406C417 332 422 338 422 347.7 422 358.3 415.8 364.3 403.9 364.3H395.8V383.3H379.7ZM395.8 342.6V353.8H400C404.7 353.8 406.8 351.8 406.8 348.3 406.8 344.7 404.8 342.6 400.6 342.6Z" />
      </g>
    </svg>
  );
}
