"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

const itemClass = (active: boolean, column: boolean) =>
  `rounded-xl px-3 py-2.5 font-medium transition ${column ? "text-base" : "text-sm"} ${
    active ? "bg-brand-soft text-brand-strong" : "text-muted hover:bg-surface-2 hover:text-foreground"
  }`;

/** Site sections. The current one is highlighted (the item whose path the URL starts with). */
export function MainNav({ items, label, layout }: { items: NavItem[]; label: string; layout: "row" | "column" }) {
  const pathname = usePathname();
  return <NavList items={items} label={label} layout={layout} isActive={(href) => pathname === href || pathname.startsWith(`${href}/`)} />;
}

/** Same links without highlighting: the server-rendered fallback before the URL is known. */
export function NavList({
  items,
  label,
  layout,
  isActive = () => false,
}: {
  items: NavItem[];
  label: string;
  layout: "row" | "column";
  isActive?: (href: string) => boolean;
}) {
  const column = layout === "column";
  return (
    <nav aria-label={label}>
      <ul className={column ? "flex flex-col gap-1" : "flex items-center gap-1"}>
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link href={item.href} aria-current={active ? "page" : undefined} className={`block ${itemClass(active, column)}`}>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
