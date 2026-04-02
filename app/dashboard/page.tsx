'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { WeightWidget } from '@/components/weight-widget';
import { StatsCard } from '@/components/stats-card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';

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
  scansOverTime: { month: string; count: number }[];
  topStrains: { name: string; count: number }[];
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
  topEffects: { name: string; count: number }[];
  topFlavors: { name: string; count: number }[];
};

const STRAIN_COLORS: Record<string, string> = {
  sativa: '#10b981', indica: '#8b5cf6', hybrid: '#f59e0b', unknown: '#52525b',
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
  const monthLabel = (m: string) => {
    const [y, mo] = m.split('-');
    return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
  };

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

          <WeightWidget totalGrams={myData.totalGrams ?? 0} />

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

          {myData.scansOverTime.length > 1 && (
            <Section title="Scans over time">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={myData.scansOverTime.map(d => ({ ...d, month: monthLabel(d.month) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                    <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={TT.contentStyle} cursor={TT.cursor} />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Scans" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Total Scans" value={communityData.totalScans} sub="across all users" />
            <StatCard label="Avg THC" value={communityData.avgThc != null ? communityData.avgThc + '%' : '—'} />
            <StatCard label="Users" value={communityData.totalUsers ?? '—'} sub="have scanned" />
          </div>

          <WeightWidget
            totalGrams={communityData.totalGrams ?? 0}
            label="Community Weight Logged"
            sublabel="combined across all users"
          />

          <Section title="Strain type breakdown">
            {Object.values(communityData.strainTypeCounts).some(v => v > 0) ? (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={Object.entries(communityData.strainTypeCounts).filter(([,v]) => v > 0).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))}
                      cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value"
                    >
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

      {view === 'all' && !loading && !communityData && (
        <Empty msg="Could not load community stats." />
      )}
    </div>
  );
}
