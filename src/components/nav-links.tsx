"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinksProps {
  isAdmin: boolean;
  loggedIn: boolean;
}

const mainLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/rooms", label: "Rooms" },
  { href: "/matches", label: "Matches" },
  { href: "/groups", label: "Groups" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/knockouts", label: "Knockouts" },
];

const adminLinks = [
  { href: "/admin/matches", label: "Admin Matches" },
  { href: "/admin/knockouts", label: "Admin Knockouts" },
  { href: "/admin/groups", label: "Admin Groups" },
  { href: "/admin/global-predictions", label: "Admin Global" },
];

export default function NavLinks({ isAdmin }: NavLinksProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const allLinks = [...mainLinks, ...(isAdmin ? adminLinks : [])];

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-4 text-sm">
        {mainLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`hover:underline ${pathname === link.href ? "font-semibold" : ""}`}
          >
            {link.label}
          </Link>
        ))}
        {isAdmin &&
          adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded bg-clay/10 px-2 py-0.5 text-clay hover:bg-clay/20 text-xs"
            >
              {link.label}
            </Link>
          ))}
      </nav>

      {/* Mobile hamburger button */}
      <button
        className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle menu"
      >
        <span className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${open ? "translate-y-2 rotate-45" : ""}`} />
        <span className={`block h-0.5 w-5 bg-current transition-opacity duration-200 ${open ? "opacity-0" : ""}`} />
        <span className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${open ? "-translate-y-2 -rotate-45" : ""}`} />
      </button>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 z-50 bg-white border-b border-ink/10 shadow-lg px-4 py-3 flex flex-col gap-1">
          {allLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`py-2 text-sm border-b border-ink/5 last:border-0 ${
                pathname === link.href ? "font-semibold text-field" : "text-ink"
              } ${adminLinks.includes(link) ? "text-clay" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
