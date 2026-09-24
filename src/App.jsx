import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Shell from "./components/Shell";
import Dashboard from "./pages/Dashboard";
import SinglePlayer from "./pages/SinglePlayer";
import SingleGame from "./pages/SingleGame";
import Multiplayer from "./pages/Multiplayer";
import Shop from "./pages/Shop";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import { useMultiplayerRoom } from "./lib/multiplayer";
import { isSupabaseConfigured, requestAiHint, supabase } from "./lib/supabase";
import { isRtl, LANGUAGES, translate } from "./i18n/translations";
import {
  DEFAULT_GUEST_NAME,
  DEFAULT_PLAYER_NAME,
  makeId,
  useMemoryValue,
} from "./lib/storage";

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
  const [toast, setToast] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);

  const t = useCallback(
    (key, values) => translate(settings.locale, key, values),
    [settings.locale],
  );
  const profileView = useMemo(() => {
    if (!profile) return null;
    const displayName =
      profile.isGuest && profile.displayName === DEFAULT_GUEST_NAME
        ? t("profile.defaultGuestName")
        : !profile.isGuest && profile.displayName === DEFAULT_PLAYER_NAME
          ? t("profile.defaultPlayerName")
          : profile.displayName;
    return { ...profile, displayName };
  }, [profile, t]);
  const showToast = useCallback((key, values) => {
    setToast({ key, values, id: Date.now() });
  }, []);
  const settingsHydratedRef = useRef(false);
  const hydrationRequestRef = useRef(0);
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
    setLanguageMenuClosing(true);
    languageCloseTimer.current = window.setTimeout(() => {
      setLanguageMenuClosing(false);
      languageCloseTimer.current = null;
    }, 240);
  }, []);

  const hydrateFromSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const requestId = ++hydrationRequestRef.current;
    try {
      const { data, error } = await supabase.rpc("get_app_state");
      if (error) throw error;
      const state = data || {};
      if (requestId !== hydrationRequestRef.current) return;
      if (state.profile?.id) {
        const serverProfile = {
          ...profile,
          ...state.profile,
          isGuest: false,
        };
        setProfiles((current) => ({
          ...current,
          single:
            current.single?.id === serverProfile.id
              ? serverProfile
              : current.single,
          multi:
            current.multi?.id === serverProfile.id
              ? serverProfile
              : current.multi,
        }));
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

      setSettings((current) => ({
        ...current,
        ...preferences,
        locale: preferences.locale || profileState.locale || current.locale,
      }));
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
      showToast("toast.syncUnavailable");
    }
  }, [
    setActivity,
    setInventory,
    setProgress,
    setSettings,
    setWallet,
    showToast,
  ]);

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
  }, [settings.locale, settings.reduceMotion, settings.theme, t]);

  useEffect(() => {
    return () => {
      if (themeTransitionTimer.current)
        window.clearTimeout(themeTransitionTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const setActiveProfile = useCallback(
    (nextOrUpdater) => {
      setProfiles((current) => ({
        ...current,
        [activeMode]:
          typeof nextOrUpdater === "function"
            ? nextOrUpdater(current[activeMode])
            : nextOrUpdater,
      }));
    },
    [activeMode, setProfiles],
  );

  const updateSettings = useCallback(
    (patch) => setSettings((current) => ({ ...current, ...patch })),
    [setSettings],
  );
  useEffect(() => {
    if (
      !isSupabaseConfigured ||
      !profile ||
      profile.isGuest ||
      !settingsHydratedRef.current
    )
      return undefined;
    const timeout = window.setTimeout(() => {
      supabase
        .rpc("update_user_preferences", {
          p_preferences: {
            theme: settings.theme,
            locale: settings.locale,
            sound: settings.sound,
            reduceMotion: settings.reduceMotion,
          },
        })
        .then(({ error }) => {
          if (error) showToast("toast.syncUnavailable");
        });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [profile, settings, showToast]);
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
      const shouldPersist = Boolean(
        isSupabaseConfigured && profile && !profile.isGuest,
      );
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
    defaultName: t("profile.defaultGuestName"),
    locale: settings.locale,
    onRoundWin: recordMultiRoundSafe,
    onMatchWin: recordMultiMatchSafe,
    showToast,
  });

  const purchaseItem = useCallback(
    async (item, mode) => {
      if (!isSupabaseConfigured || !profile || profile.isGuest) {
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
      if (!isSupabaseConfigured || !profile || profile.isGuest) {
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

  const signInGuest = useCallback(
    async (name = DEFAULT_GUEST_NAME) => {
      if (!isSupabaseConfigured) {
        showToast("toast.syncUnavailable");
        return null;
      }
      const { data, error } = await supabase.auth.signInAnonymously({
        data: { display_name: name.trim() || DEFAULT_GUEST_NAME },
      });
      if (error || !data.user) {
        showToast("toast.syncUnavailable");
        return null;
      }
      const next = {
        id: data.user.id,
        displayName: name.trim() || DEFAULT_GUEST_NAME,
        email: data.user.email,
        isGuest: false,
        isAnonymous: true,
        createdAt: new Date().toISOString(),
      };
      setProfiles({ single: next, multi: next });
      showToast("toast.signedIn");
      return next;
    },
    [setProfiles, showToast],
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
        const next = {
          id: data.user.id,
          displayName:
            data.user.user_metadata?.display_name ||
            data.user.email?.split("@")[0] ||
            DEFAULT_PLAYER_NAME,
          email: data.user.email,
          isGuest: false,
          createdAt: new Date().toISOString(),
        };
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
        const displayName =
          String(credentials.name || username).trim() || username;
        if (!username) {
          showToast("auth.signupValidation");
          return null;
        }
        const { data, error } = await supabase.auth.signUp({
          email: String(credentials.email || "")
            .trim()
            .toLowerCase(),
          password: credentials.password,
          options: {
            data: {
              display_name: displayName,
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
          displayName,
          username,
          email: credentials.email,
          isGuest: false,
          createdAt: new Date().toISOString(),
        };
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
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setProfiles({ single: null, multi: null });
    setSettings(initialSettings);
    setProgress(initialProgress);
    setWallet(initialWallet);
    setInventory(initialInventory);
    setActivity([]);
  }, [
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
              : {
                  id: user.id,
                  displayName:
                    user.user_metadata?.display_name ||
                    user.email?.split("@")[0] ||
                    DEFAULT_PLAYER_NAME,
                  email: user.email,
                  isGuest: false,
                  createdAt: new Date().toISOString(),
                },
          multi:
            current.multi?.id === user.id
              ? current.multi
              : {
                  id: user.id,
                  displayName:
                    user.user_metadata?.display_name ||
                    user.email?.split("@")[0] ||
                    DEFAULT_PLAYER_NAME,
                  email: user.email,
                  isGuest: false,
                  createdAt: new Date().toISOString(),
                },
        }));
    });
    return undefined;
  }, [setProfiles]);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          setProfiles({ single: null, multi: null });
          setSettings(initialSettings);
          setProgress(initialProgress);
          setWallet(initialWallet);
          setInventory(initialInventory);
          setActivity([]);
          return;
        }
        if (session?.user && profile?.id !== session.user.id) {
          const next = {
            id: session.user.id,
            displayName:
              session.user.user_metadata?.display_name ||
              session.user.email?.split("@")[0] ||
              DEFAULT_PLAYER_NAME,
            email: session.user.email,
            isGuest: false,
            createdAt: new Date().toISOString(),
          };
          setProfiles((current) => ({ ...current, single: next, multi: next }));
        }
      },
    );
    return () => listener?.subscription?.unsubscribe();
  }, [profile, setProfiles, setSettings]);

  useEffect(() => {
    if (!isSupabaseConfigured || !profile || profile.isGuest) {
      settingsHydratedRef.current = false;
      return;
    }
    settingsHydratedRef.current = false;
    hydrateFromSupabase();
  }, [profile?.id, profile?.isGuest, hydrateFromSupabase]);

  const saveDisplayName = useCallback(
    (name) => {
      const nextName = name.trim();
      setActiveProfile((current) =>
        current
          ? { ...current, displayName: nextName || current.displayName }
          : current,
      );
      if (isSupabaseConfigured && profile && !profile.isGuest && nextName) {
        supabase
          .rpc("update_profile_display_name", { p_display_name: nextName })
          .then(async ({ data, error }) => {
            if (error) showToast("toast.syncUnavailable");
            else {
              if (data) setActiveProfile(data);
              await hydrateFromSupabase();
            }
          });
      }
      showToast("profile.saved");
    },
    [hydrateFromSupabase, profile, setActiveProfile, showToast],
  );

  const resetProgress = useCallback(async () => {
    if (isSupabaseConfigured && profile && !profile.isGuest) {
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
      signInGuest,
      signUp,
      signOut,
      authBusy,
      progress,
      wallet,
      inventory,
      activity,
      toast,
      languageMenuOpen,
      languageMenuClosing,
      onLanguageMenuChange,
      showToast,
      t,
      recordSingleWin,
      purchaseItem,
      equipItem,
      saveDisplayName,
      resetProgress,
      getAiHint,
      playCue,
      multiplayer,
    }),
    [
      activity,
      authBusy,
      equipItem,
      languageMenuClosing,
      languageMenuOpen,
      onLanguageMenuChange,
      getAiHint,
      inventory,
      multiplayer,
      playCue,
      profileView,
      progress,
      purchaseItem,
      recordSingleWin,
      resetProgress,
      saveDisplayName,
      settings,
      showToast,
      signIn,
      signInGuest,
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
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="single" element={<SinglePlayer />} />
          <Route path="single/play" element={<SingleGame />} />
          <Route path="single/shop" element={<Shop mode="single" />} />
          <Route path="single/profile" element={<Profile mode="single" />} />
          <Route path="multi" element={<Multiplayer />} />
          <Route path="multi/play" element={<Multiplayer />} />
          <Route path="multi/shop" element={<Shop mode="multi" />} />
          <Route path="multi/profile" element={<Profile mode="multi" />} />
          <Route path="shop" element={<Navigate to="/single/shop" replace />} />
          <Route
            path="profile"
            element={<Navigate to="/single/profile" replace />}
          />
          <Route path="settings" element={<Settings />} />
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
