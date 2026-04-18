// icons.tsx — CannaBaseAI icon set. Stroke-based, currentColor, 1.5px.
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, rest: SVGProps<SVGSVGElement>) => ({
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: size,
  height: size,
  ...rest,
});

// ── STRAIN TYPES ─────────────────────────────────────────────

export function IconIndica({ size = 16, ...rest }: IconProps) {
  return <svg {...base(size, rest)}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>;
}

export function IconSativa({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </svg>
  );
}

export function IconHybrid({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M7 3c0 3.5 10 6.5 10 10S7 17.5 7 21" />
      <path d="M17 3c0 3.5-10 6.5-10 10s10 3.5 10 7" />
      <path d="M8.5 7h7M8.5 17h7M10 10.5h4M10 13.5h4" />
    </svg>
  );
}

export function IconUnknown({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.2a2.7 2.7 0 0 1 5.2.8c0 1.7-2.5 2.2-2.5 3.8" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── CONSUMPTION METHODS ───────────────────────────────────────

export function IconJoint({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M3 16l12-5 4 1.5-12 5z" />
      <path d="M19 11.5l2 .8" />
      <circle cx="20.5" cy="11.8" r="0.8" fill="currentColor" stroke="none" />
      <path d="M20.5 9c.5-1 0-1.8-.5-2.3M22 8.2c.5-.8.2-1.7-.3-2.2" opacity="0.6" />
    </svg>
  );
}

export function IconBong({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M9 3h3" />
      <path d="M10.5 3v5" />
      <path d="M8 8h5l-0.3 3" />
      <path d="M12.7 11a6 6 0 1 1-5.4 0" />
      <path d="M13 12l3-1.5.5 2-2.8 1.2" />
    </svg>
  );
}

export function IconBowl({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M3 14h10" />
      <circle cx="16" cy="14" r="5" />
      <path d="M14.5 9.5l1 2 2-.5" />
      <path d="M3 13v2" />
    </svg>
  );
}

export function IconVape({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M4 10h2v4H4z" />
      <path d="M6 9.5h7v5H6z" />
      <path d="M13 8.5h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-6z" />
      <circle cx="17" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconEdible({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-5-5z" />
      <path d="M8 11.5l-.6 1.2M9 11l.3.8M14 15l-.5 1M10 15.5l-.5 1" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="14.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="10" cy="15" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── UI ICONS ──────────────────────────────────────────────────

export function IconSearch({ size = 16, ...rest }: IconProps) {
  return <svg {...base(size, rest)}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>;
}

export function IconWarning({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M12 3.5L21.5 20H2.5z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconCheck({ size = 16, ...rest }: IconProps) {
  return <svg {...base(size, rest)}><path d="M4.5 12.5l4.5 4.5L19.5 6.5" /></svg>;
}

export function IconClose({ size = 16, ...rest }: IconProps) {
  return <svg {...base(size, rest)}><path d="M5.5 5.5l13 13M18.5 5.5l-13 13" /></svg>;
}

export function IconLeaf({ size = 16, ...rest }: IconProps) {
  return (
    <svg {...base(size, rest)}>
      <path d="M12 21v-6" />
      <path d="M12 15c0-5 0-8-1-12-2 3-4 5-4 8 .5 3 3 4 5 4z" />
      <path d="M12 15c0-4 1-6 3-9-.5 3 1 4 3 5-.5 2-2 4-6 4z" />
      <path d="M12 15c2 0 5-1 8-3-1 2-2 3-3 4-1.5 1-4 1-5-1z" />
      <path d="M12 15c0-4-1-6-3-9 .5 3-1 4-3 5 .5 2 2 4 6 4z" />
      <path d="M12 15c-2 0-5-1-8-3 1 2 2 3 3 4 1.5 1 4 1 5-1z" />
    </svg>
  );
}

// ── CONVENIENCE MAP ───────────────────────────────────────────

export const StrainTypeIcon: Record<string, React.ComponentType<IconProps>> = {
  indica:  IconIndica,
  sativa:  IconSativa,
  hybrid:  IconHybrid,
  unknown: IconUnknown,
};
