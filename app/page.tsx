import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';
import { ScanForm } from '@/components/scan-form';
import { HomeStats } from '@/components/home-stats';
import { CommunityPreview } from '@/components/community-preview';
import { PageFooter } from '@/components/page-footer';
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
    <div className="mx-auto w-full max-w-2xl px-4 py-6 space-y-4">
      {/* Hero logo — home page only */}
      <div className="flex flex-col items-center pt-2 pb-1">
        <img
          src="/logo.png"
          alt="CannaBaseAI"
          width={120}
          height={120}
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
      {!isGuest && <HomeStats />}
      {!isGuest && <CommunityPreview />}
      <PageFooter />
    </div>
  );
}
