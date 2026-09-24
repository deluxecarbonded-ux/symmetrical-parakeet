import { useCallback, useEffect, useRef, useState } from "react";
import { getPuzzle } from "../data/puzzles";
import { translate } from "../i18n/translations";
import { formatPuzzleAnswer } from "./numerals";
import {
  invokeMultiplayerAction,
  isSupabaseConfigured,
  supabase,
} from "./supabase";

const ROOM_MODES = new Set([
  "lobby",
  "playing",
  "round_won",
  "finished",
  "cancelled",
]);
const ROOM_CATEGORIES = new Set([
  "Math",
  "Logic",
  "Riddle",
  "Science",
  "Trivia",
]);
const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function timestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  const result = new Date(value).getTime();
  return Number.isFinite(result) ? result : null;
}

function asRows(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

function isUuid(value) {
  return UUID_PATTERN.test(String(value || ""));
}

function normalizeRoomCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeDifficulty(value, fallback) {
  return DIFFICULTIES.has(value) ? value : fallback;
}

function normalizeLevel(value, fallback) {
  const level = Math.trunc(finiteNumber(value, fallback));
  return level >= 1 && level <= 30 ? level : fallback;
}

function deterministicDifficulty(roundNumber) {
  const round = ((Math.trunc(finiteNumber(roundNumber)) % 3) + 3) % 3;
  if (round === 0) return "easy";
  if (round === 1) return "medium";
  return "hard";
}

function deterministicLevel(roundNumber) {
  const round = Math.max(0, Math.trunc(finiteNumber(roundNumber)));
  return (round % 30) + 1;
}

function nestedPuzzle(row) {
  const value = row?.puzzle || row?.content_puzzles || row?.contentPuzzle;
  return Array.isArray(value) ? value[0] : value;
}

function roundRowNumber(row) {
  return Math.trunc(
    finiteNumber(row?.round_number ?? row?.roundNumber ?? row?.number, 0),
  );
}

function roundPuzzleId(row) {
  return row?.puzzle_id || row?.puzzleId || nestedPuzzle(row)?.id || null;
}

function mapRoundRows(roundRows, puzzleRows) {
  const puzzleById = new Map(
    asRows(puzzleRows)
      .filter((row) => row?.id)
      .map((row) => [String(row.id), row]),
  );

  return asRows(roundRows)
    .map((row) => {
      const puzzle =
        puzzleById.get(String(roundPuzzleId(row))) || nestedPuzzle(row) || {};
      const number = roundRowNumber(row);
      const difficulty = normalizeDifficulty(
        puzzle.difficulty,
        deterministicDifficulty(number),
      );
      const level = normalizeLevel(puzzle.level, deterministicLevel(number));

      return {
        number,
        category: row?.category || puzzle.category || null,
        puzzleId: roundPuzzleId(row),
        difficulty,
        level,
        answerType: puzzle.answer_type || puzzle.answerType || null,
        answerKey: puzzle.answer_key || puzzle.answerKey || null,
        points: finiteNumber(puzzle.points, 0) || null,
        startedAt: timestamp(row?.started_at ?? row?.startedAt),
        winnerId:
          row?.winner_profile_id ||
          row?.winnerProfileId ||
          row?.winnerProfileID ||
          row?.winnerId ||
          null,
      };
    })
    .sort((a, b) => a.number - b.number);
}

function mapRoomRows({
  roomRow,
  playerRows,
  roundRows,
  puzzleRows,
  fallbackName = "Player",
}) {
  const players = asRows(playerRows)
    .map((row) => ({
      id: String(row?.profile_id || row?.profileId || row?.id || ""),
      profileId: String(row?.profile_id || row?.profileId || row?.id || ""),
      username: String(
        row?.username || row?.user_name || row?.display_name || row?.displayName || fallbackName,
      ),
      name: String(
        row?.username || row?.user_name || row?.display_name || row?.displayName || fallbackName,
      ),
      ready: Boolean(row?.ready),
      score: finiteNumber(row?.score, 0),
      codes: finiteNumber(row?.codes_cracked ?? row?.codesCracked, 0),
      avatar_url: row?.avatar_url || row?.avatarUrl || null,
      avatar_bucket: row?.avatar_bucket || row?.avatarBucket || null,
      avatar_media_type: row?.avatar_media_type || row?.avatarMediaType || null,
      joinedAt: row?.joined_at || row?.joinedAt || null,
    }))
    .filter((player) => player.id)
    .sort((a, b) => {
      const aTime = new Date(a.joinedAt || 0).getTime();
      const bTime = new Date(b.joinedAt || 0).getTime();
      if (aTime === bTime) return a.id.localeCompare(b.id);
      return aTime - bTime;
    });

  const rounds = mapRoundRows(roundRows, puzzleRows);
  const currentRound = Math.trunc(
    finiteNumber(roomRow?.current_round ?? roomRow?.currentRound, 0),
  );
  const currentRoundRow = rounds.find((row) => row.number === currentRound);
  const scores = Object.fromEntries(
    players.map((player) => [player.id, player.score]),
  );
  const winners = Object.fromEntries(
    rounds
      .filter((round) => round.winnerId)
      .map((round) => [String(round.number), round.winnerId]),
  );
  const hostId = roomRow?.host_profile_id || roomRow?.hostProfileId;
  const host = players.find(
    (player) => String(player.id) === String(hostId || ""),
  );
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreDifference = (b.score || 0) - (a.score || 0);
    if (scoreDifference) return scoreDifference;
    const aTime = new Date(a.joinedAt || 0).getTime();
    const bTime = new Date(b.joinedAt || 0).getTime();
    return aTime - bTime;
  });
  const explicitWinnerId =
    roomRow?.winner_profile_id ||
    roomRow?.winnerProfileId ||
    roomRow?.winner_id;
  const winnerId =
    explicitWinnerId ||
    (roomRow?.status === "finished"
      ? currentRoundRow?.winnerId || sortedPlayers[0]?.id || null
      : null);
  const status = ROOM_MODES.has(roomRow?.status) ? roomRow.status : "lobby";
  const category = roomRow?.category || "random";
  const mode =
    roomRow?.mode === "time_attack" || roomRow?.mode === "timeAttack"
      ? "timeAttack"
      : "first";
  const roundsCount = Math.min(
    30,
    Math.max(1, Math.trunc(finiteNumber(roomRow?.rounds, 5))),
  );

  return {
    id: roomRow?.id,
    code: normalizeRoomCode(roomRow?.code),
    hostId: roomRow?.host_profile_id || roomRow?.hostProfileId || null,
    hostName: host?.name || "",
    players,
    settings: {
      mode,
      rounds: roundsCount,
      category: category === "All" ? "random" : category,
    },
    status,
    round: currentRound,
    scores,
    winners,
    rounds,
    roundRows: rounds,
    roundWinner:
      currentRoundRow?.winnerId || (status === "finished" ? winnerId : null),
    winnerId,
    startedAt: timestamp(roomRow?.started_at ?? roomRow?.startedAt),
    deadline: timestamp(roomRow?.deadline_at ?? roomRow?.deadlineAt),
    createdAt: roomRow?.created_at || roomRow?.createdAt || null,
    attempts: {},
  };
}

