'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface Profile {
  username: string;
  date_of_birth: string;
  state: string | null;
  sex: string | null;
}

function getAvatarUrl(username: string) {
  return `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(username)}&backgroundColor=059669`;
}

function getAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate())) age--;
  return age;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [username, setUsername] = useState('');
  const [dob, setDob] = useState('');
  const [state, setState] = useState('');
  const [sex, setSex] = useState('');

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
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
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

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }

    setSuccess('Profile saved!');
    setProfile({ username, date_of_birth: dob, state, sex });
    router.refresh();
  }

  // Max date for DOB — must be at least 21 years old
  const maxDob = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 21);
    return d.toISOString().split('T')[0];
  })();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading…</div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-3">
        {username ? (
          <img
            src={getAvatarUrl(username)}
            alt="Your avatar"
            className="h-20 w-20 rounded-full border-2 border-emerald-500/40 bg-zinc-800"
          />
        ) : (
          <div className="h-20 w-20 rounded-full border-2 border-zinc-700 bg-zinc-800 flex items-center justify-center text-zinc-500 text-2xl">
            ?
          </div>
        )}
        <div className="text-center">
          <h1 className="text-xl font-bold text-zinc-100">
            {profile?.username ? `@${profile.username}` : 'Set up your profile'}
          </h1>
          {profile?.date_of_birth && (
            <p className="text-sm text-zinc-500 mt-0.5">{getAge(profile.date_of_birth)} years old</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-6 py-8">
        <h2 className="mb-6 text-base font-semibold text-zinc-100">Profile details</h2>

        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {/* Username */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Username <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="your_username"
                maxLength={20}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-8 pr-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <p className="text-xs text-zinc-600">3-20 characters, letters, numbers, underscores only.</p>
          </div>

          {/* Date of Birth */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Date of birth <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={dob}
              max={maxDob}
              onChange={e => setDob(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-xs text-zinc-600">You must be 21 or older to use CannaBaseAI.</p>
          </div>

          {/* State */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">State</label>
            <select
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Select your state…</option>
              {US_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
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
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSex(sex === opt.value ? '' : opt.value)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                    sex === opt.value
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">
              {success}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-400 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-300 active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </main>
  );
}
