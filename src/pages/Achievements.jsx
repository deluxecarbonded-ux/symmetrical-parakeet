import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  BarChart3,
  BrainCircuit,
  Check,
  Clock3,
  Coins,
  Crown,
  Flame,
  Info,
  KeyRound,
  LockKeyhole,
  LogIn,
  Medal,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  UsersRound,
  Zap,
} from "lucide-react";
import { useApp } from "../App";
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  Pill,
  ProgressBar,
  SectionHeading,
  StatCard,
} from "../components/Primitives";
import {
  achievementCopy,
  gameDataStyles,
  getAchievementCopy,
  isRpcSignatureError,
  metricDefinition,
  normalizeMetric,
  normalizeMode,
  normalizeToken,
  safeBoolean,
  safeNumber,
  safeText,
  translateFirst,
  translateOr,
} from "../lib/gameData";
import { formatDate, formatNumber } from "../lib/storage";
import { supabase } from "../lib/supabase";

// Re-exporting the catalog mapping keeps it available to the page-level tests
// and to route modules without making them know about the data helper.
export { achievementCopy };

const ACHIEVEMENT_REFRESH_TABLES = new Set([
  "profiles",
  "single_player_profiles",
  "multiplayer_profiles",
  "single_player_progress",
  "single_player_wallets",
  "multiplayer_wallets",
  "single_player_inventory",
  "multiplayer_inventory",
  "game_events",
  "achievement_definitions",
]);

const achievementIcons = {
  award: Award,
  bar_chart: BarChart3,
  chart: BarChart3,
  coins: Coins,
  crown: Crown,
  flame: Flame,
  key: KeyRound,
  lock: LockKeyhole,
  medal: Medal,
  shield: ShieldCheck,
  spark: Sparkles,
  star: Star,
  target: Target,
  trophy: Trophy,
  zap: Zap,
  brain: BrainCircuit,
  clock: Clock3,
};

function iconForAchievement(item, unlocked) {
  const icon = achievementIcons[normalizeToken(item.icon)];
  if (icon) return icon;
  const identity = `${item.key || ""} ${item.id || ""}`;
  if (identity.includes("speed") || identity.includes("quick")) return Zap;
  if (identity.includes("collector") || identity.includes("treasurer")) {
    return Coins;
  }
  if (identity.includes("score") || identity.includes("high_scorer")) {
    return BarChart3;
  }
  if (unlocked) return Trophy;
  if (normalizeMetric(item.metric) === "wins") return Medal;
  if (
    normalizeMetric(item.metric) === "accuracy" ||
    normalizeMetric(item.metric) === "levels"
  ) {
    return Target;
  }
  return Sparkles;
}

function toneForAchievement(item, isMulti) {
  const metric = normalizeMetric(item.metric);
  if (isMulti) return metric === "wins" ? "violet" : "blue";
  if (metric === "score") return "violet";
  if (metric === "accuracy" || metric === "speed") return "coral";
  if (metric === "wallet" || metric === "inventory") return "blue";
  return "lime";
}

function normalizeAchievement(row, index) {
  const source = row && typeof row === "object" ? row : {};
  const id = safeText(source.id, 120) || safeText(source.key, 120) || `achievement-${index}`;
  const target = Math.max(0, safeNumber(source.target, 0));
  const progress = Math.min(
    target,
    Math.max(0, safeNumber(source.progress, 0)),
  );
  return {
    id,
    key: safeText(source.key, 120) || id,
    titleKey:
      safeText(source.titleKey, 160) || safeText(source.title_key, 160),
    descriptionKey:
      safeText(source.descriptionKey, 160) ||
      safeText(source.description_key, 160),
    icon: safeText(source.icon, 60),
    metric: safeText(source.metric, 80) || "progress",
    target,
    progress,
    unlocked: safeBoolean(source.unlocked),
    unlockedAt:
      safeText(source.unlockedAt, 80) || safeText(source.unlocked_at, 80),
  };
}

