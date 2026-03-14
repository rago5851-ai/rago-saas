"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Beaker, ClipboardList, ShoppingBag, Home } from "lucide-react";

const navItems = [
  { href: "/", label: "Inicio", Icon: Home },
  { href: "/ventas", label: "Ventas", Icon: ShoppingBag },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-gray-200 bg-white pb-safe">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-1">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 transition-colors ${
                active
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5px]" : ""}`} />
              <span className={`text-[10px] font-bold ${active ? "text-blue-600" : ""}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
