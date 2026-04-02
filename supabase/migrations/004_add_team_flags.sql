-- ============================================
-- Migration: Add flag URLs to teams
-- ============================================
-- This migration updates the flag_url for each team using flagcdn.com
-- Run this in the Supabase SQL Editor or as a migration

-- Example: UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/{country_code}.png' WHERE code = '{country_code}';

-- Group A
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/mx.png' WHERE code = 'MEX';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/za.png' WHERE code = 'RSA';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/kr.png' WHERE code = 'KOR';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/cz.png' WHERE code = 'CZE';
-- Group B
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/ca.png' WHERE code = 'CAN';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/ba.png' WHERE code = 'BIH';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/qa.png' WHERE code = 'QAT';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/ch.png' WHERE code = 'SUI';
-- Group C
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/br.png' WHERE code = 'BRA';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/ma.png' WHERE code = 'MAR';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/ht.png' WHERE code = 'HAI';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/gb-sct.png' WHERE code = 'SCO';
-- Group D
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/us.png' WHERE code = 'USA';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/py.png' WHERE code = 'PAR';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/au.png' WHERE code = 'AUS';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/tr.png' WHERE code = 'TUR';
-- Group E
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/de.png' WHERE code = 'GER';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/cw.png' WHERE code = 'CUW';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/ci.png' WHERE code = 'CIV';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/ec.png' WHERE code = 'ECU';
-- Group F
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/nl.png' WHERE code = 'NED';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/jp.png' WHERE code = 'JPN';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/se.png' WHERE code = 'SWE';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/tn.png' WHERE code = 'TUN';
-- Group G
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/be.png' WHERE code = 'BEL';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/eg.png' WHERE code = 'EGY';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/ir.png' WHERE code = 'IRN';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/nz.png' WHERE code = 'NZL';
-- Group H
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/es.png' WHERE code = 'ESP';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/cv.png' WHERE code = 'CPV';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/sa.png' WHERE code = 'KSA';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/uy.png' WHERE code = 'URU';
-- Group I
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/fr.png' WHERE code = 'FRA';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/sn.png' WHERE code = 'SEN';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/iq.png' WHERE code = 'IRQ';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/no.png' WHERE code = 'NOR';
-- Group J
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/ar.png' WHERE code = 'ARG';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/dz.png' WHERE code = 'ALG';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/at.png' WHERE code = 'AUT';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/jo.png' WHERE code = 'JOR';
-- Group K
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/pt.png' WHERE code = 'POR';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/cd.png' WHERE code = 'COD';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/uz.png' WHERE code = 'UZB';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/co.png' WHERE code = 'COL';
-- Group L
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/gb-eng.png' WHERE code = 'ENG';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/hr.png' WHERE code = 'CRO';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/gh.png' WHERE code = 'GHA';
UPDATE public.teams SET flag_url = 'https://flagcdn.com/w40/pa.png' WHERE code = 'PAN';
