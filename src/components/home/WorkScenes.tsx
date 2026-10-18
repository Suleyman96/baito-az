import type { CSSProperties, ReactNode } from "react";

/*
 * People at work along the bottom of the page hero (PageHero), left to right, standing on one ground line:
 * a bricklayer, a chef, a developer, a farmer on a tractor, a delivery driver, a waiter, a cleaner,
 * a mover and a shop worker. Outline drawings with soft fills in the style of the hero's line-art
 * pattern, each with a small looping motion (globals.css .work-scenes; still when the user asks
 * for reduced motion). Every scene is drawn on a 120×96 grid with the ground at y=92. Decorative only.
 */

// Classes for the fills and motions defined in globals.css
const fill = "ws-fill";
const accent = "ws-accent";
const light = "ws-light";

/** Pivot for a swinging part, in the scene's own coordinates */
const pivot = (x: number, y: number, delay = 0): CSSProperties => ({ transformOrigin: `${x}px ${y}px`, animationDelay: `${delay}s` });
const delay = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

/** A standing person facing right: head, shirt, legs and shoes; arms are drawn per scene */
function Person({ x, lean = 0 }: { x: number; lean?: number }) {
  const h = x + lean;
  return (
    <>
      <path className={fill} d={`M${h - 7} 30q7-4 14 0l${2 - lean / 2} 22h-${18 - lean / 2}z`} />
      <path d={`M${x - 4} 52l-3 38M${x + 4} 52l3 38M${x - 7} 91h-4M${x + 7} 91h5`} />
      <circle className={light} cx={h} cy="20" r="6.5" />
    </>
  );
}

/** A wheel with spokes, so its turning shows */
function Wheel({ cx, cy, r, d = 0 }: { cx: number; cy: number; r: number; d?: number }) {
  return (
    <g className="ws-spin" style={delay(d)}>
      <circle className={light} cx={cx} cy={cy} r={r} />
      <circle cx={cx} cy={cy} r={r * 0.3} />
      <path d={`M${cx - r * 0.3} ${cy}h-${r * 0.6}M${cx + r * 0.3} ${cy}h${r * 0.6}M${cx} ${cy - r * 0.3}v-${r * 0.6}M${cx} ${cy + r * 0.3}v${r * 0.6}`} />
    </g>
  );
}

