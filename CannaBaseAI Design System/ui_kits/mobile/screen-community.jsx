// screen-community.jsx — Community feed
// A stream of FeedCards with author, tier, rating, effects/flavors, helpful votes.

function CommunityScreen() {
  return (
    <div>
      <PageTitle subtitle="Real reviews from the stash. Upvote what matches your experience.">
        Community
      </PageTitle>

      {/* Filter row */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, marginBottom: 4 }}>
        {[
          { label: 'All', v: 'zinc', active: true },
          { label: 'Sativa', v: 'amber' },
          { label: 'Indica', v: 'purple' },
          { label: 'Hybrid', v: 'emerald' },
          { label: 'Edibles', v: 'purple' },
          { label: 'Concentrate', v: 'sky' },
        ].map((f, i) => (
          <Chip key={i} variant={f.v} selected={f.active === true ? undefined : false}>{f.label}</Chip>
        ))}
      </div>

      {FEED.map((post, i) => <FeedCard key={i} {...post} />)}
    </div>
  );
}

const FEED = [
  {
    author: 'TerpHunter_PZ', tier: 'connoisseur', when: '2h ago',
    strain: 'Gelato #33', strainType: 'hybrid',
    dispensary: 'Sweet Flower · Melrose',
    rating: 4.5,
    effects: ['Euphoric', 'Creative', 'Relaxed'],
    flavors: ['Cookie', 'Citrus'],
    body: "Sticky, dense buds. Hits fast and plateaus smooth for about two hours — great for a long gallery walk, less so for admin.",
    helpful: 24, comments: 3, buyAgain: true,
  },
  {
    author: 'GreenThumb_AJ', tier: 'legend', when: '6h ago',
    strain: 'Granddaddy Purple', strainType: 'indica',
    dispensary: 'MedMen · DTLA',
    rating: 5,
    effects: ['Sleepy', 'Hungry', 'Relaxed'],
    flavors: ['Grape', 'Berry'],
    body: "Textbook GDP. Locked me to the couch in 15. Would absolutely re-up for bad-sleep weeks.",
    helpful: 58, comments: 11, buyAgain: true,
  },
  {
    author: 'NewLeafMaya', tier: 'seedling', when: 'yesterday',
    strain: 'Sour Diesel', strainType: 'sativa',
    dispensary: 'STIIIZY · Downtown',
    rating: 3,
    effects: ['Energetic', 'Anxious'],
    flavors: ['Diesel', 'Pine'],
    body: "Smells incredible but too racy for me. Fine as a 10am microdose, not an afternoon session.",
    helpful: 9, comments: 2, buyAgain: false,
  },
];

// ── FeedCard ──────────────────────────────────────────────────
function FeedCard({ author, tier, when, strain, strainType, dispensary, rating, effects, flavors, body, helpful, comments, buyAgain }) {
  const typeVariant = strainType === 'sativa' ? 'amber'
                    : strainType === 'indica' ? 'purple'
                    : 'emerald';

  return (
    <Card style={{ marginBottom: 12, padding: 16 }}>
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Avatar name={author} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-2)' }}>{author}</span>
            <TierBadge tier={tier} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--fg-6)', marginTop: 1 }}>
            {when} · {dispensary}
          </div>
        </div>
      </div>

      {/* Strain + rating */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginBottom: 10,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-2)' }}>{strain}</div>
          <div style={{ marginTop: 4 }}>
            <Chip variant={typeVariant}>{strainType[0].toUpperCase() + strainType.slice(1)}</Chip>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Stars value={rating} />
          <div style={{ fontSize: 11, color: 'var(--fg-6)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            {rating.toFixed(1)} / 5
          </div>
        </div>
      </div>

      {/* Body quote */}
      <p style={{
        fontSize: 14, fontStyle: 'italic', color: 'var(--fg-4)',
        lineHeight: 1.6, margin: '0 0 12px',
        textWrap: 'pretty',
      }}>"{body}"</p>

      {/* Effects + flavors */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
        {effects.map(e => <Chip key={e} variant="emerald">{e}</Chip>)}
        {flavors.map(f => <Chip key={f} variant="amber">{f}</Chip>)}
      </div>

      {/* Footer actions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16,
        paddingTop: 12, borderTop: '1px solid var(--border)',
        fontSize: 12, color: 'var(--fg-5)',
      }}>
        <button style={iconBtn}>
          <ThumbUpIcon /> {helpful}
        </button>
        <button style={iconBtn}>
          <ChatIcon /> {comments}
        </button>
        {buyAgain && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 11, color: 'var(--emerald-300)',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <RefreshIcon /> Would buy again
          </span>
        )}
        {!buyAgain && (
          <span style={{
            marginLeft: 'auto',
            fontSize: 11, color: 'var(--fg-6)',
          }}>
            Pass
          </span>
        )}
      </div>
    </Card>
  );
}

const iconBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  background: 'transparent', border: 'none',
  color: 'var(--fg-5)', fontSize: 12, fontWeight: 500,
  cursor: 'pointer', padding: 0, fontFamily: 'inherit',
};

// ── Avatar with 2-letter initials ─────────────────────────────
function Avatar({ name }) {
  const initials = name.split(/[_ ]/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const palette = ['var(--emerald-500)', 'var(--purple-500)', 'var(--amber-500)', 'var(--sky-400)', 'var(--rose-400)'];
  const hue = palette[name.charCodeAt(0) % palette.length];
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 9999,
      background: `linear-gradient(135deg, ${hue}, var(--bg-input))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 700, color: '#fff',
      flexShrink: 0,
    }}>{initials}</div>
  );
}

// ── Tier badge ────────────────────────────────────────────────
function TierBadge({ tier }) {
  const map = {
    seedling:    { label: 'Seedling',    color: 'var(--tier-seedling)',    bg: 'rgba(161,161,170,0.12)' },
    grower:      { label: 'Grower',      color: 'var(--tier-grower)',      bg: 'rgba(163,230,53,0.12)' },
    connoisseur: { label: 'Connoisseur', color: 'var(--tier-connoisseur)', bg: 'rgba(52,211,153,0.12)' },
    legend:      { label: 'Legend',      color: 'var(--tier-legend)',      bg: 'rgba(250,204,21,0.14)' },
  };
  const t = map[tier];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      padding: '1px 7px', borderRadius: 6,
      fontSize: 9, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.08em',
      background: t.bg, color: t.color,
      border: `1px solid ${t.color}33`,
    }}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill={t.color}><path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/></svg>
      {t.label}
    </span>
  );
}

function ThumbUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  );
}

Object.assign(window, { CommunityScreen, FeedCard, Avatar, TierBadge });
