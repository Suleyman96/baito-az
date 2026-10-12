import {
  Briefcase,
  GraduationCap,
  HardHat,
  Monitor,
  ShoppingBag,
  Sprout,
  Stethoscope,
  Truck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  sales: ShoppingBag,
  service: UtensilsCrossed,
  agriculture: Sprout,
  construction: HardHat,
  education: GraduationCap,
  healthcare: Stethoscope,
  transport: Truck,
  it: Monitor,
  office: Briefcase,
};

/** Icon for a job category; unknown and "other" fall back to a briefcase. */
export function CategoryIcon({ slug, className = "size-5" }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Briefcase;
  return <Icon className={className} aria-hidden />;
}
