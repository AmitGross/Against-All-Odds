-- ============================================
-- World Cup 2026 — Seed Data
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Create the tournament
INSERT INTO public.tournaments (name, year, is_active)
VALUES ('FIFA World Cup 2026', 2026, true);

-- 2. Insert all 48 teams (12 groups × 4)
INSERT INTO public.teams (code, name) VALUES
  -- Group A
  ('MEX', 'Mexico'),
  ('RSA', 'South Africa'),
  ('KOR', 'South Korea'),
  ('CZE', 'Czech Republic'),
  -- Group B
  ('CAN', 'Canada'),
  ('BIH', 'Bosnia and Herzegovina'),
  ('QAT', 'Qatar'),
  ('SUI', 'Switzerland'),
  -- Group C
  ('BRA', 'Brazil'),
  ('MAR', 'Morocco'),
  ('HAI', 'Haiti'),
  ('SCO', 'Scotland'),
  -- Group D
  ('USA', 'United States'),
  ('PAR', 'Paraguay'),
  ('AUS', 'Australia'),
  ('TUR', 'Turkey'),
  -- Group E
  ('GER', 'Germany'),
  ('CUW', 'Curaçao'),
  ('CIV', 'Ivory Coast'),
  ('ECU', 'Ecuador'),
  -- Group F
  ('NED', 'Netherlands'),
  ('JPN', 'Japan'),
  ('SWE', 'Sweden'),
  ('TUN', 'Tunisia'),
  -- Group G
  ('BEL', 'Belgium'),
  ('EGY', 'Egypt'),
  ('IRN', 'Iran'),
  ('NZL', 'New Zealand'),
  -- Group H
  ('ESP', 'Spain'),
  ('CPV', 'Cape Verde'),
  ('KSA', 'Saudi Arabia'),
  ('URU', 'Uruguay'),
  -- Group I
  ('FRA', 'France'),
  ('SEN', 'Senegal'),
  ('IRQ', 'Iraq'),
  ('NOR', 'Norway'),
  -- Group J
  ('ARG', 'Argentina'),
  ('ALG', 'Algeria'),
  ('AUT', 'Austria'),
  ('JOR', 'Jordan'),
  -- Group K
  ('POR', 'Portugal'),
  ('COD', 'DR Congo'),
  ('UZB', 'Uzbekistan'),
  ('COL', 'Colombia'),
  -- Group L
  ('ENG', 'England'),
  ('CRO', 'Croatia'),
  ('GHA', 'Ghana'),
  ('PAN', 'Panama');

-- 3. Insert all 72 group stage matches
-- Pattern per group — MD1: 1v2, 3v4 | MD2: 1v3, 4v2 | MD3: 4v1, 2v3
-- Positions: 1=Pot1 seed, 2=second listed, 3=third listed, 4=fourth listed
-- All kickoff times in UTC

WITH t AS (
  SELECT id, code FROM public.teams
),
tourn AS (
  SELECT id FROM public.tournaments WHERE name = 'FIFA World Cup 2026' AND year = 2026
)
INSERT INTO public.matches (tournament_id, stage, group_name, home_team_id, away_team_id, starts_at)
SELECT
  tourn.id, 'group', v.grp,
  home.id, away.id, v.kickoff::timestamptz
