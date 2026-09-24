import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  Crown,
  Gamepad2,
  Info,
  LogIn,
  Medal,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
} from "lucide-react";
import { useApp } from "../App";
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  Pill,
  SectionHeading,
} from "../components/Primitives";
import SelectMenu from "../components/SelectMenu";
import {
  defaultMetric,
  gameDataStyles,
  getInitialsForUsername,
  getMetricOptions,
  getSafeAvatarMediaType,
  getSafeAvatarUrl,
  isPercentageMetric,
  isRpcSignatureError,
  metricDefinition,
  normalizeMode,
  safeBoolean,
  safeNumber,
  safeText,
  translateOr,
} from "../lib/gameData";
import { formatNumber } from "../lib/storage";
import { supabase } from "../lib/supabase";

async function requestLeaderboard({ mode, metric, limit }) {
  if (!supabase) {
    return { data: null, error: { message: "Supabase is not configured" } };
  }

  const primary = await supabase.rpc("get_leaderboard", {
    p_scope: mode,
    p_metric: metric,
    p_limit: limit,
  });
  if (!primary?.error || !isRpcSignatureError(primary.error)) return primary;

  // Keep the page tolerant of the p_mode spelling used by an earlier draft of
  // the migration while p_scope remains the canonical schema argument.
  const fallback = await supabase.rpc("get_leaderboard", {
    p_mode: mode,
    p_metric: metric,
    p_limit: limit,
  });
  if (!fallback?.error) return fallback;
  return fallback.error ? fallback : primary;
}

function normalizeLeaderboardRow(row, index, selectedMetric) {
  const source = row && typeof row === "object" ? row : {};
  const username = safeText(source.username, 40).replace(/[<>]/g, "");
  const rank = Math.max(1, Math.round(safeNumber(source.rank, index + 1)));
  return {
    rank,
    // The RPC's username and avatar columns are the only identity fields this
    // page is allowed to consume.
    username: username || "Player",
    avatar_url:
      safeText(source.avatar_url, 2048) || safeText(source.avatar_path, 2048),
    avatar_bucket: safeText(source.avatar_bucket, 80),
    avatar_media_type: safeText(source.avatar_media_type, 80),
    metric: safeText(source.metric, 80) || selectedMetric,
    value: Math.max(0, safeNumber(source.value, 0)),
    is_current_user: safeBoolean(source.is_current_user),
  };
}

function avatarTone(row) {
  if (row.is_current_user) return "lime";
  if (row.rank === 1) return "gold";
  if (row.rank === 2) return "violet";
  if (row.rank === 3) return "coral";
  return "blue";
}