function achievementPercent(item) {
  if (item.unlocked) return 100;
  if (item.target <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((item.progress / item.target) * 100)));
}

function formatAchievementDate(value, locale) {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return formatDate(value, locale);
}

async function requestAchievements(mode) {
  if (!supabase) {
    return { data: null, error: { message: "Supabase is not configured" } };
  }

  // game_scope is the name used by the current schema.  p_mode is accepted as
  // a compatibility fallback for the first version of the planned migration.
  const primary = await supabase.rpc("get_achievements", { p_scope: mode });
  if (!primary?.error || !isRpcSignatureError(primary.error)) return primary;

  const fallback = await supabase.rpc("get_achievements", { p_mode: mode });
  if (!fallback?.error) return fallback;
  return fallback.error ? fallback : primary;
}

function AchievementIcon({ item, isMulti }) {
  const Icon = iconForAchievement(item, item.unlocked);
  return (
    <span className={`achievement-icon ${toneForAchievement(item, isMulti)}`}>
      <Icon size={21} strokeWidth={2.1} aria-hidden="true" />
    </span>
  );
}

function AchievementCard({ item, t, locale, isMulti, index }) {
  const copy = getAchievementCopy(item);
  const title = translateFirst(
    t,
    [copy.titleKey, copy.alternateTitleKey, item.titleKey],
    copy.fallbackTitle,
  );
  const description = translateFirst(
    t,
    [item.descriptionKey, copy.descriptionKey, copy.alternateDescriptionKey],
    copy.fallbackDescription,
  );
  const definition = metricDefinition(item.metric);
  const metricName = translateOr(t, definition.labelKey, t("leaderboard.metric"));
  const progressLabel = t("achievements.progress");
  const unlockedLabel = t("achievements.unlocked");
  const lockedLabel = t("common.locked");
  const currentValue = item.unlocked ? item.target : item.progress;
  const targetLabel = item.target > 0 ? formatNumber(item.target, locale) : t("common.notAvailable");
  const valueLabel = formatNumber(currentValue, locale);
  const progressValue = item.unlocked ? item.target : item.progress;
  const date = formatAchievementDate(item.unlockedAt, locale);
  const progressTone = item.unlocked
    ? "lime"
    : isMulti
      ? "violet"
      : toneForAchievement(item, isMulti);

  return (
    <Card
      className={`achievement-card ${item.unlocked ? "unlocked" : "locked"}`}
      aria-labelledby={`achievement-title-${index}`}
    >
      <div className="achievement-card-top">
        <AchievementIcon item={item} isMulti={isMulti} />
        <div className="achievement-card-heading">
          <Pill
            tone={item.unlocked ? "lime" : "neutral"}
            icon={item.unlocked ? Check : LockKeyhole}
          >
            {item.unlocked ? unlockedLabel : lockedLabel}
          </Pill>
          <span className="achievement-metric-label">{metricName}</span>
        </div>
      </div>
      <div className="achievement-card-heading">
        <h3 id={`achievement-title-${index}`}>{title}</h3>
        <p>{description}</p>
      </div>
      <div
        className="achievement-progress"
        aria-label={`${progressLabel}: ${valueLabel} / ${targetLabel}`}
      >
        <div className="achievement-progress-meta">
          <span>{progressLabel}</span>
          <strong>
            {valueLabel} / {targetLabel}
          </strong>
        </div>
        <ProgressBar
          value={progressValue}
          max={Math.max(1, item.target)}
          tone={progressTone}
          showValue
        />
      </div>
      <div className="achievement-card-foot">
        {item.unlocked ? (
          <span className="achievement-unlocked-date">
            <Check size={12} aria-hidden="true" />{" "}
            {date
              ? t("achievements.unlockedOn", { date })
              : unlockedLabel}
          </span>
        ) : (
          <span>
            <Target size={12} aria-hidden="true" />{" "}
            {t("dashboard.keepGoing")}
          </span>
        )}
        <span>{formatNumber(achievementPercent(item), locale)}%</span>
      </div>
    </Card>
  );
}

