'use client';
import React, { useState } from 'react';
import type { Character, ClaimWithJoin, GogginsUser } from '@/lib/types';
import { CharacterPortrait, SoftCard, StatBar } from './primitives';
import { formatHeaderDate, isWeekend } from '@/lib/daily';
import { ShareModal } from './ShareCard';

type Props = {
  me: GogginsUser;
  todayCharacter: Character | null;
  todayClaim: ClaimWithJoin | null;
  onClaim: () => Promise<ClaimWithJoin>;
};

export function TabDelDia({ me, todayCharacter, todayClaim, onClaim }: Props) {
  const [showShare, setShowShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [localClaim, setLocalClaim] = useState<ClaimWithJoin | null>(todayClaim);

  const weekend = isWeekend();
  const claim = localClaim;
  const revealed = !!claim;

  if (weekend) {
    return (
      <div style={{ padding: '24px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <DateHeader />
        <SoftCard style={{ padding: '32px 22px', textAlign: 'center' }}>
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 22,
              color: 'var(--ink-2)',
              lineHeight: 1.3,
              marginBottom: 6,
            }}
          >
            El Goggins descansa los fines de semana.
          </div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: 1.2,
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
              marginTop: 14,
            }}
          >
            Vuelve el lunes.
          </div>
        </SoftCard>
      </div>
    );
  }

  if (!todayCharacter) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>
        Cargando…
      </div>
    );
  }

  const display = revealed ? claim!.character : todayCharacter;

  const handleClaim = async () => {
    setBusy(true);
    setErr(null);
    try {
      const result = await onClaim();
      setLocalClaim(result);
      setShowShare(true);
    } catch (e: any) {
      setErr(
        e?.code === '23505'
          ? 'Alguien se adelantó. Refrescá para ver quién reclamó hoy.'
          : e?.message ?? 'No se pudo reclamar.',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: '20px 18px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      <DateHeader />

      <SoftCard style={{ padding: '22px 20px 24px', animation: 'slideUp 0.4s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--ink-2)',
              marginBottom: 2,
            }}
          >
            el goggins de hoy es…
          </div>
        </div>

        <div style={{ position: 'relative', display: 'grid', placeItems: 'center', height: 260 }}>
          <CharacterPortrait
            character={display}
            size={260}
            silhouette={!revealed}
            animate={revealed}
          />
          {!revealed && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontSize: 80,
                  color: 'var(--ink-3)',
                }}
              >
                ?
              </div>
            </div>
          )}
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
            {revealed ? display.display_name : '????'}
          </div>
          {revealed && (
            <div
              style={{
                marginTop: 6,
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: 'var(--ink-3)',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              Reclamado · {claim!.user.name}
            </div>
          )}
          {revealed && display.quote && (
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
              “{display.quote}”
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 22,
            paddingTop: 18,
            borderTop: '1px solid var(--line-soft)',
            opacity: revealed ? 1 : 0.3,
            transition: 'opacity 0.4s',
          }}
        >
          <StatBar label="Fuerza" value={revealed ? display.strength : 0} />
          <StatBar label="Velocidad" value={revealed ? display.speed : 0} />
          <StatBar label="Stamina" value={revealed ? display.stamina : 0} />
        </div>
      </SoftCard>

      {!revealed ? (
        <>
          <ClaimButton onClick={handleClaim} busy={busy} />
          <div
            style={{
              fontSize: 13,
              color: 'var(--ink-3)',
              textAlign: 'center',
              lineHeight: 1.5,
              padding: '0 20px',
            }}
          >
            Sé el primero en reclamarlo.<br />
            El Goggins de hoy es para uno solo.
          </div>
          {err && (
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                color: '#C25A4A',
                textAlign: 'center',
              }}
            >
              {err}
            </div>
          )}
        </>
      ) : (
        <>
          <ClaimedBanner by={claim!.user.name} isMe={claim!.user.id === me.id} />
          <button
            onClick={() => setShowShare(true)}
            style={{
              padding: '14px 16px',
              background: '#25D366',
              border: 0,
              borderRadius: 14,
              color: '#FFF',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 6px 18px -8px rgba(37,211,102,0.55)',
              animation: 'slideUp 0.4s ease-out 0.1s backwards',
            }}
          >
            Compartir tarjeta
          </button>
        </>
      )}

      {showShare && claim && (
        <ShareModal
          character={claim.character}
          user={claim.user}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

function DateHeader() {
  return (
    <div
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 11,
        color: 'var(--ink-3)',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        textAlign: 'center',
      }}
    >
      {formatHeaderDate()}
    </div>
  );
}

function ClaimButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={busy}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        padding: '18px 16px',
        background: pressed ? '#B36D2E' : 'var(--accent)',
        border: 0,
        borderRadius: 14,
        color: '#FFF',
        fontSize: 16,
        fontWeight: 500,
        letterSpacing: 0.3,
        cursor: busy ? 'default' : 'pointer',
        boxShadow: pressed
          ? '0 1px 2px rgba(201,127,58,0.2)'
          : '0 6px 18px -6px rgba(201,127,58,0.55), 0 1px 0 rgba(255,255,255,0.2) inset',
        transform: pressed ? 'translateY(1px)' : 'translateY(0)',
        transition: 'all 0.12s',
        opacity: busy ? 0.7 : 1,
      }}
    >
      {busy ? 'Reclamando…' : 'Sé el Goggins del día →'}
    </button>
  );
}

function ClaimedBanner({ by, isMe }: { by: string; isMe: boolean }) {
  return (
    <div
      style={{
        padding: '14px 18px',
        background: 'var(--accent-soft)',
        border: '1px solid #E8C99B',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#FFF',
          display: 'grid',
          placeItems: 'center',
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        ✓
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 500, marginBottom: 2 }}>
          {isMe ? '¡Reclamado por vos!' : `Reclamado por ${by}.`}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
          {isMe ? 'Compartilo y mostralo.' : 'Probá mañana — el primero gana.'}
        </div>
      </div>
    </div>
  );
}
