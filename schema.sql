-- Goggins schema
-- Run this in the Supabase SQL editor against the `public` schema.
-- auth.users is managed by Supabase. Pre-create users via the Supabase dashboard,
-- then insert a matching row in `goggins_users` so they can use the app.

-- =========================================================
-- Tables
-- =========================================================

create table if not exists characters (
  id           uuid primary key default gen_random_uuid(),
  name         text unique not null,                -- matches /public/characters/<name>.png
  display_name text not null,                       -- shown in UI (Spanish)
  rarity       text not null check (rarity in ('common','rare','special','legendary')),
  strength     int  not null check (strength between 0 and 100),
  speed        int  not null check (speed    between 0 and 100),
  stamina      int  not null check (stamina  between 0 and 100),
  quote        text,
  badge        text
);

create table if not exists goggins_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  profile_url text,                                  -- bunny.cdn url, uploaded manually
  created_at  timestamptz default now()
);

-- One claim per Argentina-day. The unique constraint on claim_date enforces
-- "first one to claim wins" at the DB layer.
create table if not exists daily_claims (
  id           uuid primary key default gen_random_uuid(),
  claim_date   date not null unique,
  character_id uuid not null references characters(id),
  user_id      uuid not null references goggins_users(id),
  claimed_at   timestamptz not null default now()
);

create index if not exists daily_claims_user_idx on daily_claims (user_id);
create index if not exists daily_claims_date_idx on daily_claims (claim_date desc);

-- =========================================================
-- Grants — Supabase roles need schema/table access before RLS applies.
-- Without these, PostgREST returns 42501 "permission denied for schema public".
-- =========================================================

grant usage on schema public to anon, authenticated, service_role;

grant select on characters    to anon, authenticated;
grant select on goggins_users to anon, authenticated;
grant select on daily_claims  to anon, authenticated;

grant insert, update on goggins_users to authenticated;
grant insert         on daily_claims  to authenticated;

-- =========================================================
-- RLS — anyone authenticated can read; only owners can write claims
-- =========================================================

alter table characters    enable row level security;
alter table goggins_users enable row level security;
alter table daily_claims  enable row level security;

drop policy if exists "characters readable" on characters;
create policy "characters readable" on characters
  for select using (true);

drop policy if exists "goggins_users readable" on goggins_users;
create policy "goggins_users readable" on goggins_users
  for select using (true);

drop policy if exists "users update self" on goggins_users;
create policy "users update self" on goggins_users
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "claims readable" on daily_claims;
create policy "claims readable" on daily_claims
  for select using (true);

drop policy if exists "claims insert self" on daily_claims;
create policy "claims insert self" on daily_claims
  for insert with check (auth.uid() = user_id);

-- =========================================================
-- Seed: characters (one row per image in /public/characters/)
-- name MUST match the image filename (without extension).
-- =========================================================

insert into characters (name, display_name, rarity, strength, speed, stamina, quote, badge) values
  ('astronaut',   'GOGGINS ASTRO',     'rare',      65, 75, 78, 'Las estrellas no se rinden.',           '★ COSMIC'),
  ('astronomer',  'GOGGINS SABIO',     'common',    42, 44, 58, 'Mirá al cielo. Encontrá el camino.',    '✦ SCHOLAR'),
  ('barista',     'GOGGINS CAFÉ',      'common',    48, 46, 52, 'Un café. Un día. Un esfuerzo más.',     '☕ HUSTLE'),
  ('boxer',       'GOGGINS BOXEO',     'special',   88, 80, 82, '¿Quién va a ganar? ¡YO!',               '🥊 FURY'),
  ('breakdancer', 'GOGGINS BREAK',     'common',    44, 58, 48, 'El piso es mi escenario.',              '🎧 FLOW'),
  ('ceo',         'GOGGINS JEFE',      'rare',      58, 65, 75, 'Trabajá como si nadie mirara.',         '💼 GRIND'),
  ('chef',        'GOGGINS CHEF',      'common',    50, 46, 54, 'El fuego también es disciplina.',       '🔪 HEAT'),
  ('cowboy',      'GOGGINS VAQUERO',   'common',    52, 50, 54, 'Cabalgá hasta el final.',               '🤠 GRIT'),
  ('dj',          'GOGGINS DJ',        'rare',      58, 76, 70, 'El beat nunca se rinde.',               '🎚️ PULSE'),
  ('doctor',      'GOGGINS DOC',       'rare',      56, 64, 76, 'Curá. Repetí. Repetí.',                 '⚕ HEAL'),
  ('firefighter', 'GOGGINS BOMBERO',   'rare',      74, 66, 72, 'Entrá cuando todos salen.',             '🔥 BLAZE'),
  ('fisherman',   'GOGGINS PESCA',     'common',    46, 36, 56, 'Paciencia es fuerza.',                  '🎣 STILL'),
  ('gardener',    'GOGGINS JARDÍN',    'common',    40, 34, 52, 'Sembrá lo que querés cosechar.',        '🌱 ROOT'),
  ('knight',      'GOGGINS CABALLERO', 'special',   85, 75, 86, 'Sin honor no hay descanso.',            '⚔ HONOR'),
  ('librarian',   'GOGGINS LIBRO',     'common',    32, 36, 50, 'Cada página es un kilómetro.',          '📚 QUIET'),
  ('lumberjack',  'GOGGINS LEÑADOR',   'rare',      78, 58, 72, 'Un golpe más. Siempre uno más.',        '🪓 SWING'),
  ('monk',        'GOGGINS MONJE',     'common',    50, 48, 58, 'La mente es el músculo.',               '☯ STILL'),
  ('ninja',       'GOGGINS NINJA',     'special',   80, 90, 80, 'No me ves. Estoy delante.',             '🥷 SHADOW'),
  ('painter',     'GOGGINS PINTOR',    'common',    36, 42, 46, 'Cada trazo cuenta.',                    '🎨 STROKE'),
  ('pirate',      'GOGGINS PIRATA',    'common',    56, 52, 54, 'El que no rema, no llega.',             '🏴 SAIL'),
  ('samurai',     'GOGGINS SAMURAI',   'legendary', 95, 92, 95, 'Camino recto. Filo recto.',             '⚔ BUSHIDO'),
  ('surfer',      'GOGGINS SURF',      'rare',      60, 74, 70, 'La ola no espera. Vos tampoco.',        '🌊 RIDE'),
  ('teacher',     'GOGGINS MAESTRO',   'common',    38, 42, 50, 'Repetí hasta que sea fácil.',           '✏ LESSON'),
  ('viking',      'GOGGINS VIKINGO',   'rare',      76, 60, 74, 'Sin hielo no hay forja.',               '🛡 NORSE'),
  ('wizard',      'GOGGINS MAGO',      'legendary', 88, 90, 100, 'La voluntad también es magia.',        '✨ ARCANE')
on conflict (name) do update set
  display_name = excluded.display_name,
  rarity       = excluded.rarity,
  strength     = excluded.strength,
  speed        = excluded.speed,
  stamina      = excluded.stamina,
  quote        = excluded.quote,
  badge        = excluded.badge;
