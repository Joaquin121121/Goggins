'use client';
import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import type { Character, GogginsUser } from '@/lib/types';
import { RARITY_META } from '@/lib/types';
import { CharacterPortrait, RarityBadge, StatBar, characterImg } from './primitives';

async function fetchAsDataURL(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'force-cache' });
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

type Props = {
  character: Character;
  user: GogginsUser;
  onClose: () => void;
};

export function ShareModal({ character, user, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [imgDataUrl, setImgDataUrl] = useState<string | null>(null);

  const message = `${user.name} es el Goggins del día — ${character.display_name}.`;

  useEffect(() => {
    let cancelled = false;
    fetchAsDataURL(characterImg(character))
      .then(dataUrl => {
        if (!cancelled) setImgDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setImgDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [character]);

  const generateBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    // Ensure every <img> inside the card is fully decoded before rasterising,
    // otherwise html-to-image captures a blank placeholder on Safari/WebKit.
    const imgs = Array.from(cardRef.current.querySelectorAll('img'));
    await Promise.all(
      imgs.map(img =>
        img.complete && img.naturalWidth > 0
          ? Promise.resolve()
          : new Promise<void>(resolve => {
              img.addEventListener('load', () => resolve(), { once: true });
              img.addEventListener('error', () => resolve(), { once: true });
            }),
      ),
    );
    const dataUrl = await toPng(cardRef.current, {
      cacheBust: false,
      pixelRatio: 2,
      backgroundColor: '#F5F1E8',
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const shareToWhatsApp = async () => {
    setBusy(true);
    try {
      const blob = await generateBlob();
      const file = blob
        ? new File([blob], 'goggins.png', { type: 'image/png' })
        : null;

      const navAny = navigator as Navigator & {
        canShare?: (data: ShareData) => boolean;
      };

      if (
        file &&
        typeof navigator.share === 'function' &&
        navAny.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          text: message,
        });
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          '_blank',
        );
      }
    } catch (e) {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        '_blank',
      );
    } finally {
      setBusy(false);
    }
  };

  const downloadImage = async () => {
    setBusy(true);
    try {
      const blob = await generateBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `goggins-${character.name}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  // Lock background scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(27,24,20,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: 18,
        animation: 'fadeIn 0.2s ease-out',
        overflow: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 360,
          animation: 'slideUp 0.3s ease-out',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <ShareCard
          ref={cardRef}
          character={character}
          user={user}
          imgSrc={imgDataUrl}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={shareToWhatsApp}
            disabled={busy || !imgDataUrl}
            style={{
              flex: 1,
              padding: '14px 16px',
              background: '#25D366',
              border: 0,
              borderRadius: 14,
              color: '#FFF',
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: 0.2,
              cursor: busy ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zM12.04 20.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.56.12.16 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.18-.47-.3z" />
            </svg>
            {busy ? 'Generando…' : 'Compartir en WhatsApp'}
          </button>
          <button
            onClick={downloadImage}
            disabled={busy || !imgDataUrl}
            title="Descargar imagen"
            style={{
              padding: '14px',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              cursor: busy ? 'default' : 'pointer',
              opacity: busy ? 0.6 : 1,
            }}
          >
            ⬇
          </button>
        </div>

        <button
          onClick={onClose}
          style={{
            padding: '12px',
            background: 'transparent',
            border: 0,
            color: '#FFF',
            fontSize: 13,
            cursor: 'pointer',
            opacity: 0.8,
          }}
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

const ShareCard = React.forwardRef<
  HTMLDivElement,
  { character: Character; user: GogginsUser; imgSrc?: string | null }
>(function ShareCard({ character, user, imgSrc }, ref) {
  const r = RARITY_META[character.rarity];
  return (
    <div
      ref={ref}
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 18,
        padding: '20px 18px 22px',
        boxShadow: '0 8px 28px -12px rgba(27,24,20,0.25)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: 1.5,
          color: 'var(--ink-3)',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        Goggins del día
      </div>
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: 16,
          color: 'var(--ink-2)',
          textAlign: 'center',
          marginBottom: 4,
        }}
      >
        {user.name} es el Goggins del día
      </div>

      <div style={{ height: 220, display: 'grid', placeItems: 'center', marginTop: 6 }}>
        <CharacterPortrait
          character={character}
          size={220}
          animate={false}
          imgSrc={imgSrc ?? undefined}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <div
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 28,
            color: 'var(--ink)',
            letterSpacing: -0.4,
            lineHeight: 1.1,
          }}
        >
          {character.display_name}
        </div>
        <div style={{ marginTop: 10 }}>
          <RarityBadge rarity={character.rarity} />
        </div>
        {character.quote && (
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--ink-2)',
              marginTop: 12,
              lineHeight: 1.45,
            }}
          >
            “{character.quote}”
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 18,
          paddingTop: 16,
          borderTop: `1px solid ${r.color}33`,
        }}
      >
        <StatBar label="Fuerza" value={character.strength} />
        <StatBar label="Velocidad" value={character.speed} />
        <StatBar label="Stamina" value={character.stamina} />
      </div>
    </div>
  );
});
