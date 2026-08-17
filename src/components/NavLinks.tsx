"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Bibliothèque" },
  { href: "/settings", label: "Réglages" },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`transition-colors ${
              active
                ? "text-shelf-text"
                : "text-shelf-muted hover:text-shelf-text"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </>
  );
}
