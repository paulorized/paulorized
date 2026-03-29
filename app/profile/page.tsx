'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming','Washington D.C.',
];

const CA_PROVINCES = [
  'Alberta','British Columbia','Manitoba','New Brunswick',
  'Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut',
  'Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon',
];

interface Profile {
  username: string;
  date_of_birth: string;
  state: string | null;
  sex: string | null;
  avatar_url: string | null;
}

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

export default function ProfilePageWrapper() {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  );
}

function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get('setup') === '1';
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');

  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [state, setState] = useState('');
  const [sex, setSex] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [tier, setTier] = useState<{ label: string; emoji: string; color: string } | null>(null);

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(data => {
        if (data.profile) {
          setProfile(data.profile);
          setUsername(data.profile.username ?? '');
          setDob(data.profile.date_of_birth ?? '');
          setState(data.profile.state ?? '');
          setSex(data.profile.sex ?? '');
          setAvatarUrl(data.profile.avatar_url ?? null);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Fetch connoisseur tier
  useEffect(() => {
    fetch('/api/my-tier', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { if (data.tier) setTier(data.tier); })
      .catch(() => {});
  }, []);

  async function handleAvatarChange(file: File) {
    setAvatarError('');
    setAvatarUploading(true);
    const form = new FormData();
    form.append('avatar', file);
    const res = await fetch('/api/profile/avatar', { method: 'POST', body: form });
    const data = await res.json();
    setAvatarUploading(false);
    if (!res.ok) { setAvatarError(data.error ?? 'Upload failed.'); return; }
    setAvatarUrl(data.avatar_url);
    router.refresh();
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setError('A username is required to continue.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, date_of_birth: dob, state, sex }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.status === 403) { window.location.href = '/blocked'; return; }
    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
    const isFirstSave = !profile;
    setSuccess('Profile saved!');
    setProfile({ username, date_of_birth: dob, state, sex, avatar_url: avatarUrl });
    if (isFirstSave) { router.push('/welcome'); } else if (isSetup) { router.push('/'); } else { router.refresh(); }
  }

  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 21);
    return d.toISOString().split('T')[0];
  })();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading…</div>
      </div>
    );
  }
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">

      {/* Setup mode banner */}
      {isSetup && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-center">
          <div className="text-2xl mb-1">👋</div>
          <p className="text-sm font-semibold text-emerald-300">One last thing before you dive in</p>
          <p className="mt-1 text-xs text-zinc-400">Pick a username so others can recognize you in the community.</p>
        </div>
      )}

      {/* Avatar section */}
      <div className="mb-8 flex flex-col items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Your avatar"
              className="h-24 w-24 rounded-full border-2 border-emerald-500/50 bg-zinc-800 object-cover"
            />
          ) : (
            <div className="h-24 w-24 rounded-full border-2 border-dashed border-zinc-600 bg-zinc-800 flex items-center justify-center">
              <span className="text-3xl">👤</span>
            </div>
          )}
          {avatarUploading && (
            <div className="absolute inset-0 rounded-full bg-zinc-950/70 flex items-center justify-center">
              <span className="text-xs text-zinc-300">Uploading…</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => uploadInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-400">
            🖼️ Upload photo
          </button>
          <button type="button" onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-emerald-500 hover:text-emerald-400">
            📷 Take photo
          </button>
        </div>

        <input ref={uploadInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleAvatarChange(e.target.files[0]); }} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleAvatarChange(e.target.files[0]); }} />

        {avatarError && <p className="text-xs text-rose-400">{avatarError}</p>}

        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-100">
            {profile?.username ? `@${profile.username}` : 'Set up your profile'}
          </h1>
          {tier && (
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <span className="text-base">{tier.emoji}</span>
              <span className={`text-sm font-semibold ${tier.color}`}>{tier.label}</span>
            </div>
          )}
          {profile?.date_of_birth && (
            <p className="text-sm text-zinc-500 mt-0.5">{getAge(profile.date_of_birth)} years old</p>
          )}
        </div>
      </div>

      {/* Profile form */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-8">
        <h2 className="mb-6 text-base font-semibold text-zinc-100">Profile details</h2>

        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Username <span className="text-rose-400">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
              <input type="text" required value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="your_username" maxLength={20}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-8 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none" />
            </div>
            <p className="text-xs text-zinc-600">3–20 characters, letters, numbers, underscores only.</p>
          </div>

          {/* Date of Birth */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Date of birth <span className="text-rose-400">*</span></label>
            <input type="date" required value={dob} max={maxDob} onChange={e => setDob(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none" />
            <p className="text-xs text-zinc-600">You must be 21 or older to use CannaBaseAI.</p>
          </div>

          {/* State */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">State</label>
            <select value={state} onChange={e => setState(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none">
              <option value="">Select your region…</option>
              <optgroup label="🇺🇸 United States">
                {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </optgroup>
              <optgroup label="🇨🇦 Canada">
                {CA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </optgroup>
            </select>
          </div>

          {/* Sex */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Sex</label>
            <div className="flex gap-3">
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'prefer_not_to_say', label: 'Prefer not to say' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setSex(sex === opt.value ? '' : opt.value)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                    sex === opt.value
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>
          )}
          {success && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{success}</p>
          )}

          <button type="submit" disabled={saving}
            className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save profile'}
          </button>

          {/* Privacy blurb */}
          <p className="text-center text-xs text-zinc-600 leading-relaxed">
            🔐 Your data is private and never shared. Scan photos are discarded after AI processing and never stored.
            Product photos you upload are stored securely in your account.{' '}
            <span className="text-zinc-500">You can delete any entry at any time.</span>
          </p>
        </form>
      </div>

      {/* Discord community card */}
      <a href="https://discord.gg/MTNvDM4MS" target="_blank" rel="noopener noreferrer"
        className="mt-4 flex items-center gap-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 px-5 py-4 transition hover:border-indigo-500/40 hover:bg-indigo-500/10">
        <span className="text-2xl">💬</span>
        <div>
          <p className="font-medium text-indigo-300 text-sm">Join our Discord community</p>
          <p className="text-xs text-zinc-500 mt-0.5">Share feedback, chat with other users, and get updates</p>
        </div>
        <span className="ml-auto text-indigo-400 text-lg">→</span>
      </a>

      {/* Sign out */}
      <button
        type="button"
        onClick={async () => {
          const supabase = createBrowserSupabaseClient();
          await supabase.auth.signOut({ scope: 'global' });
          await fetch('/api/auth/session', { method: 'DELETE' });
          window.location.replace('/login');
        }}
        className="mt-4 w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 py-3.5 text-sm font-medium text-zinc-500 transition hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-400">
        Sign out
      </button>
    </div>
  )
}