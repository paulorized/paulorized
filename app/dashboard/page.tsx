'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WeightWidget } from '@/components/weight-widget';
import { StatsCard } from '@/components/stats-card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';

type ThcRecord = { strain_name: string | null; brand: string | null; thc_percent: number };

type DashboardData = {
  totalScans: number;
  totalReviews: number;
  totalGrams: number;
  avgThc: number | null;
  avgRating: number | null;
  wbaPct: number | null;
  strainTypeCounts: Record<string, number>;
  productTypeCounts: Record<string, number>;
  topBrands: { name: string; count: number }[];
  topDispensaries: { name: string; count: number }[];
  topEffects: { name: string; count: number }[];
  topFlavors: { name: string; count: number }[];
  thcDistribution: { range: string; count: number }[];
  scansOverTime: { date: string; count: number }[];
  topStrains: { name: string; count: number }[];
  highestThcByType: Record<string, ThcRecord>;
  uniqueStrains: number;
  lastLogDate: string | null;
  favProductType: { name: string; count: number } | null;
  favDispensary: { name: string; count: number } | null;
};

type CommunityData = {
  totalScans: number;
  totalUsers: number;
  totalGrams: number;
  isFallback: boolean;
  avgThc: number | null;
  strainTypeCounts: Record<string, number>;
  topStrains: { name: string; count: number }[];
  topBrands: { name: string; count: number }[];
  topProductTypes: { name: string; count: number }[];
  topDispensaries: { name: string; count: number }[];
  topEffects: { name: string; count: number }[];
  topFlavors: { name: string; count: number }[];
};

const STRAIN_COLORS: Record<string, string> = {
  sativa: '#f59e0b', indica: '#8b5cf6', hybrid: '#10b981', unknown: '#52525b',
};
const COLORS = ['#10b981','#8b5cf6','#f59e0b','#3b82f6','#ef4444','#ec4899','#14b8a6','#f97316'];
const TT = {
  contentStyle: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#f4f4f5', fontSize: 12 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">{label}</p>
      <p className="mt-1 text-3xl font-bold text-zinc-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{title}</h2>
      {children}
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/30 py-8">
      <p className="text-sm text-zinc-600">{msg}</p>
    </div>
  );
}

function StrainKpiCard({ label, icon, record, emptyMsg }: {
  label: string;
  icon: string;
  record: ThcRecord | null | undefined;
  emptyMsg: string;
}) {
  const strainQuery = record?.strain_name ? encodeURIComponent(record.strain_name) : null;
  const inner = record ? (
    <div className="mt-2 space-y-1.5">
      <p className="text-2xl font-bold text-emerald-400">{record.thc_percent}%</p>
      <p className="text-sm font-semibold text-zinc-100 leading-tight truncate">{record.strain_name ?? '—'}</p>
      {record.brand && <p className="text-xs text-zinc-500 truncate">by {record.brand}</p>}
    </div>
  ) : (
    <p className="mt-3 text-xs text-zinc-600">{emptyMsg}</p>
  );

  if (!strainQuery) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">{icon} {label}</p>
        {inner}
      </div>
    );
  }
  return (
    <a href={`/strains?q=${strainQuery}`}
      className="block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-emerald-500/40 hover:bg-zinc-900 group">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">{icon} {label}</p>
        <span className="text-[10px] text-zinc-700 group-hover:text-emerald-500 transition">StrainAI ›</span>
      </div>
      {inner}
    </a>
  );
}

function SimpleKpiCard({ label, icon, value, sub, href }: {
  label: string; icon: string; value: string; sub?: string; href?: string;
}) {
  const cls = "rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition" + (href ? " hover:border-zinc-700 hover:bg-zinc-900 block" : "");
  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">{icon} {label}</p>
      <p className="mt-2 text-2xl font-bold text-zinc-100">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500 truncate">{sub}</p>}
    </>
  );
  return href ? <a href={href} className={cls}>{content}</a> : <div className={cls}>{content}</div>;
}

type GranularityView = 'daily' | 'weekly' | 'monthly';

