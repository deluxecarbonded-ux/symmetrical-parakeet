import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Shell from "./components/Shell";
import NotificationToaster from "./components/NotificationToaster";
import Dashboard from "./pages/Dashboard";
import SinglePlayer from "./pages/SinglePlayer";
import SingleGame from "./pages/SingleGame";
import Multiplayer from "./pages/Multiplayer";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import Auth from "./pages/Auth";
import { useMultiplayerRoom } from "./lib/multiplayer";
import { isSupabaseConfigured, requestAiHint, supabase } from "./lib/supabase";
import { isRtl, LANGUAGES, translate } from "./i18n/translations";
import {
  isValidUsername,
  normalizeUsername,
  profileFromAuthUser,
  publicUsername,
} from "./lib/identity";
import { makeId, useMemoryValue } from "./lib/storage";
import {
  NOTIFICATION_TONES,
  inferNotificationTone,
  notificationDuration,
} from "./lib/notifications";
import { useRealtimeInvalidation } from "./lib/realtime";

export const AppContext = createContext(null);

const browserLocale =
  typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "en";
const supportedLocale = LANGUAGES.some(([code]) => code === browserLocale)
  ? browserLocale
  : "en";

const initialSettings = {
  theme:
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  locale: supportedLocale || "en",
  sound: true,
  reduceMotion:
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
};

const initialProgress = {
  single: {
    completed: {},
    bestScores: {},
    currentLevel: { easy: 1, medium: 1, hard: 1 },
    solved: 0,
    score: 0,
    attempts: 0,
    history: [],
  },
  multi: {
    matches: 0,
    wins: 0,
    solved: 0,
    score: 0,
    history: [],
  },
};

const initialWallet = { single: 0, multi: 0 };
const initialInventory = {
  single: [],
  multi: [],
  equipped: { single: null, multi: null },
};

const MEDIA_EXTENSIONS = {
  image: {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    avif: "image/avif",
    heic: "image/heic",
    heif: "image/heif",
    svg: "image/svg+xml",
  },
  video: {
    mp4: "video/mp4",
    m4v: "video/x-m4v",
    mov: "video/quicktime",
    webm: "video/webm",
    ogv: "video/ogg",
    "3gp": "video/3gpp",
    "3g2": "video/3gpp2",
    mkv: "video/x-matroska",
  },
};

function resolveMediaType(file) {
  const declared = String(file?.type || "").toLowerCase().split(";")[0];
  if (declared.startsWith("image/") || declared.startsWith("video/")) {
    return { kind: declared.split("/")[0], mimeType: declared };
  }
  const extension = String(file?.name || "")
    .split(".")
    .pop()
    ?.toLowerCase();
  const imageType = MEDIA_EXTENSIONS.image[extension];
  if (imageType) return { kind: "image", mimeType: imageType };
  const videoType = MEDIA_EXTENSIONS.video[extension];
  if (videoType) return { kind: "video", mimeType: videoType };
  return { kind: "", mimeType: declared };
}

function snapshotPreferences(settings) {
  return {
    theme: settings.theme,
    locale: settings.locale,
    sound: settings.sound,
    reduceMotion: settings.reduceMotion,
  };
}

function samePreferences(left, right) {
  return Boolean(
    left &&
      right &&
      left.theme === right.theme &&
      left.locale === right.locale &&
      left.sound === right.sound &&
      left.reduceMotion === right.reduceMotion,
  );
}

const REALTIME_SUBSCRIPTION_TABLES = Object.freeze([
  "profiles",
  "single_player_profiles",
  "multiplayer_profiles",
  "single_player_progress",
  "single_player_wallets",
  "multiplayer_wallets",
  "single_player_inventory",
  "multiplayer_inventory",
  "user_achievements",
  "achievement_definitions",
  "shop_items",
  "shop_purchases",
  "translation_catalogs",
  "wallet_transactions",
  "leaderboard_revision",
  "game_events",
]);

const APP_REALTIME_TABLES = new Set([
  "profiles",
  "single_player_profiles",
  "multiplayer_profiles",
  "single_player_progress",
  "single_player_wallets",
  "multiplayer_wallets",
  "single_player_inventory",
  "multiplayer_inventory",
  "shop_purchases",
  "wallet_transactions",
  "game_events",
]);

