import { redirect } from 'next/navigation';
import { createAuthServerClient } from '@/lib/supabase.server';
import { ScanForm } from '@/components/scan-form';

export default async function HomePage() {
  const supabase = await createAuthServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <ScanForm />
    </main>
  );
}
