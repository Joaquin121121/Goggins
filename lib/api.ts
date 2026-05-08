'use client';
import { supabase } from './supabase';
import type { Character, GogginsUser, ClaimWithJoin } from './types';
import { argentinaDateISO, pickCharacterIndex } from './daily';

export async function fetchCharacters(): Promise<Character[]> {
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .order('name');
  if (error) throw error;
  return (data ?? []) as Character[];
}

export async function fetchMe(userId: string): Promise<GogginsUser | null> {
  const { data, error } = await supabase
    .from('goggins_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as GogginsUser | null;
}

export async function fetchTodaysClaim(): Promise<ClaimWithJoin | null> {
  const today = argentinaDateISO();
  const { data, error } = await supabase
    .from('daily_claims')
    .select('*, character:characters(*), user:goggins_users(*)')
    .eq('claim_date', today)
    .maybeSingle();
  if (error) throw error;
  return data as ClaimWithJoin | null;
}

export async function fetchAllClaims(): Promise<ClaimWithJoin[]> {
  const { data, error } = await supabase
    .from('daily_claims')
    .select('*, character:characters(*), user:goggins_users(*)')
    .order('claim_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClaimWithJoin[];
}

export async function claimToday(
  userId: string,
  characterId: string,
): Promise<ClaimWithJoin> {
  const today = argentinaDateISO();
  const { data, error } = await supabase
    .from('daily_claims')
    .insert({ claim_date: today, user_id: userId, character_id: characterId })
    .select('*, character:characters(*), user:goggins_users(*)')
    .single();
  if (error) throw error;
  return data as ClaimWithJoin;
}

export function pickTodaysCharacter(characters: Character[]): Character | null {
  if (characters.length === 0) return null;
  const idx = pickCharacterIndex(argentinaDateISO(), characters.length);
  return characters[idx];
}
