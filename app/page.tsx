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
      <div>
        <ScanForm isGuest={isGuest} />
      </div>
      {!isGuest && <HomeStats />}
      {!isGuest && <CommunityPreview />}
      <PageFooter />
    </div>
  );
}
