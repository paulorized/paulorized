'use client';

import { useState } from 'react';

interface Props {
  userId: string;
  initialFollowing: boolean;
  isSelf: boolean;
  size?: 'sm' | 'md';
}

export function FollowButton({ userId, initialFollowing, isSelf, size = 'md' }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (isSelf) return null;

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/follow', {
        method: following ? 'DELETE' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      if (res.ok) setFollowing(f => !f);
    } catch {}
    setLoading(false);
  };

  const base = size === 'sm'
    ? 'rounded-lg px-3 py-1 text-xs font-semibold transition'
    : 'rounded-xl px-4 py-2 text-sm font-semibold transition';

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${base} ${
        following
          ? 'border border-zinc-600 bg-zinc-800 text-zinc-300 hover:border-rose-500/50 hover:text-rose-400'
          : 'bg-emerald-400 text-zinc-950 hover:bg-emerald-300'
      } disabled:opacity-50`}
    >
      {loading ? '…' : following ? 'Following' : 'Follow'}
    </button>
  );
}
