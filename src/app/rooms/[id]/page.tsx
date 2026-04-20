import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import CopyInviteButton from "./copy-invite-button";
import LeaveRoomButton from "./leave-room-button";
import RenameRoomForm from "./rename-room-form";
import WatchPartyScheduler from "./watch-party-scheduler";
import TelepathyViewer from "./telepathy-viewer";
import RoomCanvas from "./room-canvas";
import RoomAdminModal, { type AdminQuestion } from "./room-admin-modal";
import RoomActivityLog from "./room-activity-log";
import MatchQuestionForm from "./match-question-form";
import MatchQuestionVoter, { type VotableQuestion } from "./match-question-voter";

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch room
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select("id, name, invite_code, created_by, created_at, room_rules_locked")
    .eq("id", id)
    .single();

  if (roomError || !room) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Room not found</h2>
        <p className="text-sm text-ink/60">
          This room doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
    );
  }

  // Fetch members with profile info
  const { data: members } = await supabase
    .from("room_memberships")
    .select("user_id, role, joined_at, profiles(username, display_name, is_fortune_teller, is_prophet)")
    .eq("room_id", id)
    .order("joined_at", { ascending: true });

  const isOwner = room.created_by === user.id;

  const otherMembers = (members ?? [])
    .filter((m: any) => m.user_id !== user.id)
    .map((m: any) => ({
      userId: m.user_id as string,
      displayName: m.profiles?.display_name ?? null,
      username: m.profiles?.username ?? "Unknown",
    }));

  // Fetch prediction scores with joined prediction + match data for stats
  const memberIds = (members ?? []).map((m: any) => m.user_id as string);

  // Use admin client: prediction_scores inner-joins predictions, which has RLS
  // restricting to own rows — so the user session client would silently drop all
  // other members' scores.
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const adminClient = createAdminClient();

  const { data: scores } =
    memberIds.length > 0
      ? await adminClient
          .from("prediction_scores")
          .select(`
            user_id, base_points,
            predictions!inner(predicted_home_score_90, predicted_away_score_90),
            matches!inner(home_score_90, away_score_90)
          `)
          .in("user_id", memberIds)
      : { data: [] };

  // Fetch outlier bonuses for this room
  const { data: bonuses } = await supabase
    .from("room_prediction_bonuses")
    .select("user_id, bonus_points")
    .eq("room_id", id);

  // Fetch global + knockout prediction points for members
  const [{ data: globalPreds }, { data: knockoutPreds }] = memberIds.length > 0
    ? await Promise.all([
        adminClient.from("global_predictions").select("user_id, points_awarded").in("user_id", memberIds),
        adminClient
          .from("knockout_predictions")
          .select("user_id, points_awarded, predicted_home_score, predicted_away_score, knockout_slots!inner(home_score, away_score, winner_team_id, home_team_id)")
          .in("user_id", memberIds),
      ])
    : [{ data: [] }, { data: [] }];

  // Aggregate standings with per-user stats
  const standings = new Map<string, {
    exact: number;
    direction: number;
    wrong: number;
    pts: number;
    globalBonus: number;
    roomBonus: number;
  }>();
  for (const uid of memberIds) {
    standings.set(uid, { exact: 0, direction: 0, wrong: 0, pts: 0, globalBonus: 0, roomBonus: 0 });
  }
  for (const s of scores ?? []) {
    const entry = standings.get(s.user_id);
    if (!entry) continue;
    const pred = s.predictions as unknown as { predicted_home_score_90: number; predicted_away_score_90: number };
    const match = s.matches as unknown as { home_score_90: number | null; away_score_90: number | null };
    if (match.home_score_90 !== null && match.away_score_90 !== null) {
      const isExact =
        pred.predicted_home_score_90 === match.home_score_90 &&
        pred.predicted_away_score_90 === match.away_score_90;
      if (isExact) {
        entry.exact += 1;
      } else if (s.base_points > 0) {
        entry.direction += 1;
      } else {
        entry.wrong += 1;
      }
    }
    entry.pts += s.base_points;
  }
  for (const b of bonuses ?? []) {
    const entry = standings.get(b.user_id);
    if (entry) entry.roomBonus += b.bonus_points;
  }
  for (const g of globalPreds ?? []) {
    const entry = standings.get(g.user_id);
    if (entry) entry.globalBonus += g.points_awarded;
  }
  for (const k of knockoutPreds ?? []) {
    const entry = standings.get(k.user_id);
    if (!entry) continue;
    const slot = k.knockout_slots as unknown as {
      home_score: number | null;
      away_score: number | null;
      winner_team_id: string | null;
      home_team_id: string | null;
    };
    if (slot.home_score !== null && slot.away_score !== null && k.predicted_home_score != null && k.predicted_away_score != null) {
      const isExact = k.predicted_home_score === slot.home_score && k.predicted_away_score === slot.away_score;
      if (isExact) {
        entry.exact += 1;
      } else if (k.points_awarded > 0) {
        entry.direction += 1;
      } else {
        entry.wrong += 1;
      }
    }
    entry.pts += k.points_awarded;
  }

  const profileMap = new Map(
    (members ?? []).map((m: any) => [
      m.user_id,
      {
        username: m.profiles?.username ?? "Unknown",
        displayName: m.profiles?.display_name,
        role: m.role,
        isFortuneTeller: m.profiles?.is_fortune_teller ?? false,
        isProphet: m.profiles?.is_prophet ?? false,
      },
    ])
  );

  const sortedStandings = [...standings.entries()]
    .map(([userId, s]) => ({
      userId,
      ...profileMap.get(userId)!,
      exact: s.exact,
      direction: s.direction,
      wrong: s.wrong,
      pts: s.pts,
      globalBonus: s.globalBonus,
      roomBonus: s.roomBonus,
      total: s.pts + s.globalBonus + s.roomBonus,
    }))
    .sort((a, b) => b.total - a.total);

  // Fetch locked/finished match IDs first (the .or on a referenced table is unreliable)
  const { data: lockedMatchRows } = await supabase
    .from("matches")
    .select("id, is_locked, status, starts_at, home_score_90, away_score_90, home_team:teams!matches_home_team_id_fkey(name, flag_url), away_team:teams!matches_away_team_id_fkey(name, flag_url)")
    .or("is_locked.eq.true,status.eq.finished");

  const lockedMatchIds = lockedMatchRows?.map((m) => m.id) ?? [];

  // Fetch member predictions for those matches — reuse adminClient (bypasses RLS)
  const { data: telepathyPreds } = memberIds.length > 0 && lockedMatchIds.length > 0
    ? await adminClient
        .from("predictions")
        .select("user_id, predicted_home_score_90, predicted_away_score_90, match_id")
        .in("user_id", memberIds)
        .in("match_id", lockedMatchIds)
    : { data: [] };

  // Build a lookup map from match id → match row
  const lockedMatchById = new Map(
    (lockedMatchRows ?? []).map((m) => [m.id, m])
  );

  // Group by match
  const telepathyMatchMap = new Map<string, {
    matchId: string;
    label: string;
    roundLabel: string | null;
    homeName: string;
    awayName: string;
    startsAt: string;
    homeScore: number | null;
    awayScore: number | null;
    homeFlagUrl: string | null;
    awayFlagUrl: string | null;
    isLocked: boolean;
    predictions: { userId: string; username: string; displayName: string | null; home: number | null; away: number | null }[];
  }>();

  for (const p of telepathyPreds ?? []) {
    const m = lockedMatchById.get((p as any).match_id);
    if (!m) continue;
    const home = (m.home_team as any)?.name ?? "TBD";
    const away = (m.away_team as any)?.name ?? "TBD";
    const label = `${home} vs ${away}`;
    if (!telepathyMatchMap.has(m.id)) {
      telepathyMatchMap.set(m.id, {
        matchId: m.id,
        label,
        roundLabel: null,
        homeName: home,
        awayName: away,
        startsAt: m.starts_at,
        homeScore: m.home_score_90,
        awayScore: m.away_score_90,
        homeFlagUrl: (m.home_team as any)?.flag_url ?? null,
        awayFlagUrl: (m.away_team as any)?.flag_url ?? null,
        isLocked: true,
        predictions: [],
      });
    }
    const profile = profileMap.get(p.user_id);
    telepathyMatchMap.get(m.id)!.predictions.push({
      userId: p.user_id,
      username: profile?.username ?? "Unknown",
      displayName: profile?.displayName ?? null,
      home: p.predicted_home_score_90,
      away: p.predicted_away_score_90,
    });
  }

  // Fetch ALL knockout slots to build match pairs (each slot = one team position; pairs of adjacent positions = one match)
  const { data: allKnockoutSlotsRaw } = await supabase
    .from("knockout_slots")
    .select("id, round, side, position, slot_label, match_date, home_score, away_score, winner_team_id, home_team_id, home_team:teams!knockout_slots_home_team_id_fkey(name, flag_url), away_team:teams!knockout_slots_away_team_id_fkey(name, flag_url)")
    .order("round").order("side").order("position");

  const allKnockoutSlots = (allKnockoutSlotsRaw ?? []) as any[];

  // Build match pairs: group by round+side, pair i with i+1
  interface KOPair {
    slotAId: string;
    round: string;
    teamAName: string | null;
    teamBName: string | null;
    teamAFlagUrl: string | null;
    teamBFlagUrl: string | null;
    slotALabel: string | null;
    slotBLabel: string | null;
    matchDate: string | null;
    homeScore: number | null;
    awayScore: number | null;
    winnerTeamId: string | null;
  }

  const knockoutMatchPairs: KOPair[] = [];
  const slotGroups = new Map<string, any[]>();
  for (const s of allKnockoutSlots) {
    const key = `${s.round}:${s.side}`;
    if (!slotGroups.has(key)) slotGroups.set(key, []);
    slotGroups.get(key)!.push(s);
  }
  for (const [key, slots] of slotGroups) {
    // final and bronze are handled separately below
    if (key.startsWith("final:") || key.startsWith("bronze:")) continue;
    slots.sort((a: any, b: any) => a.position - b.position);
    for (let i = 0; i + 1 < slots.length; i += 2) {
      const a = slots[i], b = slots[i + 1];
      knockoutMatchPairs.push({
        slotAId: a.id,
        round: a.round,
        teamAName: a.home_team?.name ?? null,
        teamBName: b.home_team?.name ?? null,
        teamAFlagUrl: a.home_team?.flag_url ?? null,
        teamBFlagUrl: b.home_team?.flag_url ?? null,
        slotALabel: a.slot_label,
        slotBLabel: b.slot_label,
        matchDate: a.match_date,
        homeScore: a.home_score,
        awayScore: a.away_score,
        winnerTeamId: a.winner_team_id,
      });
    }
  }
  // Final: left pos 0 vs right pos 0
  const leftFinal = allKnockoutSlots.find((s: any) => s.round === "final" && s.side === "left" && s.position === 0);
  const rightFinal = allKnockoutSlots.find((s: any) => s.round === "final" && s.side === "right" && s.position === 0);
  if (leftFinal && rightFinal) {
    knockoutMatchPairs.push({
      slotAId: leftFinal.id, round: "final",
      teamAName: leftFinal.home_team?.name ?? null, teamBName: rightFinal.home_team?.name ?? null,
      teamAFlagUrl: leftFinal.home_team?.flag_url ?? null, teamBFlagUrl: rightFinal.home_team?.flag_url ?? null,
      slotALabel: leftFinal.slot_label, slotBLabel: rightFinal.slot_label,
      matchDate: leftFinal.match_date, homeScore: leftFinal.home_score,
      awayScore: leftFinal.away_score, winnerTeamId: leftFinal.winner_team_id,
    });
  }
  // Bronze: position 0 vs position 1
  const bronzeSlots = allKnockoutSlots.filter((s: any) => s.round === "bronze").sort((a: any, b: any) => a.position - b.position);
  if (bronzeSlots.length >= 2) {
    knockoutMatchPairs.push({
      slotAId: bronzeSlots[0].id, round: "bronze",
      teamAName: bronzeSlots[0].home_team?.name ?? null, teamBName: bronzeSlots[1].home_team?.name ?? null,
      teamAFlagUrl: bronzeSlots[0].home_team?.flag_url ?? null, teamBFlagUrl: bronzeSlots[1].home_team?.flag_url ?? null,
      slotALabel: bronzeSlots[0].slot_label, slotBLabel: bronzeSlots[1].slot_label,
      matchDate: bronzeSlots[0].match_date, homeScore: bronzeSlots[0].home_score,
      awayScore: bronzeSlots[0].away_score, winnerTeamId: bronzeSlots[0].winner_team_id,
    });
  }

  const roundLabel: Record<string, string> = {
    r32: "Round of 32", r16: "Round of 16", qf: "Quarter-Final",
    sf: "Semi-Final", final: "Final", bronze: "3rd Place",
  };

  // Telepathy: knockout pairs where teams are known (predictions stored on slotA)
  const lockedKnockoutPairs = knockoutMatchPairs.filter(p => p.teamAName && p.teamBName);
  const lockedKnockoutSlotAIds = lockedKnockoutPairs.map(p => p.slotAId);

  const { data: knockoutTelePreds } = memberIds.length > 0 && lockedKnockoutSlotAIds.length > 0
    ? await adminClient
        .from("knockout_predictions")
        .select("user_id, predicted_home_score, predicted_away_score, slot_id")
        .in("user_id", memberIds)
        .in("slot_id", lockedKnockoutSlotAIds)
    : { data: [] };

  const knockoutPairBySlotAId = new Map(lockedKnockoutPairs.map(p => [p.slotAId, p]));

  for (const p of knockoutTelePreds ?? []) {
    const pair = knockoutPairBySlotAId.get((p as any).slot_id);
    if (!pair) continue;
    const label = `${roundLabel[pair.round] ?? pair.round}: ${pair.teamAName} vs ${pair.teamBName}`;
    const key = `ko:${pair.slotAId}`;
    if (!telepathyMatchMap.has(key)) {
      telepathyMatchMap.set(key, {
        matchId: key,
        label,
        roundLabel: roundLabel[pair.round] ?? pair.round,
        homeName: pair.teamAName ?? "TBD",
        awayName: pair.teamBName ?? "TBD",
        startsAt: pair.matchDate ?? "9999",
        homeScore: pair.homeScore,
        awayScore: pair.awayScore,
        homeFlagUrl: pair.teamAFlagUrl,
        awayFlagUrl: pair.teamBFlagUrl,
        isLocked: true,
        predictions: [],
      });
    }
    const profile = profileMap.get(p.user_id);
    telepathyMatchMap.get(key)!.predictions.push({
      userId: p.user_id,
      username: profile?.username ?? "Unknown",
      displayName: profile?.displayName ?? null,
      home: (p as any).predicted_home_score ?? null,
      away: (p as any).predicted_away_score ?? null,
    });
  }

  // Add all upcoming (unlocked) group matches — show with ? in the viewer
  const { data: nextUnlockedRows } = await supabase
    .from("matches")
    .select("id, starts_at, home_score_90, away_score_90, home_team:teams!matches_home_team_id_fkey(name, flag_url), away_team:teams!matches_away_team_id_fkey(name, flag_url)")
    .eq("is_locked", false)
    .neq("status", "finished")
    .order("starts_at", { ascending: true });

  if (nextUnlockedRows && nextUnlockedRows.length > 0) {
    const allUpcomingIds = (nextUnlockedRows as any[]).map((m) => m.id);

    // Fetch predictions for all upcoming matches (bypasses RLS so we see all members)
    const { data: upcomingPreds } = memberIds.length > 0 && allUpcomingIds.length > 0
      ? await adminClient
          .from("predictions")
          .select("user_id, predicted_home_score_90, predicted_away_score_90, match_id")
          .in("user_id", memberIds)
          .in("match_id", allUpcomingIds)
      : { data: [] };

    for (const m of nextUnlockedRows as any[]) {
      const home = m.home_team?.name ?? "TBD";
      const away = m.away_team?.name ?? "TBD";
      telepathyMatchMap.set(m.id, {
        matchId: m.id,
        label: `${home} vs ${away}`,
        roundLabel: "Upcoming",
        homeName: home,
        awayName: away,
        startsAt: m.starts_at,
        homeScore: m.home_score_90,
        awayScore: m.away_score_90,
        homeFlagUrl: m.home_team?.flag_url ?? null,
        awayFlagUrl: m.away_team?.flag_url ?? null,
        isLocked: false,
        predictions: (upcomingPreds ?? [])
          .filter((p: any) => p.match_id === m.id)
          .map((p: any) => {
            const profile = profileMap.get(p.user_id);
            return {
              userId: p.user_id,
              username: profile?.username ?? "Unknown",
              displayName: profile?.displayName ?? null,
              home: p.predicted_home_score_90,
              away: p.predicted_away_score_90,
            };
          }),
      });
    }
  }

  // Fill in all roommates who didn't submit a prediction for each match
  for (const entry of telepathyMatchMap.values()) {
    // Deduplicate first (guard against duplicate rows from DB joins)
    const seen = new Map<string, typeof entry.predictions[0]>();
    for (const p of entry.predictions) seen.set(p.userId, p);
    entry.predictions = [...seen.values()];

    const submittedIds = new Set(entry.predictions.map((p) => p.userId));
    for (const uid of memberIds) {
      if (!submittedIds.has(uid)) {
        const profile = profileMap.get(uid);
        entry.predictions.push({
          userId: uid,
          username: profile?.username ?? "Unknown",
          displayName: profile?.displayName ?? null,
          home: null,
          away: null,
        });
      }
    }
  }

  const telepathyMatches = [...telepathyMatchMap.values()]
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

  // Fetch upcoming (non-finished) matches for watch party selector
  const { data: upcomingMatches } = await supabase
    .from("matches")
    .select(`
      id, starts_at, stage, group_name,
      home_team:teams!matches_home_team_id_fkey(name),
      away_team:teams!matches_away_team_id_fkey(name)
    `)
    .neq("status", "finished")
    .order("starts_at", { ascending: true });

  const stageLabel: Record<string, string> = {
    group: "Group", round_of_16: "Round of 16", quarter_final: "Quarter-Final",
    semi_final: "Semi-Final", third_place: "3rd Place", final: "Final",
  };

  const matchesForPicker = (upcomingMatches ?? []).map((m: any) => {
    const home = m.home_team?.name ?? null;
    const away = m.away_team?.name ?? null;
    const stage = stageLabel[m.stage] ?? m.stage;
    const prefix = m.group_name ? `Group ${m.group_name}` : stage;
    const label = home && away ? `${home} vs ${away} · ${prefix}` : `${prefix} · TBD vs TBD`;
    return {
      id: m.id as string,
      type: "match" as const,
      homeTeam: home ?? "TBD",
      awayTeam: away ?? "TBD",
      startsAt: m.starts_at as string,
      label,
    };
  });

  // Build knockout picker items from all pairs
  const knockoutPickerItems = knockoutMatchPairs
    .map(p => {
      const rl = roundLabel[p.round] ?? p.round;
      const teamLabel = p.teamAName && p.teamBName
        ? `${p.teamAName} vs ${p.teamBName}`
        : `${p.slotALabel || "TBD"} vs ${p.slotBLabel || "TBD"}`;
      return {
        id: p.slotAId,
        type: "knockout" as const,
        homeTeam: p.teamAName ?? "TBD",
        awayTeam: p.teamBName ?? "TBD",
        startsAt: p.matchDate ?? "",
        label: `${rl} · ${teamLabel}`,
      };
    });

  const allPickerItems = [...matchesForPicker, ...knockoutPickerItems]
    .sort((a, b) => {
      const ta = a.startsAt ? new Date(a.startsAt).getTime() : Infinity;
      const tb = b.startsAt ? new Date(b.startsAt).getTime() : Infinity;
      return ta - tb;
    });

  // Fetch existing watch party slots for this room
  const { data: watchPartyRows } = await supabase
    .from("room_watch_parties")
    .select("slot, match_id, knockout_slot_id, place, is_locked")
    .eq("room_id", id)
    .order("slot", { ascending: true });

  const savedSlots = (watchPartyRows ?? []).map((r: any) => ({
    slot: r.slot as number,
    matchId: r.match_id as string | null,
    knockoutSlotId: r.knockout_slot_id as string | null,
    place: r.place as string,
    isLocked: r.is_locked as boolean,
  }));

  // Fetch current user's peek token balance and revealed matches for this room
  const peekTokenRow = user
    ? await supabase
        .from("room_peek_tokens")
        .select("granted, used")
        .eq("room_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then((r) => r.data)
    : null;

  const { data: peekRevealRows } = user
    ? await supabase
        .from("room_peek_reveals")
        .select("match_id, knockout_slot_id")
        .eq("room_id", id)
        .eq("user_id", user.id)
    : { data: [] };

  const peekedMatchIds = new Set<string>(
    (peekRevealRows ?? []).map((r: any) => r.match_id ?? `ko:${r.knockout_slot_id}`)
  );

  const peekGranted = peekTokenRow?.granted ?? 0;
  // Derive used from actual reveal rows (same source of truth as usePeekToken action)
  const peekUsed = peekRevealRows?.length ?? 0;

  // Fetch current user's snipe token balance and reveals
  const snipeTokenRow = user
    ? await supabase
        .from("room_snipe_tokens")
        .select("granted, used")
        .eq("room_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
        .then((r) => r.data)
    : null;

  const { data: snipeRevealRows } = user
    ? await supabase
        .from("room_snipe_reveals")
        .select("match_id, knockout_slot_id, target_user_id")
        .eq("room_id", id)
        .eq("user_id", user.id)
    : { data: [] };

  // key: `${matchId ?? 'ko:'+knockoutSlotId}::${targetUserId}`
  const snipedTargetKeys = new Set<string>(
    (snipeRevealRows ?? []).map((r: any) => {
      const mid = r.match_id ?? `ko:${r.knockout_slot_id}`;
      return `${mid}::${r.target_user_id}`;
    })
  );

  const snipeGranted = snipeTokenRow?.granted ?? 0;
  // Derive used from actual reveal rows (same source of truth as useSnipeToken action)
  const snipeUsed = snipeRevealRows?.length ?? 0;

  // If owner, fetch all members' peek + snipe token rows for the management panel
  const { data: allPeekTokens } = isOwner
    ? await supabase
        .from("room_peek_tokens")
        .select("user_id, granted, used")
        .eq("room_id", id)
    : { data: [] };

  const peekTokenMap = new Map<string, { granted: number; used: number }>(
    (allPeekTokens ?? []).map((t: any) => [t.user_id, { granted: t.granted, used: t.used }])
  );

  const { data: allSnipeTokens } = isOwner
    ? await supabase
        .from("room_snipe_tokens")
        .select("user_id, granted, used")
        .eq("room_id", id)
    : { data: [] };

  const snipeTokenMap = new Map<string, { granted: number; used: number }>(
    (allSnipeTokens ?? []).map((t: any) => [t.user_id, { granted: t.granted, used: t.used }])
  );

  // Fetch first group match start time (for tournament-locked logic)
  const { data: firstGroupMatch } = await supabase
    .from("matches")
    .select("starts_at")
    .eq("stage", "group")
    .order("starts_at", { ascending: true })
    .limit(1)
    .single();
  const tournamentStarted = firstGroupMatch
    ? new Date(firstGroupMatch.starts_at) <= new Date()
    : false;

  // Next two upcoming matches for Section C panel
  const upcomingTwo = (nextUnlockedRows ?? []).slice(0, 2).map((m: any) => ({
    id: m.id as string,
    homeName: (m.home_team?.name ?? "TBD") as string,
    awayName: (m.away_team?.name ?? "TBD") as string,
    homeFlagUrl: (m.home_team?.flag_url ?? null) as string | null,
    awayFlagUrl: (m.away_team?.flag_url ?? null) as string | null,
    startsAt: (m.starts_at ?? null) as string | null,
    watchPlace: savedSlots.find(s => s.matchId === m.id && s.place)?.place ?? null,
  }));

  // Fetch shared canvas snapshot
  const { data: canvasRow } = await supabase
    .from("room_canvas")
    .select("data")
    .eq("room_id", id)
    .single();
  const canvasData = canvasRow?.data ?? "";

  // Fetch all room activity (peek + snipe reveals) for the activity log
  const [{ data: allPeekReveals }, { data: allSnipeReveals }] = await Promise.all([
    adminClient
      .from("room_peek_reveals")
      .select("id, user_id, match_id, knockout_slot_id, revealed_at")
      .eq("room_id", id)
      .order("revealed_at", { ascending: false })
      .limit(50),
    adminClient
      .from("room_snipe_reveals")
      .select("id, user_id, target_user_id, match_id, knockout_slot_id, revealed_at")
      .eq("room_id", id)
      .order("revealed_at", { ascending: false })
      .limit(50),
  ]);

  // Clean up old reveals beyond the 50 most recent per table (fire-and-forget)
  const peekIdsToKeep = (allPeekReveals ?? []).map((r: any) => r.id);
  const snipeIdsToKeep = (allSnipeReveals ?? []).map((r: any) => r.id);
  if (peekIdsToKeep.length === 50) {
    // There may be older rows — delete anything not in the top 50
    adminClient
      .from("room_peek_reveals")
      .delete()
      .eq("room_id", id)
      .not("id", "in", `(${peekIdsToKeep.map((i: string) => `"${i}"`).join(",")})`)
      .then(() => {});
  }
  if (snipeIdsToKeep.length === 50) {
    adminClient
      .from("room_snipe_reveals")
      .delete()
      .eq("room_id", id)
      .not("id", "in", `(${snipeIdsToKeep.map((i: string) => `"${i}"`).join(",")})`)
      .then(() => {});
  }

  interface ActivityEntry {
    id: string;
    type: "peek" | "snipe";
    username: string;
    displayName: string | null;
    targetUsername?: string;
    targetDisplayName?: string | null;
    matchLabel: string;
    timestamp: string;
  }

  const activityLog: ActivityEntry[] = [];

  for (const r of allPeekReveals ?? []) {
    const profile = profileMap.get((r as any).user_id);
    const mid = (r as any).match_id;
    const slotId = (r as any).knockout_slot_id;
    const key = mid ?? `ko:${slotId}`;
    const matchEntry = telepathyMatchMap.get(key);
    activityLog.push({
      id: (r as any).id,
      type: "peek",
      username: profile?.username ?? "Unknown",
      displayName: profile?.displayName ?? null,
      matchLabel: matchEntry?.label ?? "a match",
      timestamp: (r as any).revealed_at,
    });
  }

  for (const r of allSnipeReveals ?? []) {
    const profile = profileMap.get((r as any).user_id);
    const target = profileMap.get((r as any).target_user_id);
    const mid = (r as any).match_id;
    const slotId = (r as any).knockout_slot_id;
    const key = mid ?? `ko:${slotId}`;
    const matchEntry = telepathyMatchMap.get(key);
    activityLog.push({
      id: (r as any).id,
      type: "snipe",
      username: profile?.username ?? "Unknown",
      displayName: profile?.displayName ?? null,
      targetUsername: target?.username ?? "Unknown",
      targetDisplayName: target?.displayName ?? null,
      matchLabel: matchEntry?.label ?? "a match",
      timestamp: (r as any).revealed_at,
    });
  }

  activityLog.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Next 10 upcoming unlocked matches for the question submission form
  const questionMatches = (nextUnlockedRows ?? []).slice(0, 10).map((m: any) => ({
    id: m.id as string,
    homeName: (m.home_team?.name ?? "TBD") as string,
    awayName: (m.away_team?.name ?? "TBD") as string,
    homeFlagUrl: (m.home_team?.flag_url ?? null) as string | null,
    awayFlagUrl: (m.away_team?.flag_url ?? null) as string | null,
    startsAt: (m.starts_at ?? null) as string | null,
  }));

  // Fetch current user's submitted questions for this room
  const { data: myQuestions } = await supabase
    .from("match_questions")
    .select("id, match_id, question_text, option_a, option_b, status")
    .eq("room_id", id)
    .eq("submitted_by", user.id);

  const existingQuestions = (myQuestions ?? []).map((q: any) => ({
    id: q.id as string,
    matchId: q.match_id as string,
    questionText: q.question_text as string,
    optionA: q.option_a as string,
    optionB: q.option_b as string,
    status: q.status as "pending" | "approved" | "rejected",
  }));

  const pendingQuestionCount = existingQuestions.filter((q) => q.status === "pending").length;

  // For admin: fetch ALL questions in this room across all matches
  // Columns correct_answer + points added in migration 028 — fail safely if not yet run
  let allRoomQuestions: any[] = [];
  {
    const { data, error: aqErr } = await adminClient
      .from("match_questions")
      .select("id, match_id, submitted_by, question_text, option_a, option_b, status, correct_answer, points")
      .eq("room_id", id)
      .order("created_at", { ascending: true });
    if (!aqErr) allRoomQuestions = data ?? [];
    else {
      // Fallback without new columns (pre-028)
      const { data: fallback } = await adminClient
        .from("match_questions")
        .select("id, match_id, submitted_by, question_text, option_a, option_b, status")
        .eq("room_id", id)
        .order("created_at", { ascending: true });
      allRoomQuestions = fallback ?? [];
    }
  }

  // Fetch match details (name + lock status) for all referenced matches
  const questionMatchIds = [...new Set((allRoomQuestions ?? []).map((q: any) => q.match_id as string))];
  const { data: questionMatchRows } = questionMatchIds.length > 0
    ? await adminClient
        .from("matches")
        .select("id, is_locked, status, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name)")
        .in("id", questionMatchIds)
    : { data: [] };

  // Build approved-count-per-match map (for admin modal optimistic state)
  const approvedCountByMatch = new Map<string, number>();
  for (const q of allRoomQuestions ?? []) {
    if ((q as any).status === "approved") {
      const mid = (q as any).match_id as string;
      approvedCountByMatch.set(mid, (approvedCountByMatch.get(mid) ?? 0) + 1);
    }
  }

  // Build match label + lock maps
  const matchLabelMap = new Map(
    (questionMatchRows ?? []).map((m: any) => [
      m.id,
      `${m.home_team?.name ?? "TBD"} vs ${m.away_team?.name ?? "TBD"}`,
    ])
  );
  const matchLockedMap = new Map(
    (questionMatchRows ?? []).map((m: any) => [m.id, !!(m.is_locked || m.status === "finished")])
  );

  const adminQuestions: AdminQuestion[] = (allRoomQuestions ?? []).map((q: any) => {
    const mid = q.match_id as string;
    const profile = profileMap.get(q.submitted_by as string);
    return {
      id: q.id as string,
      matchId: mid,
      matchLabel: matchLabelMap.get(mid) ?? "Unknown Match",
      submitterName: profile?.displayName ?? profile?.username ?? "Unknown",
      questionText: q.question_text as string,
      optionA: q.option_a as string,
      optionB: q.option_b as string,
      correctAnswer: (q.correct_answer ?? null) as "a" | "b" | null,
      status: q.status as "pending" | "approved" | "rejected",
      points: (q.points ?? 1) as number,
      isMatchLocked: matchLockedMap.get(mid) ?? false,
      approvedCountForMatch: approvedCountByMatch.get(mid) ?? 0,
    };
  });

  // Approved questions per match_id → shown in Section C (upcoming/unlocked matches only)
  const upcomingMatchIds = new Set((nextUnlockedRows ?? []).map((m: any) => m.id as string));

  // Fetch current user's votes on approved questions
  // (table may not exist yet if migrations haven't run — fail safely)
  const approvedQuestionIds = adminQuestions
    .filter((q) => q.status === "approved" && upcomingMatchIds.has(q.matchId))
    .map((q) => q.id);
  let myVotes: { question_id: string; answer: string }[] = [];
  if (approvedQuestionIds.length > 0) {
    const { data, error: votesErr } = await supabase
      .from("match_question_votes")
      .select("question_id, answer")
      .eq("user_id", user.id)
      .eq("room_id", id)
      .in("question_id", approvedQuestionIds);
    if (!votesErr) myVotes = (data ?? []) as typeof myVotes;
  }
  const myVoteMap = new Map(myVotes.map((v) => [v.question_id, v.answer as "a" | "b"]));

  // Build votable questions per match
  const votableQuestionsByMatch = new Map<string, VotableQuestion[]>();
  for (const q of adminQuestions) {
    if (q.status === "approved" && upcomingMatchIds.has(q.matchId)) {
      if (!votableQuestionsByMatch.has(q.matchId)) votableQuestionsByMatch.set(q.matchId, []);
      votableQuestionsByMatch.get(q.matchId)!.push({
        id: q.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        points: q.points,
        myVote: myVoteMap.get(q.id) ?? null,
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Section A — full-width header */}
      <div className="rounded-lg border border-ink/10 bg-white p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{room.name}</h2>
            <p className="text-sm text-ink/40">
              {(members ?? []).length} member{(members ?? []).length !== 1 ? "s" : ""}
            </p>
            {isOwner && <RenameRoomForm roomId={room.id} currentName={room.name} />}
          </div>
          <div className="flex flex-col items-end gap-2">
            {isOwner && (
              <RoomAdminModal
                roomId={id}
                rulesLocked={room.room_rules_locked ?? false}
                tournamentStarted={tournamentStarted}
                peeksPerPlayer={peekTokenMap.size > 0 ? Math.max(...[...peekTokenMap.values()].map(t => t.granted)) : 0}
                snipesPerPlayer={snipeTokenMap.size > 0 ? Math.max(...[...snipeTokenMap.values()].map(t => t.granted)) : 0}
                members={(members ?? []).map((m: any) => ({ userId: m.user_id as string }))}
                allQuestions={adminQuestions}
              />
            )}
            <LeaveRoomButton roomId={room.id} isOwner={isOwner} otherMembers={otherMembers} />
          </div>
        </div>

        {/* Invite Code */}
        <div className="rounded-lg border border-ink/10 bg-ink/5 p-4">
          <p className="mb-1 text-xs font-medium text-ink/50">Invite Code</p>
          <div className="flex items-center gap-2">
            <code className="rounded bg-sand px-3 py-1 text-sm font-mono">
              {room.invite_code}
            </code>
            <CopyInviteButton code={room.invite_code} />
          </div>
          <p className="mt-2 text-xs text-ink/40">
            Share this code so friends can join your room.
          </p>
        </div>
      </div>

      {/* Sections B + C — two-column grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr]">

        {/* Section B — Standings */}
        <div className="rounded-lg border border-ink/10 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">Standings</h3>
          <div className="h-[400px] overflow-y-auto overflow-x-auto rounded-lg border border-ink/10">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-ink/10 bg-ink/5 text-left text-xs text-ink/50 uppercase">
                  <th className="w-8 px-3 py-2">#</th>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2 text-center" title="Exact score predictions">🎯</th>
                  <th className="px-3 py-2 text-center" title="Correct direction">✓</th>
                  <th className="px-3 py-2 text-center" title="Wrong direction">✗</th>
                  <th className="px-3 py-2 text-right">Pts</th>
                  <th className="px-3 py-2 text-right">Global Bonus</th>
                  <th className="px-3 py-2 text-right">Room Bonus</th>
                  <th className="px-3 py-2 text-right font-bold text-ink">Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedStandings.map((s, i) => (
                  <tr
                    key={s.userId}
                    className={`border-b border-ink/5 ${
                      i < 3 ? "bg-field/5 font-medium" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-ink/50">{i + 1}</td>
                    <td className="px-3 py-2">
                      {s.displayName || s.username}
                      {s.role === "owner" && (
                        <span className="ml-1 text-xs">👑</span>
                      )}
                      {s.isFortuneTeller && !s.isProphet && (
                        <span className="ml-1 text-xs" title="Fortune Teller: 3+ correct outcomes in a row">🔮</span>
                      )}
                      {s.isProphet && (
                        <span className="ml-1 text-xs" title="Prophet: 3+ exact scores in a row">🧙</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-field font-medium">{s.exact}</td>
                    <td className="px-3 py-2 text-center text-green-600">{s.direction}</td>
                    <td className="px-3 py-2 text-center text-red-400">{s.wrong}</td>
                    <td className="px-3 py-2 text-right">{s.pts}</td>
                    <td className="px-3 py-2 text-right text-field">
                      {s.globalBonus > 0 ? `+${s.globalBonus}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-clay">
                      {s.roomBonus > 0 ? `+${s.roomBonus}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {s.total}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section C — Upcoming Matches */}
        <div className="rounded-lg border border-ink/10 bg-white p-4 flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Upcoming Matches</h3>
          {upcomingTwo.length === 0 ? (
            <p className="text-sm text-ink/40">No upcoming matches scheduled.</p>
          ) : (
            upcomingTwo.map((m) => {
              const d = m.startsAt ? new Date(m.startsAt) : null;
              const timeStr = d
                ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " UTC"
                : "";
              const dateStr = d
                ? d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                : "";
              return (
                <div key={m.id} className="rounded-lg border border-ink/10 bg-ink/[0.03] overflow-hidden">
                  {/* Scoreboard bar */}
                  <div className="bg-ink text-white flex items-center px-4 py-3 gap-2">
                    {/* Home */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {m.homeFlagUrl && (
                        <img src={m.homeFlagUrl} alt={m.homeName} className="w-7 h-[18px] object-cover rounded-[2px] flex-shrink-0" />
                      )}
                      <span className="font-semibold text-sm truncate">{m.homeName}</span>
                      <span className="ml-1 rounded bg-white/15 px-2 py-0.5 text-xs font-bold tabular-nums">—</span>
                    </div>
                    {/* Time */}
                    <div className="flex-shrink-0 rounded bg-white/10 px-3 py-1 text-xs font-medium tracking-wide">
                      {timeStr}
                    </div>
                    {/* Away */}
                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="mr-1 rounded bg-white/15 px-2 py-0.5 text-xs font-bold tabular-nums">—</span>
                      <span className="font-semibold text-sm truncate text-right">{m.awayName}</span>
                      {m.awayFlagUrl && (
                        <img src={m.awayFlagUrl} alt={m.awayName} className="w-7 h-[18px] object-cover rounded-[2px] flex-shrink-0" />
                      )}
                    </div>
                  </div>
                  {/* Date + where to watch */}
                  <div className="px-4 py-3 space-y-1">
                    {dateStr && (
                      <p className="text-sm font-semibold" style={{ color: "#5a6e2c" }}>{dateStr}</p>
                    )}
                    <p className="text-xs text-ink/40">
                      {m.watchPlace ? m.watchPlace : "where to watch"}
                    </p>
                    {/* Approved questions for this match — users vote A or B */}
                    {(votableQuestionsByMatch.get(m.id) ?? []).length > 0 && (
                      <MatchQuestionVoter
                        roomId={id}
                        questions={votableQuestionsByMatch.get(m.id)!}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Sections D, e, F, G — lower row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">

        {/* Section D — Watch Party Scheduler (spans 2 cols) */}
        <div className="lg:col-span-2">
          <WatchPartyScheduler
            roomId={id}
            isOwner={isOwner}
            matches={allPickerItems}
            savedSlots={savedSlots}
          />
        </div>

        {/* Section e — Telepathy */}
        <TelepathyViewer
          matches={telepathyMatches}
          roomId={id}
          currentUserId={user.id}
          peekGranted={peekGranted}
          peekUsed={peekUsed}
          peekedMatchIds={peekedMatchIds}
          snipeGranted={snipeGranted}
          snipeUsed={snipeUsed}
          snipedTargetKeys={snipedTargetKeys}
        />

        {/* Section F — Token balances */}
        <div className="rounded-lg border border-ink/10 bg-white p-4">
          <h3 className="mb-3 text-sm font-semibold">Tokens</h3>
          <div className="flex gap-6 flex-wrap">
            <div className="flex flex-col items-center gap-1 flex-1 min-w-[100px]">
              <p className="text-xs text-ink/50 font-medium">👁️ Peeks</p>
              <p className="text-2xl font-bold">{peekGranted - peekUsed}</p>
              <p className="text-xs text-ink/40">remaining</p>
              {peekGranted > 0 && (
                <p className="text-xs text-ink/30">{peekUsed} / {peekGranted} used</p>
              )}
              {peekGranted === 0 && (
                <p className="text-xs text-ink/30 text-center">
                  {isOwner ? "Set via ⚙️ Room Admin." : "None granted yet."}
                </p>
              )}
            </div>
            <div className="flex flex-col items-center gap-1 flex-1 min-w-[100px]">
              <p className="text-xs text-ink/50 font-medium">🎯 Snipes</p>
              <p className="text-2xl font-bold">{snipeGranted - snipeUsed}</p>
              <p className="text-xs text-ink/40">remaining</p>
              {snipeGranted > 0 && (
                <p className="text-xs text-ink/30">{snipeUsed} / {snipeGranted} used</p>
              )}
              {snipeGranted === 0 && (
                <p className="text-xs text-ink/30 text-center">
                  {isOwner ? "Set via ⚙️ Room Admin." : "None granted yet."}
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Section G — Activity Log + Question Submission */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RoomActivityLog entries={activityLog} />
        <MatchQuestionForm
          roomId={id}
          matches={questionMatches}
          existingQuestions={existingQuestions}
          pendingCount={pendingQuestionCount}
        />
      </div>

      {/* Section H — Drawing Board (full width) */}
      <RoomCanvas roomId={id} initialData={canvasData} />

    </div>
  );
}
