import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  Clock3,
  Eye,
  EyeOff,
  Flag,
  Hash,
  Lightbulb,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  TimerReset,
  Trophy,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../App";
import {
  Button,
  Card,
  CodeSlots,
  DifficultyBadge,
  Pill,
  ProgressBar,
  WordSlots,
} from "../components/Primitives";
import { LettersPad, Numpad } from "../components/AnswerPad";
import { DIFFICULTIES, getPuzzle } from "../data/puzzles";
import {
  formatCode,
  formatLocalizedInteger,
  formatPuzzleAnswer,
  formatTimer,
  isPuzzleAnswerCorrect,
} from "../lib/numerals";

export default function SingleGame() {
  const {
    t,
    settings,
    profile,
    recordSingleWin,
    getAiHint,
    showToast,
    playCue,
  } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedDifficulty = params.get("difficulty");
  const difficulty = DIFFICULTIES.some(
    (item) => item.id === requestedDifficulty,
  )
    ? requestedDifficulty
    : "easy";
  const initialLevel = Math.min(
    30,
    Math.max(1, Number(params.get("level") || 1)),
  );
  const [level, setLevel] = useState(initialLevel);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(Date.now());
  const inputRef = useRef(null);
  const puzzle = useMemo(
    () => getPuzzle(difficulty, level),
    [difficulty, level],
  );
  const locale = settings.locale || "en";
  const expectedAnswer =
    puzzle.answerType === "letters" ? t(puzzle.answerKey) : puzzle.answer;
  const localizedClues = puzzle.clueKeys.length
    ? puzzle.clueKeys.map((key) => t(key)).join(" · ")
    : t("puzzle.lettersHint");
  const fallbackHint =
    puzzle.answerType === "letters"
      ? t("puzzle.lettersHint")
      : t("puzzle.hint", { clues: localizedClues });
  const answerLength = puzzle.answerType === "digits" ? 4 : 0;
  const score = Math.max(
    10,
    puzzle.points * 4 - attempts * 8 - Math.floor(elapsed / 12),
  );
  const isComplete = level === 30 && result?.correct;

  useEffect(() => {
    setAnswer("");
    setAttempts(0);
    setHint("");
    setResult(null);
    setElapsed(0);
    setStartedAt(Date.now());
  }, [difficulty, level]);

  useEffect(() => {
    if (result?.correct) return undefined;
    const timer = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [result?.correct, startedAt]);

  const clearAnswer = () => setAnswer("");
  const updateAnswer = (value) => {
    if (result?.correct) return;
    setAnswer(value);
  };

  const submit = async () => {
    const complete =
      answerLength === 4 ? answer.length === 4 : Boolean(answer.trim());
    if (!complete || result?.correct) return;
    if (!profile) {
      navigate(
        `/single/auth?next=${encodeURIComponent(`/single/play?difficulty=${difficulty}&level=${level}`)}`,
      );
      return;
    }
    const nextAttempts = attempts + 1;
    setAttempts(nextAttempts);
    if (isPuzzleAnswerCorrect(puzzle, answer, expectedAnswer, locale)) {
      const persisted = await recordSingleWin({
        difficulty,
        level,
        score,
        attempts: nextAttempts,
        time: elapsed,
        answer: puzzle.answer,
        submittedAnswer: answer,
        answerType: puzzle.answerType,
        code: puzzle.answerType === "digits" ? puzzle.answer : null,
      });
      if (!persisted) {
        setResult({ correct: false });
        return;
      }
      setResult({ correct: true, answer: expectedAnswer });
      playCue("success");
    } else {
      playCue("wrong");
      setResult({ correct: false });
      if (nextAttempts === 2) setHint(fallbackHint);
    }
  };

  const useHint = async () => {
    if (hint) return;
    setAiLoading(true);
    const response = await getAiHint(puzzle);
    setHint(response || fallbackHint);
    setAiLoading(false);
  };

  const nextLevel = () => {
    if (level >= 30) navigate("/single");
    else {
      setLevel((current) => current + 1);
      navigate(`/single/play?difficulty=${difficulty}&level=${level + 1}`, {
        replace: true,
      });
    }
  };

  return (
    <main className="page game-page">
      <div className="game-topline">
        <button className="back-link" onClick={() => navigate("/single")}>
          <ArrowLeft size={16} /> {t("single.backToMap")}
        </button>
        <div className="game-top-meta">
          <Pill tone="lime">
            <BrainCircuit size={13} /> {t("single.title")}
          </Pill>
          <span className="game-timer">
            <Clock3 size={15} /> {formatTimer(elapsed, locale)}
          </span>
        </div>
      </div>
      <div className="game-heading">
        <div>
          <div className="eyebrow">
            {t("single.level")}{" "}
            {formatCode(String(level).padStart(2, "0"), locale)} /{" "}
            {formatLocalizedInteger(30, locale)}
          </div>
          <h1>{t("single.question")}</h1>
        </div>
        <div className="game-heading-actions">
          <DifficultyBadge difficulty={difficulty} />
          <button
            className="icon-button game-flag"
            title={t("single.reportClue")}
          >
            <Flag size={16} />
          </button>
        </div>
      </div>
      <div className="game-progress">
        <ProgressBar
          value={result?.correct ? level : level - 1}
          max={30}
          tone={
            difficulty === "hard"
              ? "coral"
              : difficulty === "medium"
                ? "violet"
                : "lime"
          }
        />
        <span>
          {formatLocalizedInteger(result?.correct ? level : level - 1, locale)}{" "}
          / {formatLocalizedInteger(30, locale)} {t("single.completed")}
        </span>
      </div>

      <div className="game-layout">
        <div className="game-main">
          <Card className={`clue-card clue-${difficulty}`}>
            <div className="clue-card-top">
              <div className="clue-category">
                <span className="clue-symbol">
                  <Sparkles size={17} />
                </span>
                <div>
                  <span className="section-eyebrow">
                    {t(`category.${puzzle.category.toLowerCase()}`)}
                  </span>
                  <strong>{t("single.question")}</strong>
                </div>
              </div>
              <span className="clue-index">
                {formatCode(String(level).padStart(2, "0"), locale)}
              </span>
            </div>
            <p className="clue-prompt">{t(puzzle.promptKey)}</p>
            <div className="clue-footer">
              <span>
                <Hash size={15} /> {t(`puzzle.answerType.${puzzle.answerType}`)}
              </span>
              <span>
                <Trophy size={15} />{" "}
                {formatLocalizedInteger(puzzle.points, locale)}{" "}
                {t("single.score")}
              </span>
              <span>
                <TimerReset size={15} /> {t("dashboard.setGoal")}
              </span>
            </div>
          </Card>

          <Card
            className={`code-card ${result?.correct ? "code-card-correct" : result?.correct === false ? "code-card-wrong" : ""}`}
          >
            <div className="code-card-heading">
              <div>
                <span className="section-eyebrow">
                  {puzzle.answerType === "letters"
                    ? t("single.enterWord")
                    : t("single.enterCode")}
                </span>
                <h2>
                  {result?.correct
                    ? t("single.correct")
                    : result?.correct === false
                      ? t("single.incorrect")
                      : puzzle.answerType === "letters"
                        ? t("single.enterWord")
                        : t("single.enterCode")}
                </h2>
              </div>
              <span className="attempt-count">
                {formatLocalizedInteger(attempts, locale)}{" "}
                {t("single.attempts")}
              </span>
            </div>
            {puzzle.answerType === "digits" ? (
              <CodeSlots
                value={answer}
                displayValue={formatCode(answer, locale)}
                invalid={result?.correct === false}
              />
            ) : (
              <WordSlots
                value={answer}
                placeholder={t("single.wordPlaceholder")}
                invalid={result?.correct === false}
              />
            )}
            {result?.correct ? (
              <div className="result-banner result-success">
                <span className="result-icon">
                  <Check size={20} />
                </span>
                <div>
                  <strong>{t("single.correct")}</strong>
                  <span>
                    {t(
                      puzzle.answerType === "letters"
                        ? "single.wordAnswerIs"
                        : "single.answerIs",
                    )}{" "}
                    <b>{formatPuzzleAnswer(puzzle, expectedAnswer, locale)}</b>{" "}
                    · +{formatLocalizedInteger(score, locale)}{" "}
                    {t("single.score")}
                  </span>
                </div>
              </div>
            ) : result?.correct === false ? (
              <div className="result-banner result-error">
                <span className="result-icon">
                  <X size={19} />
                </span>
                <div>
                  <strong>{t("single.incorrect")}</strong>
                  <span>
                    {hint ? t("single.hintUsed") : t("dashboard.keepGoing")}
                  </span>
                </div>
              </div>
            ) : (
              <p className="code-instruction">
                {puzzle.answerType === "letters"
                  ? t("single.enterWord")
                  : t("single.enterCode")}{" "}
                <span>·</span> {localizedClues}
              </p>
            )}
            {!result?.correct && (
              <div className="code-actions">
                <Button
                  onClick={submit}
                  disabled={
                    puzzle.answerType === "digits"
                      ? answer.length !== 4
                      : !answer.trim()
                  }
                  icon={LockKeyhole}
                >
                  {t("single.submit")}
                </Button>
                <Button
                  variant="quiet"
                  onClick={useHint}
                  disabled={aiLoading || Boolean(hint)}
                  icon={Lightbulb}
                >
                  {aiLoading
                    ? t("common.loading")
                    : hint
                      ? t("single.hintUsed")
                      : t("single.hint")}
                </Button>
              </div>
            )}
            {result?.correct && (
              <div className="code-actions">
                <Button onClick={nextLevel} iconAfter={ArrowRight}>
                  {level === 30 ? t("single.backToMap") : t("single.nextLevel")}
                </Button>
                <Button
                  variant="quiet"
                  onClick={() => {
                    setResult(null);
                    setAnswer("");
                    setAttempts(0);
                    setHint("");
                  }}
                  icon={RotateCcw}
                >
                  {t("single.tryAgain")}
                </Button>
              </div>
            )}
          </Card>
        </div>

        <aside className="game-side">
          {puzzle.answerType === "digits" ? (
            <Numpad
              value={answer}
              onChange={updateAnswer}
              onSubmit={submit}
              onClear={clearAnswer}
              t={t}
              locale={locale}
              disabled={Boolean(result?.correct)}
              inputRef={inputRef}
            />
          ) : (
            <LettersPad
              value={answer}
              onChange={updateAnswer}
              onSubmit={submit}
              onClear={clearAnswer}
              t={t}
              locale={locale}
              disabled={Boolean(result?.correct)}
              inputRef={inputRef}
            />
          )}
          {hint && (
            <Card className="hint-card">
              <div className="hint-card-title">
                <span className="hint-icon">
                  <Lightbulb size={16} />
                </span>
                <strong>{t("single.hintUsed")}</strong>
              </div>
              <p>{hint}</p>
            </Card>
          )}
          <Card className="score-card">
            <div className="side-card-heading">
              <span className="section-eyebrow">{t("single.score")}</span>
              <Trophy size={15} />
            </div>
            <strong className="score-number">
              {formatLocalizedInteger(score, locale)}
            </strong>
            <div className="score-bar">
              <span style={{ width: `${Math.min(100, score / 2)}%` }} />
            </div>
            <p>{t("dashboard.keepGoing")}</p>
          </Card>
          <div className="game-tip">
            <Sparkles size={15} />
            <span>{localizedClues}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
