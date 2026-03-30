import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase.server';

export default async function WelcomePage() {
  // Redirect logged-in users straight to the app
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/');

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* ── Hero ── */}
      <section className="mx-auto max-w-2xl px-6 pt-16 pb-12 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
          🌿 AI-powered cannabis tracking
        </div>
        <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          Know exactly what<br />
          <span className="text-emerald-400">you&apos;re smoking.</span>
        </h1>
        <p className="mt-4 text-base text-zinc-400 leading-relaxed max-w-lg mx-auto">
          Scan any product label, identify any strain, log THC%, effects &amp; flavors — then share with a community that actually knows their weed.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/signup"
            className="rounded-2xl bg-emerald-400 px-6 py-3.5 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-[0.98]">
            Start logging free →
          </Link>
          <Link href="/login"
            className="rounded-2xl border border-zinc-700 bg-zinc-900 px-6 py-3.5 text-base font-medium text-zinc-300 transition hover:bg-zinc-800">
            Sign in
          </Link>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section className="mx-auto max-w-2xl px-6 pb-12 space-y-3">

        {/* Scan */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </span>
          <div>
            <p className="font-semibold text-zinc-100">Scan any label</p>
            <p className="text-sm text-zinc-500 mt-0.5">Point your camera or upload a photo — AI reads the label and pulls strain name, THC%, brand, and weight automatically.</p>
          </div>
        </div>

        {/* StrainAI */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-400/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <div>
            <p className="font-semibold text-zinc-100">Identify any strain</p>
            <p className="text-sm text-zinc-500 mt-0.5">Search 10,000+ strains by name. Get THC range, effects, flavors, and type — even for obscure boutique drops. Powered by live web search.</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['🌙 Indica', '☀️ Sativa', '⚡ Hybrid'].map(t => (
                <span key={t} className="rounded-full border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">{t}</span>
              ))}
              {['Relaxed', 'Euphoric', 'Creative', 'Sleepy'].map(e => (
                <span key={e} className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">{e}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Log */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </span>
          <div>
            <p className="font-semibold text-zinc-100">Build your log</p>
            <p className="text-sm text-zinc-500 mt-0.5">Every product you try gets saved to your personal history. Track your top strains, THC distribution, dispensaries, and smoking habits over time.</p>
          </div>
        </div>

        {/* Community */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </span>
          <div>
            <p className="font-semibold text-zinc-100">Community feed</p>
            <p className="text-sm text-zinc-500 mt-0.5">See what others are scanning and smoking. Leave reviews, earn helpful votes, and rank up from Seedling 🌿 to Legend 🌳.</p>
          </div>
        </div>
      </section>

      {/* ── Live community preview ── */}
      <section className="mx-auto max-w-2xl px-6 pb-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Live from the community</p>
        <div className="space-y-2">
          {[
            { user: 'Paulorized', logs: 16, strain: 'Crunch Berries', brand: 'Garden Greens', type: 'hybrid', thc: '25.12%', rating: 4, note: 'Glass tip for the win! Such a good pre-roll.', effects: ['Relaxed', 'Berry', 'Floral'] },
            { user: 'StrainScout123', logs: 6, strain: 'Super Lemon Haze', brand: "Raritan's Choice", type: 'sativa', thc: '24.8%', rating: 5, note: null, effects: ['Energetic', 'Euphoric', 'Creative'] },
            { user: 'CValerio', logs: 2, strain: 'Country Roadz', brand: "Sneaky Pete's", type: 'indica', thc: '35.57%', rating: 4, note: '11/10', effects: [] },
          ].map((item, i) => {
            const typeColor = item.type === 'hybrid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : item.type === 'sativa' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
              : 'bg-purple-500/20 text-purple-300 border-purple-500/30';
            return (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 space-y-1.5 pointer-events-none select-none">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-white">{item.user[0]}</span>
                    </div>
                    <span className="text-xs text-zinc-400">{item.user}</span>
                    <span className="text-[10px] text-zinc-600">{item.logs} logs</span>
                  </div>
                  <span className="text-[10px] text-zinc-600">🌿 Seedling</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-100">{item.strain}</span>
                  <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize ${typeColor}`}>{item.type}</span>
                  <span className="text-[10px] text-emerald-500 font-medium">THC {item.thc}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-yellow-400">{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</span>
                  <span className="text-xs text-emerald-400">✓ Would buy again</span>
                </div>
                {item.note && <p className="text-xs text-zinc-400 italic">&ldquo;{item.note}&rdquo;</p>}
                {item.effects.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {item.effects.map(e => (
                      <span key={e} className="rounded-full border border-zinc-700/60 text-zinc-500 text-[10px] px-2 py-0.5">{e}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-center text-xs text-zinc-600">Create an account to join the conversation →</p>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-2xl px-6 pb-16 text-center">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 space-y-4">
          <p className="text-2xl font-bold">Ready to know your weed?</p>
          <p className="text-sm text-zinc-500">Free to use. No credit card required.</p>
          <Link href="/signup"
            className="inline-block rounded-2xl bg-emerald-400 px-8 py-4 text-base font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-[0.98]">
            Create your free account →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800 px-6 py-6 text-center">
        <p className="text-xs text-zinc-600">© 2026 CannaBaseAI · Built for cannabis enthusiasts</p>
      </footer>

    </main>
  );
}
