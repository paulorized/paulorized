'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';

type DashboardData = {
  totalScans: number;
  totalReviews: number;
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

const STRAIN_COLORS: Record<string, string> = {
  sativa: '#10b981',
  indica: '#8b5cf6',
  hybrid: '#f59e0b',
  unknown: '#52525b',
};

const COLORS = ['#10b981','#8b5cf6','#f59e0b','#3b82f6','#ef4444','#ec4899','#14b8a6','#f97316'];

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

const tooltipStyle = {
  contentStyle: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: 12, color: '#f4f4f5', fontSize: 12 },
  cursor: { fill: 'rgba(255,255,255,0.04)' },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-xl bg-zinc-800" />
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-zinc-800" />)}
          </div>
          <div className="h-48 rounded-2xl bg-zinc-800" />
          <div className="h-48 rounded-2xl bg-zinc-800" />
        </div>
      </main>
    );
  }

  if (!data || data.totalScans === 0) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center space-y-3">
        <p className="text-4xl">📊</p>
        <h1 className="text-xl font-bold text-zinc-100">Your dashboard is empty</h1>
        <p className="text-sm text-zinc-500">Start scanning products to see your personal stats here.</p>
        <a href="/" className="inline-block mt-4 rounded-xl bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300">
          Scan something →
        </a>
      </main>
    );
  }

  const strainPieData = Object.entries(data.strainTypeCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  const productPieData = Object.entries(data.productTypeCounts)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));

  const monthLabel = (m: string) => {
    const [y, mo] = m.split('-');
    return new Date(Number(y), Number(mo) - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">My Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">A look at everything you've logged</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Scans" value={data.totalScans} />
        <StatCard label="Reviews" value={data.totalReviews} />
        <StatCard label="Avg THC" value={data.avgThc != null ? `${data.avgThc}%` : '—'} />
        <StatCard label="Avg Rating" value={data.avgRating != null ? `${data.avgRating}/5` : '—'} sub={data.wbaPct != null ? `${data.wbaPct}% would buy again` : undefined} />
      </div>

      {/* Scans over time */}
      {data.scansOverTime.length > 1 && (
        <Section title="Scans over time">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data.scansOverTime.map(d => ({ ...d, month: monthLabel(d.month) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} name="Scans" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Strain type + Product type */}
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
                  <Tooltip {...tooltipStyle} />
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
                  <Tooltip {...tooltipStyle} />
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

      {/* THC Distribution */}
      <Section title="THC % distribution">
        {data.thcDistribution.some(d => d.count > 0) ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.thcDistribution} barSize={28}>
                <XAxis dataKey="range" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} name="Products" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <Empty msg="Scan products with THC % to see distribution" />}
      </Section>

      {/* Top Strains */}
      {data.topStrains.length > 0 && (
        <Section title="Your top strains">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <ResponsiveContainer width="100%" height={Math.max(160, data.topStrains.length * 36)}>
              <BarChart data={data.topStrains} layout="vertical" barSize={18}>
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#d4d4d8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} name="Times logged" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Top Brands */}
      {data.topBrands.length > 0 && (
        <Section title="Top brands">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
            <ResponsiveContainer width="100%" height={Math.max(160, data.topBrands.length * 36)}>
              <BarChart data={data.topBrands} layout="vertical" barSize={18}>
                <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#d4d4d8', fontSize: 11 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Times scanned" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Top Dispensaries */}
      {data.topDispensaries.length > 0 && (
        <Section title="Your dispensaries">
          <div className="space-y-2">
            {data.topDispensaries.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                <span className="text-sm font-medium text-zinc-100 flex-1">📍 {d.name}</span>
                <span className="text-xs text-zinc-500">{d.count} visit{d.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Effects + Flavors */}
      {data.topEffects.length > 0 && (
        <Section title="Most common effects">
          <div className="flex flex-wrap gap-2">
            {data.topEffects.map((e, i) => (
              <span key={i} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
                {e.name} <span className="text-emerald-600">×{e.count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      {data.topFlavors.length > 0 && (
        <Section title="Most common flavors">
          <div className="flex flex-wrap gap-2">
            {data.topFlavors.map((f, i) => (
              <span key={i} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                {f.name} <span className="text-amber-600">×{f.count}</span>
              </span>
            ))}
          </div>
        </Section>
      )}

      <div className="pb-8" />
    </main>
  );
}
