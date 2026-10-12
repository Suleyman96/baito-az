import { Mountain } from "lucide-react";
import { site } from "@/config/site";

/** Mountain mark + wordmark. The mountains stand for the Zaqatala–Şəki foothills of the Caucasus. */
export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-10 rounded-xl" : "size-9 rounded-xl";
  return (
    <span className="flex items-center gap-2.5">
      <span className={`${box} flex items-center justify-center bg-brand text-on-brand`}>
        <Mountain className="size-5" strokeWidth={2.25} aria-hidden />
      </span>
      <span className="font-heading text-xl font-extrabold tracking-tight">{site.name}</span>
    </span>
  );
}
