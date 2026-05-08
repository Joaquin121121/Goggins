'use client';
import React, { useMemo, useState } from 'react';
import type { ClaimWithJoin, GogginsUser } from '@/lib/types';
import { SoftCard } from './primitives';
import { argentinaNow } from '@/lib/daily';

type Range = 'semana' | 'mes' | 'total';

type Row = {
  user: GogginsUser;
  count: number;
  streak: number;
};

export function TabHistorico({ me, claims }: { me: GogginsUser; claims: ClaimWithJoin[] }) {
  const [range, setRange] = useState<Range>('semana');

  const rows = useMemo(() => buildRows(claims, range), [claims, range]);
  const max = Math.max(1, ...rows.map(r => r.count));
  const totalClaims = rows.reduce((s, r) => s + r.count, 0);

  const labels: Record<Range, string> = {
    semana: 'Esta semana',
    mes: 'Este mes',
    total: 'Histórico',
  };

  return (
    <div style={{ padding: '20px 18px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 32,
            color: 'var(--ink)',
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          {labels[range]}
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 6 }}>
          {rows.length} cazadores · {totalClaims} Goggins reclamados
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: 4,
        }}
      >
        {(['semana', 'mes', 'total'] as Range[]).map(t => {
          const active = range === t;
          const txt = t === 'semana' ? 'Semana' : t === 'mes' ? 'Mes' : 'Total';
          return (
            <button
              key={t}
              onClick={() => setRange(t)}
              style={{
                padding: '9px 4px',
                background: active ? 'var(--ink)' : 'transparent',
                border: 0,
                borderRadius: 8,
                cursor: 'pointer',
                color: active ? '#FFF' : 'var(--ink-2)',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                transition: 'all 0.15s',
              }}
            >
              {txt}
            </button>
          );
        })}
      </div>

      <SoftCard style={{ padding: 0, overflow: 'hidden' }}>
        {rows.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              color: 'var(--ink-3)',
            }}
          >
            Aún nadie reclamó nada.
          </div>
        ) : (
          rows.map((r, i) => (
            <LeaderRow
              key={r.user.id}
              row={r}
              rank={i + 1}
              max={max}
              last={i === rows.length - 1}
              isMe={r.user.id === me.id}
            />
          ))
        )}
      </SoftCard>

      <div
        style={{
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: 14,
          color: 'var(--ink-3)',
          textAlign: 'center',
          padding: '4px 20px',
          lineHeight: 1.4,
        }}
      >
        Llegá primero. Subí en el ranking.
      </div>
    </div>
  );
}

function buildRows(claims: ClaimWithJoin[], range: Range): Row[] {
  const now = argentinaNow();
  const cutoff = (() => {
    if (range === 'total') return null;
    const d = new Date(now);
    if (range === 'semana') d.setUTCDate(d.getUTCDate() - 7);
    else d.setUTCDate(d.getUTCDate() - 30);
    return d.toISOString().slice(0, 10);
  })();

  const filtered = cutoff ? claims.filter(c => c.claim_date >= cutoff) : claims;

  const grouped = new Map<string, { user: GogginsUser; dates: string[] }>();
  for (const c of filtered) {
    const entry = grouped.get(c.user_id) ?? { user: c.user, dates: [] };
    entry.dates.push(c.claim_date);
    grouped.set(c.user_id, entry);
  }

  const rows: Row[] = [...grouped.values()].map(({ user, dates }) => ({
    user,
    count: dates.length,
    streak: computeStreak(dates),
  }));

  rows.sort((a, b) => b.count - a.count || a.user.name.localeCompare(b.user.name));
  return rows;
}

// Streak = consecutive weekdays (Argentina) ending today or yesterday.
// Skips weekends.
function computeStreak(dates: string[]): number {
  const set = new Set(dates);
  let cur = argentinaNow();
  let streak = 0;
  // Walk back from today
  for (let i = 0; i < 60; i++) {
    const iso = cur.toISOString().slice(0, 10);
    const dow = cur.getUTCDay();
    const isWeekend = dow === 0 || dow === 6;
    if (!isWeekend) {
      if (set.has(iso)) {
        streak++;
      } else if (i > 0) {
        // first weekday miss after start breaks the streak
        break;
      }
    }
    cur = new Date(cur.getTime() - 86400000);
  }
  return streak;
}

function LeaderRow({
  row,
  rank,
  max,
  last,
  isMe,
}: {
  row: Row;
  rank: number;
  max: number;
  last: boolean;
  isMe: boolean;
}) {
  const pct = (row.count / max) * 100;
  const fallback = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(row.user.name)}`;
  const avatar = row.user.profile_url || fallback;

  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '28px 44px 1fr auto',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderBottom: last ? 'none' : '1px solid var(--line-soft)',
        background: isMe ? 'var(--accent-soft)' : 'transparent',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 15,
          color: rank === 1 ? 'var(--accent)' : 'var(--ink-3)',
          fontWeight: rank === 1 ? 500 : 400,
          fontVariantNumeric: 'tabular-nums',
          textAlign: 'center',
        }}
      >
        {rank}
      </div>

      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatar}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            color: 'var(--ink)',
            fontWeight: isMe ? 500 : 400,
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isMe ? 'Tú' : row.user.name}
          {row.streak > 0 && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--accent)' }}>
              · {row.streak}🔥
            </span>
          )}
        </div>
        <div
          style={{
            height: 3,
            background: 'rgba(27,24,20,0.06)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: isMe ? 'var(--accent)' : 'var(--ink-2)',
              borderRadius: 99,
            }}
          />
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 17,
            color: 'var(--ink)',
            fontWeight: 500,
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1,
          }}
        >
          {row.count}
        </div>
        <div
          style={{
            fontSize: 10,
            color: 'var(--ink-3)',
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          Goggins
        </div>
      </div>
    </div>
  );
}
