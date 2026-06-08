/** Persistent bottom tab bar: Timeline · Forum · Search · Help. */
import { NavLink } from "react-router-dom";
import { IconForum, IconHelp, IconSearch, IconTimeline } from "./icons";
import type { ComponentType, SVGProps } from "react";

const TABS: { to: string; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { to: "/timeline", label: "Timeline", Icon: IconTimeline },
  { to: "/forum", label: "Forum", Icon: IconForum },
  { to: "/search", label: "Search", Icon: IconSearch },
  { to: "/help", label: "Help", Icon: IconHelp },
];

export function TabBar() {
  return (
    <nav
      aria-label="Primary"
      className="sticky bottom-0 z-10 border-t border-border bg-surface/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-app">
        {TABS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted hover:text-ink"
                }`
              }
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
