import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';
import { ScanForm } from '@/components/scan-form';
import { HomeScanReveal } from '@/components/home-scan-reveal';
import { HomeStats } from '@/components/home-stats';
import { CommunityPreview } from '@/components/community-preview';
import { PageFooter } from '@/components/page-footer';
import Image from 'next/image';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Guests are allowed — only redirect if they have an account but no profile
  if (user) {
    const db = createServerSupabaseClient();
    const { data: profile } = await db
      .from('profiles')
      .select('id, username')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || !profile.username) redirect('/profile?setup=1');
  }

  const isGuest = !user;

  return (
    <div className={isGuest ? 'w-full' : 'mx-auto w-full max-w-2xl px-4 py-6 space-y-4'}>
      {isGuest ? (
        <>
          {/* Marketing hero — logged-out visitors only */}
          <section
            aria-label="CannaBaseAI — your cannabis, logged and understood"
            className="relative mx-auto w-full max-w-6xl px-4 pt-4 pb-2"
          >
            <div className="relative w-full">
              <Image
                src="/hero.png"
                alt="Your cannabis, logged and understood. Scan, review, and track every product you try. CannaBaseAI turns your experiences into a personal library you'll actually use."
                width={1344}
                height={620}
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="h-auto w-full rounded-2xl ring-1 ring-zinc-800/60"
              />
              {/* Clickable CTA overlays — positioned as percentages of the hero image */}
              <a
                href="/signup"
                aria-label="Create a free account"
                className="absolute left-[4%] top-[64%] w-[22%] h-[17%] rounded-xl transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <Image
                  src="/cta1.png"
                  alt="Create a free account"
                  width={300}
                  height={100}
                  className="h-full w-full object-contain"
                />
              </a>
              <a
                href="#scan-section-reveal"
                aria-label="Try it out first"
                className="absolute left-[7%] top-[85%] w-[18%] h-[9%] rounded-lg transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <Image
                  src="/cta2.png"
                  alt="Try it out first"
                  width={240}
                  height={60}
                  className="h-full w-full object-contain"
                />
              </a>
            </div>
          </section>
          <div className="mx-auto w-full max-w-2xl px-4 py-6 space-y-4">
            <HomeScanReveal>
              <ScanForm isGuest={isGuest} />
            </HomeScanReveal>
          </div>
        </>
      ) : (
        <>
          {/* Hero logo — home page only */}
          <div className="flex flex-col items-center pt-2 pb-1">
            <Image
              src="/logo.png"
              alt="CannaBaseAI"
              width={120}
              height={120}
              priority
              className="h-[120px] w-[120px] rounded-2xl shadow-lg shadow-emerald-500/10 ring-1 ring-zinc-800/60"
            />
            <div className="mt-3 text-2xl font-bold tracking-tight font-[family-name:var(--font-montserrat)]">
              <span className="text-emerald-400">Canna</span><span className="text-purple-400">Base</span><span className="text-yellow-300">AI</span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Scan. Log. Discover.</p>
          </div>
          <div>
            <ScanForm isGuest={isGuest} />
          </div>
          <HomeStats />
          <CommunityPreview />
        </>
      )}
      <div className={isGuest ? 'mx-auto w-full max-w-2xl px-4' : ''}>
        <PageFooter />
      </div>
    </div>
  );
}
