// screen-scan.jsx — the Scan entry screen (3 states via Tweak)
// state: idle | extracting | results

function ScanScreen({ state = 'idle' }) {
  if (state === 'extracting') return <ScanExtracting />;
  if (state === 'results') return <ScanResults />;
  return <ScanIdle />;
}

// ── Idle: upload CTA + recents ─────────────────────────────────
function ScanIdle() {
  return (
    <div>
      <PageTitle subtitle="Snap a product label. The AI extracts strain, THC, terps, and price.">
        Scan a product
      </PageTitle>

      {/* Upload zone */}
      <div style={{
        border: '2px dashed var(--border-strong)',
        borderRadius: 16, padding: '28px 20px',
        background: 'var(--card)',
        textAlign: 'center',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'var(--chip-yellow-bg)',
          border: '1px solid var(--chip-yellow-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
               stroke="var(--brand-ai)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg-2)', marginBottom: 4 }}>
            Snap the label
          </div>
          <div style={{ fontSize: 12, color: 'var(--fg-6)', maxWidth: 260, lineHeight: 1.5 }}>
            Front of jar works best. We'll pull text and cross-check Leafly.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <Button variant="primary" full icon={<CameraIcon />}>Camera</Button>
          <Button variant="secondary" full icon={<UploadIcon />}>Upload</Button>
        </div>
      </div>

      {/* Recents */}
      <div style={{ marginTop: 28 }}>
        <Eyebrow style={{ marginBottom: 10 }}>Recent scans</Eyebrow>
        {[
          { name: 'Blue Dream', type: 'Sativa', thc: '22.4%', when: '2h ago', variant: 'amber' },
          { name: 'Northern Lights', type: 'Indica', thc: '19.1%', when: 'yesterday', variant: 'purple' },
          { name: 'Wedding Cake', type: 'Hybrid', thc: '24.8%', when: '3d ago', variant: 'emerald' },
        ].map((r, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 14px', marginBottom: 8,
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `var(--chip-${r.variant}-bg)`,
              border: `1px solid var(--chip-${r.variant}-border)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16,
            }}>
              <div style={{ width: 6, height: 20, borderRadius: 2, background: `var(--chip-${r.variant}-fg)` }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg-2)' }}>{r.name}</div>
              <div style={{ fontSize: 12, color: 'var(--fg-6)', marginTop: 2 }}>
                {r.type} · {r.thc} · {r.when}
              </div>
            </div>
            <Chip variant={r.variant}>{r.type}</Chip>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Extracting state ──────────────────────────────────────────
function ScanExtracting() {
  return (
    <div>
      <PageTitle>Extracting…</PageTitle>
      {/* Photo preview */}
      <div style={{
        width: '100%', aspectRatio: '4 / 3',
        borderRadius: 16, overflow: 'hidden', position: 'relative',
        background: 'linear-gradient(135deg, #1b2d26 0%, #2a1f3d 50%, #2b2718 100%)',
        border: '1px solid var(--border)',
        marginBottom: 16,
      }}>
        {/* Scanning sweep */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '40%', height: 2,
          background: 'linear-gradient(90deg, transparent, var(--brand-ai), transparent)',
          boxShadow: '0 0 20px var(--brand-ai)',
        }} />
        {/* Corner brackets */}
        {[
          { top: 12, left: 12, br: '0', tr: '0', bl: '0', bt: '2px solid', bl2: '2px solid' },
        ].map((_, i) => null)}
        {['tl', 'tr', 'bl', 'br'].map(pos => (
          <div key={pos} style={{
            position: 'absolute', width: 24, height: 24,
            ...(pos.includes('t') ? { top: 12 } : { bottom: 12 }),
            ...(pos.includes('l') ? { left: 12 } : { right: 12 }),
            borderTop: pos.includes('t') ? '2px solid var(--brand-ai)' : 'none',
            borderBottom: pos.includes('b') ? '2px solid var(--brand-ai)' : 'none',
            borderLeft: pos.includes('l') ? '2px solid var(--brand-ai)' : 'none',
            borderRight: pos.includes('r') ? '2px solid var(--brand-ai)' : 'none',
          }} />
        ))}
        {/* Fake label blur */}
        <div style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%,-50%)',
          fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.15)',
          filter: 'blur(1px)',
        }}>BLUE DREAM</div>
      </div>

      {/* Step list */}
      <Card style={{ padding: 0 }}>
        {[
          { label: 'Reading label', status: 'done' },
          { label: 'Identifying strain', status: 'done' },
          { label: 'Checking Leafly database', status: 'active' },
          { label: 'Estimating terpene profile', status: 'pending' },
        ].map((s, i, arr) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px',
            borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: 9999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              background: s.status === 'done' ? 'var(--emerald-500)'
                        : s.status === 'active' ? 'transparent'
                        : 'var(--bg-input)',
              border: s.status === 'active' ? '2px solid var(--brand-ai)' : 'none',
              borderTopColor: s.status === 'active' ? 'transparent' : undefined,
              animation: s.status === 'active' ? 'spin 1s linear infinite' : undefined,
            }}>
              {s.status === 'done' && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#052e16" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
            <div style={{
              flex: 1, fontSize: 14,
              color: s.status === 'pending' ? 'var(--fg-6)' : 'var(--fg-3)',
            }}>{s.label}</div>
            {s.status === 'active' && (
              <Badge variant="yellow">StrainAI</Badge>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── Results state ─────────────────────────────────────────────
function ScanResults() {
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <Badge variant="emerald" icon={<CheckDot />}>Matched</Badge>
        <Badge variant="yellow">StrainAI + Leafly</Badge>
      </div>

      <h1 style={{
        fontFamily: 'var(--font-body)', fontSize: 28, fontWeight: 700,
        color: 'var(--fg-2)', margin: '0 0 4px',
        letterSpacing: '-0.01em', lineHeight: 1.1,
      }}>Blue Dream</h1>
      <div style={{ fontSize: 13, color: 'var(--fg-6)', marginBottom: 20 }}>
        Sativa-dominant hybrid · Humboldt Seed Co. genetics
      </div>

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <StatCard eyebrow="THC" value="22.4%" caption="CBD 0.1%" accent="emerald" />
        <StatCard eyebrow="Type" value="Sativa" caption="70/30 split" accent="amber" />
      </div>

      {/* Terpenes */}
      <Eyebrow style={{ marginBottom: 8 }}>Top terpenes</Eyebrow>
      <Card style={{ marginBottom: 16 }}>
        {[
          { name: 'Myrcene', pct: 0.62, variant: 'emerald' },
          { name: 'Pinene', pct: 0.28, variant: 'sky' },
          { name: 'Caryophyllene', pct: 0.19, variant: 'amber' },
        ].map((t, i) => (
          <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--fg-3)' }}>{t.name}</span>
              <span style={{ fontSize: 12, color: 'var(--fg-6)', fontVariantNumeric: 'tabular-nums' }}>
                {t.pct.toFixed(2)}%
              </span>
            </div>
            <ProgressBar value={t.pct} max={0.7} accent={t.variant === 'sky' ? 'amber' : t.variant === 'amber' ? 'amber' : 'emerald'} />
          </div>
        ))}
      </Card>

      {/* Effects + flavors */}
      <Eyebrow style={{ marginBottom: 8 }}>Expected effects</Eyebrow>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {['Creative', 'Uplifted', 'Euphoric', 'Focused', 'Relaxed'].map(e => (
          <Chip key={e} variant="emerald">{e}</Chip>
        ))}
      </div>

      <Eyebrow style={{ marginBottom: 8 }}>Flavors</Eyebrow>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {['Berry', 'Sweet', 'Pine'].map(f => (
          <Chip key={f} variant="amber">{f}</Chip>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="primary" full>Log session</Button>
        <Button variant="secondary" full>Save to stash</Button>
      </div>
    </div>
  );
}

// Inline icons
function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  );
}
function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}
function CheckDot() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 2 }}><polyline points="20 6 9 17 4 12"/></svg>
  );
}

Object.assign(window, { ScanScreen });
