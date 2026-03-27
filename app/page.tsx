import { redirect } from 'next/navigation';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';
import { ScanForm } from '@/components/scan-form';

export default async function HomePage() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user has completed their profile (21+ verification)
  const db = createServerSupabaseClient();
  const { data: profile } = await db
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) {
    redirect('/profile');
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <ScanForm />
    </main>
  );
}
