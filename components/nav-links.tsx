'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',           label: 'Scan',      exact: true,  color: 'text-zinc-100' },
  { href: '/history',    label: 'History',   exact: false, color: 'text-zinc-100' },
  { href: '/dashboard',  label: 'Stats',     exact: false, color: 'text-zinc-100' },
  { href: '/community',  label: 'Community', exact: false, color: 'text-teal-400' },
  { href: '/wishlist',   label: 'Wishlist',  exact: false, color: 'text-purple-400' },
  { href: '/strains',    label: 'StrainAI',  exact: false, color: 'text-yellow-300' },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="nav-scroll flex items-center justify-between border-t border-zinc-800/40 pb-1.5 pt-1 overflow-x-auto">
      {NAV_ITEMS.map(({ href, label, exact, color }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href) && href !== '/';
        const scanActive = href === '/' && (pathname === '/' || pathname === '');

        const active = isActive || scanActive;

        return (
          <Link
            key={href}
            href={href === '/' ? '/?reset=1' : href}
            className={`
              relative rounded-lg px-2 py-1 text-xs font-semibold transition whitespace-nowrap
              ${active
                ? `${color} bg-zinc-800`
                : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
              }
            `}
          >
            {label}
            {active && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] rounded-full bg-current opacity-60" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