function AchievementSkeleton({ label }) {
  return (
    <div
      className="achievement-skeleton-grid"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div className="achievement-skeleton-card" key={index} aria-hidden="true">
          <div className="achievement-skeleton-line achievement-skeleton-icon" />
          <div className="achievement-skeleton-line achievement-skeleton-title" />
          <div className="achievement-skeleton-line achievement-skeleton-copy" />
          <div className="achievement-skeleton-line achievement-skeleton-copy short" />
          <div className="achievement-skeleton-line achievement-skeleton-progress" />
        </div>
      ))}
    </div>
  );
}

function AchievementState({ type, t, onRetry, authPath, isSignedIn }) {
  if (type === "auth") {
    return (
      <Card className="achievement-state-card">
        <EmptyState
          icon={ShieldCheck}
          title={t("achievements.authTitle")}
          description={t("achievements.authDescription")}
          action={
            <LinkButton to={authPath} icon={LogIn} size="sm">
              {t("nav.signIn")}
            </LinkButton>
          }
        />
      </Card>
    );
  }

  if (type === "error") {
    return (
      <Card className="achievement-state-card">
        <EmptyState
          icon={Info}
          title={t("achievements.errorTitle")}
          description={t("achievements.errorDescription")}
          action={
            <Button onClick={onRetry} icon={RefreshCw} size="sm">
              {t("common.retry")}
            </Button>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="achievement-state-card">
      <EmptyState
        icon={Trophy}
        title={t("achievements.title")}
        description={t("achievements.empty")}
        action={
          isSignedIn ? (
            <Button onClick={onRetry} icon={RefreshCw} size="sm">
              {t("common.refresh")}
            </Button>
          ) : null
        }
      />
    </Card>
  );
}

export default function Achievements({ mode = "single" }) {
  const { t, profile, settings, realtimeEvent } = useApp();
  const normalizedMode = normalizeMode(mode);
  const isMulti = normalizedMode === "multi";
  const isSignedIn = Boolean(profile);
  const locale = settings?.locale || "en";
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(isSignedIn ? "loading" : "auth");
  const [, setError] = useState(null);
  const requestId = useRef(0);

  const loadAchievements = useCallback(async ({ silent = false } = {}) => {
    const currentRequest = ++requestId.current;
    if (!isSignedIn) {
      setItems([]);
      setError(null);
      setStatus("auth");
      return;
    }

    if (!silent) {
      setItems([]);
      setError(null);
      setStatus("loading");
    }
    try {
      const response = await requestAchievements(normalizedMode);
      if (currentRequest !== requestId.current) return;
      if (response?.error) {
        setError(response.error);
        if (!silent) setStatus("error");
        return;
      }
      const rows = Array.isArray(response?.data) ? response.data : [];
      setItems(rows.map(normalizeAchievement));
      setStatus("success");
    } catch (requestError) {
      if (currentRequest !== requestId.current) return;
      setError(requestError);
      if (!silent) setStatus("error");
    }
  }, [isSignedIn, normalizedMode]);

  useEffect(() => {
    void loadAchievements();
    return () => {
      requestId.current += 1;
    };
  }, [loadAchievements]);

  useEffect(() => {
    if (
      !isSignedIn ||
      !realtimeEvent?.id ||
      !ACHIEVEMENT_REFRESH_TABLES.has(realtimeEvent.table)
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      void loadAchievements({ silent: true });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isSignedIn, loadAchievements, realtimeEvent?.id, realtimeEvent?.table]);

  const summary = useMemo(() => {
    const total = items.length;
    const unlocked = items.filter((item) => item.unlocked).length;
    return {
      total,
      unlocked,
      locked: Math.max(0, total - unlocked),
      percent: total ? Math.round((unlocked / total) * 100) : 0,
    };
  }, [items]);

  const authPath = `/${normalizedMode}/auth?next=${encodeURIComponent(
    `/${normalizedMode}/achievements`,
  )}`;
  const modeLabel = t(isMulti ? "dashboard.multiMode" : "dashboard.singleMode");
  const pageTitle = t("achievements.title");
  const pageDescription = t("achievements.subtitle");
  const leaderboardTitle = t("leaderboard.title");

  return (
    <main
      className={`page achievements-page ${settings?.reduceMotion ? "reduce-motion-safe" : ""}`}
    >
      <style>{gameDataStyles}</style>
      <PageHeader
        eyebrow={t("achievements.eyebrow")}
        title={pageTitle}
        description={pageDescription}
        actions={
          <div className="header-action-cluster">
            <Pill tone={isMulti ? "violet" : "lime"} icon={isMulti ? UsersRound : BrainCircuit}>
              {modeLabel}
            </Pill>
            {isSignedIn ? (
              <LinkButton
                to={`/${normalizedMode}/leaderboard`}
                variant="quiet"
                size="sm"
                icon={Trophy}
              >
                {leaderboardTitle}
              </LinkButton>
            ) : (
              <LinkButton to={authPath} size="sm" icon={LogIn}>
                {t("nav.signIn")}
              </LinkButton>
            )}
          </div>
        }
      />

      <div className={`achievement-mode-strip ${isMulti ? "multi" : ""}`}>
        <div className="achievement-mode-mark" aria-hidden="true">
          {isMulti ? <UsersRound size={25} /> : <BrainCircuit size={25} />}
        </div>
        <div className="achievement-mode-copy">
          <span className="section-eyebrow">
            {t("achievements.modeLabel")}
          </span>
          <h2>{modeLabel}</h2>
          <p>
            {t(isMulti ? "dashboard.multiDesc" : "dashboard.singleDesc")}
          </p>
        </div>
        <div className="achievement-mode-total">
          <strong>
            {formatNumber(summary.unlocked, locale)} / {formatNumber(summary.total, locale)}
          </strong>
          <span>
            {t("achievements.unlockedCount")}
          </span>
        </div>
      </div>

      {status === "loading" ? (
        <AchievementSkeleton
          label={t("achievements.loading")}
        />
      ) : (status === "auth" || status === "error" || (status === "success" && !items.length)) ? (
        <AchievementState
          type={status === "success" ? "empty" : status}
          t={t}
          onRetry={() => void loadAchievements()}
          authPath={authPath}
          isSignedIn={isSignedIn}
        />
      ) : (
        <>
          <div
            className="achievement-summary-grid"
            aria-label={t("achievements.summary")}
          >
            <StatCard
              label={t("achievements.unlocked")}
              value={formatNumber(summary.unlocked, locale)}
              hint={t("achievements.unlockedHint")}
              icon={Trophy}
              tone="lime"
            />
            <StatCard
              label={t("achievements.total")}
              value={formatNumber(summary.total, locale)}
              hint={t("achievements.totalHint")}
              icon={Target}
              tone="violet"
            />
            <StatCard
              label={t("single.progress")}
              value={`${formatNumber(summary.percent, locale)}%`}
              hint={
                summary.locked
                  ? t("achievements.remaining", {
                      count: formatNumber(summary.locked, locale),
                    })
                  : t("achievements.allUnlocked")
              }
              icon={BarChart3}
              tone="coral"
            />
          </div>
          <SectionHeading
            eyebrow={t("achievements.catalog")}
            title={t("achievements.all")}
            action={
              <Pill tone="neutral" icon={Sparkles}>
                {t("achievements.live")}
              </Pill>
            }
          />
          <div className="achievement-grid">
            {items.map((item, index) => (
              <AchievementCard
                key={`${item.id}-${index}`}
                item={item}
                t={t}
                locale={locale}
                isMulti={isMulti}
                index={index}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
