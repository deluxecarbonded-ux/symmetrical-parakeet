import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Clock3,
  Coins,
  Flame,
  KeyRound,
  LockKeyhole,
  Play,
  Radio,
  Sparkles,
  Target,
  Trophy,
  UsersRound,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../App";
import {
  Button,
  Card,
  EmptyState,
  LinkButton,
  PageHeader,
  Pill,
  ProgressBar,
  RingProgress,
  SectionHeading,
  StatCard,
} from "../components/Primitives";
import { formatDate, formatNumber, getInitials } from "../lib/storage";
import { formatCode } from "../lib/numerals";
import { DIFFICULTIES } from "../data/puzzles";

function HeroVisual() {
  const { t, settings } = useApp();
  const locale = settings.locale || "en";
  return (
    <div className="hero-visual" aria-hidden="true">
      <div className="hero-orbit orbit-one" />
      <div className="hero-orbit orbit-two" />
      <div className="hero-cross cross-one" />
      <div className="hero-cross cross-two" />
      <div className="hero-code-card">
        <div className="code-card-top">
          <span>{t("dashboard.vaultLabel")}</span>
          <span className="live-label">
            <i /> {t("dashboard.live")}
          </span>
        </div>
        <div className="code-digits">
          <b>{formatCode("7", locale)}</b>
          <b>{formatCode("3", locale)}</b>
          <b>{formatCode("1", locale)}</b>
          <b>{formatCode("9", locale)}</b>
        </div>
        <div className="code-card-bottom">
          <span>{t("dashboard.patternFound")}</span>
          <span>{formatNumber(86, locale)}%</span>
        </div>
        <div className="mini-progress">
          <span />
        </div>
      </div>
      <div className="floating-note note-top">
        <Sparkles size={13} /> {t("dashboard.oneClueAtATime")}
      </div>
      <div className="floating-note note-bottom">
        <span className="tiny-check">✓</span> {t("dashboard.signalLocked")}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t, profile, progress, wallet, activity, settings } = useApp();
  const single = progress.single || {};
  const multi = progress.multi || {};
  const totalSolved = (single.solved || 0) + (multi.solved || 0);
  const totalAttempts = (single.attempts || 0) + (multi.solved || 0);
  const accuracy = totalAttempts
    ? Math.round((totalSolved / totalAttempts) * 100)
    : 0;
  const completedLevels = Object.values(single.completed || {}).reduce(
    (sum, levels) => sum + (levels?.length || 0),
    0,
  );
  const currentDifficulty =
    DIFFICULTIES.find((item) => item.id === "easy") || DIFFICULTIES[0];
  const displayName = profile?.displayName || t("dashboard.guest");

  return (
    <main className="page dashboard-page">
      <PageHeader
        eyebrow={t("dashboard.eyebrow")}
        title={<>{t("dashboard.title")}</>}
        description={`${t("dashboard.welcomeNamed", { name: displayName })} ${t("dashboard.subtitle")}`}
        actions={
          <LinkButton
            to={profile ? "/single" : "/single/auth"}
            variant="primary"
            icon={ArrowRight}
          >
            {profile ? t("common.continue") : t("dashboard.beginJourney")}
          </LinkButton>
        }
      />

      <Card className="hero-card">
        <div className="hero-copy">
          <Pill tone="lime" icon={Zap}>
            {t("app.tagline")}
          </Pill>
          <h2>{t("dashboard.subtitle")}</h2>
          <p>{t("dashboard.noProgress")}</p>
          <div className="hero-actions">
            <LinkButton to="/single" variant="primary" icon={Play}>
              {t("common.play")}
            </LinkButton>
            <LinkButton to="/multi" variant="quiet" icon={UsersRound}>
              {t("multi.title")}
            </LinkButton>
          </div>
          <div className="hero-meta">
            <span>
              <LockKeyhole size={13} /> {t("auth.secureNote")}
            </span>
          </div>
        </div>
        <HeroVisual />
      </Card>

      <div className="stat-grid dashboard-stats">
        <StatCard
          label={t("dashboard.codesCracked")}
          value={formatNumber(totalSolved, settings.locale)}
          hint={t("dashboard.setGoal")}
          icon={KeyRound}
          tone="lime"
        />
        <StatCard
          label={t("dashboard.accuracy")}
          value={`${formatNumber(accuracy, settings.locale)}%`}
          hint={
            totalAttempts
              ? t("dashboard.roundsPlayed")
              : t("dashboard.noProgress")
          }
          icon={Target}
          tone="violet"
        />
        <StatCard
          label={t("dashboard.currentStreak")}
          value={
            single.solved
              ? formatNumber(Math.min(99, single.solved), settings.locale)
              : "—"
          }
          hint={t("dashboard.keepGoing")}
          icon={Flame}
          tone="coral"
        />
        <StatCard
          label={t("shop.singleBalance")}
          value={formatNumber(wallet.single, settings.locale)}
          hint={t("shop.multiBalance")}
          icon={Coins}
          tone="blue"
        />
      </div>

      <div className="dashboard-columns">
        <div>
          <SectionHeading
            eyebrow={t("dashboard.chooseMode")}
            title={t("dashboard.modesTitle")}
            action={
              <Link to="/single" className="text-link">
                {t("common.continue")} <ArrowRight size={15} />
              </Link>
            }
          />
          <div className="mode-grid">
            <Link to="/single" className="mode-card mode-card-lime">
              <div className="mode-card-top">
                <span className="mode-icon">
                  <BrainCircuit size={21} />
                </span>
                <Pill tone="light">
                  {t(`difficulty.${currentDifficulty.id}`)}
                </Pill>
              </div>
              <h3>{t("dashboard.singleMode")}</h3>
              <p>{t("dashboard.singleDesc")}</p>
              <div className="mode-card-bottom">
                <span>{t("single.levels")}</span>
                <span className="round-arrow">
                  <ArrowRight size={16} />
                </span>
              </div>
            </Link>
            <Link to="/multi" className="mode-card mode-card-dark">
              <div className="mode-card-top">
                <span className="mode-icon">
                  <Radio size={21} />
                </span>
                <Pill tone="accent">
                  <i className="live-dot" /> {t("multi.roomLive")}
                </Pill>
              </div>
              <h3>{t("dashboard.multiMode")}</h3>
              <p>{t("dashboard.multiDesc")}</p>
              <div className="mode-card-bottom">
                <span>{t("multi.roomLive")}</span>
                <span className="round-arrow">
                  <ArrowRight size={16} />
                </span>
              </div>
            </Link>
          </div>
          <SectionHeading
            className="shop-callout-heading"
            eyebrow={t("nav.shop")}
            title={t("dashboard.quickShop")}
            action={
              <Link to="/single/shop" className="text-link">
                {t("common.continue")} <ArrowRight size={15} />
              </Link>
            }
          />
          <Link to="/single/shop" className="shop-callout">
            <div className="shop-callout-icon">
              <Sparkles size={22} />
            </div>
            <div>
              <strong>{t("dashboard.shopDesc")}</strong>
              <span>
                {t("shop.singleBalance")} ·{" "}
                {formatNumber(wallet.single, settings.locale)}
              </span>
            </div>
            <div className="shop-callout-right">
              <span>{t("common.play")}</span>
              <ArrowRight size={16} />
            </div>
          </Link>
        </div>
        <div>
          <SectionHeading
            eyebrow={t("dashboard.dailyPulse")}
            title={t("dashboard.dailyPulse")}
          />
          <Card className="pulse-card">
            <div className="pulse-card-head">
              <div>
                <span className="section-eyebrow">
                  {t("dashboard.setGoal")}
                </span>
                <strong>
                  {completedLevels
                    ? `${formatNumber(completedLevels, settings.locale)} / ${formatNumber(90, settings.locale)}`
                    : `${formatNumber(0, settings.locale)} / ${formatNumber(90, settings.locale)}`}
                </strong>
              </div>
              <RingProgress
                value={
                  completedLevels ? Math.round((completedLevels / 90) * 100) : 0
                }
                label={`${formatNumber(
                  completedLevels
                    ? Math.round((completedLevels / 90) * 100)
                    : 0,
                  settings.locale,
                )}%`}
                sublabel={t("single.progress")}
                size={112}
              />
            </div>
            <div className="pulse-divider" />
            <div className="pulse-list">
              <div className="pulse-row">
                <span className="pulse-label">
                  <span className="pulse-icon lime">
                    <KeyRound size={14} />
                  </span>
                  {t("dashboard.codesCracked")}
                </span>
                <strong>{formatNumber(totalSolved, settings.locale)}</strong>
              </div>
              <div className="pulse-row">
                <span className="pulse-label">
                  <span className="pulse-icon violet">
                    <BarChart3 size={14} />
                  </span>
                  {t("dashboard.roundsPlayed")}
                </span>
                <strong>
                  {formatNumber(
                    (single.solved || 0) + (multi.matches || 0),
                    settings.locale,
                  )}
                </strong>
              </div>
              <div className="pulse-row">
                <span className="pulse-label">
                  <span className="pulse-icon coral">
                    <Clock3 size={14} />
                  </span>
                  {t("multi.timeAttack")}
                </span>
                <strong>
                  {formatNumber(multi.matches || 0, settings.locale)}
                </strong>
              </div>
            </div>
            <Link to="/single" className="pulse-cta">
              {t("dashboard.keepGoing")} <ArrowRight size={15} />
            </Link>
          </Card>
        </div>
      </div>

      <SectionHeading
        eyebrow={t("dashboard.dailyPulse")}
        title={t("dashboard.noActivity")}
        action={
          activity.length > 0 && (
            <Link to="/settings" className="text-link">
              {t("nav.settings")} <ArrowRight size={15} />
            </Link>
          )
        }
      />
      <Card className="activity-card">
        {activity.length ? (
          <div className="activity-list">
            {activity.slice(0, 5).map((entry) => (
              <div className="activity-row" key={entry.id}>
                <span className={`activity-icon activity-${entry.type}`}>
                  <Trophy size={15} />
                </span>
                <div>
                  <strong>
                    {entry.type === "single"
                      ? `${t("single.title")} · ${t(`difficulty.${entry.difficulty}`)} ${formatNumber(entry.level, settings.locale)}`
                      : entry.type === "multi"
                        ? `${t("multi.title")} · ${t("multi.round")} ${formatNumber(entry.round, settings.locale)}`
                        : t("multi.title")}
                  </strong>
                  <span>{formatDate(entry.at, settings.locale)}</span>
                </div>
                <b>
                  {entry.coins
                    ? `+${formatNumber(entry.coins, settings.locale)}`
                    : entry.score
                      ? `+${formatNumber(entry.score, settings.locale)}`
                      : "—"}
                </b>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Sparkles}
            title={t("dashboard.noProgress")}
            description={t("dashboard.noActivity")}
            action={
              <LinkButton to={profile ? "/single" : "/single/auth"} size="sm">
                {profile ? t("common.start") : t("dashboard.beginJourney")}
              </LinkButton>
            }
          />
        )}
      </Card>
    </main>
  );
}
