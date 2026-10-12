import { imageUrl } from "@/lib/images";

const SIZES = {
  xs: "size-6 rounded-md text-[10px]",
  sm: "size-8 rounded-lg text-xs",
  md: "size-12 rounded-xl text-lg",
  lg: "size-16 rounded-2xl text-2xl",
  xl: "size-24 rounded-3xl text-3xl",
} as const;

/** Initials of a name: "Dağ Restoranı" → "DR". */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toLocaleUpperCase())
    .join("");
}

/**
 * Profile photo, or the initials when there is none. Used for people and,
 * through the employer's photo, as a company logo. Decorative: the name is always shown next to it.
 */
export function Avatar({ name, imageId, size = "md" }: { name: string; imageId?: string | null; size?: keyof typeof SIZES }) {
  const box = `${SIZES[size]} shrink-0 overflow-hidden`;
  if (imageId) {
    // eslint-disable-next-line @next/next/no-img-element -- served by our own route with long caching; next/image adds nothing here
    return <img src={imageUrl(imageId)} alt="" loading="lazy" className={`${box} bg-surface-2 object-cover`} />;
  }
  return (
    <span aria-hidden className={`${box} flex items-center justify-center bg-brand-soft font-heading font-extrabold text-brand-strong`}>
      {initials(name)}
    </span>
  );
}
