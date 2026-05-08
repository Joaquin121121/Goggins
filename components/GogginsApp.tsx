'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchAllClaims,
  fetchCharacters,
  fetchMe,
  fetchTodaysClaim,
  pickTodaysCharacter,
  claimToday,
} from '@/lib/api';
import type {
  Character,
  ClaimWithJoin,
  GogginsUser,
} from '@/lib/types';
import { Login } from './Login';
import { GogginsHeader, GogginsTabBar, TabId } from './Header';
import { TabDelDia } from './TabDelDia';
import { TabMisGoggins } from './TabMisGoggins';
import { TabHistorico } from './TabHistorico';

const STORAGE_KEY = 'goggins_user_id';

export function GogginsApp() {
  const [bootstrapped, setBootstrapped] = useState(false);
  const [me, setMe] = useState<GogginsUser | null>(null);
  const [tab, setTab] = useState<TabId>('today');

  const [characters, setCharacters] = useState<Character[]>([]);
  const [todayClaim, setTodayClaim] = useState<ClaimWithJoin | null>(null);
  const [allClaims, setAllClaims] = useState<ClaimWithJoin[]>([]);
  const [loading, setLoading] = useState(false);

  // Bootstrap session: prefer Supabase session, fall back to stored id (which
  // means we still need the auth session — if missing, force login).
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUserId = data.session?.user.id ?? null;
      const storedId =
        typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

      const userId = sessionUserId ?? storedId;
      if (!userId) {
        if (mounted) setBootstrapped(true);
        return;
      }
      // If we don't have an auth session, the stored id is stale.
      if (!sessionUserId) {
        localStorage.removeItem(STORAGE_KEY);
        if (mounted) setBootstrapped(true);
        return;
      }
      try {
        const profile = await fetchMe(userId);
        if (mounted) {
          setMe(profile);
          if (profile) localStorage.setItem(STORAGE_KEY, profile.id);
        }
      } finally {
        if (mounted) setBootstrapped(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [chars, claim, all] = await Promise.all([
        fetchCharacters(),
        fetchTodaysClaim(),
        fetchAllClaims(),
      ]);
      setCharacters(chars);
      setTodayClaim(claim);
      setAllClaims(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (me) loadData();
  }, [me, loadData]);

  const handleLogin = useCallback(async (userId: string) => {
    const profile = await fetchMe(userId);
    if (!profile) {
      // No goggins_users row for this auth user — surface a clear error.
      alert('Tu cuenta no tiene perfil de Goggins. Avisá al admin.');
      await supabase.auth.signOut();
      return;
    }
    localStorage.setItem(STORAGE_KEY, profile.id);
    setMe(profile);
  }, []);

  const handleLogout = useCallback(async () => {
    localStorage.removeItem(STORAGE_KEY);
    await supabase.auth.signOut();
    setMe(null);
  }, []);

  const handleClaim = useCallback(async (): Promise<ClaimWithJoin> => {
    if (!me) throw new Error('No user');
    const today = pickTodaysCharacter(characters);
    if (!today) throw new Error('No characters');
    const result = await claimToday(me.id, today.id);
    setTodayClaim(result);
    setAllClaims(prev => [result, ...prev]);
    return result;
  }, [me, characters]);

  if (!bootstrapped) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', color: 'var(--ink-3)' }}>
          Cargando…
        </div>
      </div>
    );
  }

  if (!me) return <Login onSuccess={handleLogin} />;

  const todayCharacter = pickTodaysCharacter(characters);

  return (
    <div className="app-shell">
      <GogginsHeader tab={tab} />
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {loading && characters.length === 0 ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              color: 'var(--ink-3)',
            }}
          >
            Cargando…
          </div>
        ) : (
          <>
            {tab === 'today' && (
              <TabDelDia
                me={me}
                todayCharacter={todayCharacter}
                todayClaim={todayClaim}
                onClaim={handleClaim}
              />
            )}
            {tab === 'mine' && <TabMisGoggins me={me} claims={allClaims} />}
            {tab === 'hist' && <TabHistorico me={me} claims={allClaims} />}
          </>
        )}
      </div>
      <GogginsTabBar active={tab} onChange={setTab} />

      <button
        onClick={handleLogout}
        title="Cerrar sesión"
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + 14px)',
          right: 22,
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '1px solid var(--line)',
          background: 'transparent',
          color: 'var(--ink-3)',
          cursor: 'pointer',
          fontSize: 12,
          display: 'none',
        }}
      >
        ↪
      </button>
    </div>
  );
}
