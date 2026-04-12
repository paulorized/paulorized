'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CommentNode {
  id: string;
  review_id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  created_at: string;
  username: string;
  avatar_url: string | null;
  children: CommentNode[];
}

const BUBBLE_COLORS = [
  'bg-emerald-600', 'bg-purple-600', 'bg-yellow-500', 'bg-sky-600',
  'bg-rose-600', 'bg-orange-500', 'bg-teal-600', 'bg-indigo-600',
];

function getBubbleColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash * 31 + userId.charCodeAt(i)) & 0xffffffff;
  return BUBBLE_COLORS[Math.abs(hash) % BUBBLE_COLORS.length];
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function CommentInput({ onSubmit, placeholder, autoFocus, onCancel }: {
  onSubmit: (body: string) => Promise<void>;
  placeholder: string;
  autoFocus?: boolean;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit(body.trim());
    setBody('');
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={placeholder}
        maxLength={2000}
        autoFocus={autoFocus}
        className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
      />
      <button type="submit" disabled={submitting || !body.trim()}
        className="shrink-0 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:opacity-40">
        {submitting ? '...' : 'Post'}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}
          className="shrink-0 rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 transition">
          Cancel
        </button>
      )}
    </form>
  );
}

function SingleComment({ comment, currentUserId, depth, onReply, onDelete }: {
  comment: CommentNode;
  currentUserId: string | null;
  depth: number;
  onReply: (parentId: string, body: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}) {
  const [showReply, setShowReply] = useState(false);
  const [collapsed, setCollapsed] = useState(depth >= 4);
  const isOwn = currentUserId === comment.user_id;
  const bubbleColor = getBubbleColor(comment.user_id);

  return (
    <div className={depth > 0 ? 'ml-4 border-l border-zinc-800 pl-3' : ''}>
      <div className="flex items-start gap-2 py-1.5">
        {/* Avatar */}
        <Link href={`/u/${comment.username}`} className="shrink-0 mt-0.5">
          {comment.avatar_url ? (
            <img src={comment.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${bubbleColor}`}>
              <span className="text-[9px] text-white font-bold">{comment.username[0]?.toUpperCase()}</span>
            </div>
          )}
        </Link>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/u/${comment.username}`} className="text-xs font-semibold text-zinc-300 hover:text-emerald-400 transition">
              {comment.username}
            </Link>
            <span className="text-[10px] text-zinc-600">{timeAgo(comment.created_at)}</span>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
          <div className="flex items-center gap-3 mt-1">
            {currentUserId && (
              <button onClick={() => setShowReply(s => !s)}
                className="text-[10px] text-zinc-600 hover:text-emerald-400 transition">
                Reply
              </button>
            )}
            {isOwn && (
              <button onClick={() => { if (confirm('Delete this comment?')) onDelete(comment.id); }}
                className="text-[10px] text-zinc-600 hover:text-rose-400 transition">
                Delete
              </button>
            )}
            {comment.children.length > 0 && (
              <button onClick={() => setCollapsed(c => !c)}
                className="text-[10px] text-zinc-600 hover:text-zinc-300 transition">
                {collapsed ? `Show ${comment.children.length} ${comment.children.length === 1 ? 'reply' : 'replies'}` : 'Hide replies'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reply input */}
      {showReply && (
        <div className="ml-7 mb-2">
          <CommentInput
            placeholder={`Reply to ${comment.username}...`}
            autoFocus
            onCancel={() => setShowReply(false)}
            onSubmit={async (body) => {
              await onReply(comment.id, body);
              setShowReply(false);
            }}
          />
        </div>
      )}

      {/* Nested children */}
      {!collapsed && comment.children.map(child => (
        <SingleComment
          key={child.id}
          comment={child}
          currentUserId={currentUserId}
          depth={depth + 1}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

// Main export: full comment section for a review
export function CommentSection({ reviewId, currentUserId }: { reviewId: string; currentUserId: string | null }) {
  const [comments, setComments] = useState<CommentNode[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?review_id=${reviewId}`)
      .then(r => r.json())
      .then(d => { setComments(d.comments ?? []); setCount(d.count ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reviewId]);

  async function handlePost(body: string) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, body }),
    });
    const data = await res.json();
    if (data.comment) {
      setComments(prev => [...prev, data.comment]);
      setCount(c => c + 1);
      setExpanded(true);
    }
  }

  async function handleReply(parentId: string, body: string) {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ review_id: reviewId, parent_comment_id: parentId, body }),
    });
    const data = await res.json();
    if (data.comment) {
      // Re-fetch to get proper tree structure
      const r = await fetch(`/api/comments?review_id=${reviewId}`);
      const d = await r.json();
      setComments(d.comments ?? []);
      setCount(d.count ?? 0);
    }
  }

  async function handleDelete(commentId: string) {
    const res = await fetch('/api/comments', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment_id: commentId }),
    });
    if (res.ok) {
      const r = await fetch(`/api/comments?review_id=${reviewId}`);
      const d = await r.json();
      setComments(d.comments ?? []);
      setCount(d.count ?? 0);
    }
  }

  if (loading) return null;

  return (
    <div className="mt-2 border-t border-zinc-800/60 pt-2">
      {/* Toggle / count */}
      <button onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-zinc-300 transition mb-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        {count > 0 ? `${count} comment${count !== 1 ? 's' : ''}` : 'Add a comment'}
      </button>

      {expanded && (
        <div className="space-y-1">
          {comments.map(c => (
            <SingleComment
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              depth={0}
              onReply={handleReply}
              onDelete={handleDelete}
            />
          ))}
          {currentUserId && (
            <div className="mt-2">
              <CommentInput placeholder="Write a comment..." onSubmit={handlePost} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
