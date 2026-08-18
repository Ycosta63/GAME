"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Bibliothèque" },
  { href: "/decouvrir", label: "Découvrir" },
  { href: "/communaute", label: "Communauté" },
  { href: "/settings", label: "Réglages" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`pb-[3px] border-b-2 transition-colors ${
              active
                ? "text-shelf-text border-brass"
                : "text-shelf-muted border-transparent hover:text-shelf-text hover:border-shelf-border"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
