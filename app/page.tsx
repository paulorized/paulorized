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
    .select('id, username')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) redirect('/profile?setup=1');
  if (!profile.username) redirect('/profile?setup=1');

  return (
    <div classNa