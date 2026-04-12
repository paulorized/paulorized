'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'comment' | 'reply' | 'follow' | 'helpful' | 'digest';
  actor_id: string | null;
  actor_username: string | null;
  actor_avatar_url: string | null;
  reference_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  comment: '\uD83D\uDCAC',
  reply: '\u21A9\uFE0F',
  follow: '\uD83D\uDC64',
  helpful: '\uD83D\uDC4D',
  digest: '\uD83D\uDCE8',
};

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount + poll every 30s
  useEffect(() => {
    let active = true;
    async function fetchCount() {
      try {
        const r = await fetch('/api/notifications');
        const d = await r.json();
        if (active) setUnreadCount(d.unread_count ?? 0);
      } catch {}
    }
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleOpen() {
    setOpen(o => !o);
    if (!open) {
      setLoading(true);
      try {
        const r = await fetch('/api/notifications');
        const d = await r.json();
        setNotifications(d.notifications ?? []);
        setUnreadCount(d.unread_count ?? 0);
      } catch {}
      setLoading(false);
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button onClick={handleOpen} className="relative rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[9px] font-bold text-zinc-950">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl z-50">
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
            <span className="text-xs font-semibold text-zinc-300">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-emerald-400 hover:text-emerald-300 transition">
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="px-4 py-6 text-center text-xs text-zinc-600">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-zinc-600">No notifications yet</div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {notifications.map(n => (
                <div key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition ${n.read ? '' : 'bg-emerald-500/5'}`}>
                  <span className="mt-0.5 text-sm shrink-0">{TYPE_ICONS[n.type] ?? ''}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${n.read ? 'text-zinc-500' : 'text-zinc-300'}`}>
                      {n.message}
                    </p>
                    <span className="text-[10px] text-zinc-600">{timeAgo(n.created_at)}</span>
                  </div>
                  {!n.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-zinc-800 px-4 py-2 text-center">
            <Link href="/profile?tab=settings" onClick={() => setOpen(false)}
              className="text-[10px] text-zinc-600 hover:text-zinc-400 transition">
              Notification settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
