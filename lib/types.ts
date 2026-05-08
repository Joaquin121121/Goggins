export type Rarity = 'common' | 'rare' | 'special' | 'legendary';

export type Character = {
  id: string;
  name: string;
  display_name: string;
  rarity: Rarity;
  strength: number;
  speed: number;
  stamina: number;
  quote: string | null;
  badge: string | null;
};

export type GogginsUser = {
  id: string;
  name: string;
  profile_url: string | null;
};

export type DailyClaim = {
  id: string;
  claim_date: string;
  character_id: string;
  user_id: string;
  claimed_at: string;
};

export type ClaimWithJoin = DailyClaim & {
  character: Character;
  user: GogginsUser;
};

export const RARITY_META: Record<Rarity, { label: string; color: string }> = {
  common:    { label: 'Común',     color: '#8E8A7E' },
  rare:      { label: 'Raro',      color: '#5A7BA0' },
  special:   { label: 'Especial',  color: '#8A6BA3' },
  legendary: { label: 'Legendario', color: '#C97F3A' },
};