function SafeAvatar({ row, reduceMotion }) {
  const [failed, setFailed] = useState(false);
  const source = getSafeAvatarUrl(row);
  const mediaType = getSafeAvatarMediaType(row);
  const isVideo = mediaType.startsWith("video/");

  useEffect(() => {
    setFailed(false);
  }, [source]);

  const initials = getInitialsForUsername(row.username, "?");

  // A paused video can still animate while loading in some browsers.  Use the
  // safe initials fallback when the user has explicitly reduced motion.
  if (!source || !mediaType || failed || (isVideo && reduceMotion)) {
    return (
      <span
        className={`leaderboard-avatar-fallback ${avatarTone(row)}`}
        aria-hidden="true"
      >
        {initials}
      </span>
    );
  }

  return (
    <span className="global-leaderboard-avatar" aria-hidden="true">
      {isVideo ? (
        <video
          src={source}
          muted
          autoPlay
          loop={!reduceMotion}
          playsInline
          preload="metadata"
          onError={() => setFailed(true)}
        />
      ) : (
        <img
          src={source}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

function LeaderboardRow({ row, t, locale, selectedMetric, isMulti, reduceMotion }) {
  const definition = metricDefinition(row.metric || selectedMetric);
  const metricName = translateOr(t, definition.labelKey, definition.fallback);
  const value = formatNumber(row.value, locale);
  const displayValue = isPercentageMetric(row.metric || selectedMetric)
    ? `${value}%`
    : value;
  const rankClass = row.rank <= 3 ? `top-${row.rank}` : "";
  const RankIcon = row.rank === 1 ? Crown : row.rank === 2 ? Medal : row.rank === 3 ? Award : null;

  return (
    <div
      className={`global-leaderboard-row ${
        row.is_current_user ? "current current-user" : ""
      }`}
      role="listitem"
      aria-current={row.is_current_user ? "true" : undefined}
      aria-label={`${formatNumber(row.rank, locale)}. ${row.username}`}
    >
      <span
        className={`global-leaderboard-rank ${rankClass}`}
        aria-label={formatNumber(row.rank, locale)}
      >
        {RankIcon ? <RankIcon size={14} aria-hidden="true" /> : formatNumber(row.rank, locale)}
      </span>
      <SafeAvatar row={row} reduceMotion={reduceMotion} />
      <div className="global-leaderboard-player">
        <div>
          <strong title={row.username}>{row.username}</strong>
          {row.is_current_user && (
            <span className="global-leaderboard-you">
              {translateOr(t, "leaderboard.you", "You")}
            </span>
          )}
        </div>
        <small>{metricName}</small>
      </div>
      <div className="global-leaderboard-value">
        <strong>{displayValue}</strong>
        <span>
          {translateOr(
            t,
            isMulti ? "nav.multi" : "nav.single",
            isMulti ? "Duel" : "Solo",
          )}
        </span>
      </div>
    </div>
  );
}

function LeaderboardSkeleton({ label }) {
  return (
    <div
      className="leaderboard-skeleton-list"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {Array.from({ length: 7 }, (_, index) => (
        <div className="leaderboard-skeleton-row" key={index} aria-hidden="true">
          <div className="leaderboard-skeleton-block rank" />
          <div className="leaderboard-skeleton-block avatar" />
          <div className="leaderboard-skeleton-lines">
            <div className="leaderboard-skeleton-block name" />
            <div className="leaderboard-skeleton-line" />
          </div>
          <div className="leaderboard-skeleton-block value" />
        </div>
      ))}
    </div>
  );
}

function LeaderboardState({ type, t, onRetry, authPath, isSignedIn }) {
  if (type === "auth") {
    return (
      <Card className="achievement-state-card">
        <EmptyState
          icon={LogIn}
          title={translateOr(t, "leaderboard.authTitle", "Sign in to see your place")}
          description={translateOr(
            t,
            "leaderboard.authDescription",
            "Sign in to view the rankings and your current position.",
          )}
          action={
            <LinkButton to={authPath} icon={LogIn} size="sm">
              {translateOr(t, "nav.signIn", "Sign in")}
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
          title={translateOr(
            t,
            "leaderboard.errorTitle",
            "The rankings are temporarily offline",
          )}
          description={translateOr(
            t,
            "toast.syncUnavailable",
            "We could not load the rankings. Check your connection and try again.",
          )}
          action={
            <div className="header-action-cluster">
              <Button onClick={onRetry} icon={RefreshCw} size="sm">
                {translateOr(t, "common.retry", "Try again")}
              </Button>
              {!isSignedIn && (
                <LinkButton to={authPath} variant="quiet" size="sm" icon={LogIn}>
                  {translateOr(t, "nav.signIn", "Sign in")}
                </LinkButton>
              )}
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <Card className="achievement-state-card">
      <EmptyState
        icon={Trophy}
        title={translateOr(t, "leaderboard.title", "Leaderboard")}
        description={translateOr(
          t,
          "leaderboard.empty",
          "Be the first player to put a signal on the board.",
        )}
        action={
          <div className="header-action-cluster">
            {isSignedIn && (
              <Button onClick={onRetry} icon={RefreshCw} size="sm">
                {translateOr(t, "common.refresh", "Refresh")}
              </Button>
            )}
            {!isSignedIn && (
              <LinkButton to={authPath} size="sm" icon={LogIn}>
                {translateOr(t, "nav.signIn", "Sign in")}
              </LinkButton>
            )}
          </div>
        }
      />
    </Card>
  );
}

export default function Leaderboard({
  mode = "single",
  metric: metricProp,
  limit = 50,
}) {
  const { t, profile, settings } = useApp();
  const normalizedMode = normalizeMode(mode);
  const isMulti = normalizedMode === "multi";
  const isSignedIn = Boolean(profile);
  const locale = settings?.locale || "en";
  const reduceMotion = Boolean(settings?.reduceMotion);
  const safeLimit = Math.min(100, Math.max(1, Math.round(safeNumber(limit, 50))));
  const fallbackMetric = metricProp || defaultMetric[normalizedMode];
  const [metricSelection, setMetricSelection] = useState({
    mode: normalizedMode,
    value: fallbackMetric,
  });
  const metric =
    metricProp ||
    (metricSelection.mode === normalizedMode
      ? metricSelection.value
      : fallbackMetric);
  const setMetric = (value) =>
    setMetricSelection({ mode: normalizedMode, value });
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading");
  const [, setError] = useState(null);
  const requestId = useRef(0);

  const loadLeaderboard = useCallback(async () => {
    const currentRequest = ++requestId.current;
    if (!isSignedIn) {
      setRows([]);
      setError(null);
      setStatus("auth");
      return;
    }
    setStatus("loading");
    setError(null);
    try {
      const response = await requestLeaderboard({
        mode: normalizedMode,
        metric,
        limit: safeLimit,
      });
      if (currentRequest !== requestId.current) return;
      if (response?.error) {
        setError(response.error);
        setStatus("error");
        return;
      }
      const data = Array.isArray(response?.data) ? response.data : [];
      setRows(
        data
          .map((row, index) => normalizeLeaderboardRow(row, index, metric))
          .sort((left, right) => left.rank - right.rank),
      );
      setStatus("success");
    } catch (requestError) {
      if (currentRequest !== requestId.current) return;
      setError(requestError);
      setStatus("error");
    }
  }, [isSignedIn, metric, normalizedMode, safeLimit]);

  useEffect(() => {
    void loadLeaderboard();
    return () => {
      requestId.current += 1;
    };
  }, [loadLeaderboard]);

  const metricChoices = useMemo(() => {
    const available = rows.map((row) => row.metric);
    const choices = getMetricOptions(normalizedMode, available);
    if (!choices.some((choice) => choice.value === metric)) {
      choices.push({ value: metric, key: metric });
    }
    return choices.map((choice) => {
      const definition = metricDefinition(choice.value);
      return {
        value: choice.value,
        label: translateOr(t, definition.labelKey, definition.fallback),
      };
    });
  }, [metric, normalizedMode, rows, t]);

  const selectedDefinition = metricDefinition(metric);
  const selectedMetricLabel = translateOr(
    t,
    selectedDefinition.labelKey,
    selectedDefinition.fallback,
  );
  const authPath = `/${normalizedMode}/auth?next=${encodeURIComponent(
    `/${normalizedMode}/leaderboard`,
  )}`;
  const pageTitle = translateOr(t, "leaderboard.title", "Leaderboard");
  const pageDescription = translateOr(
    t,
    "leaderboard.subtitle",
    "See who has found the sharpest pattern.",
  );
  const modeLabel = translateOr(
    t,
    isMulti ? "dashboard.multiMode" : "dashboard.singleMode",
    isMulti ? "Live duel" : "Solo sprint",
  );

  return (
    <main className={`page leaderboard-page ${reduceMotion ? "reduce-motion-safe" : ""}`}>
      <style>{gameDataStyles}</style>
      <PageHeader
        eyebrow={translateOr(t, "leaderboard.eyebrow", "THE SIGNAL BOARD")}
        title={pageTitle}
        description={pageDescription}
        actions={
          <div className="header-action-cluster">
            <Pill tone={isMulti ? "violet" : "lime"} icon={isMulti ? UsersRound : Gamepad2}>
              {modeLabel}
            </Pill>
            {isSignedIn ? (
              <LinkButton
                to={`/${normalizedMode}/achievements`}
                variant="quiet"
                size="sm"
                icon={Sparkles}
              >
                {translateOr(t, "achievements.title", "Achievements")}
              </LinkButton>
            ) : (
              <LinkButton to={authPath} size="sm" icon={LogIn}>
                {translateOr(t, "nav.signIn", "Sign in")}
              </LinkButton>
            )}
          </div>
        }
      />

      <Card className="leaderboard-controls-card">
        <div className="leaderboard-controls-copy">
          <span className="section-eyebrow">
            {translateOr(t, "leaderboard.rankBy", "RANK BY")}
          </span>
          <h2>{selectedMetricLabel}</h2>
        </div>
        <div className="leaderboard-metric-control">
          <span>{translateOr(t, "leaderboard.metric", "Metric")}</span>
          <SelectMenu
            className="leaderboard-select"
            value={metric}
            options={metricChoices}
            onChange={setMetric}
            ariaLabel={translateOr(t, "leaderboard.metric", "Metric")}
          />
        </div>
      </Card>

      {!isSignedIn && (
        <Card className="leaderboard-auth-note">
          <Info size={17} aria-hidden="true" />
          <div>
            <strong>
              {translateOr(
                t,
                "leaderboard.authTitle",
                "Sign in to see your place",
              )}
            </strong>
            <span>
              {translateOr(
                t,
                "auth.subtitle",
                "The public board is available, but your position needs an account.",
              )}
            </span>
          </div>
          <LinkButton to={authPath} variant="quiet" size="sm" icon={LogIn}>
            {translateOr(t, "nav.signIn", "Sign in")}
          </LinkButton>
        </Card>
      )}

      {status === "loading" ? (
        <Card className="leaderboard-list-card">
          <div className="leaderboard-list-heading">
            <div>
              <span className="section-eyebrow">
                {translateOr(t, "leaderboard.board", "LIVE BOARD")}
              </span>
              <h2>{selectedMetricLabel}</h2>
            </div>
            <span>
              {translateOr(t, "leaderboard.loading", "Loading…")}
            </span>
          </div>
          <LeaderboardSkeleton
            label={translateOr(t, "leaderboard.loading", "Loading…")}
          />
        </Card>
      ) : (status === "auth" || status === "error" || (status === "success" && !rows.length)) ? (
        <LeaderboardState
          type={status === "success" ? "empty" : status}
          t={t}
          onRetry={() => void loadLeaderboard()}
          authPath={authPath}
          isSignedIn={isSignedIn}
        />
      ) : (
        <>
          <SectionHeading
            eyebrow={translateOr(t, "leaderboard.board", "LIVE BOARD")}
            title={selectedMetricLabel}
            action={
              <Pill tone="neutral" icon={Target}>
                {formatNumber(rows.length, locale)}{" "}
                {translateOr(t, "leaderboard.player", "players")}
              </Pill>
            }
          />
          <Card className="leaderboard-list-card">
            <div className="leaderboard-list-heading">
              <div>
                <span className="section-eyebrow">
                  {translateOr(t, "leaderboard.rank", "RANK")}
                </span>
                <h2>{selectedMetricLabel}</h2>
              </div>
              <span>
                {translateOr(t, "leaderboard.updated", "Server ranked")}
              </span>
            </div>
            <div className="global-leaderboard-list" role="list">
              {rows.map((row, index) => (
                <LeaderboardRow
                  key={`${row.rank}-${row.username}-${index}`}
                  row={row}
                  t={t}
                  locale={locale}
                  selectedMetric={metric}
                  isMulti={isMulti}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>
          </Card>
        </>
      )}
    </main>
  );
}
