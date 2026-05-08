'use client';
import React from 'react';

export type TabId = 'today' | 'mine' | 'hist';

export function GogginsHeader({ tab }: { tab: TabId }) {
  const titles: Record<TabId, string> = {
    today: 'Hoy',
    mine: 'Tu colección',
    hist: 'Histórico',
  };
  return (
    <div
      style={{
        padding: 'calc(env(safe-area-inset-top) + 14px) 22px 14px',
        borderBottom: '1px solid var(--line)',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 28,
          color: 'var(--ink)',
          letterSpacing: -0.5,
          lineHeight: 1,
        }}
      >
        Goggins
      </div>
      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 13,
          color: 'var(--ink-2)',
          letterSpacing: 0.2,
        }}
      >
        {titles[tab]}
      </div>
    </div>
  );
}

export function GogginsTabBar({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
}) {
  const tabs: { id: TabId; label: string }[] = [
    { id: 'today', label: 'Del día' },
    { id: 'mine', label: 'Mis Goggins' },
    { id: 'hist', label: 'Histórico' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        background: 'var(--surface)',
        borderTop: '1px solid var(--line)',
        padding: '6px 8px calc(env(safe-area-inset-bottom) + 18px)',
      }}
    >
      {tabs.map(t => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 0,
              padding: '12px 4px 10px',
              cursor: 'pointer',
              position: 'relative',
              color: isActive ? 'var(--ink)' : 'var(--ink-3)',
              fontSize: 13,
              fontWeight: isActive ? 500 : 400,
              letterSpacing: 0.2,
              transition: 'color 0.15s',
            }}
          >
            {t.label}
            <span
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 2,
                transform: 'translateX(-50%)',
                width: isActive ? 24 : 0,
                height: 2,
                background: 'var(--accent)',
                borderRadius: 99,
                transition: 'width 0.2s ease',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
