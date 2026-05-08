'use client';
import React, { useState } from 'react';
import type { ClaimWithJoin, GogginsUser, Rarity } from '@/lib/types';
import { RARITY_META } from '@/lib/types';
import { CharacterPortrait, RarityBadge, SectionHead, SoftCard, StatBar } from './primitives';
import { formatTileDate } from '@/lib/daily';

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'special', 'legendary'];

export function TabMisGoggins({
  me,
  claims,
}: {
  me: GogginsUser;
  claims: ClaimWithJoin[];
}) {
  const myClaims = claims.filter(c => c.user_id === me.id);
  const [detail, setDetail] = useState<ClaimWithJoin | null>(null);

  const byRarity: Record<Rarity, number> = { common: 0, rare: 0, special: 0, legendary: 0 };
  myClaims.forEach(c => {
    byRarity[c.character.rarity]++;
  });

  return (
    <div style={{ padding: '20px 18px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            fontSize: 22,
            color: 'var(--ink-2)',
            lineHeight: 1.1,
            marginBottom: 4,
          }}
        >
          Hola, {me.name},
        </div>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 32,
            color: 'var(--ink)',
            letterSpacing: -0.5,
            lineHeight: 1,
          }}
        >
          tenés {myClaims.length} Goggins.
        </div>
      </div>

      <SoftCard style={{ padding: '16px 18px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
          {RARITY_ORDER.map((k, i) => (
            <div
              key={k}
              style={{
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid var(--line-soft)' : 'none',
                padding: '0 4px',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 22,
                  color: RARITY_META[k].color,
                  fontWeight: 500,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {byRarity[k]}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--ink-3)',
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  marginTop: 4,
                }}
              >
                {RARITY_META[k].label}
              </div>
            </div>
          ))}
        </div>
      </SoftCard>

      <SectionHead label="Tu colección" hint={`${myClaims.length} / ${claims.length}`} />

      {claims.length === 0 ? (
        <div
          style={{
            color: 'var(--ink-3)',
            textAlign: 'center',
            fontFamily: 'var(--serif)',
            fontStyle: 'italic',
            padding: '24px 0',
          }}
        >
          Todavía no hay Goggins reclamados.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {claims.map(c => (
            <CollectionTile
              key={c.id}
              claim={c}
              isMine={c.user_id === me.id}
              onClick={() => c.user_id === me.id && setDetail(c)}
            />
          ))}
        </div>
      )}

      {detail && <DetailModal claim={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function CollectionTile({
  claim,
  isMine,
  onClick,
}: {
  claim: ClaimWithJoin;
  isMine: boolean;
  onClick: () => void;
}) {
  const r = RARITY_META[claim.character.rarity];
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        aspectRatio: '0.85',
        cursor: isMine ? 'pointer' : 'default',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.12s',
      }}
    >
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: isMine ? 'var(--bg)' : '#FAF7EF',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <CharacterPortrait character={claim.character} size="92%" silhouette={!isMine} />
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: isMine ? r.color : 'var(--ink-3)',
            opacity: isMine ? 1 : 0.5,
          }}
        />
      </div>
      <div
        style={{
          padding: '8px 10px',
          borderTop: '1px solid var(--line-soft)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 9,
            color: 'var(--ink-3)',
            letterSpacing: 0.5,
          }}
        >
          {formatTileDate(claim.claim_date)}
        </span>
        <span
          style={{
            fontSize: 10,
            color: isMine ? 'var(--accent)' : 'var(--ink-3)',
            fontWeight: isMine ? 500 : 400,
            maxWidth: 70,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isMine ? 'Tuyo' : claim.user.name}
        </span>
      </div>
    </div>
  );
}

function DetailModal({ claim, onClose }: { claim: ClaimWithJoin; onClose: () => void }) {
  const c = claim.character;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        background: 'rgba(27,24,20,0.35)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: 22,
        animation: 'fadeIn 0.2s ease-out',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 360, animation: 'slideUp 0.3s ease-out' }}
      >
        <SoftCard style={{ padding: '22px 22px 20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ink-3)',
                letterSpacing: 1.2,
              }}
            >
              {formatTileDate(claim.claim_date)}
            </span>
            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                borderRadius: '50%',
                cursor: 'pointer',
                color: 'var(--ink-2)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ height: 220, display: 'grid', placeItems: 'center', marginTop: 4 }}>
            <CharacterPortrait character={c} size={220} animate />
          </div>

          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <div
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 30,
                color: 'var(--ink)',
                letterSpacing: -0.4,
                lineHeight: 1.1,
              }}
            >
              {c.display_name}
            </div>
            <div style={{ marginTop: 10 }}>
              <RarityBadge rarity={c.rarity} />
            </div>
            {c.quote && (
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 15,
                  color: 'var(--ink-2)',
                  marginTop: 12,
                  lineHeight: 1.45,
                }}
              >
                “{c.quote}”
              </div>
            )}
          </div>

          <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line-soft)' }}>
            <StatBar label="Fuerza" value={c.strength} />
            <StatBar label="Velocidad" value={c.speed} />
            <StatBar label="Stamina" value={c.stamina} />
          </div>
        </SoftCard>
      </div>
    </div>
  );
}
