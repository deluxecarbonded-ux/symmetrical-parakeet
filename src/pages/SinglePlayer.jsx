import { useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BrainCircuit,
  Check,
  ChevronRight,
  Clock3,
  Coins,
  Flame,
  LockKeyhole,
  Play,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../App";
import {
  Button,
  Card,
  DifficultyBadge,
  LinkButton,
  PageHeader,
  Pill,
  ProgressBar,
  RingProgress,
  SectionHeading,
  StatCard,
} from "../components/Primitives";
import { DIFFICULTIES, getPuzzle } from "../data/puzzles";
import { formatNumber } from "../lib/storage";
import { formatCode, formatLocalizedInteger } from "../lib/numerals";

export default function SinglePlayer() {
  const { t, progress, wallet, profile, settings } = useApp();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState("easy");
  const single = progress.single || {};
  const completed = single.completed?.[difficulty] || [];
  const currentLevel = single.currentLevel?.[difficulty] || 1;
  const best = single.bestScores?.[difficulty] || 0;
  const total = Object.values(single.completed || {}).reduce(
    (sum, levels) => sum + (levels?.length || 0),
    0,
  );
  const completion = Math.round((total / 90) * 100);
  const currentPuzzle = getPuzzle(difficulty, currentLevel);
  const rows = useMemo(
    () => Array.from({ length: 30 }, (_, index) => index + 1),
    [],
  );

  const isUnlocked = (level) =>
    level === 1 || completed.includes(level - 1) || level <= currentLevel;
  const openLevel = (level) => {
    if (!isUnlocked(level)) return;
    if (!profile)
      navigate(`/single/auth?next=${encodeURIComponent("/single")}`);
    else navigate(`/single/play?difficulty=${difficulty}&level=${level}`);
  };

  return (
    <main className="page single-page">
      <PageHeader
        eyebrow={t("single.title")}
        title={t("single.subtitle")}
        actions={
          <div className="header-action-cluster">
            <div className="header-wallet">
              <Coins size={16} />
              <span>{formatNumber(wallet.single, settings.locale)}</span>
              <small>{t("shop.singleBalance")}</small>
            </div>
            <LinkButton
              to="/single/achievements"
              variant="quiet"
              size="sm"
              icon={Award}
            >
              {t("nav.achievements")}
            </LinkButton>
            <LinkButton
              to="/single/leaderboard"
              variant="quiet"
              size="sm"
              icon={Trophy}
            >
              {t("nav.leaderboard")}
            </LinkButton>
            <LinkButton
              to="/single/shop"
              variant="quiet"
              size="sm"
              icon={ShoppingBag}
            >
              {t("nav.shop")}
            </LinkButton>
          </div>
        }
      />

      <div className="mode-banner mode-banner-lime">
        <div className="mode-banner-icon">
          <BrainCircuit size={23} />
        </div>
        <div>
          <span className="section-eyebrow">{t("dashboard.singleMode")}</span>
          <strong>{t("dashboard.singleDesc")}</strong>
        </div>
        <div className="mode-banner-stat">
          <strong>{formatNumber(total, settings.locale)}</strong>
          <span>{t("dashboard.codesCracked")}</span>
        </div>
        <div className="mode-banner-stat">
          <strong>{formatNumber(completion, settings.locale)}%</strong>
          <span>{t("single.progress")}</span>
        </div>
      </div>

      <div className="single-layout">
        <div>
          <SectionHeading
            eyebrow={t("single.difficulty")}
            title={t("single.selectDifficulty")}
          />
          <div className="difficulty-tabs">
            {DIFFICULTIES.map((item) => (
              <button
                key={item.id}
                className={`difficulty-tab ${difficulty === item.id ? "active" : ""} difficulty-tab-${item.id}`}
                onClick={() => setDifficulty(item.id)}
              >
                <span className="difficulty-tab-dot" />
                <span>
                  <strong>{t(`difficulty.${item.id}`)}</strong>
                  <small>{t(`difficulty.${item.id}Description`)}</small>
                </span>
                <b>
                  {formatNumber(
                    progress.single?.completed?.[item.id]?.length || 0,
                    settings.locale,
                  )}
                  /{formatNumber(30, settings.locale)}
                </b>
              </button>
            ))}
          </div>

          <Card className="path-card">
            <div className="path-card-header">
              <div>
                <span className="section-eyebrow">{t("single.path")}</span>
                <h2>
                  {t(`difficulty.${difficulty}`)}{" "}
                  <span>
                    · {t("single.level")}{" "}
                    {formatNumber(currentLevel, settings.locale)}
                  </span>
                </h2>
              </div>
              <Pill
                tone={
                  difficulty === "hard"
                    ? "coral"
                    : difficulty === "medium"
                      ? "violet"
                      : "lime"
                }
              >
                {formatNumber(completed.length, settings.locale)}/
                {formatNumber(30, settings.locale)} {t("single.completed")}
              </Pill>
            </div>
            <div className="path-progress">
              <ProgressBar
                value={completed.length}
                max={30}
                tone={
                  difficulty === "hard"
                    ? "coral"
                    : difficulty === "medium"
                      ? "violet"
                      : "lime"
                }
                label={t("single.progress")}
                showValue
              />
            </div>
            <div className="level-path">
              {rows.map((level) => {
                const done = completed.includes(level);
                const unlocked = isUnlocked(level);
                const active = level === currentLevel && !done;
                const puzzle = getPuzzle(difficulty, level);
                return (
                  <button
                    key={level}
                    className={`level-node ${done ? "done" : ""} ${active ? "active" : ""} ${!unlocked ? "locked" : ""}`}
                    onClick={() => openLevel(level)}
                    aria-label={`${t("single.level")} ${formatNumber(level, settings.locale)}`}
                  >
                    <span className="level-node-number">
                      {done ? (
                        <Check size={15} strokeWidth={3} />
                      ) : !unlocked ? (
                        <LockKeyhole size={14} />
                      ) : (
                        formatNumber(level, settings.locale)
                      )}
                    </span>
                    {level % 5 === 0 && (
                      <small>{formatNumber(level, settings.locale)}</small>
                    )}
                    {active && <span className="node-pulse" />}
                  </button>
                );
              })}
            </div>
            <div className="path-legend">
              <span>
                <i className="legend-dot legend-done" /> {t("single.completed")}
              </span>
              <span>
                <i className="legend-dot legend-current" />{" "}
                {t("single.current")}
              </span>
              <span>
                <i className="legend-dot legend-locked" /> {t("common.locked")}
              </span>
            </div>
          </Card>
        </div>

        <aside className="single-side">
          <Card className="next-level-card">
            <div className="next-level-top">
              <span className="section-eyebrow">{t("single.current")}</span>
              <DifficultyBadge difficulty={difficulty} />
            </div>
            <div className="next-level-number">
              {formatCode(
                String(currentLevel).padStart(2, "0"),
                settings.locale,
              )}
              <span>/ {formatLocalizedInteger(30, settings.locale)}</span>
            </div>
            <h3>{t(`category.${currentPuzzle.category.toLowerCase()}`)}</h3>
            <p>{t(currentPuzzle.promptKey)}</p>
            <Button
              className="full-button"
              onClick={() => openLevel(currentLevel)}
              icon={Play}
            >
              {completed.length ? t("single.resume") : t("single.startLevel")}
            </Button>
            <div className="next-level-foot">
              <span>
                <Trophy size={14} /> {t("single.score")}{" "}
                <strong>
                  {best ? formatNumber(best, settings.locale) : t("common.notAvailable")}
                </strong>
              </span>
              <span>
                <Flame size={14} />{" "}
                {formatNumber(single.solved || 0, settings.locale)}{" "}
                {t("dashboard.codesCracked")}
              </span>
            </div>
          </Card>
          <Card className="single-tip-card">
            <div className="tip-icon">
              <Zap size={18} />
            </div>
            <div>
              <span className="section-eyebrow">
                {t("dashboard.keepGoing")}
              </span>
              <strong>{t("single.hint")}</strong>
              <p>
                {currentPuzzle.answerType === "letters"
                  ? t("puzzle.lettersHint")
                  : t("puzzle.hint", {
                      clues: currentPuzzle.clueKeys
                        .map((key) => t(key))
                        .join(" · "),
                    })}
              </p>
            </div>
          </Card>
          <Card className="single-stats-card">
            <div className="side-card-heading">
              <span className="section-eyebrow">
                {t("profile.soloProgress")}
              </span>
              <RotateCcw size={15} />
            </div>
            <div className="mini-stat-list">
              <div>
                <Target size={15} />
                <span>{t("dashboard.accuracy")}</span>
                <strong>
                  {single.solved
                    ? formatNumber(
                        Math.round(
                          (single.solved / Math.max(1, single.attempts)) * 100,
                        ),
                        settings.locale,
                      )
                    : formatNumber(0, settings.locale)}
                  %
                </strong>
              </div>
              <div>
                <Clock3 size={15} />
                <span>{t("dashboard.roundsPlayed")}</span>
                <strong>
                  {formatNumber(single.solved || 0, settings.locale)}
                </strong>
              </div>
              <div>
                <Trophy size={15} />
                <span>{t("single.score")}</span>
                <strong>
                  {formatNumber(single.score || 0, settings.locale)}
                </strong>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </main>
  );
}
