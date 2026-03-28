import { redirect } from 'next/navigation';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';
import { ScanForm } from '@/components/scan-form';
import { QuickLog } from '@/components/quick-log';
import { PageFooter } from '@/components/page-footer';
import { ThemeToggle } from '@/components/theme-toggle';

export default async function HomePage() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const db = createServerSupabaseClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/profile');

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 space-y-4">
      <div className="relative">
        <div className="absolute top-3 right-3 z-10">
          <ThemeToggle />
        </div>
        <ScanForm />
      </div>
      <QuickLog />
      <PageFooter />
    </div>
  );
}