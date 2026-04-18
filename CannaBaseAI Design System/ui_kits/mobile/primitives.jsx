// primitives.jsx — shared atoms: Chip, Stars, StatCard, PageTitle, Eyebrow, etc.

// ── Chip ──────────────────────────────────────────────────────
// variant: emerald | purple | amber | yellow | sky | rose | zinc
function Chip({ children, variant = 'zinc', onClick, selected, icon, style = {} }) {
  const v = variant;
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '4px 10px', borderRadius: 9999,
        fontSize: 12, fontWeight: 500,
        fontFamily: 'var(--font-body)',
        background: selected === false ? 'var(--chip-zinc-bg)' : `var(--chip-${v}-bg)`,
        border: `1px solid ${selected === false ? 'var(--chip-zinc-border)' : `var(--chip-${v}-border)`}`,
        color: selected === false ? 'var(--chip-zinc-fg)' : `var(--chip-${v}-fg)`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

// ── Section header ────────────────────────────────────────────
function PageTitle({ children, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h1 style={{
        fontFamily: 'var(--font-body)',
        fontSize: 24, fontWeight: 700,
        color: 'var(--fg-2)', margin: 0,
        letterSpacing: '-0.01em', lineHeight: 1.1,
      }}>{children}</h1>
      {subtitle && (
        <p style={{
          fontSize: 14, color: 'var(--fg-5)', margin: '4px 0 0',
          lineHeight: 1.5,
        }}>{subtitle}</p>
      )}
    </div>
  );
}

function Eyebrow({ children, style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-body)',
      fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.15em',
      color: 'var(--fg-6)',
      ...style,
    }}>{children}</div>
  );
}

// ── Card ──────────────────────────────────────────────────────
function Card({ children, style = {}, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 16,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms',
        ...style,
      }}
    >{children}</div>
  );
}

// ── Stars ─────────────────────────────────────────────────────
function Stars({ value, max = 5, size = 14, onChange }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <svg
            key={i} width={size} height={size} viewBox="0 0 24 24"
            onClick={onChange ? () => onChange(i + 1) : undefined}
            style={{ cursor: onChange ? 'pointer' : 'default' }}
            fill={filled ? 'var(--yellow-300)' : 'none'}
            stroke={filled ? 'var(--yellow-300)' : 'var(--fg-7)'}
            strokeWidth="2" strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        );
      })}
    </div>
  );
}

// ── Stat card (KPI) ───────────────────────────────────────────
function StatCard({ eyebrow, value, caption, accent = 'emerald' }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{
        fontSize: 10, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.15em',
        color: `var(--${accent}-400)`, marginBottom: 6,
      }}>{eyebrow}</div>
      <div style={{
        fontSize: 30, fontWeight: 700,
        color: 'var(--fg-2)', lineHeight: 1.1,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</div>
      {caption && (
        <div style={{ fontSize: 12, color: 'var(--fg-6)', marginTop: 4 }}>{caption}</div>
      )}
    </Card>
  );
}

// ── Button ────────────────────────────────────────────────────
function Button({ variant = 'primary', children, onClick, disabled, style = {}, icon, full }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    padding: '12px 20px',
    borderRadius: 12,
    fontSize: 14, fontWeight: 600,
    fontFamily: 'var(--font-body)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent',
    transition: 'all 150ms',
    minHeight: 44,
    width: full ? '100%' : undefined,
    opacity: disabled ? 0.4 : 1,
  };
  const variants = {
    primary: { background: 'var(--emerald-500)', color: '#052e16', borderColor: 'var(--emerald-500)' },
    secondary: { background: 'var(--bg-input)', color: 'var(--fg-3)', borderColor: 'var(--border-strong)' },
    ghost: { background: 'transparent', color: 'var(--fg-4)' },
    ai: { background: 'var(--yellow-300)', color: '#422006', borderColor: 'var(--yellow-300)' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {icon}
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────
function Badge({ children, variant = 'zinc', icon }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 6,
      fontSize: 10, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      background: `var(--chip-${variant}-bg)`,
      border: `1px solid var(--chip-${variant}-border)`,
      color: `var(--chip-${variant}-fg)`,
    }}>{icon}{children}</span>
  );
}

// ── Progress bar ──────────────────────────────────────────────
function ProgressBar({ value, max = 100, accent = 'emerald', height = 6 }) {
  return (
    <div style={{
      width: '100%', height, borderRadius: 9999,
      background: 'var(--bg-input)', overflow: 'hidden',
    }}>
      <div style={{
        width: `${Math.min(100, (value / max) * 100)}%`,
        height: '100%', borderRadius: 9999,
        background: `var(--${accent}-400)`,
        transition: 'width 300ms',
      }} />
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────
function Input({ placeholder, value, onChange, leading, trailing, style = {} }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '0 12px', minHeight: 44,
      background: 'var(--bg-input)',
      border: '1px solid var(--border-strong)',
      borderRadius: 12,
      ...style,
    }}>
      {leading}
      <input
        type="text" placeholder={placeholder} value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: 'var(--fg-2)', fontSize: 14, fontFamily: 'var(--font-body)',
          minWidth: 0,
        }}
      />
      {trailing}
    </div>
  );
}

// ── Segmented control ─────────────────────────────────────────
function Segmented({ options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 12, padding: 3, gap: 2,
    }}>
      {options.map(opt => {
        const id = typeof opt === 'string' ? opt : opt.id;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange && onChange(id)}
            style={{
              padding: '6px 12px', borderRadius: 9,
              fontSize: 12, fontWeight: 500,
              fontFamily: 'var(--font-body)',
              background: active ? 'var(--bg-input)' : 'transparent',
              color: active ? 'var(--fg-2)' : 'var(--fg-6)',
              border: 'none', cursor: 'pointer',
              transition: 'all 150ms',
            }}
          >{label}</button>
        );
      })}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────
function Divider({ style = {} }) {
  return <div style={{ height: 1, background: 'var(--border)', margin: '16px 0', ...style }} />;
}

Object.assign(window, {
  Chip, PageTitle, Eyebrow, Card, Stars, StatCard, Button, Badge,
  ProgressBar, Input, Segmented, Divider,
});
