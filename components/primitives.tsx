'use client';
import React from 'react';
import { Character, Rarity, RARITY_META } from '@/lib/types';

export function SoftCard({
  children,
  style,
  onClick,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 18,
        boxShadow: '0 1px 0 rgba(27,24,20,0.02), 0 4px 20px -12px rgba(27,24,20,0.08)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function RarityBadge({ rarity, size = 'md' }: { rarity: Rarity; size?: 'sm' | 'md' }) {
  const r = RARITY_META[rarity];
  const fs = size === 'sm' ? 10 : 11;
  const py = size === 'sm' ? 3 : 4;
  const px = size === 'sm' ? 8 : 10;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: `${py}px ${px}px`,
        background: 'transparent',
        border: `1px solid ${r.color}33`,
        borderRadius: 999,
        color: r.color,
        fontFamily: 'var(--mono)',
        fontSize: fs,
        letterSpacing: 0.5,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: r.color,
          boxShadow: `0 0 0 3px ${r.color}1a`,
        }}
      />
      {r.label}
    </span>
  );
}

function statColor(v: number): string {
  if (v < 34) return '#C25A4A';
  if (v < 67) return '#C9A23A';
  return '#5C8B5A';
}

export function StatBar({ label, value }: { label: string; value: number }) {
  const color = statColor(value);
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 12,
            color: 'var(--ink-2)',
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 13,
            color: 'var(--ink)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
          <span style={{ color: 'var(--ink-3)' }}> / 100</span>
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: 'var(--line-soft)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${value}%`,
            background: color,
            borderRadius: 99,
            transition: 'width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), background 0.3s',
          }}
        />
      </div>
    </div>
  );
}

export function characterImg(character: Pick<Character, 'name'>): string {
  return `/characters/${character.name}.png`;
}

export function CharacterPortrait({
  character,
  size = 240,
  silhouette = false,
  animate = false,
  imgSrc,
}: {
  character: Character | null;
  size?: number | string;
  silhouette?: boolean;
  animate?: boolean;
  imgSrc?: string;
}) {
  if (!character) {
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'grid',
          placeItems: 'center',
          background: 'var(--bg)',
          border: '1px dashed var(--line)',
          borderRadius: 14,
          color: 'var(--ink-3)',
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: typeof size === 'number' ? size / 6 : 36,
        }}
      >
        ?
      </div>
    );
  }
  const r = RARITY_META[character.rarity];
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          bottom: '6%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '64%',
          height: 10,
          background: `radial-gradient(ellipse, ${r.color}55 0%, transparent 70%)`,
          filter: 'blur(2px)',
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc ?? characterImg(character)}
        alt={character.display_name}
        crossOrigin="anonymous"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          filter: silhouette ? 'brightness(0) saturate(100%) opacity(0.18)' : 'none',
          animation: animate ? 'float 4s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  );
}

export function SectionHead({ label, hint }: { label: string; hint?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        padding: '0 4px',
      }}
    >
      <h3
        style={{
          margin: 0,
          fontFamily: 'var(--serif)',
          fontStyle: 'italic',
          fontSize: 19,
          color: 'var(--ink)',
          fontWeight: 400,
          letterSpacing: -0.2,
        }}
      >
        {label}
      </h3>
      {hint && (
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 11,
            color: 'var(--ink-3)',
            letterSpacing: 0.5,
          }}
        >
          {hint}
        </span>
      )}
    </div>
  );
}