FROM (VALUES
  -- ======== GROUP A: Mexico, South Africa, South Korea, Czech Republic ========
  -- MD1 — June 11
  ('A', 'MEX', 'RSA', '2026-06-11 19:00:00+00'),
  ('A', 'KOR', 'CZE', '2026-06-12 02:00:00+00'),
  -- MD2 — June 18
  ('A', 'MEX', 'KOR', '2026-06-19 01:00:00+00'),
  ('A', 'CZE', 'RSA', '2026-06-18 16:00:00+00'),
  -- MD3 — June 24
  ('A', 'CZE', 'MEX', '2026-06-25 01:00:00+00'),
  ('A', 'RSA', 'KOR', '2026-06-25 01:00:00+00'),

  -- ======== GROUP B: Canada, Bosnia and Herzegovina, Qatar, Switzerland ========
  -- MD1 — June 12–13
  ('B', 'CAN', 'BIH', '2026-06-12 19:00:00+00'),
  ('B', 'QAT', 'SUI', '2026-06-13 19:00:00+00'),
  -- MD2 — June 18
  ('B', 'CAN', 'QAT', '2026-06-18 23:00:00+00'),
  ('B', 'SUI', 'BIH', '2026-06-18 19:00:00+00'),
  -- MD3 — June 24
  ('B', 'SUI', 'CAN', '2026-06-24 19:00:00+00'),
  ('B', 'BIH', 'QAT', '2026-06-24 19:00:00+00'),

  -- ======== GROUP C: Brazil, Morocco, Haiti, Scotland ========
  -- MD1 — June 13
  ('C', 'BRA', 'MAR', '2026-06-13 22:00:00+00'),
  ('C', 'HAI', 'SCO', '2026-06-13 17:00:00+00'),
  -- MD2 — June 19
  ('C', 'BRA', 'HAI', '2026-06-20 00:30:00+00'),
  ('C', 'SCO', 'MAR', '2026-06-19 16:00:00+00'),
  -- MD3 — June 24
  ('C', 'SCO', 'BRA', '2026-06-24 22:00:00+00'),
  ('C', 'MAR', 'HAI', '2026-06-24 22:00:00+00'),

  -- ======== GROUP D: United States, Paraguay, Australia, Turkey ========
  -- MD1 — June 12–13
  ('D', 'USA', 'PAR', '2026-06-13 01:00:00+00'),
  ('D', 'AUS', 'TUR', '2026-06-13 23:00:00+00'),
  -- MD2 — June 19
  ('D', 'USA', 'AUS', '2026-06-20 03:00:00+00'),
  ('D', 'TUR', 'PAR', '2026-06-19 20:00:00+00'),
  -- MD3 — June 25
  ('D', 'TUR', 'USA', '2026-06-26 02:00:00+00'),
  ('D', 'PAR', 'AUS', '2026-06-26 02:00:00+00'),

  -- ======== GROUP E: Germany, Curaçao, Ivory Coast, Ecuador ========
  -- MD1 — June 14
  ('E', 'GER', 'CUW', '2026-06-14 17:00:00+00'),
  ('E', 'CIV', 'ECU', '2026-06-14 20:00:00+00'),
  -- MD2 — June 20
  ('E', 'GER', 'CIV', '2026-06-20 20:00:00+00'),
  ('E', 'ECU', 'CUW', '2026-06-21 00:00:00+00'),
  -- MD3 — June 25
  ('E', 'ECU', 'GER', '2026-06-25 20:00:00+00'),
  ('E', 'CUW', 'CIV', '2026-06-25 20:00:00+00'),

  -- ======== GROUP F: Netherlands, Japan, Sweden, Tunisia ========
  -- MD1 — June 14
  ('F', 'NED', 'JPN', '2026-06-14 20:00:00+00'),
  ('F', 'SWE', 'TUN', '2026-06-14 23:00:00+00'),
  -- MD2 — June 20
  ('F', 'NED', 'SWE', '2026-06-20 23:00:00+00'),
  ('F', 'TUN', 'JPN', '2026-06-21 04:00:00+00'),
  -- MD3 — June 25
  ('F', 'TUN', 'NED', '2026-06-25 23:00:00+00'),
  ('F', 'JPN', 'SWE', '2026-06-25 23:00:00+00'),

  -- ======== GROUP G: Belgium, Egypt, Iran, New Zealand ========
  -- MD1 — June 15
  ('G', 'BEL', 'EGY', '2026-06-15 19:00:00+00'),
  ('G', 'IRN', 'NZL', '2026-06-15 22:00:00+00'),
  -- MD2 — June 21
  ('G', 'BEL', 'IRN', '2026-06-21 19:00:00+00'),
  ('G', 'NZL', 'EGY', '2026-06-22 01:00:00+00'),
  -- MD3 — June 26
  ('G', 'NZL', 'BEL', '2026-06-27 03:00:00+00'),
  ('G', 'EGY', 'IRN', '2026-06-27 03:00:00+00'),

  -- ======== GROUP H: Spain, Cape Verde, Saudi Arabia, Uruguay ========
  -- MD1 — June 15
  ('H', 'ESP', 'CPV', '2026-06-15 16:00:00+00'),
  ('H', 'KSA', 'URU', '2026-06-15 22:00:00+00'),
  -- MD2 — June 21
  ('H', 'ESP', 'KSA', '2026-06-21 16:00:00+00'),
  ('H', 'URU', 'CPV', '2026-06-21 22:00:00+00'),
  -- MD3 — June 26
  ('H', 'URU', 'ESP', '2026-06-27 00:00:00+00'),
  ('H', 'CPV', 'KSA', '2026-06-27 00:00:00+00'),

  -- ======== GROUP I: France, Senegal, Iraq, Norway ========
  -- MD1 — June 16
  ('I', 'FRA', 'SEN', '2026-06-16 19:00:00+00'),
  ('I', 'IRQ', 'NOR', '2026-06-16 22:00:00+00'),
  -- MD2 — June 22
  ('I', 'FRA', 'IRQ', '2026-06-22 17:00:00+00'),
  ('I', 'NOR', 'SEN', '2026-06-22 20:00:00+00'),
  -- MD3 — June 26
  ('I', 'NOR', 'FRA', '2026-06-26 19:00:00+00'),
  ('I', 'SEN', 'IRQ', '2026-06-26 19:00:00+00'),

  -- ======== GROUP J: Argentina, Algeria, Austria, Jordan ========
  -- MD1 — June 16
  ('J', 'ARG', 'ALG', '2026-06-17 01:00:00+00'),
  ('J', 'AUT', 'JOR', '2026-06-17 04:00:00+00'),
  -- MD2 — June 22
  ('J', 'ARG', 'AUT', '2026-06-22 17:00:00+00'),
  ('J', 'JOR', 'ALG', '2026-06-23 03:00:00+00'),
  -- MD3 — June 27
  ('J', 'JOR', 'ARG', '2026-06-28 02:00:00+00'),
  ('J', 'ALG', 'AUT', '2026-06-28 02:00:00+00'),

  -- ======== GROUP K: Portugal, DR Congo, Uzbekistan, Colombia ========
  -- MD1 — June 17
  ('K', 'POR', 'COD', '2026-06-17 17:00:00+00'),
  ('K', 'UZB', 'COL', '2026-06-17 20:00:00+00'),
  -- MD2 — June 23
  ('K', 'POR', 'UZB', '2026-06-23 17:00:00+00'),
  ('K', 'COL', 'COD', '2026-06-23 20:00:00+00'),
  -- MD3 — June 27
  ('K', 'COL', 'POR', '2026-06-27 23:30:00+00'),
  ('K', 'COD', 'UZB', '2026-06-27 23:30:00+00'),

  -- ======== GROUP L: England, Croatia, Ghana, Panama ========
  -- MD1 — June 17
  ('L', 'ENG', 'CRO', '2026-06-17 20:00:00+00'),
  ('L', 'GHA', 'PAN', '2026-06-17 23:00:00+00'),
  -- MD2 — June 23
  ('L', 'ENG', 'GHA', '2026-06-23 20:00:00+00'),
  ('L', 'PAN', 'CRO', '2026-06-23 23:00:00+00'),
  -- MD3 — June 27
  ('L', 'PAN', 'ENG', '2026-06-27 21:00:00+00'),
  ('L', 'CRO', 'GHA', '2026-06-27 21:00:00+00')

) AS v(grp, home_code, away_code, kickoff)
JOIN t home ON home.code = v.home_code
JOIN t away ON away.code = v.away_code
CROSS JOIN tourn;
