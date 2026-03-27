import { NextRequest, NextResponse } from 'next/server';
import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase.server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, type } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    if (message.trim().length > 1000) {
      return NextResponse.json({ error: 'Message must be 1000 characters or fewer.' }, { status: 400 });
    }

    // Get current user (optional)
    let userId: string | null = null;
    let userEmail: string | null = null;
    try {
      const supabase = await createAuthServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id ?? null;
      userEmail = user?.email ?? null;
    } catch {
      // Not logged in — still allow feedback
    }

    const db = createServerSupabaseClient();
    const { error } = await db.from('feedback').insert({
      user_id: userId,
      message: message.trim(),
      type: type ?? 'general',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notification via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
  