const scenes: { key: string; draw: ReactNode }[] = [
  {
    // Bricklayer in a hard hat, spreading mortar with a trowel on a half-built wall
    key: "bricklayer",
    draw: (
      <>
        <path className={fill} d="M64 92V52h18v10h18v30z" />
        <path d="M64 82h36M64 72h36M64 62h18M82 92V82M73 82V72M91 82V72M82 72V62M73 62V52" />
        <Person x={32} />
        <path className={accent} d="M25 18.5a7 7 0 0 1 14 0z" />
        <path d="M23 18.5h18M32 11.5v3M28 32l-4 13" />
        <g className="ws-swing" style={pivot(36, 32)}>
          <path d="M36 32l10 6 9-3" />
          <path className={accent} d="M55 35l8-3-1 7z" />
        </g>
      </>
    ),
  },
  {
    // Chef in a tall hat, stirring a steaming pot on the stove
    key: "chef",
    draw: (
      <>
        <path className={fill} d="M58 60h46v32H58z" />
        <path d="M58 70h46M70 80h4M88 80h4" />
        <path className={accent} d="M66 46h28v14H66z" />
        <path d="M62 49h4M94 49h4M66 50h28" />
        <path className="ws-rise" style={delay(0)} d="M73 40c-2-3 2-5 0-8" />
        <path className="ws-rise" style={delay(0.9)} d="M80 40c-2-3 2-5 0-8" />
        <path className="ws-rise" style={delay(1.8)} d="M87 40c-2-3 2-5 0-8" />
        <Person x={34} />
        <path className={light} d="M27.5 14V8a3.5 3.5 0 0 1 3.5-3.5 4.5 4.5 0 0 1 6 0A3.5 3.5 0 0 1 40.5 8v6z" />
        <path d="M30 33l-4 13" />
        <g className="ws-swing" style={pivot(38, 33)}>
          <path d="M38 33l12 6 10-1M60 38l16 12" />
        </g>
      </>
    ),
  },
  {
    // Developer on a chair, typing on a laptop, code on the screen
    key: "developer",
    draw: (
      <>
        <path d="M22 62V40M22 62v30M40 62v30M54 62h52M58 62v30M102 62v30" />
        <path className={fill} d="M20 60h22v4H20z" />
        <path className={fill} d="M32 42q-6 0-6 6l2 14h20v-4l-12-2z" />
        <path d="M44 62v29M44 91h5" />
        <circle className={light} cx="32" cy="34" r="6.5" />
        <g className="ws-type">
          <path d="M34 46l12 6 12 3" />
        </g>
        <path className={light} d="M62 61h24l7-22H69z" />
        <path d="M58 61h28" />
        <path className="ws-blink" d="M72 45h8M71 49h12" style={delay(0)} />
        <path className="ws-blink" d="M70 53h6" style={delay(0.6)} />
        <path className="ws-bob" d="M68 22l-4 4 4 4M80 22l4 4-4 4M76 20l-4 12" />
      </>
    ),
  },
  {
    // Farmer in a straw hat driving a tractor, wheels turning and puffing smoke
    key: "farmer",
    draw: (
      <>
        <circle className="ws-rise" style={delay(0)} cx="83" cy="36" r="2.5" />
        <circle className="ws-rise" style={delay(1.2)} cx="86" cy="30" r="3" />
        <g className="ws-bob">
          <path className={accent} d="M62 56h18l4 10h24v10H62z" />
          <path d="M80 56V42M30 58V30h24l6 26z" />
          <path className={light} d="M33 33h18l4 20H33z" />
          <circle className={fill} cx="44" cy="40" r="5" />
          <path className={accent} d="M36 36h16l-3-5h-10z" />
          <path d="M44 45v7l9-4" />
        </g>
        <Wheel cx={44} cy={74} r={18} />
        <Wheel cx={100} cy={82} r={10} />
      </>
    ),
  },
  {
    // Delivery driver in a van with a parcel on its side, driving along
    key: "driver",
    draw: (
      <>
        <path className="ws-dash" d="M2 60h6M0 68h8M4 76h5" />
        <g className="ws-bob">
          <path className={fill} d="M10 84V48a4 4 0 0 1 4-4h60l16 18h18a4 4 0 0 1 4 4v18z" />
          <path className={light} d="M76 50h-8v14h20z" />
          <circle className={fill} cx="74" cy="56" r="3.5" />
          <path d="M74 60l6 3" />
          <path className={accent} d="M22 56h22v16H22z" />
          <path d="M33 56v16M28 60h10M108 70h4" />
        </g>
        <Wheel cx={30} cy={84} r={8} />
        <Wheel cx={94} cy={84} r={8} d={0.2} />
      </>
    ),
  },
  {
    // Waiter in a bow tie carrying drinks on a tray to a café table
    key: "waiter",
    draw: (
      <>
        <path className={fill} d="M70 60h32v3H70z" />
        <path d="M86 63v29M78 92h16" />
        <path className={light} d="M80 60v-7h5v7zM90 60v-5a3 3 0 0 1 6 0v5z" />
        <Person x={34} />
        <path className={accent} d="M30 29l4 2-4 2zM38 29l-4 2 4 2z" />
        <path d="M30 33l-4 13M26 46l4 8" />
        <g className="ws-bob">
          <path d="M38 33l10-4 2-16" />
          <path d="M38 13h24" />
          <path className={light} d="M42 13V6h5v7zM52 13V4h4v9z" />
        </g>
      </>
    ),
  },
  {
    // Cleaner mopping the floor next to a bucket, the floor sparkling
    key: "cleaner",
    draw: (
      <>
        <path className={accent} d="M80 70h20l-2 22H82z" />
        <path d="M80 70a10 8 0 0 1 20 0M82 76h16" />
        <circle className="ws-rise" style={delay(0.3)} cx="86" cy="66" r="1.8" />
        <circle className="ws-rise" style={delay(1.4)} cx="93" cy="64" r="1.4" />
        <path className="ws-blink" style={delay(0.8)} d="M74 82v6M71 85h6" />
        <Person x={30} />
        <g className="ws-swing" style={pivot(50, 28)}>
          <path d="M50 28l14 60" />
          <path className={fill} d="M56 86h16v4H56z" />
          <path d="M58 90l-2 3M64 90v3M70 90l2 3" />
        </g>
        <path d="M34 33l14 7 6-4M34 34l10 12 10-4" />
      </>
    ),
  },
  {
    // Mover pushing stacked boxes on a hand truck
    key: "mover",
    draw: (
      <>
        <path className={accent} d="M74 66h22v20H74z" />
        <path className={fill} d="M76 46h18v20H76z" />
        <path d="M74 76h22M85 46v-3M80 56h10" />
        <path d="M58 34l12 54h24" />
        <Wheel cx={72} cy={88} r={4} />
        <Person x={28} lean={5} />
        <g className="ws-type">
          <path d="M34 33l14 3 10-2M34 34l12 9 12-4" />
        </g>
      </>
    ),
  },
  {
    // Shop worker pushing a full supermarket trolley
    key: "shop",
    draw: (
      <>
        <path className={accent} d="M74 48h8v10h-8z" />
        <circle className={fill} cx="88" cy="54" r="4" />
        <path className={light} d="M92 44h5v14h-5z" />
        <path className={fill} d="M64 58h40l-6 12H70z" />
        <path d="M56 40h6l8 30h28l6-12H64M70 70l-3 8h33" />
        <Wheel cx={72} cy={86} r={4} />
        <Wheel cx={96} cy={86} r={4} d={0.3} />
        <Person x={28} lean={4} />
        <g className="ws-type" style={delay(0.4)}>
          <path d="M33 33l14 6 10 1M33 34l12 9 12-2" />
        </g>
      </>
    ),
  },
];

// Which breakpoint shows each scene, by position: 4 on phones, 5 from md, 8 from lg, 9 from xl
const VISIBLE_FROM = ["", "", "", "", "hidden md:block", "hidden lg:block", "hidden lg:block", "hidden lg:block", "hidden xl:block"];

/**
 * The scenes in a row on a shared ground line, 64px tall on phones and 96px from sm.
 * Narrow screens show the first four; each wider breakpoint adds more, up to all nine.
 */
export function WorkScenes({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`work-scenes pointer-events-none ${className ?? ""}`}>
      <div className="mx-auto flex h-full max-w-7xl items-end justify-between px-4 sm:px-6">
        {scenes.map((scene, i) => (
          <svg
            key={scene.key}
            viewBox="0 0 120 96"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`h-full w-auto shrink-0 overflow-visible ${VISIBLE_FROM[i]}`}
          >
            {scene.draw}
          </svg>
        ))}
      </div>
      {/* The ground they stand on */}
      <div className="absolute inset-x-0 bottom-[4%] h-px bg-current opacity-70" />
    </div>
  );
}
