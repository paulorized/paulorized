// shell.jsx — CannaBaseAI app shell: tri-color wordmark header + bottom nav.
// Reproduces app/layout.tsx. Uses tokens from colors_and_type.css via CSS vars.

const shellStyles = {
  root: {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: 'var(--bg)',
    color: 'var(--fg-4)',
    fontFamily: 'var(--font-body)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    position: 'sticky', top: 0, zIndex: 50,
    background: 'rgba(9,9,11,0.9)',
    backdropFilter: 'blur(12px) saturate(180%)',
    WebkitBackdropFilter: 'blur(12px) saturate(180%)',
    borderBottom: '1px solid rgba(39,39,42,0.6)',
    padding: '8px 16px 0',
  },
  topRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 44,
  },
  wordmark: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 20,
    letterSpacing: '-0.01em',
    lineHeight: 1,
  },
  headerIcons: {
    display: 'flex', gap: 6, alignItems: 'center',
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'transparent', border: 'none', color: 'var(--fg-5)',
    cursor: 'pointer',
  },
  avatar: {
    width: 30, height: 30, borderRadius: 9999,
    background: 'linear-gradient(135deg, var(--purple-500), var(--emerald-500))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 600, color: '#fff',
  },
  navRow: {
    display: 'flex', gap: 2,
    padding: '6px 0',
    overflowX: 'auto',
    scrollbarWidth: 'none',
  },
  navItem: (active) => ({
    flexShrink: 0,
    padding: '6px 10px',
    fontSize: 13,
    fontWeight: 500,
    borderRadius: 8,
    color: active ? 'var(--fg-2)' : 'var(--fg-6)',
    background: active ? 'var(--bg-input)' : 'transparent',
    border: 'none', cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  }),
  body: {
    flex: 1, overflow: 'auto', padding: '16px',
    paddingBottom: 32,
  },
};

// ── Tri-color wordmark ────────────────────────────────────────
function Wordmark({ size = 20 }) {
  return (
    <div style={{ ...shellStyles.wordmark, fontSize: size }}>
      <span style={{ color: 'var(--brand-canna)' }}>Canna</span>
      <span style={{ color: 'var(--brand-base)' }}>Base</span>
      <span style={{ color: 'var(--brand-ai)' }}>AI</span>
    </div>
  );
}

// ── Bell + avatar ─────────────────────────────────────────────
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}

// ── Shell wrapper ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'scan', label: 'Scan' },
  { id: 'community', label: 'Community' },
  { id: 'strain', label: 'StrainAI' },
  { id: 'stats', label: 'Stats' },
  { id: 'stash', label: 'Stash' },
  { id: 'profile', label: 'Profile' },
];

function AppShell({ active = 'scan', onNav, children, notifCount = 3 }) {
  return (
    <div style={shellStyles.root}>
      <div style={shellStyles.header}>
        <div style={shellStyles.topRow}>
          <Wordmark />
          <div style={shellStyles.headerIcons}>
            <button style={{ ...shellStyles.iconBtn, position: 'relative' }} aria-label="Notifications">
              <BellIcon />
              {notifCount > 0 && (
                <span style={{
                  position: 'absolute', top: 5, right: 5,
                  minWidth: 16, height: 16, borderRadius: 9999,
                  background: 'var(--rose-500)', color: '#fff',
                  fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 4px',
                }}>{notifCount}</span>
              )}
            </button>
            <div style={shellStyles.avatar}>PZ</div>
          </div>
        </div>
        <div style={shellStyles.navRow}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              style={shellStyles.navItem(active === item.id)}
              onClick={() => onNav && onNav(item.id)}
            >{item.label}</button>
          ))}
        </div>
      </div>
      <div style={shellStyles.body}>{children}</div>
    </div>
  );
}

Object.assign(window, { AppShell, Wordmark });
