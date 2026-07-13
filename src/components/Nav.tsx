"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, MapIcon, BellIcon, MessageIcon, SettingsIcon } from "./Icons";

const links = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/alerts", label: "Alerts", icon: BellIcon },
  { href: "/messages", label: "Send", icon: MessageIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon }
];

export default function Nav() {
  const path = usePathname();
  return (
    <>
      <header className="sticky top-0 z-30 bg-surface border-b border-line">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-ink flex items-center justify-center">
              <span className="text-white text-xs font-semibold tracking-tight">CG</span>
            </div>
            <span className="text-sm font-semibold tracking-tight">Caregiver</span>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const active = path === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={
                    "px-3 py-1.5 rounded-md text-sm inline-flex items-center gap-1.5 " +
                    (active ? "bg-ink text-white" : "text-ink hover:bg-bg")
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-line">
        <div className="max-w-2xl mx-auto grid grid-cols-5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = path === href;
            return (
              <Link
                key={href}
                href={href}
                className={
                  "flex flex-col items-center justify-center py-2 text-[11px] " +
                  (active ? "text-ink" : "text-muted")
                }
              >
                <Icon className={"w-5 h-5 mb-0.5 " + (active ? "text-ink" : "text-muted")} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
