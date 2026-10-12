/** Two ridges of the Caucasus foothills with snow caps; colors follow the theme. */
export function Mountains({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 220" preserveAspectRatio="none" aria-hidden className={className}>
      <path d="M0 150 L140 70 L250 130 L390 30 L520 120 L640 60 L780 140 L900 50 L1040 130 L1160 70 L1300 120 L1440 60 L1440 220 L0 220 Z" style={{ fill: "var(--mountain-far)" }} />
      <path d="M390 30 L420 48 L405 52 L390 44 L372 54 L360 47 Z" fill="#ffffff" opacity="0.8" />
      <path d="M900 50 L930 68 L915 72 L900 64 L882 74 L870 67 Z" fill="#ffffff" opacity="0.8" />
      <path d="M0 190 L180 120 L330 175 L470 110 L640 180 L820 115 L990 175 L1150 120 L1310 170 L1440 130 L1440 220 L0 220 Z" style={{ fill: "var(--mountain-near)" }} />
      <path d="M0 220 L0 200 C240 175 480 210 720 195 C960 180 1200 210 1440 190 L1440 220 Z" style={{ fill: "var(--background)" }} />
    </svg>
  );
}