function aggregateScans(raw: { date: string; count: number }[], granularity: GranularityView) {
  if (!raw.length) return [];
  if (granularity === 'daily') {
    return raw.map(d => ({ label: d.date.slice(5), count: d.count }));
  }
  if (granularity === 'weekly') {
    const buckets: Record<string, number> = {};
    for (const { date, count } of raw) {
      const d = new Date(date + 'T00:00:00');
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((day + 6) % 7));
      const key = monday.toISOString().slice(0, 10);
      buckets[key] = (buckets[key] ?? 0) + count;
    }
    return Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, count]) => ({ label: key.slice(5), count }));
  }
  const buckets: Record<string, number> = {};
  for (const { date, count } of raw) {
    const key = date.slice(0, 7);
    buckets[key] = (buckets[key] ?? 0) + count;
  }
  return Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, count]) => ({ label: new Date(key + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }), count }));
}

function ScansChart({ data }: { data: { date: string; count: number }[] }) {
  const [granularity, setGranularity] = useState<GranularityView>('daily');
  const chartData = aggregateScans(data, granularity);
  const tabs: { key: GranularityView; label: string }[] = [
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      <div className="flex items-center justify-end gap-1">
        {tabs.map(t => (
          <button key={t.key} type="button" onClick={() => setGranularity(t.key)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${granularity === t.key ? 'bg-emerald-400 text-zinc-950' : 'text-zinc-500 hover:text-zinc-300'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false}
            interval={granularity === 'daily' ? Math.floor(chartData.length / 6) : granularity === 'weekly' ? Math.floor(chartData.length / 6) : 0} />
          <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#f4f4f5' }} cursor={{ stroke: '#3f3f46' }} />
          <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={chartData.length <= 60 ? { fill: '#10b981', r: 2 } : false} name="Scans" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function StashCalculator({ totalGrams, label }: { totalGrams: number; label?: string }) {
  const [active, setActive] = useState<string | null>(null);

  const units = [
    { key: 'joint',    icon: '🚬', name: 'Standard Joints',  grams: 0.35,  color: 'emerald' },
    { key: 'king',     icon: '👑', name: 'King Size Joints', grams: 0.5,   color: 'yellow'  },
    { key: 'blunt',    icon: '🌿', name: 'Blunts',           grams: 1.0,   color: 'amber'   },
    { key: 'bong',     icon: '💨', name: 'Bong Rips',        grams: 0.25,  color: 'sky'     },
    { key: 'bowl',     icon: '🫙', name: 'Bowl Packs',       grams: 0.3,   color: 'purple'  },
    { key: 'eighth',   icon: '⅛',  name: 'Eighths',          grams: 3.5,   color: 'teal'    },
    { key: 'quarter',  icon: '¼',  name: 'Quarters',         grams: 7.0,   color: 'pink'    },
    { key: 'brownie',  icon: '🍪', name: 'Pot Brownies',     grams: 1.0,   color: 'orange'  },
  ];

  const colorMap: Record<string, { bg: string; border: string; text: string; numText: string }> = {
    emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/50', text: 'text-emerald-400', numText: 'text-emerald-300' },
    yellow:  { bg: 'bg-yellow-500/15',  border: 'border-yellow-500/50',  text: 'text-yellow-400',  numText: 'text-yellow-300'  },
    amber:   { bg: 'bg-amber-500/15',   border: 'border-amber-500/50',   text: 'text-amber-400',   numText: 'text-amber-300'   },
    sky:     { bg: 'bg-sky-500/15',     border: 'border-sky-500/50',     text: 'text-sky-400',     numText: 'text-sky-300'     },
    purple:  { bg: 'bg-purple-500/15',  border: 'border-purple-500/50',  text: 'text-purple-400',  numText: 'text-purple-300'  },
    teal:    { bg: 'bg-teal-500/15',    border: 'border-teal-500/50',    text: 'text-teal-400',    numText: 'text-teal-300'    },
    pink:    { bg: 'bg-pink-500/15',    border: 'border-pink-500/50',    text: 'text-pink-400',    numText: 'text-pink-300'    },
    orange:  { bg: 'bg-orange-500/15',  border: 'border-orange-500/50',  text: 'text-orange-400',  numText: 'text-orange-300'  },
  };

  if (!totalGrams || totalGrams <= 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          {label ?? 'Your stash, broken down'}
        </p>
        <p className="mt-0.5 text-xs text-zinc-600">{totalGrams}g logged — tap any unit to highlight</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {units.map(u => {
          const count = Math.floor(totalGrams / u.grams);
          const isActive = active === u.key;
          const c = colorMap[u.color];
          return (
            <button
              key={u.key}
              type="button"
              onClick={() => setActive(isActive ? null : u.key)}
              className={`rounded-xl border p-3 text-left transition ${
                isActive
                  ? `${c.bg} ${c.border}`
                  : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
              }`}
            >
              <span className="text-xl leading-none">{u.icon}</span>
              <p className={`mt-2 text-2xl font-bold ${isActive ? c.numText : 'text-zinc-100'}`}>
                {count.toLocaleString()}
              </p>
              <p className={`text-[11px] leading-tight mt-0.5 ${isActive ? c.text : 'text-zinc-500'}`}>
                {u.name}
              </p>
            </button>
          );
        })}
      </div>
      {active && (() => {
        const u = units.find(x => x.key === active)!;
        const count = Math.floor(totalGrams / u.grams);
        const c = colorMap[u.color];
        return (
          <p className={`text-xs ${c.text} text-center py-1`}>
            That&apos;s <span className="font-bold">{count.toLocaleString()} {u.name.toLowerCase()}</span> worth of cannabis logged 🌿
          </p>
        );
      })()}
    </div>
  );
}

function Toggle({ view, onChange }: { view: 'me' | 'all'; onChange: (v: 'me' | 'all') => void }) {
  return (
    <div className="flex rounded-xl border border-zinc-700 bg-zinc-900 p-1 w-fit">
      <button type="button" onClick={() => onChange('me')}
        className={view === 'me' ? 'rounded-lg px-4 py-1.5 text-sm font-medium transition bg-emerald-400 text-zinc-950' : 'rounded-lg px-4 py-1.5 text-sm font-medium transition text-zinc-400 hover:text-zinc-200'}>
        Me
      </button>
      <button type="button" onClick={() => onChange('all')}
        className={view === 'all' ? 'rounded-lg px-4 py-1.5 text-sm font-medium transition bg-emerald-400 text-zinc-950' : 'rounded-lg px-4 py-1.5 text-sm font-medium transition text-zinc-400 hover:text-zinc-200'}>
        All Users
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const [view, setView] = useState<'me' | 'all'>('me');
  const [myData, setMyData] = useState<DashboardData | null>(null);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => { document.title = 'Stats — CannaBaseAI'; }, []);
  const [communityData, setCommunityData] = useState<CommunityData | null>(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [loadingAll, setLoadingAll] = useState(false);
  const [fetchedAll, setFetchedAll] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setMyData(d); setLoadingMe(false); })
      .catch(() => setLoadingMe(false));
    fetch('/api/profile')
      .then(r => r.json())
      .then(d => { if (d.profile?.username) setUsername(d.profile.username); if (d.profile?.avatar_url) setAvatarUrl(d.profile.avatar_url); })
      .catch(() => {});
  }, []);

  const handleViewChange = (v: 'me' | 'all') => {
    setView(v);
    if (v === 'all' && !fetchedAll) {
      setLoadingAll(true);
      fetch('/api/community')
        .then(r => r.json())
        .then(d => { setCommunityData(d); setLoadingAll(false); setFetchedAll(true); })
        .catch(() => setLoadingAll(false));
    }
  };

  const loading = view === 'me' ? loadingMe : loadingAll;
  if (loadingMe) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl bg-zinc-800" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-zinc-800" />)}
          </div>
          <div className="h-48 rounded-2xl bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!myData) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center space-y-3">
        <p className="text-4xl">📊</p>
        <h1 className="text-xl font-bold text-zinc-100">Could not load stats</h1>
        <p className="text-sm text-zinc-500">Try refreshing the page.</p>
      </div>
    );
  }

  const strainPieData = Object.entries(myData.strainTypeCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  const productPieData = Object.entries(myData.productTypeCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Stats</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {view === 'me' ? 'A look at everything you\u2019ve logged' : 'Trends across all CannaBaseAI users'}
          </p>
        </div>
        <Toggle view={view} onChange={handleViewChange} />
      </div>

      {loading && (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-zinc-800" />)}
          </div>
          <div className="h-48 rounded-2xl bg-zinc-800" />
        </div>
      )}

      {view === 'me' && !loading && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Scans" value={myData.totalScans} />
            <StatCard label="Reviews" value={myData.totalReviews} />
            <StatCard label="Avg THC" value={myData.avgThc != null ? myData.avgThc + '%' : '—'} />
            <StatCard label="Avg Rating" value={myData.avgRating != null ? myData.avgRating + '/5' : '—'}
              sub={myData.wbaPct != null ? myData.wbaPct + '% would buy again' : undefined} />
          </div>

          {/* ── Personal Record KPI cards ── */}
          <div className="grid grid-cols-2 gap-3">
            <StrainKpiCard
              label="Highest THC Flower"
              icon="🌿"
              record={myData.highestThcByType?.['flower']}
              emptyMsg="No flower logged yet"
            />
            <StrainKpiCard
              label="Highest THC Pre-roll"
              icon="🚬"
              record={myData.highestThcByType?.['pre-roll']}
              emptyMsg="No pre-rolls logged yet"
            />
            <SimpleKpiCard
              label="Strains Tried"
              icon="🧬"
              value={String(myData.uniqueStrains ?? 0)}
              sub={myData.topStrains?.[0] ? `Most tried: ${myData.topStrains[0].name}` : undefined}
              href={myData.topStrains?.[0] ? `/strains?q=${encodeURIComponent(myData.topStrains[0].name)}` : undefined}
            />
            <SimpleKpiCard
              label="Go-To Product"
              icon="🏆"
              value={myData.favProductType ? (myData.favProductType.name.charAt(0).toUpperCase() + myData.favProductType.name.slice(1)) : '—'}
              sub={myData.favProductType ? `${myData.favProductType.count} logs` : 'No data yet'}
            />
          </div>

          <WeightWidget totalGrams={myData.totalGrams ?? 0} />

          <StashCalculator totalGrams={myData.totalGrams ?? 0} />

          <StatsCard
            username={username || 'me'}
            avatarUrl={avatarUrl}
            totalScans={myData.totalScans}
            totalReviews={myData.totalReviews}
            totalGrams={myData.totalGrams ?? 0}
            avgThc={myData.avgThc}
            avgRating={myData.avgRating}
            wbaPct={myData.wbaPct}
            topStrains={myData.topStrains?.slice(0, 3) ?? []}
            topEffects={myData.topEffects?.slice(0, 4) ?? []}
            topFlavors={myData.topFlavors?.slice(0, 3) ?? []}
            topBrand={myData.topBrands?.[0]?.name ?? null}
            strainTypeCounts={myData.strainTypeCounts}
            thcDistribution={myData.thcDistribution}
            productTypeCounts={myData.productTypeCounts}
          />

          {myData.scansOverTime.length > 0 && (
            <Section title="Scans over time">
              <ScansChart data={myData.scansOverTime} />
            </Section>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Section title="Strain types">
              {strainPieData.length === 0 ? <Empty msg="No data yet" /> : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={strainPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                        {strainPieData.map((entry, i) => (
                          <Cell key={i} fill={STRAIN_COLORS[entry.name.toLowerCase()] ?? COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={TT.contentStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {strainPieData.map((entry, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs text-zinc-400">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: STRAIN_COLORS[entry.name.toLowerCase()] ?? COLORS[i % COLORS.length] }} />
                        {entry.name} ({entry.value})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
            <Section title="Product types">
              {productPieData.length === 0 ? <Empty msg="No data yet" /> : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={productPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                        {productPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={TT.contentStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-2 mt-2">
                    {productPieData.map((entry, i) => (
                      <span key={i} className="flex items-center gap-1 text-xs text-zinc-400">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {entry.name} ({entry.value})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Section>
          </div>

          <Section title="THC % distribution">
            {myData.thcDistribution.some(d => d.count > 0) ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={myData.thcDistribution} barSize={28}>
                    <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TT.contentStyle} cursor={TT.cursor} />
                    <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Products" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <Empty msg="Scan products with THC % to see distribution" />}
          </Section>

          {myData.topStrains.length > 0 && (
            <Section title="Your top strains">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <ResponsiveContainer width="100%" height={Math.max(160, myData.topStrains.length * 32)}>
                  <BarChart data={myData.topStrains} layout="vertical" barSize={16}>
                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip contentStyle={TT.contentStyle} cursor={TT.cursor} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Scans" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          {myData.topBrands.length > 0 && (
            <Section title="Top brands">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <ResponsiveContainer width="100%" height={Math.max(160, myData.topBrands.length * 32)}>
                  <BarChart data={myData.topBrands} layout="vertical" barSize={16}>
                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip contentStyle={TT.contentStyle} cursor={TT.cursor} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Scans" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          {myData.topDispensaries.length > 0 && (
            <Section title="Top dispensaries">
              <div className="flex flex-wrap gap-2">
                {myData.topDispensaries.map((d, i) => (
                  <a key={i} href={`https://www.google.com/maps/search/${encodeURIComponent(d.name + ' dispensary')}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20 transition">
                    <svg width="9" height="11" viewBox="0 0 24 28" fill="currentColor" className="shrink-0"><path d="M12 0C7.16 0 3.2 3.96 3.2 8.8c0 7.7 8.8 17.6 8.8 17.6s8.8-9.9 8.8-17.6C20.8 3.96 16.84 0 12 0zm0 12a3.2 3.2 0 1 1 0-6.4A3.2 3.2 0 0 1 12 12z"/></svg>
                    {d.name} <span className="text-red-500">{d.count}x</span>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {myData.topEffects.length > 0 && (
            <Section title="Most common effects">
              <div className="flex flex-wrap gap-2">
                {myData.topEffects.map((e, i) => (
                  <span key={i} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                    {e.name} <span className="text-emerald-600">{e.count}x</span>
                  </span>
                ))}
              </div>
            </Section>
          )}

          {myData.topFlavors.length > 0 && (
            <Section title="Most common flavors">
              <div className="flex flex-wrap gap-2">
                {myData.topFlavors.map((f, i) => (
                  <span key={i} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    {f.name} <span className="text-amber-600">{f.count}x</span>
                  </span>
                ))}
              </div>
            </Section>
          )}

          {myData.totalScans === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 py-12 text-center space-y-3">
              <p className="text-4xl">📊</p>
              <p className="text-sm font-medium text-zinc-300">No personal stats yet</p>
              <p className="text-sm text-zinc-500">Start scanning products to see your data here.</p>
              <Link href="/" className="inline-block mt-2 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">
                Scan something →
              </Link>
            </div>
          )}
        </>
      )}

      {view === 'all' && !loading && communityData && (
        <>
          {/* ── Community headline stats ── */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total Scans" value={communityData.totalScans.toLocaleString()} sub="across all users" />
            <StatCard label="Users" value={communityData.totalUsers ?? '—'} sub="have scanned" />
            <StatCard label="Avg THC" value={communityData.avgThc != null ? communityData.avgThc + '%' : '—'} sub="community average" />
            <StatCard label="Grams Logged" value={communityData.totalGrams != null ? (communityData.totalGrams >= 1000 ? (communityData.totalGrams / 1000).toFixed(1) + 'kg' : communityData.totalGrams + 'g') : '—'} sub="combined weight" />
          </div>

          {/* ── Community KPI spotlight cards ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Most logged strain → StrainAI */}
            {communityData.topStrains[0] ? (
              <a href={`/strains?q=${encodeURIComponent(communityData.topStrains[0].name)}`}
                className="block rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 transition hover:border-purple-500/30 hover:bg-zinc-900 group">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">🏆 Most Logged Strain</p>
                  <span className="text-[10px] text-zinc-700 group-hover:text-purple-400 transition">StrainAI ›</span>
                </div>
                <p className="mt-2 text-xl font-bold text-zinc-100 truncate">{communityData.topStrains[0].name}</p>
                <p className="mt-1 text-xs text-zinc-500">{communityData.topStrains[0].count} logs community-wide</p>
              </a>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">🏆 Most Logged Strain</p>
                <p className="mt-3 text-xs text-zinc-600">No data yet</p>
              </div>
            )}

            {/* Top brand */}
            {communityData.topBrands[0] ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">🏷️ Top Brand</p>
                <p className="mt-2 text-xl font-bold text-zinc-100 truncate">{communityData.topBrands[0].name}</p>
                <p className="mt-1 text-xs text-zinc-500">{communityData.topBrands[0].count} logs</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">🏷️ Top Brand</p>
                <p className="mt-3 text-xs text-zinc-600">No data yet</p>
              </div>
            )}

            {/* Most popular product type */}
            {communityData.topProductTypes[0] ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">💨 Most Popular Type</p>
                <p className="mt-2 text-xl font-bold text-zinc-100 capitalize">{communityData.topProductTypes[0].name}</p>
                <p className="mt-1 text-xs text-zinc-500">{communityData.topProductTypes[0].count} logs</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">💨 Most Popular Type</p>
                <p className="mt-3 text-xs text-zinc-600">No data yet</p>
              </div>
            )}

            {/* Hybrid vs Indica vs Sativa breakdown winner */}
            {(() => {
              const counts = communityData.strainTypeCounts;
              const winner = Object.entries(counts).filter(([k]) => k !== 'unknown').sort((a, b) => b[1] - a[1])[0];
              const total = Object.values(counts).reduce((a, b) => a + b, 0);
              const icons: Record<string, string> = { sativa: '☀️', indica: '🌙', hybrid: '⚡', unknown: '🌿' };
              return winner ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">🧬 Community Leans</p>
                  <p className="mt-2 text-xl font-bold text-zinc-100 capitalize">{icons[winner[0]] ?? ''} {winner[0]}</p>
                  <p className="mt-1 text-xs text-zinc-500">{total > 0 ? Math.round((winner[1] / total) * 100) : 0}% of all logs</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600">🧬 Community Leans</p>
                  <p className="mt-3 text-xs text-zinc-600">No data yet</p>
                </div>
              );
            })()}
          </div>

          <WeightWidget totalGrams={communityData.totalGrams ?? 0} label="Community Weight Logged" sublabel="combined across all users" />

          <StashCalculator totalGrams={communityData.totalGrams ?? 0} label="Community stash, broken down" />

          <Section title="Strain type breakdown">
            {Object.values(communityData.strainTypeCounts).some(v => v > 0) ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={Object.entries(communityData.strainTypeCounts).filter(([,v]) => v > 0).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                      {Object.entries(communityData.strainTypeCounts).filter(([,v]) => v > 0).map(([name], i) => (
                        <Cell key={i} fill={STRAIN_COLORS[name] ?? COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TT.contentStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  {Object.entries(communityData.strainTypeCounts).filter(([,v]) => v > 0).map(([name, val], i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-zinc-400">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ background: STRAIN_COLORS[name] ?? COLORS[i % COLORS.length] }} />
                      {name.charAt(0).toUpperCase() + name.slice(1)} ({val})
                    </span>
                  ))}
                </div>
              </div>
            ) : <Empty msg="No data yet" />}
          </Section>

          {communityData.topStrains.length > 0 && (
            <Section title="Most popular strains">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <ResponsiveContainer width="100%" height={Math.max(160, communityData.topStrains.length * 32)}>
                  <BarChart data={communityData.topStrains} layout="vertical" barSize={16}>
                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip contentStyle={TT.contentStyle} cursor={TT.cursor} />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Scans" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          {communityData.topBrands.length > 0 && (
            <Section title="Most scanned brands">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <ResponsiveContainer width="100%" height={Math.max(160, communityData.topBrands.length * 32)}>
                  <BarChart data={communityData.topBrands} layout="vertical" barSize={16}>
                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip contentStyle={TT.contentStyle} cursor={TT.cursor} />
                    <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Scans" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          {communityData.topProductTypes.length > 0 && (
            <Section title="Most popular product types">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <ResponsiveContainer width="100%" height={Math.max(160, communityData.topProductTypes.length * 32)}>
                  <BarChart data={communityData.topProductTypes} layout="vertical" barSize={16}>
                    <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                    <Tooltip contentStyle={TT.contentStyle} cursor={TT.cursor} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} name="Scans" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          )}

          {communityData.topDispensaries?.length > 0 && (
            <Section title="Most visited dispensaries">
              <div className="flex flex-wrap gap-2">
                {communityData.topDispensaries.map((d, i) => (
                  <a key={i} href={`https://www.google.com/maps/search/${encodeURIComponent(d.name + ' dispensary')}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300 hover:bg-red-500/20 transition">
                    <svg width="9" height="11" viewBox="0 0 24 28" fill="currentColor" className="shrink-0"><path d="M12 0C7.16 0 3.2 3.96 3.2 8.8c0 7.7 8.8 17.6 8.8 17.6s8.8-9.9 8.8-17.6C20.8 3.96 16.84 0 12 0zm0 12a3.2 3.2 0 1 1 0-6.4A3.2 3.2 0 0 1 12 12z"/></svg>
                    {d.name} <span className="text-red-500">{d.count}x</span>
                  </a>
                ))}
              </div>
            </Section>
          )}

          {communityData.topEffects.length > 0 && (
            <Section title="Most reported effects">
              <div className="flex flex-wrap gap-2">
                {communityData.topEffects.map((e, i) => (
                  <span key={i} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                    {e.name} <span className="text-emerald-600">{e.count}x</span>
                  </span>
                ))}
              </div>
            </Section>
          )}

          {communityData.topFlavors.length > 0 && (
            <Section title="Most reported flavors">
              <div className="flex flex-wrap gap-2">
                {communityData.topFlavors.map((f, i) => (
                  <span key={i} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                    {f.name} <span className="text-amber-600">{f.count}x</span>
                  </span>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
