// components/icons.tsx — CannaBaseAI complete icon set.
// Stroke-based, currentColor, 1.5px strokeWidth, viewBox 0 0 24 24.
// Each icon accepts { size?: number, ...SVGProps }.

import React, { SVGProps } from 'react';

type IconProps = { size?: number } & SVGProps<SVGSVGElement>;

const _base = (size = 16, rest: SVGProps<SVGSVGElement>) => ({
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  width: size,
  height: size,
  ...rest,
});

// ── STRAIN TYPES ─────────────────────────────────────────────────────────────

export function IconIndica({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>;
}

export function IconSativa({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" />
    </svg>
  );
}

export function IconHybrid({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M7 3c0 3.5 10 6.5 10 10S7 17.5 7 21" />
      <path d="M17 3c0 3.5-10 6.5-10 10s10 3.5 10 7" />
      <path d="M8.5 7h7M8.5 17h7M10 10.5h4M10 13.5h4" />
    </svg>
  );
}

export function IconUnknown({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.2a2.7 2.7 0 0 1 5.2.8c0 1.7-2.5 2.2-2.5 3.8" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── CONSUMPTION METHODS ───────────────────────────────────────────────────────

export function IconJoint({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M3 16l12-5 4 1.5-12 5z" />
      <path d="M19 11.5l2 .8" />
      <circle cx="20.5" cy="11.8" r="0.8" fill="currentColor" stroke="none" />
      <path d="M20.5 9c.5-1 0-1.8-.5-2.3M22 8.2c.5-.8.2-1.7-.3-2.2" opacity="0.6" />
    </svg>
  );
}

export function IconKingSize({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M2 17l15-6 4 1.5-15 6z" />
      <path d="M21 12.5l1.5.6" />
      <circle cx="22.3" cy="12.9" r="0.6" fill="currentColor" stroke="none" />
      <path d="M5 15l.8-1.5.8 1 .8-1.8.8 1.3.8-1" />
    </svg>
  );
}

export function IconBlunt({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M3 13.5c1-2 4-3 9-3s7 .5 9 1.5-2 2.5-9 2.5-9-1-9-1z" />
      <path d="M20 12.5l2 .5-2 .5" />
      <circle cx="22.3" cy="13" r="0.6" fill="currentColor" stroke="none" />
      <path d="M7 11.5l1 2M11 11l1 2M15 11l1 2" opacity="0.7" />
    </svg>
  );
}

export function IconBong({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M9 3h3" /><path d="M10.5 3v5" />
      <path d="M8 8h5l-0.3 3" />
      <path d="M12.7 11a6 6 0 1 1-5.4 0" />
      <path d="M13 12l3-1.5.5 2-2.8 1.2" />
    </svg>
  );
}

export function IconBowl({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M3 14h10" />
      <circle cx="16" cy="14" r="5" />
      <path d="M14.5 9.5l1 2 2-.5" />
      <path d="M3 13v2" />
    </svg>
  );
}

export function IconVape({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M4 10h2v4H4z" />
      <path d="M6 9.5h7v5H6z" />
      <path d="M13 8.5h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-6z" />
      <circle cx="17" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconEdible({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-5-5z" />
      <path d="M8 11.5l-.6 1.2M9 11l.3.8M14 15l-.5 1M10 15.5l-.5 1" />
      <circle cx="8" cy="11" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="14.5" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="10" cy="15" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconBrownie({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M4 6h12.5a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 16.5 13V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
      <path d="M7 10c0-1.5.8-2.5 2-3-0.2 1.3-1 2.3-2 3z" />
      <path d="M7 10v2" />
      <circle cx="10" cy="14" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="13" cy="17" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="7"  cy="16" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── UI ICONS ─────────────────────────────────────────────────────────────────

export function IconSearch({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>;
}
export function IconWarning({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 3.5L21.5 20H2.5z" />
      <path d="M12 10v5" />
      <circle cx="12" cy="17.5" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconCheck({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M4.5 12.5l4.5 4.5L19.5 6.5" /></svg>;
}
export function IconClose({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M5.5 5.5l13 13M18.5 5.5l-13 13" /></svg>;
}
export function IconLeaf({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 21v-6" />
      <path d="M12 15c0-5 0-8-1-12-2 3-4 5-4 8 .5 3 3 4 5 4z" />
      <path d="M12 15c0-4 1-6 3-9-.5 3 1 4 3 5-.5 2-2 4-6 4z" />
      <path d="M12 15c2 0 5-1 8-3-1 2-2 3-3 4-1.5 1-4 1-5-1z" />
      <path d="M12 15c0-4-1-6-3-9 .5 3-1 4-3 5 .5 2 2 4 6 4z" />
      <path d="M12 15c-2 0-5-1-8-3 1 2 2 3 3 4 1.5 1 4 1 5-1z" />
    </svg>
  );
}

// ── ACTIONS ───────────────────────────────────────────────────────────────────

export function IconSave({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 3v11" /><path d="M7 10l5 5 5-5" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
export function IconCamera({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
export function IconScan({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M4 8V6a2 2 0 0 1 2-2h2" /><path d="M20 8V6a2 2 0 0 0-2-2h-2" />
      <path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M20 16v2a2 2 0 0 1-2 2h-2" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconRefresh({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M20 12a8 8 0 1 1-2.9-6.2" /><path d="M20 4v4h-4" /></svg>;
}
export function IconPin({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}
export function IconScale({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 4v16" /><path d="M6 20h12" /><path d="M6 8h12" />
      <path d="M3 12l3-6 3 6a3 3 0 0 1-6 0z" />
      <path d="M15 12l3-6 3 6a3 3 0 0 1-6 0z" />
    </svg>
  );
}
export function IconTrophy({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v1a3 3 0 0 0 3 3" /><path d="M17 6h3v1a3 3 0 0 1-3 3" />
      <path d="M12 14v3" /><path d="M8 20h8" /><path d="M9 17h6v3H9z" />
    </svg>
  );
}
export function IconTag({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M20.6 12.6l-8 8a2 2 0 0 1-2.8 0L3 13.8V4h9.8l7.8 7.8a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </svg>
  );
}
export function IconSparkle({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z" />
      <path d="M19 4l.6 1.8L21.5 6.5l-1.9.7L19 9l-.6-1.8L16.5 6.5l1.9-.7z" />
    </svg>
  );
}
export function IconLightbulb({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M9 18h6" /><path d="M10 21h4" />
      <path d="M12 3a6 6 0 0 0-4 10.5c.8.8 1.5 1.6 1.5 2.5V17h5v-1c0-.9.7-1.7 1.5-2.5A6 6 0 0 0 12 3z" />
    </svg>
  );
}
export function IconGlobe({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" /><path d="M12 3a13 13 0 0 1 0 18" /><path d="M12 3a13 13 0 0 0 0 18" />
    </svg>
  );
}
export function IconHourglass({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M6 3h12" /><path d="M6 21h12" />
      <path d="M7 3v3c0 3 5 4 5 6s-5 3-5 6v3" />
      <path d="M17 3v3c0 3-5 4-5 6s5 3 5 6v3" />
    </svg>
  );
}
export function IconMail({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
}
export function IconLink({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M10 13.5a4 4 0 0 0 5.6 0l2.5-2.5a4 4 0 1 0-5.6-5.6l-1 1" />
      <path d="M14 10.5a4 4 0 0 0-5.6 0l-2.5 2.5a4 4 0 1 0 5.6 5.6l1-1" />
    </svg>
  );
}
export function IconPhone({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>;
}
export function IconFloppy({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M4 4h12l4 4v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M7 4v5h8V4" /><rect x="7" y="13" width="10" height="6" rx="0.5" />
    </svg>
  );
}
export function IconEdit({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M15.5 3.5l5 5L8 21H3v-5z" /><path d="M13 6l5 5" /></svg>;
}
export function IconComment({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-9l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z" />
      <circle cx="8.5" cy="11" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="12"  cy="11" r="0.7" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="11" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconBookmark({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M6 3h12v18l-6-4-6 4z" /></svg>;
}
export function IconStar({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)} fill="currentColor"><path d="M12 3l2.8 6 6.4.6-4.8 4.4 1.4 6.4L12 17.5 6.2 20.4l1.4-6.4L2.8 9.6 9.2 9z" /></svg>;
}
export function IconStarOutline({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M12 3l2.8 6 6.4.6-4.8 4.4 1.4 6.4L12 17.5 6.2 20.4l1.4-6.4L2.8 9.6 9.2 9z" /></svg>;
}
export function IconCrown({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M3 8l3 9h12l3-9-4.5 3L12 5 7.5 11z" /><path d="M5 20h14" />
      <circle cx="3" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="21" cy="8" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

// ── STATUS & FEEDBACK ─────────────────────────────────────────────────────────

export function IconThumbsUp({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M7 11v9h-3a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z" />
      <path d="M7 11l3.5-7a2 2 0 0 1 2-1 2 2 0 0 1 2 2v4h4.5a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 17.7 20H7z" />
    </svg>
  );
}
export function IconThumbsDown({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M7 13V4h-3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1z" />
      <path d="M7 13l3.5 7a2 2 0 0 0 2 1 2 2 0 0 0 2-2v-4h4.5a2 2 0 0 0 2-2.3l-1.3-7A2 2 0 0 0 17.7 4H7z" />
    </svg>
  );
}
export function IconFire({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 3c0 3-3 4-3 7 0 1.5 1 2.5 2 3-.5-1.5 1-3 2-3 0 2 3 2.5 3 5.5a6 6 0 0 1-12 0c0-5 5-5 5-12.5z" />
      <path d="M11 16c0-1 .5-2 1.5-2.5" />
    </svg>
  );
}
export function IconTurtle({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <ellipse cx="12" cy="12" rx="6" ry="5" />
      <circle cx="19" cy="12" r="1.8" />
      <path d="M7 8l-2-1M7 16l-2 1M17 8l1-1M17 16l1 1" />
      <path d="M6 12H4" />
      <path d="M12 9v6M9 12h6" opacity="0.7" />
    </svg>
  );
}
export function IconBrain({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 5a3 3 0 0 0-3 3 2.5 2.5 0 0 0-3 3c0 1 .5 2 1.5 2.5A3 3 0 0 0 9 18a3 3 0 0 0 3 2" />
      <path d="M12 5a3 3 0 0 1 3 3 2.5 2.5 0 0 1 3 3c0 1-.5 2-1.5 2.5A3 3 0 0 1 15 18a3 3 0 0 1-3 2" />
      <path d="M12 5v15" />
      <path d="M9 11.5h2M13 11.5h2" opacity="0.7" />
    </svg>
  );
}
export function IconMuscle({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M3 18c0-4 3-7 8-7" />
      <path d="M11 11a4 4 0 0 0 4-4V4" />
      <path d="M15 4h4v6a4 4 0 0 1-4 4h-4" />
      <path d="M11 14v4" />
    </svg>
  );
}
export function IconOkHand({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <circle cx="9" cy="10" r="3" />
      <path d="M12 9c1 0 2-1 2-2V4" />
      <path d="M14 9c1 0 2-1 2-2V5" />
      <path d="M16 10c1 0 2-1 2-2V7" />
      <path d="M8 13v5a2 2 0 0 0 2 2h4a4 4 0 0 0 4-4v-6" />
    </svg>
  );
}
export function IconArrowUp({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M12 20V4" /><path d="M5 11l7-7 7 7" /></svg>;
}
export function IconArrowDown({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M12 4v16" /><path d="M5 13l7 7 7-7" /></svg>;
}
export function IconPinch({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M9 12c-1-1-1-2 0-3l3-3c1-1 2-1 3 0s1 2 0 3l-2 2" />
      <path d="M15 11l-1 1c-1 1-1 2 0 3" />
      <path d="M11 13l-2 2c-1 1-1 2 0 3l1 1a3 3 0 0 0 4 0l3-3c1-1 1-2 0-3" />
      <path d="M10 19l-2 2" />
    </svg>
  );
}
export function IconWave({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M8 20a5 5 0 0 1-3-4.5V9a1.5 1.5 0 0 1 3 0v3" />
      <path d="M8 11V5a1.5 1.5 0 0 1 3 0v7" />
      <path d="M11 11V4a1.5 1.5 0 0 1 3 0v8" />
      <path d="M14 12V6a1.5 1.5 0 0 1 3 0v8" />
      <path d="M18.5 7l2-1M19 11l2 .5M19 15l2 1" opacity="0.7" />
    </svg>
  );
}
export function IconPointUp({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M10 20v-8V4a1.5 1.5 0 0 1 3 0v8" />
      <path d="M13 11V9a1.5 1.5 0 0 1 3 0v5" />
      <path d="M16 11v-1a1.5 1.5 0 0 1 3 0v5a5 5 0 0 1-5 5h-2a4 4 0 0 1-3-2l-2-3" />
    </svg>
  );
}
export function IconFolded({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 4v16" />
      <path d="M12 20H7a2 2 0 0 1-2-2l-2-6a2 2 0 0 1 2-2.5l2 .5 5-6z" />
      <path d="M12 20h5a2 2 0 0 0 2-2l2-6a2 2 0 0 0-2-2.5l-2 .5-5-6z" />
    </svg>
  );
}
export function IconHandshake({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M2 11l4-3 4 2 2 2" /><path d="M22 11l-4-3-4 2-2 2" />
      <path d="M8 14l2 2a2 2 0 0 0 3 0l3-3 2 2" /><path d="M14 11l-3 3" />
    </svg>
  );
}
export function IconHeart({ size = 16, ...rest }: IconProps) {
  return <svg {..._base(size, rest)}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>;
}
export function IconPeople({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <circle cx="9" cy="8" r="3" /><path d="M3 20v-1a5 5 0 0 1 10 0v1" />
      <circle cx="16" cy="9" r="2.5" /><path d="M14 14.5a4 4 0 0 1 7 3.5V19" />
    </svg>
  );
}

// ── TIERS ─────────────────────────────────────────────────────────────────────

export function IconSeedling({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 20v-7" />
      <path d="M12 13c-3 0-5-2-5-4 3 0 5 2 5 4z" />
      <path d="M12 13c3 0 5-2 5-4-3 0-5 2-5 4z" />
      <path d="M5 20h14" />
    </svg>
  );
}
export function IconGrower({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 21V9" />
      <path d="M12 9c0-3-1-5-3-6 0 3 1 5 3 6z" />
      <path d="M12 13c-3 0-5-1-6-3 3-1 5 0 6 3z" />
      <path d="M12 13c3 0 5-1 6-3-3-1-5 0-6 3z" />
      <path d="M6 21h12" />
    </svg>
  );
}
export function IconConnoisseur({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 21V6" />
      <path d="M12 6c-1.5 0-2.5-1-2.5-2.5C11 3.5 12 4.5 12 6z" />
      <path d="M12 6c1.5 0 2.5-1 2.5-2.5C13 3.5 12 4.5 12 6z" />
      <path d="M12 10c-2-.5-3.5-2-4-4 2 .5 3.5 2 4 4z" />
      <path d="M12 10c2-.5 3.5-2 4-4-2 .5-3.5 2-4 4z" />
      <path d="M12 15c-3 0-5.5-1.5-6.5-4 3 0 5.5 1.5 6.5 4z" />
      <path d="M12 15c3 0 5.5-1.5 6.5-4-3 0-5.5 1.5-6.5 4z" />
      <path d="M5 21h14" />
    </svg>
  );
}
export function IconLegend({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M12 22V4" />
      <path d="M12 4c-1 0-2-1-2-2.5C11 1.5 12 2.5 12 4z" />
      <path d="M12 4c1 0 2-1 2-2.5C13 1.5 12 2.5 12 4z" />
      <path d="M12 8c-2 0-4-1.5-4.5-3.5 2 0 4 1.5 4.5 3.5z" />
      <path d="M12 8c2 0 4-1.5 4.5-3.5-2 0-4 1.5-4.5 3.5z" />
      <path d="M12 13c-3.5 0-6.5-2-7.5-5 3.5 0 6.5 2 7.5 5z" />
      <path d="M12 13c3.5 0 6.5-2 7.5-5-3.5 0-6.5 2-7.5 5z" />
      <path d="M12 18c-2.5-.5-4.5-2.5-5-5 2.5.5 4.5 2.5 5 5z" />
      <path d="M12 18c2.5-.5 4.5-2.5 5-5-2.5.5-4.5 2.5-5 5z" />
      <path d="M4 22h16" />
      <path d="M7 22c0-1.5 2-2.5 5-2.5s5 1 5 2.5" opacity="0.6" />
    </svg>
  );
}

// ── REFERENCE OBJECTS ─────────────────────────────────────────────────────────

export function IconGolfBall({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="9"  cy="9"  r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="8"  r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9"  r="0.6" fill="currentColor" stroke="none" />
      <circle cx="8"  cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="16" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="9"  cy="15" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="16" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="15" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
export function IconBattery({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <rect x="3" y="8" width="16" height="8" rx="1.5" />
      <path d="M20 10.5v3h1.5a.5.5 0 0 0 .5-.5v-2a.5.5 0 0 0-.5-.5z" />
      <path d="M5 10h7v4H5z" fill="currentColor" stroke="none" opacity="0.9" />
    </svg>
  );
}
export function IconCup({ size = 16, ...rest }: IconProps) {
  return (
    <svg {..._base(size, rest)}>
      <path d="M5 7h14l-1.5 13a1 1 0 0 1-1 1H7.5a1 1 0 0 1-1-1z" />
      <path d="M4 7h16" /><path d="M13 3l-2 8" />
      <path d="M6 11h12" opacity="0.5" />
    </svg>
  );
}

// ── REGISTRIES ────────────────────────────────────────────────────────────────

export const StrainTypeIcon: Record<string, React.ComponentType<IconProps>> = {
  indica: IconIndica, sativa: IconSativa, hybrid: IconHybrid, unknown: IconUnknown,
};

export const ConsumptionIcon: Record<string, React.ComponentType<IconProps>> = {
  joint: IconJoint, 'pre-roll': IconJoint, 'king-size': IconKingSize,
  blunt: IconBlunt, bong: IconBong, bowl: IconBowl, pipe: IconBowl,
  vape: IconVape, edible: IconEdible, brownie: IconBrownie,
};

export const TierIcon: Record<string, React.ComponentType<IconProps>> = {
  seedling: IconSeedling, grower: IconGrower,
  connoisseur: IconConnoisseur, legend: IconLegend,
};