function unwrapRoomRow(value) {
  let result = value;
  if (typeof result === "string") {
    try {
      result = JSON.parse(result);
    } catch {
      return null;
    }
  }
  result = result?.room ?? result;
  if (result?.room && !result.id) result = result.room;
  return Array.isArray(result) ? result[0] : result;
}

function assertActionResult(result) {
  if (result?.error) {
    const error = result.error;
    throw error instanceof Error
      ? error
      : new Error(error.message || String(error));
  }
  return result;
}

function actionErrorKey(error) {
  const message = String(error?.message || error || "").toLowerCase();
  if (message.includes("full")) return "multi.full";
  if (
    message.includes("auth") ||
    message.includes("sign in") ||
    message.includes("signin") ||
    message.includes("login") ||
    message.includes("token") ||
    message.includes("unauthenticated")
  ) {
    return "toast.needSignIn";
  }
  return "toast.syncUnavailable";
}

export function useMultiplayerRoom({
  profile,
  defaultName = "Player",
  locale = "en",
  onRoundWin,
  onMatchWin,
  showToast,
}) {
  const [room, setRoom] = useState(null);
  const [connection, setConnection] = useState("offline");
  const roomRef = useRef(null);
  const ignoredRoomIdRef = useRef(null);
  const previousRoomRef = useRef(null);
  const notifiedRoundsRef = useRef(new Set());
  const notifiedMatchesRef = useRef(new Set());
  const profileId = profile?.id ? String(profile.id) : null;
  const canUseRemote = Boolean(isSupabaseConfigured && supabase && profileId);

  const clearRoom = useCallback(() => {
    roomRef.current = null;
    setRoom(null);
  }, []);

  const applyRoom = useCallback((nextRoom, expectedId) => {
    if (
      expectedId &&
      String(roomRef.current?.id || "") !== String(expectedId)
    ) {
      return false;
    }
    roomRef.current = nextRoom;
    setRoom(nextRoom);
    return true;
  }, []);

  const getAuthenticatedUser = useCallback(
    async (notify = false) => {
      if (!canUseRemote) {
        if (notify) showToast?.("toast.needSignIn");
        return null;
      }
      try {
        let user = null;
        if (typeof supabase.auth?.getUser === "function") {
          const result = await supabase.auth.getUser();
          if (result?.error) throw result.error;
          user = result?.data?.user || null;
        } else if (typeof supabase.auth?.getSession === "function") {
          const result = await supabase.auth.getSession();
          if (result?.error) throw result.error;
          user = result?.data?.session?.user || null;
        }
        if (!user || String(user.id) !== profileId) {
          if (notify) showToast?.("toast.needSignIn");
          return null;
        }
        return user;
      } catch (error) {
        if (notify) showToast?.(actionErrorKey(error));
        return null;
      }
    },
    [canUseRemote, profileId, showToast],
  );

  const notifyError = useCallback(
    (error) => showToast?.(actionErrorKey(error)),
    [showToast],
  );

  const loadRoom = useCallback(
    async (target, authenticatedUser = null, targetKind = null) => {
      if (!target || !canUseRemote) return null;
      const user = authenticatedUser || (await getAuthenticatedUser(false));
      if (!user) return null;

      const rawTarget = String(target).trim();
      if (!rawTarget) return null;
      const queryByCode =
        targetKind === "code" ||
        (targetKind !== "id" &&
          /^[A-Z0-9]{6}$/.test(rawTarget.toUpperCase()) &&
          !isUuid(rawTarget));
      const roomRequest = queryByCode
        ? supabase
            .from("multiplayer_rooms")
            .select("*")
            .eq("code", rawTarget.toUpperCase())
            .maybeSingle()
        : supabase
            .from("multiplayer_rooms")
            .select("*")
            .eq("id", rawTarget)
            .maybeSingle();
      const roomResult = await roomRequest;
      if (roomResult?.error) throw roomResult.error;
      const roomRow = Array.isArray(roomResult?.data)
        ? roomResult.data[0]
        : roomResult?.data;
      if (!roomRow?.id) return null;

      // The room RPC projects only safe puzzle metadata and never exposes
      // answer_code/answer_key. This also keeps room loading compatible with
      // the column-level answer protections in the database.
      const { data: snapshot, error: snapshotError } = await supabase.rpc(
        "get_multiplayer_room_state",
        { p_room_id: roomRow.id },
      );
      if (snapshotError) throw snapshotError;
      if (!snapshot?.room?.id) return null;

      return mapRoomRows({
        roomRow: snapshot.room,
        playerRows: snapshot.players,
        roundRows: snapshot.round ? [snapshot.round] : [],
        puzzleRows: [],
        fallbackName: profile?.username || profile?.displayName || defaultName,
      });
    },
    [
      canUseRemote,
      defaultName,
      getAuthenticatedUser,
      profile?.displayName,
      profile?.username,
    ],
  );

  const refreshRoom = useCallback(
    async (roomId) => {
      const targetId = roomId || roomRef.current?.id;
      if (!targetId || !canUseRemote) return null;
      try {
        const nextRoom = await loadRoom(targetId);
        if (nextRoom) {
          if (String(roomRef.current?.id || "") !== String(targetId)) {
            return null;
          }
          applyRoom(nextRoom, targetId);
        } else if (String(roomRef.current?.id || "") === String(targetId)) {
          clearRoom();
          setConnection("offline");
        }
        return nextRoom;
      } catch {
        setConnection("offline");
        return null;
      }
    },
    [applyRoom, canUseRemote, clearRoom, loadRoom],
  );

  const hydrateLatestRoom = useCallback(async () => {
    if (!canUseRemote) return null;
    const user = await getAuthenticatedUser(false);
    if (!user) return null;

    const membershipResult = await supabase
      .from("multiplayer_players")
      .select("room_id,joined_at")
      .eq("profile_id", user.id)
      .order("joined_at", { ascending: false })
      .limit(20);
    if (membershipResult?.error) throw membershipResult.error;

    const memberships = asRows(membershipResult?.data);
    let selected = null;
    let selectedRank = Number.POSITIVE_INFINITY;
    for (const membership of memberships) {
      if (
        ignoredRoomIdRef.current &&
        String(membership.room_id) === String(ignoredRoomIdRef.current)
      ) {
        continue;
      }
      const candidate = await loadRoom(membership.room_id, user, "id");
      if (!candidate) continue;
      const rank = ["lobby", "playing", "round_won"].includes(candidate.status)
        ? 0
        : 1;
      if (rank < selectedRank) {
        selected = candidate;
        selectedRank = rank;
      }
      if (rank === 0) break;
    }
    return selected;
  }, [canUseRemote, getAuthenticatedUser, loadRoom]);

  useEffect(() => {
    ignoredRoomIdRef.current = null;
    previousRoomRef.current = null;
    notifiedRoundsRef.current.clear();
    notifiedMatchesRef.current.clear();
  }, [profileId]);

  useEffect(() => {
    let cancelled = false;
    if (!canUseRemote) {
      clearRoom();
      previousRoomRef.current = null;
      setConnection("offline");
      return undefined;
    }

    setConnection("connecting");
    hydrateLatestRoom()
      .then((nextRoom) => {
        if (cancelled) return;
        if (nextRoom) {
          applyRoom(nextRoom);
        } else {
          clearRoom();
          setConnection("offline");
        }
      })
      .catch(() => {
        if (cancelled) return;
        clearRoom();
        setConnection("offline");
      });

    return () => {
      cancelled = true;
    };
  }, [applyRoom, canUseRemote, clearRoom, hydrateLatestRoom]);

  useEffect(() => {
    if (!canUseRemote || !supabase || !room?.id) return undefined;
    let disposed = false;
    let refreshTimer = null;
    const scheduleRefresh = () => {
      if (disposed) return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (!disposed) void refreshRoom(room.id);
      }, 50);
    };
    const channel = supabase
      .channel(`exotic-room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "multiplayer_rooms",
          filter: `id=eq.${room.id}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "multiplayer_players",
          filter: `room_id=eq.${room.id}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "multiplayer_rounds",
          filter: `room_id=eq.${room.id}`,
        },
        scheduleRefresh,
      )
      .subscribe((status) => {
        if (disposed) return;
        if (status === "SUBSCRIBED") {
          setConnection("realtime");
          scheduleRefresh();
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setConnection("offline");
        } else {
          setConnection("connecting");
        }
      });

    return () => {
      disposed = true;
      if (refreshTimer) clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [canUseRemote, refreshRoom, room?.id]);

  useEffect(() => {
    if (
      !canUseRemote ||
      !room?.id ||
      room.status !== "playing" ||
      !room.deadline
    ) {
      return undefined;
    }
    const delay = Math.min(
      2147483647,
      Math.max(250, room.deadline - Date.now() + 250),
    );
    const timer = setTimeout(() => {
      if (roomRef.current?.id === room.id) void refreshRoom(room.id);
    }, delay);
    return () => clearTimeout(timer);
  }, [canUseRemote, refreshRoom, room]);

  const puzzleFor = useCallback(
    (currentRoom, roundNumber) => {
      const safeRoom = currentRoom || roomRef.current;
      if (!safeRoom) return null;
      const requestedRound = Number(roundNumber);
      const round = Number.isFinite(requestedRound)
        ? Math.trunc(requestedRound)
        : Math.trunc(finiteNumber(safeRoom.round, 0));
      const roundMetadata = (safeRoom.rounds || safeRoom.roundRows || []).find(
        (row) => Number(row.number) === round,
      );
      const difficulty = normalizeDifficulty(
        roundMetadata?.difficulty,
        deterministicDifficulty(round),
      );
      const level = normalizeLevel(
        roundMetadata?.level,
        deterministicLevel(round),
      );
      const generated = getPuzzle(difficulty, level);
      const metadataCategory =
        roundMetadata?.category && roundMetadata.category !== "random"
          ? roundMetadata.category
          : null;
      const settingCategory =
        safeRoom.settings?.category &&
        safeRoom.settings.category !== "random" &&
        safeRoom.settings.category !== "All"
          ? safeRoom.settings.category
          : null;
      const category =
        metadataCategory || settingCategory || generated.category;
      const answerType = generated.answerType;
      const answerKey = generated.answerKey;
      let localizedAnswer = generated.answer;
      if (answerType === "letters" && answerKey) {
        const translatedAnswer = translate(locale, answerKey);
        localizedAnswer =
          translatedAnswer && translatedAnswer !== answerKey
            ? translatedAnswer
            : generated.answer;
      }
      const localizedPuzzle = {
        ...generated,
        id: generated.id,
        serverPuzzleId: roundMetadata?.puzzleId || null,
        category,
        answer: generated.answer,
        answerType,
        answerKey,
        code: answerType === "digits" ? generated.code : null,
        expectedAnswer: localizedAnswer,
      };
      return {
        ...localizedPuzzle,
        displayAnswer: formatPuzzleAnswer(
          localizedPuzzle,
          localizedAnswer,
          locale,
        ),
      };
    },
    [locale],
  );

  const currentPlayer =
    room?.players.find((item) => String(item.id) === profileId) || null;

  const notifyRoundWin = useCallback(
    (nextRoom, puzzle, gained, roundNumber, confirmed = false) => {
      if (!nextRoom || !profileId || !onRoundWin) return;
      const round = Math.trunc(finiteNumber(roundNumber, nextRoom.round));
      const roundRow = (nextRoom.rounds || []).find(
        (row) => Number(row.number) === round,
      );
      const won =
        confirmed ||
        nextRoom.settings?.mode === "timeAttack" ||
        roundRow?.winnerId === profileId ||
        nextRoom.roundWinner === profileId;
      if (!won) return;
      const key = `${nextRoom.id}:${round}`;
      if (notifiedRoundsRef.current.has(key)) return;
      const player = nextRoom.players.find(
        (item) => String(item.id) === profileId,
      );
      if (!player || !puzzle) return;
      notifiedRoundsRef.current.add(key);
      onRoundWin({
        room: nextRoom,
        player,
        puzzle,
        gained: finiteNumber(gained, puzzle.points || 0),
      });
    },
    [onRoundWin, profileId],
  );

  const notifyMatchWin = useCallback(
    (nextRoom) => {
      if (!nextRoom || nextRoom.status !== "finished" || !profileId) return;
      if (!onMatchWin) return;
      const key = String(nextRoom.id);
      if (notifiedMatchesRef.current.has(key)) return;
      const winner =
        nextRoom.players.find(
          (player) => String(player.id) === String(nextRoom.winnerId || ""),
        ) ||
        [...nextRoom.players].sort((a, b) => {
          const scoreDifference = (b.score || 0) - (a.score || 0);
          if (scoreDifference) return scoreDifference;
          return (
            new Date(a.joinedAt || 0).getTime() -
            new Date(b.joinedAt || 0).getTime()
          );
        })[0];
      if (!winner) return;
      notifiedMatchesRef.current.add(key);
      onMatchWin({
        room: nextRoom,
        winner,
        localWinner: String(winner.id) === profileId,
      });
    },
    [onMatchWin, profileId],
  );

  useEffect(() => {
    const previous = previousRoomRef.current;
    if (!room) {
      previousRoomRef.current = null;
      return;
    }
    if (previous && String(previous.id) === String(room.id)) {
      if (room.status === "finished" && previous.status !== "finished") {
        notifyMatchWin(room);
      }
      if (
        (room.status === "round_won" || room.status === "finished") &&
        previous.status !== room.status &&
        room.roundWinner === profileId
      ) {
        const roundPuzzle = puzzleFor(room, room.round);
        notifyRoundWin(room, roundPuzzle, roundPuzzle?.points, room.round);
      }
    }
    previousRoomRef.current = room;
  }, [notifyMatchWin, notifyRoundWin, profileId, puzzleFor, room]);

  const getActionUser = useCallback(async () => {
    if (!canUseRemote) {
      showToast?.("toast.needSignIn");
      return null;
    }
    return getAuthenticatedUser(true);
  }, [canUseRemote, getAuthenticatedUser, showToast]);

  const createRoom = useCallback(
    (settings = {}) => {
      if (!canUseRemote) {
        showToast?.("toast.needSignIn");
        return { error: "toast.needSignIn" };
      }
      const mode =
        settings?.mode === "timeAttack" || settings?.mode === "time_attack"
          ? "time_attack"
          : "first_to_crack";
      const rounds = Math.min(
        30,
        Math.max(1, Math.trunc(finiteNumber(settings?.rounds, 5))),
      );
      const requestedCategory =
        mode === "time_attack" ? "random" : settings?.category;
      const category =
        requestedCategory === "All" || !ROOM_CATEGORIES.has(requestedCategory)
          ? "random"
          : requestedCategory;

      const request = (async () => {
        const user = await getActionUser();
        if (!user) return { error: "toast.needSignIn" };
        try {
          setConnection("connecting");
          const result = assertActionResult(
            await invokeMultiplayerAction("create-room", {
              mode,
              rounds,
              category,
            }),
          );
          const roomRow = unwrapRoomRow(result);
          if (!roomRow?.id) throw new Error("Room state unavailable");
          ignoredRoomIdRef.current = null;
          notifiedRoundsRef.current.clear();
          notifiedMatchesRef.current.clear();
          const nextRoom = await loadRoom(roomRow.id, user, "id");
          if (!nextRoom) throw new Error("Room state unavailable");
          applyRoom(nextRoom);
          return nextRoom;
        } catch (error) {
          notifyError(error);
          return { error: actionErrorKey(error) };
        }
      })();
      return request;
    },
    [applyRoom, canUseRemote, getActionUser, loadRoom, notifyError, showToast],
  );

  const joinRoom = useCallback(
    (code) => {
      const normalized = normalizeRoomCode(code);
      if (!/^[A-Z0-9]{6}$/.test(normalized)) {
        return { error: "multi.roomCode" };
      }
      if (!canUseRemote) {
        showToast?.("toast.needSignIn");
        return { error: "toast.needSignIn" };
      }

      const request = (async () => {
        const user = await getActionUser();
        if (!user) return { error: "toast.needSignIn" };
        try {
          setConnection("connecting");
          const result = assertActionResult(
            await invokeMultiplayerAction("join-room", {
              code: normalized,
            }),
          );
          const roomRow = unwrapRoomRow(result);
          const target = roomRow?.id || normalized;
          const nextRoom = await loadRoom(
            target,
            user,
            roomRow?.id ? "id" : "code",
          );
          if (!nextRoom) throw new Error("Room state unavailable");
          ignoredRoomIdRef.current = null;
          notifiedRoundsRef.current.clear();
          notifiedMatchesRef.current.clear();
          applyRoom(nextRoom);
          showToast?.("toast.joined");
          return { room: nextRoom };
        } catch (error) {
          notifyError(error);
          return { error: actionErrorKey(error) };
        }
      })();
      return request;
    },
    [applyRoom, canUseRemote, getActionUser, loadRoom, notifyError, showToast],
  );

  const toggleReady = useCallback(() => {
    const current = roomRef.current;
    if (!current || current.status !== "lobby") return false;
    if (!canUseRemote) {
      showToast?.("toast.needSignIn");
      return false;
    }
    const currentPlayerId = profileId;
    const mine = current.players.find(
      (player) => String(player.id) === currentPlayerId,
    );
    if (!mine) return false;

    const request = (async () => {
      const user = await getActionUser();
      if (!user) return false;
      try {
        setConnection("connecting");
        const result = assertActionResult(
          await invokeMultiplayerAction("ready", {
            roomId: current.id,
            ready: !mine.ready,
          }),
        );
        if (!result?.player) throw new Error("Ready state unavailable");
        const nextRoom = await loadRoom(current.id, user, "id");
        if (!nextRoom) throw new Error("Room state unavailable");
        applyRoom(nextRoom, current.id);
        return true;
      } catch (error) {
        notifyError(error);
        return false;
      }
    })();
    return request;
  }, [
    applyRoom,
    canUseRemote,
    getActionUser,
    loadRoom,
    notifyError,
    profileId,
    showToast,
  ]);

  const startMatch = useCallback(() => {
    const current = roomRef.current;
    if (
      !current ||
      current.status !== "lobby" ||
      String(current.hostId) !== profileId
    ) {
      return false;
    }
    if (current.players.filter((player) => player.ready).length < 2) {
      return false;
    }
    if (!canUseRemote) {
      showToast?.("toast.needSignIn");
      return false;
    }

    const request = (async () => {
      const user = await getActionUser();
      if (!user) return false;
      try {
        setConnection("connecting");
        assertActionResult(
          await invokeMultiplayerAction("start-room", { roomId: current.id }),
        );
        const nextRoom = await loadRoom(current.id, user, "id");
        if (!nextRoom) throw new Error("Room state unavailable");
        applyRoom(nextRoom, current.id);
        return true;
      } catch (error) {
        notifyError(error);
        return false;
      }
    })();
    return request;
  }, [
    applyRoom,
    canUseRemote,
    getActionUser,
    loadRoom,
    notifyError,
    profileId,
    showToast,
  ]);

  const submitAnswer = useCallback(
    (submittedAnswer) => {
      const current = roomRef.current;
      if (!current || current.status !== "playing") {
        return { result: "closed" };
      }
      const mine = current.players.find(
        (player) => String(player.id) === profileId,
      );
      if (!mine || !profileId) return { result: "not-in-room" };
      const puzzle = puzzleFor(current, current.round);
      if (!puzzle) return { result: "unavailable" };
      if (!canUseRemote) {
        showToast?.("toast.needSignIn");
        return { result: "auth" };
      }

      const roundNumber = current.round;
      const request = (async () => {
        const user = await getActionUser();
        if (!user) return { result: "auth" };
        try {
          setConnection("connecting");
          const serverResult = assertActionResult(
            await invokeMultiplayerAction("submit-answer", {
              roomId: current.id,
              answer: submittedAnswer,
              locale,
            }),
          );
          const nextRoom = await loadRoom(current.id, user, "id");
          if (nextRoom) {
            applyRoom(nextRoom, current.id);
            if (serverResult?.correct === true) {
              const gained = finiteNumber(
                serverResult.gained,
                puzzle.points || 0,
              );
              notifyRoundWin(nextRoom, puzzle, gained, roundNumber, true);
              notifyMatchWin(nextRoom);
            }
          }
          if (serverResult?.correct === false) {
            return {
              result: "wrong",
              attempts: finiteNumber(current.attempts?.[mine.id], 0) + 1,
              puzzle,
              room: nextRoom || current,
            };
          }
          if (serverResult?.correct !== true) {
            throw new Error("Answer action returned no result");
          }
          return {
            result: "correct",
            puzzle,
            gained: finiteNumber(serverResult.gained, puzzle.points || 0),
            room: nextRoom || current,
          };
        } catch (error) {
          notifyError(error);
          return {
            result: "error",
            error: actionErrorKey(error),
            puzzle,
            room: current,
          };
        }
      })();
      return request;
    },
    [
      applyRoom,
      canUseRemote,
      getActionUser,
      loadRoom,
      locale,
      notifyError,
      notifyMatchWin,
      notifyRoundWin,
      profileId,
      puzzleFor,
      showToast,
    ],
  );

  const nextRound = useCallback(() => {
    const current = roomRef.current;
    if (
      !current ||
      current.status !== "round_won" ||
      String(current.hostId) !== profileId
    ) {
      return false;
    }
    if (!canUseRemote) {
      showToast?.("toast.needSignIn");
      return false;
    }

    const request = (async () => {
      const user = await getActionUser();
      if (!user) return false;
      try {
        setConnection("connecting");
        assertActionResult(
          await invokeMultiplayerAction("advance-room", { roomId: current.id }),
        );
        const nextRoom = await loadRoom(current.id, user, "id");
        if (!nextRoom) throw new Error("Room state unavailable");
        applyRoom(nextRoom, current.id);
        notifyMatchWin(nextRoom);
        return true;
      } catch (error) {
        notifyError(error);
        return false;
      }
    })();
    return request;
  }, [
    applyRoom,
    canUseRemote,
    getActionUser,
    loadRoom,
    notifyError,
    notifyMatchWin,
    profileId,
    showToast,
  ]);

  const leaveRoom = useCallback(() => {
    const current = roomRef.current;
    if (!current) return false;
    if (!canUseRemote) {
      showToast?.("toast.needSignIn");
      return false;
    }

    const request = (async () => {
      const user = await getActionUser();
      if (!user) return false;
      try {
        assertActionResult(
          await invokeMultiplayerAction("leave-room", { roomId: current.id }),
        );
        if (String(roomRef.current?.id || "") === String(current.id)) {
          ignoredRoomIdRef.current = current.id;
          previousRoomRef.current = null;
          clearRoom();
          setConnection("offline");
          showToast?.("toast.roomLeft");
        }
        return true;
      } catch (error) {
        notifyError(error);
        return false;
      }
    })();
    return request;
  }, [canUseRemote, clearRoom, getActionUser, notifyError, showToast]);

  const player = useCallback(
    (name) => {
      if (!profile || !profileId) return null;
      return {
        id: profileId,
        name:
          String(
            name ||
              currentPlayer?.name ||
              profile.username ||
              profile.displayName ||
              defaultName,
          ).trim() ||
          defaultName ||
          "Player",
        ready: currentPlayer?.ready || false,
        score: currentPlayer?.score || 0,
        codes: currentPlayer?.codes || 0,
      };
    },
    [currentPlayer, defaultName, profile, profileId],
  );

  return {
    room,
    currentPlayer,
    connection,
    createRoom,
    joinRoom,
    toggleReady,
    startMatch,
    submitAnswer,
    nextRound,
    leaveRoom,
    puzzleFor,
    player,
  };
}
