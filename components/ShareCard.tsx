'use client';
import React, { useEffect, useRef, useState } from 'react';
import type { Character, GogginsUser } from '@/lib/types';
import { RARITY_META } from '@/lib/types';
import { CharacterPortrait, RarityBadge, StatBar, characterImg } from './primitives';

type Props = {
  character: Character;
  user: GogginsUser;
  onClose: () => void;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function statColor(v: number): string {
  if (v < 34) return '#C25A4A';
  if (v < 67) return '#C9A23A';
  return '#5C8B5A';
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function measureLetterSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  letterSpacing: number,
): number {
  let w = 0;
  for (let i = 0; i < text.length; i++) {
    w += ctx.measureText(text[i]).width;
    if (i < text.length - 1) w += letterSpacing;
  }
  return w;
}

function fillTextSpaced(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacing: number,
  align: 'left' | 'center' | 'right' = 'left',
) {
  const totalW = measureLetterSpaced(ctx, text, letterSpacing);
  let cursor = align === 'left' ? x : align === 'center' ? x - totalW / 2 : x - totalW;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  for (let i = 0; i < text.length; i++) {
    ctx.fillText(text[i], cursor, y);
    cursor += ctx.measureText(text[i]).width + letterSpacing;
  }
  ctx.textAlign = prevAlign;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (ctx.measureText(trial).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await Promise.all([
      (document as Document).fonts.load('16px "Instrument Serif"'),
      (document as Document).fonts.load('italic 16px "Instrument Serif"'),
      (document as Document).fonts.load('28px "Instrument Serif"'),
      (document as Document).fonts.load('italic 14px "Instrument Serif"'),
      (document as Document).fonts.load('500 10px "JetBrains Mono"'),
      (document as Document).fonts.load('500 11px "JetBrains Mono"'),
      (document as Document).fonts.load('500 12px "JetBrains Mono"'),
      (document as Document).fonts.load('400 13px "JetBrains Mono"'),
    ]);
    await (document as Document).fonts.ready;
  } catch {
    // Falls back to system fonts; not fatal.
  }
}

const SERIF = '"Instrument Serif", Georgia, serif';
const MONO = '"JetBrains Mono", ui-monospace, "SF Mono", monospace';

const COLORS = {
  bg: '#F5F1E8',
  surface: '#FFFFFF',
  line: '#E8E2D2',
  lineSoft: '#F0EBDD',
  ink: '#1B1814',
  ink2: '#5C574E',
  ink3: '#9A9385',
};

async function renderShareCanvas(
  character: Character,
  user: GogginsUser,
  charImg: HTMLImageElement,
): Promise<Blob | null> {
  await ensureFontsLoaded();

  const dpr = 2;
  const width = 360;

  // Measure quote first to compute final height.
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d')!;
  measureCtx.font = `italic 14px ${SERIF}`;
  const innerWidth = width - 18 * 2; // 18px horizontal padding on the card
  const quoteText = character.quote ? `“${character.quote}”` : '';
  const quoteLines = quoteText ? wrapText(measureCtx, quoteText, innerWidth) : [];
  const quoteLineHeight = 14 * 1.45;
  const quoteHeight = quoteLines.length * quoteLineHeight;

  // Vertical layout (matches the React card pretty closely).
  const padTop = 20;
  const padBottom = 22;
  const labelH = 14;
  const labelGap = 8;
  const userLineH = 22;
  const userGap = 4;
  const portraitGap = 6;
  const portraitH = 220;
  const nameGap = 4;
  const nameH = 32;
  const badgeGap = 10;
  const badgeH = 22;
  const quoteGap = quoteLines.length ? 12 : 0;
  const dividerGap = 18;
  const dividerPad = 16;
  const statLabelH = 14;
  const statLabelToBar = 6;
  const statBarH = 4;
  const statRowGap = 14;
  const statBlockH = statLabelH + statLabelToBar + statBarH;
  const statsH = statBlockH * 3 + statRowGap * 2;

  const totalH = Math.round(
    padTop +
      labelH +
      labelGap +
      userLineH +
      userGap +
      portraitGap +
      portraitH +
      nameGap +
      nameH +
      badgeGap +
      badgeH +
      quoteGap +
      quoteHeight +
      dividerGap +
      dividerPad +
      statsH +
      padBottom,
  );

  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = totalH * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(dpr, dpr);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Background.
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, width, totalH);

  const cx = width / 2;
  const cardLeft = 18;
  const cardRight = width - 18;
  let y = padTop;

  // "GOGGINS DEL DIA" eyebrow.
  ctx.font = `500 10px ${MONO}`;
  ctx.fillStyle = COLORS.ink3;
  ctx.textBaseline = 'top';
  fillTextSpaced(ctx, 'GOGGINS DEL DÍA', cx, y, 1.5, 'center');
  y += labelH + labelGap;

  // "{name} es el Goggins del día"
  ctx.font = `italic 16px ${SERIF}`;
  ctx.fillStyle = COLORS.ink2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`${user.name} es el Goggins del día`, cx, y);
  y += userLineH + userGap + portraitGap;

  // Portrait + soft glow underneath.
  const r = RARITY_META[character.rarity];
  const portraitTop = y;
  const portraitLeft = cx - portraitH / 2;
  // Soft shadow ellipse.
  const glowCenterX = cx;
  const glowCenterY = portraitTop + portraitH * 0.94;
  const glowRX = portraitH * 0.32;
  const glowRY = 5;
  const glow = ctx.createRadialGradient(
    glowCenterX,
    glowCenterY,
    0,
    glowCenterX,
    glowCenterY,
    glowRX,
  );
  glow.addColorStop(0, `${r.color}55`);
  glow.addColorStop(1, `${r.color}00`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(glowCenterX, glowCenterY, glowRX, glowRY, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw character image with object-fit: contain.
  const iw = charImg.naturalWidth || charImg.width;
  const ih = charImg.naturalHeight || charImg.height;
  if (iw > 0 && ih > 0) {
    const scale = Math.min(portraitH / iw, portraitH / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = portraitLeft + (portraitH - dw) / 2;
    const dy = portraitTop + (portraitH - dh) / 2;
    ctx.drawImage(charImg, dx, dy, dw, dh);
  }
  y = portraitTop + portraitH + nameGap;

  // Display name.
  ctx.font = `400 28px ${SERIF}`;
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(character.display_name, cx, y);
  y += nameH + badgeGap;

  // Rarity badge.
  ctx.font = `500 11px ${MONO}`;
  const labelText = r.label;
  const labelTextWidth = measureLetterSpaced(ctx, labelText, 0.5);
  const dotSize = 6;
  const dotGap = 6;
  const pillPadX = 10;
  const pillContentW = dotSize + dotGap + labelTextWidth;
  const pillW = pillContentW + pillPadX * 2;
  const pillH = badgeH;
  const pillX = cx - pillW / 2;
  const pillY = y;
  // Border only (transparent fill).
  roundedRectPath(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.strokeStyle = `${r.color}33`;
  ctx.lineWidth = 1;
  ctx.stroke();
  // Dot glow.
  const dotCX = pillX + pillPadX + dotSize / 2;
  const dotCY = pillY + pillH / 2;
  ctx.fillStyle = `${r.color}1a`;
  ctx.beginPath();
  ctx.arc(dotCX, dotCY, dotSize / 2 + 3, 0, Math.PI * 2);
  ctx.fill();
  // Dot.
  ctx.fillStyle = r.color;
  ctx.beginPath();
  ctx.arc(dotCX, dotCY, dotSize / 2, 0, Math.PI * 2);
  ctx.fill();
  // Label text.
  ctx.fillStyle = r.color;
  ctx.textBaseline = 'middle';
  fillTextSpaced(
    ctx,
    labelText,
    pillX + pillPadX + dotSize + dotGap,
    dotCY,
    0.5,
    'left',
  );
  y += pillH;

  // Quote (optional).
  if (quoteLines.length) {
    y += quoteGap;
    ctx.font = `italic 14px ${SERIF}`;
    ctx.fillStyle = COLORS.ink2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (const line of quoteLines) {
      ctx.fillText(line, cx, y);
      y += quoteLineHeight;
    }
  }

  // Divider.
  y += dividerGap;
  ctx.strokeStyle = `${r.color}33`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cardLeft, y + 0.5);
  ctx.lineTo(cardRight, y + 0.5);
  ctx.stroke();
  y += dividerPad;

  // Stat bars.
  const drawStat = (label: string, value: number) => {
    // Label.
    ctx.font = `500 12px ${MONO}`;
    ctx.fillStyle = COLORS.ink2;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    fillTextSpaced(ctx, label.toUpperCase(), cardLeft, y, 1, 'left');

    // Value: "<value> / 100" right-aligned, with /100 in light ink.
    ctx.font = `400 13px ${MONO}`;
    ctx.textBaseline = 'top';
    const slash = ' / 100';
    const valueStr = String(value);
    ctx.fillStyle = COLORS.ink3;
    const slashW = ctx.measureText(slash).width;
    ctx.textAlign = 'right';
    ctx.fillText(slash, cardRight, y);
    ctx.fillStyle = COLORS.ink;
    ctx.fillText(valueStr, cardRight - slashW, y);

    // Bar background.
    const barY = y + statLabelH + statLabelToBar;
    const barW = cardRight - cardLeft;
    ctx.fillStyle = COLORS.lineSoft;
    roundedRectPath(ctx, cardLeft, barY, barW, statBarH, statBarH / 2);
    ctx.fill();

    // Bar fill.
    const clamped = Math.max(0, Math.min(100, value));
    const fillW = (barW * clamped) / 100;
    if (fillW > 0) {
      ctx.fillStyle = statColor(value);
      roundedRectPath(ctx, cardLeft, barY, fillW, statBarH, statBarH / 2);
      ctx.fill();
    }

    y = barY + statBarH + statRowGap;
  };

  drawStat('Fuerza', character.strength);
  drawStat('Velocidad', character.speed);
  drawStat('Stamina', character.stamina);

  return new Promise<Blob | null>(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png');
  });
}

export function ShareModal({ character, user, onClose }: Props) {
  const [busy, setBusy] = useState(false);
  const [charImg, setCharImg] = useState<HTMLImageElement | null>(null);

  const message = `${user.name} es el Goggins del día — ${character.display_name}.`;

  useEffect(() => {
    let cancelled = false;
    loadImage(characterImg(character))
      .then(img => {
        if (!cancelled) setCharImg(img);
      })
      .catch(() => {
        if (!cancelled) setCharImg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [character]);

  const generateBlob = async (): Promise<Blob | null> => {
    if (!charImg) return null;
    return renderShareCanvas(character, user, charImg);
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

  const ready = !!charImg;

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
        <ShareCardPreview character={character} user={user} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={shareToWhatsApp}
            disabled={busy || !ready}
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
              cursor: busy || !ready ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: busy || !ready ? 0.6 : 1,
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
              <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.91-7.01zM12.04 20.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.14.16-.25.25-.41.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.02 2.56.12.16 1.75 2.67 4.24 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.18-.47-.3z" />
            </svg>
            {busy ? 'Generando…' : 'Compartir en WhatsApp'}
          </button>
          <button
            onClick={downloadImage}
            disabled={busy || !ready}
            title="Descargar imagen"
            style={{
              padding: '14px',
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              cursor: busy || !ready ? 'default' : 'pointer',
              opacity: busy || !ready ? 0.6 : 1,
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

function ShareCardPreview({
  character,
  user,
}: {
  character: Character;
  user: GogginsUser;
}) {
  const r = RARITY_META[character.rarity];
  return (
    <div
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
        <CharacterPortrait character={character} size={220} animate={false} />
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
}