export default function App() {
  const location = useLocation();
  const activeMode = location.pathname.startsWith("/multi")
    ? "multi"
    : "single";
  const [settings, setSettings] = useMemoryValue(initialSettings);
  const [profiles, setProfiles] = useMemoryValue({
    single: null,
    multi: null,
  });
  const profile = profiles?.[activeMode] || null;
  const [progress, setProgress] = useMemoryValue(initialProgress);
  const [wallet, setWallet] = useMemoryValue(initialWallet);
  const [inventory, setInventory] = useMemoryValue(initialInventory);
  const [activity, setActivity] = useMemoryValue([]);
  const [notifications, setNotifications] = useState([]);
  const [authBusy, setAuthBusy] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState("offline");
  const [realtimeEvent, setRealtimeEvent] = useState(null);

  const t = useCallback(
    (key, values) => translate(settings.locale, key, values),
    [settings.locale],
  );
  const profileView = useMemo(() => {
    if (!profile) return null;
    const username = publicUsername(profile);
    return {
      ...profile,
      username: username || null,
      displayName: username || t("profile.defaultPlayerName"),
    };
  }, [profile, t]);
  const notificationSequenceRef = useRef(0);
  const showToast = useCallback((key, values, options = {}) => {
    const notificationOptions = options || {};
    const tone =
      NOTIFICATION_TONES[notificationOptions.tone] || inferNotificationTone(key);
    const id = `notification-${++notificationSequenceRef.current}`;
    setNotifications((current) =>
      [
        {
          id,
          key,
          values: values || {},
          tone,
          duration:
            notificationOptions.duration ?? notificationDuration(tone),
        },
        ...current,
      ].slice(0, 5),
    );
    return id;
  }, []);
  const dismissNotification = useCallback((id) => {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }, []);
  const clearNotifications = useCallback(() => setNotifications([]), []);
  const toast = notifications[0] || null;
  const settingsHydratedRef = useRef(false);
  const preferencesSnapshotRef = useRef(null);
  const preferencesDirtyRef = useRef(false);
  const hydrationRequestRef = useRef(0);
  const realtimeEventIdRef = useRef(0);
  const realtimeHydrationTimerRef = useRef(null);
  const previousRealtimeStatusRef = useRef(null);
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [languageMenuClosing, setLanguageMenuClosing] = useState(false);
  const languageCloseTimer = useRef(null);
  const themeTransitionTimer = useRef(null);
  const previousThemeRef = useRef(null);
  const firstThemeEffectRef = useRef(true);
  const onLanguageMenuChange = useCallback((open) => {
    if (languageCloseTimer.current) {
      window.clearTimeout(languageCloseTimer.current);
      languageCloseTimer.current = null;
    }
    if (open) {
      setLanguageMenuOpen(true);
      setLanguageMenuClosing(false);
      return;
    }
    setLanguageMenuOpen(false);
    if (settings.reduceMotion) {
      setLanguageMenuClosing(false);
      return;
    }
    setLanguageMenuClosing(true);
    languageCloseTimer.current = window.setTimeout(() => {
      setLanguageMenuClosing(false);
      languageCloseTimer.current = null;
    }, 240);
  }, [settings.reduceMotion]);

  useEffect(() => {
    if (!settings.reduceMotion || !languageCloseTimer.current) return;
    window.clearTimeout(languageCloseTimer.current);
    languageCloseTimer.current = null;
    setLanguageMenuClosing(false);
  }, [settings.reduceMotion]);

  const hydrateFromSupabase = useCallback(async ({ silent = false } = {}) => {
    if (!isSupabaseConfigured) return;
    const requestId = ++hydrationRequestRef.current;
    try {
      const { data, error } = await supabase.rpc("get_app_state");
      if (error) throw error;
      const state = data || {};
      if (requestId !== hydrationRequestRef.current) return;
      if (state.profile?.id) {
        setProfiles((current) => {
          const baseProfile = current.single || current.multi || {};
          const serverProfile = {
            ...baseProfile,
            ...state.profile,
          };
          return {
            ...current,
            single: serverProfile,
            multi: serverProfile,
          };
        });
      }
      const rows = state.single_progress || [];
      const completed = {};
      const bestScores = {};
      const currentLevel = { easy: 1, medium: 1, hard: 1 };
      let attempts = 0;
      rows.forEach((row) => {
        attempts += row.attempts || 0;
        if (!row.completed) return;
        completed[row.difficulty] = Array.from(
          new Set([...(completed[row.difficulty] || []), row.level]),
        ).sort((a, b) => a - b);
        bestScores[row.difficulty] = Math.max(
          bestScores[row.difficulty] || 0,
          row.best_score || 0,
        );
        currentLevel[row.difficulty] = Math.min(
          30,
          Math.max(currentLevel[row.difficulty] || 1, row.level + 1),
        );
      });
      const singleItems = state.single_inventory || [];
      const multiItems = state.multiplayer_inventory || [];
      const singleEquipped =
        singleItems.find((item) => item.equipped)?.item_id || null;
      const multiEquipped =
        multiItems.find((item) => item.equipped)?.item_id || null;
      const profileState = state.profile || {};
      const preferences = profileState.preferences || {};

      setSettings((current) => {
        if (preferencesDirtyRef.current) return current;
        const nextSettings = {
          ...current,
          ...preferences,
          locale: preferences.locale || profileState.locale || current.locale,
        };
        preferencesSnapshotRef.current = snapshotPreferences(nextSettings);
        return nextSettings;
      });
      settingsHydratedRef.current = true;
      const serverActivity = state.activity || [];
      const singleHistory = serverActivity
        .filter((event) => event.event_type === "level_cleared")
        .map((event) => ({
          id: event.id,
          ...event.payload,
          at: event.created_at,
        }));
      const multiHistory = serverActivity
        .filter((event) =>
          ["round_cleared", "match_finished"].includes(event.event_type),
        )
        .map((event) => ({
          id: event.id,
          ...event.payload,
          at: event.created_at,
        }));
      setProgress((current) => ({
        ...current,
        single: {
          completed,
          bestScores,
          currentLevel,
          solved:
            state.single_profile?.codes_cracked ??
            rows.filter((row) => row.completed).length,
          score: state.single_profile?.total_score ?? 0,
          attempts,
          history: singleHistory,
        },
        multi: {
          matches: state.multiplayer_profile?.duels_played ?? 0,
          wins: state.multiplayer_profile?.duels_won ?? 0,
          solved: multiHistory.filter((event) => event.round !== undefined)
            .length,
          score: multiHistory.reduce(
            (sum, event) => sum + (event.score || 0),
            0,
          ),
          history: multiHistory,
        },
      }));
      setWallet((current) => ({
        ...current,
        single: state.single_wallet?.balance ?? 0,
        multi: state.multiplayer_wallet?.balance ?? 0,
      }));
      setInventory((current) => ({
        ...current,
        single: singleItems.map((item) => ({
          id: item.item_id,
          equippedAt: item.acquired_at,
        })),
        multi: multiItems.map((item) => ({
          id: item.item_id,
          equippedAt: item.acquired_at,
        })),
        equipped: { single: singleEquipped, multi: multiEquipped },
      }));
      setActivity(
        serverActivity.map((event) => ({
          id: event.id,
          type:
            event.event_type === "level_cleared"
              ? "single"
              : event.event_type === "match_finished"
                ? "multi-match"
                : "multi",
          ...event.payload,
          at: event.created_at,
        })),
      );
    } catch {
      if (!silent) showToast("toast.syncUnavailable");
    }
  }, [
    setActivity,
    setInventory,
    setProgress,
    setSettings,
    setWallet,
    showToast,
  ]);

  const scheduleRealtimeHydration = useCallback(() => {
    if (realtimeHydrationTimerRef.current) {
      window.clearTimeout(realtimeHydrationTimerRef.current);
    }
    realtimeHydrationTimerRef.current = window.setTimeout(() => {
      realtimeHydrationTimerRef.current = null;
      void hydrateFromSupabase({ silent: true });
    }, 120);
  }, [hydrateFromSupabase]);

  const handleRealtimeChange = useCallback(
    (change) => {
      const table = String(change?.table || change?.schemaTable || "");
      if (!table) return;
      setRealtimeEvent({
        id: ++realtimeEventIdRef.current,
        table,
        event: String(change?.event || change?.eventType || "change"),
        at: change?.at || new Date().toISOString(),
      });
      if (APP_REALTIME_TABLES.has(table)) scheduleRealtimeHydration();
    },
    [scheduleRealtimeHydration],
  );

  const realtimeConnection = useRealtimeInvalidation({
    tables: REALTIME_SUBSCRIPTION_TABLES,
    onChange: handleRealtimeChange,
    enabled: Boolean(isSupabaseConfigured && profile?.id),
    debounceMs: 50,
  });

  useEffect(() => {
    setRealtimeStatus(
      isSupabaseConfigured && profile?.id ? realtimeConnection.status : "offline",
    );
  }, [isSupabaseConfigured, profile?.id, realtimeConnection.status]);

  useEffect(() => {
    const previousStatus = previousRealtimeStatusRef.current;
    if (
      realtimeStatus === "live" &&
      previousStatus &&
      previousStatus !== "live" &&
      profile?.id
    ) {
      void hydrateFromSupabase({ silent: true });
    }
    previousRealtimeStatusRef.current = realtimeStatus;
  }, [hydrateFromSupabase, profile?.id, realtimeStatus]);

  useEffect(() => {
    return () => {
      if (realtimeHydrationTimerRef.current) {
        window.clearTimeout(realtimeHydrationTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.reduceMotion = String(Boolean(settings.reduceMotion));
    root.lang = settings.locale;
    root.dir = isRtl(settings.locale) ? "rtl" : "ltr";
    root.style.colorScheme = settings.theme;
  }, [settings.locale, settings.reduceMotion, settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    const themeChanged =
      previousThemeRef.current !== null &&
      previousThemeRef.current !== settings.theme;
    const shouldAnimateTheme =
      !firstThemeEffectRef.current && themeChanged && !settings.reduceMotion;
    firstThemeEffectRef.current = false;
    previousThemeRef.current = settings.theme;

    if (themeTransitionTimer.current) {
      window.clearTimeout(themeTransitionTimer.current);
      themeTransitionTimer.current = null;
    }
    if (shouldAnimateTheme) {
      root.classList.add("theme-transition");
      themeTransitionTimer.current = window.setTimeout(() => {
        root.classList.remove("theme-transition");
        themeTransitionTimer.current = null;
      }, 420);
    } else if (settings.reduceMotion) {
      root.classList.remove("theme-transition");
    }

    root.dataset.theme = settings.theme;
    root.dataset.reduceMotion = String(Boolean(settings.reduceMotion));
    root.lang = settings.locale;
    root.dir = isRtl(settings.locale) ? "rtl" : "ltr";
    root.style.colorScheme = settings.theme;
    document.title = t("meta.title");
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", t("meta.description"));
    const manifest = document.querySelector('link[rel="manifest"]');
    if (manifest) manifest.setAttribute("href", `/manifest.${settings.locale}.webmanifest`);
  }, [settings.locale, settings.reduceMotion, settings.theme, t]);

  useEffect(() => {
    return () => {
      if (themeTransitionTimer.current)
        window.clearTimeout(themeTransitionTimer.current);
    };
  }, []);

  const updateSettings = useCallback(
    (patch) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        if (profile?.id) {
          preferencesDirtyRef.current = true;
        }
        return next;
      });
    },
    [profile?.id, setSettings],
  );
  useEffect(() => {
    if (!isSupabaseConfigured || !profile?.id || !settingsHydratedRef.current)
      return undefined;
    const snapshot = snapshotPreferences(settings);
    if (samePreferences(snapshot, preferencesSnapshotRef.current)) {
      return undefined;
    }
    preferencesSnapshotRef.current = snapshot;
    const timeout = window.setTimeout(() => {
      supabase
        .rpc("update_user_preferences", {
          p_preferences: snapshot,
        })
        .then(({ error }) => {
          if (error) {
            preferencesSnapshotRef.current = null;
            showToast("toast.syncUnavailable");
          } else {
            preferencesDirtyRef.current = false;
          }
        });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [profile?.id, settings, showToast]);
  useEffect(() => {
    if (!LANGUAGES.some(([code]) => code === settings.locale)) {
      updateSettings({ locale: "en" });
    }
  }, [settings.locale, updateSettings]);
  const playCue = useCallback(
    (kind = "success") => {
      if (!settings.sound || typeof window === "undefined") return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      try {
        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = kind === "wrong" ? "sawtooth" : "sine";
        oscillator.frequency.value = kind === "wrong" ? 180 : 540;
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(
          0.045,
          context.currentTime + 0.01,
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          context.currentTime + 0.16,
        );
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.17);
        oscillator.addEventListener("ended", () => context.close());
      } catch {
        /* audio is an enhancement, never a blocker */
      }
    },
    [settings.sound],
  );

  const addActivity = useCallback(
    (entry) => {
      setActivity((current) =>
        [{ id: makeId("activity"), ...entry }, ...current].slice(0, 12),
      );
    },
    [setActivity],
  );

  const recordSingleWin = useCallback(
    async ({
      difficulty,
      level,
      score,
      attempts,
      time,
      answer,
      submittedAnswer,
      answerType,
      code,
    }) => {
      const coins =
        8 +
        level +
        (difficulty === "hard" ? 8 : difficulty === "medium" ? 4 : 0);
      const shouldPersist = Boolean(isSupabaseConfigured && profile);
      if (!shouldPersist) {
        setProgress((current) => {
          const single = current.single || initialProgress.single;
          const completed = { ...(single.completed || {}) };
          completed[difficulty] = Array.from(
            new Set([...(completed[difficulty] || []), level]),
          ).sort((a, b) => a - b);
          const bestScores = {
            ...(single.bestScores || {}),
            [difficulty]: Math.max(single.bestScores?.[difficulty] || 0, score),
          };
          const currentLevel = {
            ...(single.currentLevel || initialProgress.single.currentLevel),
          };
          currentLevel[difficulty] = Math.min(
            30,
            Math.max(level + 1, currentLevel[difficulty] || 1),
          );
          return {
            ...current,
            single: {
              ...single,
              completed,
              bestScores,
              currentLevel,
              solved: (single.solved || 0) + 1,
              score: (single.score || 0) + score,
              attempts: (single.attempts || 0) + attempts,
              history: [
                {
                  id: makeId("run"),
                  difficulty,
                  level,
                  score,
                  attempts,
                  time,
                  answer: answer || code,
                  answerType: answerType || "digits",
                  code: code || null,
                  at: new Date().toISOString(),
                },
                ...(single.history || []),
              ].slice(0, 20),
            },
          };
        });
        setWallet((current) => ({
          ...current,
          single: (current.single || 0) + coins,
        }));
        addActivity({
          type: "single",
          difficulty,
          level,
          score,
          coins,
          at: new Date().toISOString(),
        });
      }
      if (!shouldPersist) {
        showToast("single.correct");
        return true;
      }
      const { data, error } = await supabase.rpc(
        "submit_single_answer_localized",
        {
          p_difficulty: difficulty,
          p_level: level,
          p_answer: submittedAnswer || answer || code || "",
          p_locale: settings.locale,
          p_attempts: attempts,
          p_time_ms: time * 1000,
        },
      );
      if (error || data?.correct === false) {
        showToast("toast.syncUnavailable");
        return false;
      }
      await hydrateFromSupabase();
      showToast("single.correct");
      return true;
    },
    [
      addActivity,
      hydrateFromSupabase,
      profile,
      settings.locale,
      setProgress,
      setWallet,
      showToast,
    ],
  );

  const recordMultiRound = useCallback(async () => {
    await hydrateFromSupabase();
  }, [hydrateFromSupabase]);

  const recordMultiMatch = useCallback(async () => {
    await hydrateFromSupabase();
  }, [hydrateFromSupabase]);

  const recordMultiRoundSafe = useCallback(
    (payload) => {
      if (payload?.player?.id === profile?.id) recordMultiRound(payload);
    },
    [profile?.id, recordMultiRound],
  );

  const recordMultiMatchSafe = useCallback(
    (payload) => recordMultiMatch(payload),
    [recordMultiMatch],
  );

  const multiplayer = useMultiplayerRoom({
    profile,
    defaultName: t("profile.defaultPlayerName"),
    locale: settings.locale,
    onRoundWin: recordMultiRoundSafe,
    onMatchWin: recordMultiMatchSafe,
    showToast,
  });

  const purchaseItem = useCallback(
    async (item, mode) => {
      if (!isSupabaseConfigured || !profile) {
        showToast("toast.needSignIn");
        return false;
      }
      const balance = wallet[mode] || 0;
      if (balance < item.price) {
        showToast("shop.insufficient");
        return false;
      }
      if ((inventory[mode] || []).some((owned) => owned.id === item.id)) {
        showToast("shop.equippedToast");
        return false;
      }
      const { error } = await supabase.rpc("purchase_shop_item", {
        p_scope: mode,
        p_item_id: item.id,
      });
      if (error) {
        showToast("toast.syncUnavailable");
        return false;
      }
      showToast("toast.purchased");
      await hydrateFromSupabase();
      return true;
    },
    [hydrateFromSupabase, inventory, profile, showToast, wallet],
  );

  const equipItem = useCallback(
    async (item, mode) => {
      if (!isSupabaseConfigured || !profile) {
        showToast("toast.needSignIn");
        return;
      }
      const { error } = await supabase.rpc("equip_shop_item", {
        p_scope: mode,
        p_item_id: item.id,
      });
      if (error) {
        showToast("toast.syncUnavailable");
        return;
      }
      showToast("toast.equipped");
      await hydrateFromSupabase();
    },
    [hydrateFromSupabase, profile, showToast],
  );

  const signIn = useCallback(
    async (credentials) => {
      setAuthBusy(true);
      try {
        if (!isSupabaseConfigured) {
          showToast("toast.syncUnavailable");
          return null;
        }
        const { data, error } =
          await supabase.auth.signInWithPassword(credentials);
        if (error) throw error;
        const next = profileFromAuthUser(data.user);
        hydrationRequestRef.current += 1;
        preferencesSnapshotRef.current = null;
        preferencesDirtyRef.current = false;
        setRealtimeEvent(null);
        setRealtimeStatus("connecting");
        setProfiles((current) => ({ ...current, single: next, multi: next }));
        return next;
      } catch (error) {
        showToast("auth.invalidCredentials");
        return null;
      } finally {
        setAuthBusy(false);
      }
    },
    [setProfiles, showToast],
  );

  const signUp = useCallback(
    async (credentials) => {
      setAuthBusy(true);
      try {
        if (!isSupabaseConfigured) {
          showToast("toast.syncUnavailable");
          return null;
        }
        const username = String(credentials.username || "")
          .trim()
          .toLowerCase();
        if (!isValidUsername(username)) {
          showToast("auth.usernameInvalid");
          return null;
        }
        const { data, error } = await supabase.auth.signUp({
          email: String(credentials.email || "")
            .trim()
            .toLowerCase(),
          password: credentials.password,
          options: {
            data: {
              display_name: username,
              username,
              locale: settings.locale,
            },
          },
        });
        if (error) throw error;
        if (!data.user || !data.session) {
          showToast("auth.signupFailed");
          return null;
        }
        const next = {
          id: data.user.id,
          displayName: username,
          username,
          createdAt: new Date().toISOString(),
        };
        hydrationRequestRef.current += 1;
        preferencesSnapshotRef.current = null;
        preferencesDirtyRef.current = false;
        setRealtimeEvent(null);
        setRealtimeStatus("connecting");
        if (data.user)
          setProfiles((current) => ({
            ...current,
            single: next,
            multi: next,
          }));
        return data.user ? next : null;
      } catch (error) {
        const message = String(error?.message || error || "").toLowerCase();
        if (message.includes("username") || message.includes("unique")) {
          showToast("auth.usernameTaken");
        } else if (
          message.includes("email") ||
          message.includes("registered") ||
          message.includes("already")
        ) {
          showToast("auth.emailTaken");
        } else {
          showToast("auth.signupFailed");
        }
        return null;
      } finally {
        setAuthBusy(false);
      }
    },
    [setProfiles, settings.locale, showToast],
  );

  const signOut = useCallback(async () => {
    hydrationRequestRef.current += 1;
    preferencesSnapshotRef.current = null;
    preferencesDirtyRef.current = false;
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setProfiles({ single: null, multi: null });
    setRealtimeEvent(null);
    setRealtimeStatus("offline");
    setSettings(initialSettings);
    setProgress(initialProgress);
    setWallet(initialWallet);
    setInventory(initialInventory);
    setActivity([]);
    clearNotifications();
  }, [
    clearNotifications,
    setActivity,
    setInventory,
    setProgress,
    setProfiles,
    setSettings,
    setWallet,
  ]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    supabase.auth.getSession().then(({ data: sessionData }) => {
      const user = sessionData?.session?.user;
      if (user)
        setProfiles((current) => ({
          ...current,
          single:
            current.single?.id === user.id
              ? current.single
              : profileFromAuthUser(user),
          multi:
            current.multi?.id === user.id
              ? current.multi
              : profileFromAuthUser(user),
        }));
    });
    return undefined;
  }, [setProfiles]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          hydrationRequestRef.current += 1;
          preferencesSnapshotRef.current = null;
          preferencesDirtyRef.current = false;
          setProfiles({ single: null, multi: null });
          setRealtimeEvent(null);
          setRealtimeStatus("offline");
          setSettings(initialSettings);
          setProgress(initialProgress);
          setWallet(initialWallet);
          setInventory(initialInventory);
          setActivity([]);
          return;
        }
        if (session?.user && profile?.id !== session.user.id) {
          hydrationRequestRef.current += 1;
          preferencesSnapshotRef.current = null;
          preferencesDirtyRef.current = false;
          setRealtimeEvent(null);
          const next = profileFromAuthUser(session.user);
          setProfiles((current) => ({ ...current, single: next, multi: next }));
        }
      },
    );
    return () => listener?.subscription?.unsubscribe();
  }, [clearNotifications, profile?.id, setProfiles, setSettings]);

  useEffect(() => {
    if (!isSupabaseConfigured || !profile) {
      settingsHydratedRef.current = false;
      return;
    }
    settingsHydratedRef.current = false;
    hydrateFromSupabase();
  }, [profile?.id, hydrateFromSupabase]);

  const saveUsername = useCallback(
    async (value) => {
      const username = normalizeUsername(value);
      if (!isValidUsername(username)) {
        showToast("profile.usernameInvalid");
        return false;
      }
      if (publicUsername(profile) === username) {
        showToast("profile.saved");
        return true;
      }
      if (isSupabaseConfigured && profile) {
        const { data, error } = await supabase.rpc("update_profile_username", {
          p_username: username,
        });
        if (error) {
          const message = String(error.message || error).toLowerCase();
          showToast(
            message.includes("username") || message.includes("unique")
              ? "profile.usernameTaken"
              : "toast.syncUnavailable",
          );
          await hydrateFromSupabase();
          return false;
        }
        if (data) {
          setProfiles((current) => ({
            ...current,
            single: current.single ? { ...current.single, ...data } : current.single,
            multi: current.multi ? { ...current.multi, ...data } : current.multi,
          }));
        }
        await hydrateFromSupabase();
        showToast("profile.saved");
        return true;
      }
      setProfiles((current) => ({
        ...current,
        single: current.single
          ? { ...current.single, username, displayName: username }
          : current.single,
        multi: current.multi
          ? { ...current.multi, username, displayName: username }
          : current.multi,
      }));
      showToast("profile.saved");
      return true;
    },
    [hydrateFromSupabase, profile, setProfiles, showToast],
  );

  const uploadAvatar = useCallback(
    async (file) => {
      if (!profile || !file || !isSupabaseConfigured) return null;
      const mediaType = resolveMediaType(file);
      const isVideo = mediaType.kind === "video";
      const isImage = mediaType.kind === "image";
      if ((!isVideo && !isImage) || file.size > 25 * 1024 * 1024) {
        showToast("profile.mediaInvalid");
        return null;
      }
      const bucket = isVideo ? "profile-media" : "avatars";
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, "") || (isVideo ? "mp4" : "jpg");
      const unique = globalThis.crypto?.randomUUID?.() || `${Date.now()}`;
      const path = `${profile.id}/avatar-${unique}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false, contentType: mediaType.mimeType });
      if (uploadError) {
        showToast("profile.mediaUploadFailed");
        return null;
      }
      const { data, error } = await supabase.rpc("update_profile_avatar", {
        p_bucket: bucket,
        p_path: path,
        p_mime_type: mediaType.mimeType,
      });
      if (error || !data) {
        await supabase.storage.from(bucket).remove([path]);
        showToast("profile.mediaUploadFailed");
        return null;
      }
      const previousPath = profile.avatar_url || profile.avatar_path;
      const previousBucket = profile.avatar_bucket || "avatars";
      if (
        previousPath &&
        previousPath !== path &&
        /^(avatars|profile-media)$/i.test(previousBucket)
      ) {
        await supabase.storage.from(previousBucket).remove([previousPath]);
      }
      setProfiles((current) => ({
        ...current,
        single: current.single ? { ...current.single, ...data } : current.single,
        multi: current.multi ? { ...current.multi, ...data } : current.multi,
      }));
      showToast("profile.mediaUpdated");
      return data;
    },
    [profile, setProfiles, showToast],
  );

  const resetProgress = useCallback(async () => {
    if (isSupabaseConfigured && profile) {
      const { error } = await supabase.rpc("reset_user_progress");
      if (error) {
        showToast("toast.syncUnavailable");
        return;
      }
      await hydrateFromSupabase();
      return;
    }
    setProgress(initialProgress);
    setWallet(initialWallet);
    setInventory(initialInventory);
    setActivity([]);
  }, [
    hydrateFromSupabase,
    profile,
    setActivity,
    setInventory,
    setProgress,
    setWallet,
    showToast,
  ]);

  const getAiHint = useCallback(
    async (puzzle) => {
      const localizedClues = puzzle.clueKeys.length
        ? puzzle.clueKeys.map((key) => t(key)).join(" · ")
        : t("puzzle.lettersHint");
      const localizedFallback =
        puzzle.answerType === "letters"
          ? t("puzzle.lettersHint")
          : t("puzzle.hint", { clues: localizedClues });
      try {
        const result = await requestAiHint({
          prompt: `${t(puzzle.promptKey)}\n\n${
            puzzle.answerType === "letters"
              ? t("puzzle.lettersPrompt")
              : t("single.enterCode")
          }\n\n${localizedFallback}`,
          difficulty: puzzle.difficulty,
          level: puzzle.level,
          locale: settings.locale,
          answerType: puzzle.answerType,
        });
        if (result) return result;
      } catch {
        showToast("toast.aiUnavailable");
      }
      return localizedFallback;
    },
    [settings.locale, showToast, t],
  );

  const value = useMemo(
    () => ({
      settings,
      updateSettings,
      profile: profileView,
      signIn,
      signUp,
      signOut,
      authBusy,
      progress,
      wallet,
      inventory,
      activity,
      notifications,
      toast,
      notify: showToast,
      dismissNotification,
      clearNotifications,
      realtimeStatus,
      realtimeEvent,
      languageMenuOpen,
      languageMenuClosing,
      onLanguageMenuChange,
      showToast,
      t,
      recordSingleWin,
      purchaseItem,
      equipItem,
      saveUsername,
      uploadAvatar,
      resetProgress,
      getAiHint,
      playCue,
      multiplayer,
    }),
    [
      activity,
      authBusy,
      clearNotifications,
      dismissNotification,
      notifications,
      equipItem,
      languageMenuClosing,
      languageMenuOpen,
      onLanguageMenuChange,
      getAiHint,
      inventory,
      multiplayer,
      playCue,
      profileView,
      realtimeEvent,
      realtimeStatus,
      progress,
      purchaseItem,
      recordSingleWin,
      resetProgress,
      saveUsername,
      uploadAvatar,
      settings,
      showToast,
      signIn,
      signOut,
      signUp,
      t,
      toast,
      updateSettings,
      wallet,
    ],
  );

  return (
    <AppContext.Provider value={value}>
      <NotificationToaster />
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="single" element={<SinglePlayer />} />
          <Route path="single/play" element={<SingleGame />} />
          <Route path="single/shop" element={<Shop mode="single" />} />
          <Route path="single/profile" element={<Profile mode="single" />} />
          <Route path="single/achievements" element={<Achievements mode="single" />} />
          <Route path="single/leaderboard" element={<Leaderboard mode="single" />} />
          <Route path="multi" element={<Multiplayer />} />
          <Route path="multi/play" element={<Multiplayer />} />
          <Route path="multi/shop" element={<Shop mode="multi" />} />
          <Route path="multi/profile" element={<Profile mode="multi" />} />
          <Route path="multi/achievements" element={<Achievements mode="multi" />} />
          <Route path="multi/leaderboard" element={<Leaderboard mode="multi" />} />
          <Route path="shop" element={<Navigate to="/single/shop" replace />} />
          <Route
            path="profile"
            element={<Navigate to="/single/profile" replace />}
          />
          <Route path="settings" element={<Settings />} />
          <Route path="achievements" element={<Navigate to="/single/achievements" replace />} />
          <Route path="leaderboard" element={<Navigate to="/single/leaderboard" replace />} />
        </Route>
        <Route path="auth" element={<Auth />} />
        <Route path="single/auth" element={<Auth scope="single" />} />
        <Route path="multi/auth" element={<Auth scope="multi" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppContext");
  return context;
}
