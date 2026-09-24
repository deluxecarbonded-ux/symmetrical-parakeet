import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  Clock3,
  Copy,
  Crown,
  Gamepad2,
  Hash,
  Info,
  LockKeyhole,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Target,
  Timer,
  Trophy,
  UserPlus,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../App";
import {
  Button,
  Card,
  CodeSlots,
  LinkButton,
  PageHeader,
  Pill,
  ProgressBar,
  SectionHeading,
  WordSlots,
} from "../components/Primitives";
import { LettersPad, Numpad } from "../components/AnswerPad";
import ProfileAvatar from "../components/ProfileMedia";
import SelectMenu from "../components/SelectMenu";
import { CATEGORY_LIST } from "../data/puzzles";
import {
  formatCode,
  formatLocalizedInteger,
  formatTimer,
} from "../lib/numerals";

const modes = [
  {
    id: "first",
    key: "multi.firstToCrack",
    icon: Target,
    desc: "multi.firstToCrackDesc",
    color: "lime",
  },
  {
    id: "timeAttack",
    key: "multi.timeAttack",
    icon: Timer,
    desc: "multi.timeAttackDesc",
    color: "coral",
  },
];

function CopyCode({ code }) {
  const { t, showToast } = useApp();
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef(null);
  useEffect(
    () => () => {
      if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    },
    [],
  );
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* clipboard can be unavailable */
    }
    setCopied(true);
    showToast("toast.copied");
    if (copiedTimer.current) window.clearTimeout(copiedTimer.current);
    copiedTimer.current = window.setTimeout(() => {
      setCopied(false);
      copiedTimer.current = null;
    }, 1600);
  };
  return (
    <button className="copy-code" onClick={copy}>
      {copied ? <Check size={15} /> : <Copy size={15} />}{" "}
      {copied ? t("multi.copied") : t("multi.copy")}
    </button>
  );
}

function Lobby({
  settings,
  setSettings,
  room,
  currentPlayer,
  onCreate,
  onJoin,
  joinCode,
  setJoinCode,
  isCreating,
  joinPending,
}) {
  const { t, settings: appSettings, profile } = useApp();
  const locale = appSettings.locale || "en";
  const navigate = useNavigate();
  const isHost = room?.hostId === currentPlayer?.id;
  const host = room?.players.find((item) => item.id === room.hostId);
  const canStart =
    room &&
    room.players.length >= 2 &&
    room.players.every((item) => item.ready);
  const shareUrl = room
    ? `${window.location.origin}/multi?room=${room.code}`
    : "";

  return (
    <div className="multi-lobby-layout">
      <div className="multi-lobby-main">
        <Card className="lobby-hero-card">
          <div className="lobby-hero-copy">
            <Pill tone="accent" icon={Sparkles}>
              <i className="live-dot" /> {t("multi.roomLive")}
            </Pill>
            <h2>{room ? t("multi.roomCreated") : t("multi.title")}</h2>
            <p>{room ? t("multi.shareRoom") : t("multi.subtitle")}</p>
            {room ? (
              <div className="room-code-display">
                <span>{room.code}</span>
                <CopyCode code={room.code} />
              </div>
            ) : (
              <div className="lobby-hero-badge">
                <div className="badge-signal">
                  <span />
                  <span />
                  <span />
                </div>
                <span>{t("multi.ready")}</span>
              </div>
            )}
          </div>
          <div className="lobby-radar" aria-hidden="true">
            <div className="radar-circle radar-one" />
            <div className="radar-circle radar-two" />
            <div className="radar-circle radar-three" />
            <div className="radar-cross" />
            <div className="radar-player">
              <Gamepad2 size={19} />
            </div>
            <span className="radar-ping ping-one" />
            <span className="radar-ping ping-two" />
          </div>
        </Card>

        {!room ? (
          <>
            <SectionHeading
              eyebrow={t("multi.createRoom")}
              title={t("multi.hostRound")}
            />
            <Card className="room-settings-card">
              <div className="settings-label">
                <Settings2 size={16} />
                <span>{t("multi.selectMode")}</span>
              </div>
              <div className="mode-choice-grid">
                {modes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      className={`mode-choice mode-choice-${mode.color} ${settings.mode === mode.id ? "active" : ""}`}
                      onClick={() =>
                        setSettings((current) => ({
                          ...current,
                          mode: mode.id,
                        }))
                      }
                    >
                      <span className="mode-choice-icon">
                        <Icon size={18} />
                      </span>
                      <span>
                        <strong>{t(mode.key)}</strong>
                        <small>{t(mode.desc)}</small>
                      </span>
                      <span className="choice-radio" />
                    </button>
                  );
                })}
              </div>
              <div className="settings-row">
                <div className="settings-label">
                  <RefreshCw size={16} />
                  <span>{t("multi.roundsLabel")}</span>
                </div>
                <div className="stepper">
                  <button
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        rounds: Math.max(1, current.rounds - 1),
                      }))
                    }
                  >
                    −
                  </button>
                  <strong>
                    {formatLocalizedInteger(settings.rounds, locale)}
                  </strong>
                  <button
                    onClick={() =>
                      setSettings((current) => ({
                        ...current,
                        rounds: Math.min(30, current.rounds + 1),
                      }))
                    }
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="settings-row category-row">
                <div className="settings-label">
                  <Sparkles size={16} />
                  <span>{t("multi.categoryLabel")}</span>
                </div>
                <SelectMenu
                  className="category-select-menu"
                  disabled={settings.mode === "timeAttack"}
                  value={
                    settings.mode === "timeAttack" ? "All" : settings.category
                  }
                  options={CATEGORY_LIST.map((category) => ({
                    value: category,
                    label:
                      category === "All" || category === "random"
                        ? t("multi.randomCategory")
                        : t(`category.${category.toLowerCase()}`),
                  }))}
                  onChange={(value) =>
                    setSettings((current) => ({
                      ...current,
                      category: value,
                    }))
                  }
                  ariaLabel={t("multi.categoryLabel")}
                />
              </div>
              <div className="name-field">
                <label htmlFor="host-name">{t("profile.username")}</label>
                <div className="profile-username-readonly" id="host-name">
                  @{profile?.username || "—"}
                </div>
              </div>
              <Button
                className="full-button"
                onClick={() => onCreate()}
                icon={Plus}
                disabled={isCreating}
              >
                {isCreating ? t("common.loading") : t("multi.createRoom")}
              </Button>
            </Card>
            <div className="or-divider">
              <span>{t("auth.or")}</span>
            </div>
            <Card className="join-room-card">
              <div className="join-room-icon">
                <Hash size={19} />
              </div>
              <div>
                <strong>{t("multi.joinRoom")}</strong>
                <p>{t("multi.shareRoom")}</p>
              </div>
              <div className="join-room-form">
                <input
                  value={joinCode}
                  onChange={(event) =>
                    setJoinCode(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                    )
                  }
                  placeholder={t("multi.joinPlaceholder")}
                />
                <Button
                  variant="quiet"
                  onClick={() => onJoin()}
                  disabled={joinCode.length < 6 || joinPending}
                >
                  {joinPending ? t("common.loading") : t("multi.joinRoom")}
                </Button>
              </div>
            </Card>
          </>
        ) : (
          <RoomLobby
            room={room}
            currentPlayer={currentPlayer}
            isHost={isHost}
            canStart={canStart}
            host={host}
            shareUrl={shareUrl}
          />
        )}
      </div>
      <aside className="multi-lobby-side">
        <Card className="mode-info-card">
          <div className="side-card-heading">
            <span className="section-eyebrow">
              {t("multi.modeDescription")}
            </span>
            <Info size={15} />
          </div>
          <div className="selected-mode-icon">
            <Target size={22} />
          </div>
          <h3>
            {t(
              settings.mode === "timeAttack"
                ? "multi.timeAttack"
                : "multi.firstToCrack",
            )}
          </h3>
          <p>
            {t(
              settings.mode === "timeAttack"
                ? "multi.timeAttackDesc"
                : "multi.firstToCrackDesc",
            )}
          </p>
          <div className="mode-info-lines">
            <span>
              <Clock3 size={14} /> {t("multi.rounds")}:{" "}
              <strong>
                {formatLocalizedInteger(
                  room?.settings.rounds || settings.rounds,
                  locale,
                )}
              </strong>
            </span>
            <span>
              <Sparkles size={14} /> {t("multi.categoryLabel")}:{" "}
              <strong>
                {room?.settings.category === "random" || !room
                  ? t("multi.randomCategory")
                  : t(`category.${room.settings.category.toLowerCase()}`)}
              </strong>
            </span>
          </div>
        </Card>
        <Card className="lobby-players-card">
          <div className="side-card-heading">
            <span className="section-eyebrow">{t("multi.players")}</span>
            <span className="player-count">
              {formatLocalizedInteger(room?.players.length || 0, locale)}/
              {formatLocalizedInteger(4, locale)}
            </span>
          </div>
          {room ? (
            <div className="players-list">
              {room.players.map((player, index) => (
                <div className="player-row" key={player.id}>
                  <div
                    className={`avatar avatar-player ${player.id === currentPlayer?.id ? "you" : ""}`}
                  >
                    <ProfileAvatar
                      profile={player}
                      size="small"
                      reduceMotion={appSettings.reduceMotion}
                      label={player.name}
                    />
                  </div>
                  <div className="player-copy">
                    <strong>
                      {player.name}
                      {player.id === currentPlayer?.id && (
                        <span className="you-tag">{t("multi.you")}</span>
                      )}
                    </strong>
                    <span>
                      {player.id === room.hostId ? (
                        <>
                          <Crown size={11} /> {t("multi.roomLive")}
                        </>
                      ) : player.ready ? (
                        t("multi.ready")
                      ) : (
                        t("multi.notReady")
                      )}
                    </span>
                  </div>
                  <span
                    className={`ready-indicator ${player.ready ? "ready" : ""}`}
                  >
                    {player.ready ? <Check size={13} /> : <span />}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="waiting-players">
              <div className="waiting-icon">
                <UserPlus size={19} />
              </div>
              <strong>{t("multi.waiting")}</strong>
              <p>{t("multi.waiting")}</p>
            </div>
          )}
        </Card>
        <div className="secure-room-note">
          <ShieldCheck size={16} />
          <span>{t("auth.secureNote")}</span>
        </div>
      </aside>
    </div>
  );
}

function RoomLobby({ room, currentPlayer, isHost, canStart, host, shareUrl }) {
  const { t, settings } = useApp();
  const locale = settings.locale || "en";
  const { toggleReady, startMatch, leaveRoom } = useApp().multiplayer;
  const [copiedLink, setCopiedLink] = useState(false);
  const copiedLinkTimer = useRef(null);
  useEffect(
    () => () => {
      if (copiedLinkTimer.current) window.clearTimeout(copiedLinkTimer.current);
    },
    [],
  );
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      /* noop */
    }
    setCopiedLink(true);
    if (copiedLinkTimer.current) window.clearTimeout(copiedLinkTimer.current);
    copiedLinkTimer.current = window.setTimeout(() => {
      setCopiedLink(false);
      copiedLinkTimer.current = null;
    }, 1500);
  };
  return (
    <Card className="active-room-card">
      <div className="active-room-heading">
        <div>
          <span className="section-eyebrow">{t("multi.roomLive")}</span>
          <h2>{isHost ? t("multi.roomLive") : t("multi.waitingForHost")}</h2>
        </div>
        <Pill tone="lime">
          <i className="live-dot" /> {room.code}
        </Pill>
      </div>
      <div className="invite-box">
        <div className="invite-icon">
          <LinkIcon />
        </div>
        <div>
          <strong>{t("multi.shareRoom")}</strong>
          <p>{shareUrl}</p>
        </div>
        <button onClick={copyLink}>
          {copiedLink ? <Check size={15} /> : <Copy size={15} />}{" "}
          {copiedLink ? t("multi.copied") : t("multi.copy")}
        </button>
      </div>
      <div className="ready-callout">
        <div className="ready-check">
          <Check size={16} />
        </div>
        <div>
          <strong>
            {currentPlayer?.ready ? t("multi.ready") : t("multi.notReady")}
          </strong>
          <p>{t("multi.waiting")}</p>
        </div>
        {!isHost && (
          <Button
            size="sm"
            variant={currentPlayer?.ready ? "quiet" : "primary"}
            onClick={toggleReady}
          >
            {currentPlayer?.ready ? t("multi.notReady") : t("multi.ready")}
          </Button>
        )}
      </div>
      <div className="room-action-row">
        {isHost ? (
          <Button
            className="full-button"
            onClick={startMatch}
            disabled={!canStart}
            icon={Zap}
          >
            {canStart
              ? t("multi.startMatch")
              : `${t("multi.waiting")} · ${formatLocalizedInteger(room.players.length, locale)}/${formatLocalizedInteger(2, locale)}`}
          </Button>
        ) : (
          <div className="waiting-host">
            <span className="spinner" /> {t("multi.waitingForHost")}
          </div>
        )}
        <Button variant="quiet" onClick={leaveRoom} icon={X}>
          {t("multi.leave")}
        </Button>
      </div>
    </Card>
  );
}

function LinkIcon() {
  return <Send size={18} />;
}

function Match({ room, currentPlayer, onAnswer, onNext, onLeave }) {
  const { t, settings, multiplayer, playCue } = useApp();
  const puzzle = multiplayer.puzzleFor(room, room.round);
  const locale = settings.locale || "en";
  const inputRef = useRef(null);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(
    Math.max(
      0,
      Math.floor(((room.deadline || Date.now() + 60000) - Date.now()) / 1000),
    ),
  );
  const isHost = room.hostId === currentPlayer?.id;
  const winner = room.players.find((player) => player.id === room.roundWinner);
  const sortedPlayers = [...room.players].sort(
    (a, b) => (b.score || 0) - (a.score || 0),
  );
  useEffect(() => {
    setAnswer("");
    setAttempts(0);
    setResult(null);
  }, [room.round]);
  useEffect(() => {
    if (!room.deadline) return undefined;
    const timer = window.setInterval(
      () =>
        setTimeLeft(
          Math.max(0, Math.floor((room.deadline - Date.now()) / 1000)),
        ),
      500,
    );
    return () => window.clearInterval(timer);
  }, [room.deadline]);
  const submit = async () => {
    const complete =
      puzzle.answerType === "digits"
        ? answer.length === 4
        : Boolean(answer.trim());
    if (!complete) return;
    const response = await multiplayer.submitAnswer(answer);
    if (response.result === "wrong") {
      playCue("wrong");
      setAttempts((value) => value + 1);
      setResult("wrong");
    } else if (response.result === "correct") {
      playCue("success");
      setResult("correct");
    }
  };
  if (room.status === "finished")
    return (
      <MatchFinished
        room={room}
        currentPlayer={currentPlayer}
        onLeave={onLeave}
      />
    );
  return (
    <div className="match-view">
      <div className="match-topbar">
        <button className="back-link" onClick={onLeave}>
          <ArrowLeft size={16} /> {t("multi.backToLobby")}
        </button>
        <div className="match-top-meta">
          <Pill tone="accent">
            <i className="live-dot" /> {t("multi.roomLive")}
          </Pill>
          <span className="match-room-code">{room.code}</span>
          {room.settings.mode === "timeAttack" && (
            <span className={`match-timer ${timeLeft < 10 ? "urgent" : ""}`}>
              <Timer size={15} /> {formatTimer(timeLeft, locale)}
            </span>
          )}
        </div>
      </div>
      <div className="match-heading">
        <div>
          <div className="eyebrow">
            {t("multi.round")} {formatLocalizedInteger(room.round + 1, locale)}{" "}
            / {formatLocalizedInteger(room.settings.rounds, locale)}
          </div>
          <h1>{t("multi.answer")}</h1>
        </div>
        <Pill tone="lime">
          {t(`category.${puzzle.category.toLowerCase()}`)}
        </Pill>
      </div>
      <div className="match-layout">
        <div className="match-main">
          <Card className="match-clue-card">
            <div className="match-clue-top">
              <div className="clue-category">
                <span className="clue-symbol">
                  <Sparkles size={17} />
                </span>
                <div>
                  <span className="section-eyebrow">
                    {t("single.question")}
                  </span>
                  <strong>
                    {t(`category.${puzzle.category.toLowerCase()}`)} /{" "}
                    {t("multi.round")}{" "}
                    {formatLocalizedInteger(room.round + 1, locale)}
                  </strong>
                </div>
              </div>
              <span className="match-round-badge">
                {formatCode(String(room.round + 1).padStart(2, "0"), locale)}
              </span>
            </div>
            <p>{t(puzzle.promptKey)}</p>
            <div className="match-clue-footer">
              <span>
                <UsersRound size={15} /> {t("multi.players")}:{" "}
                {formatLocalizedInteger(room.players.length, locale)}
              </span>
              <span>
                <Trophy size={15} />{" "}
                {room.settings.mode === "timeAttack"
                  ? t("multi.timeAttack")
                  : t("multi.firstToCrack")}
              </span>
            </div>
          </Card>
          <Card
            className={`match-answer-card ${result === "correct" ? "answer-correct" : result === "wrong" ? "answer-wrong" : ""}`}
          >
            <span className="section-eyebrow">
              {puzzle.answerType === "letters"
                ? t("single.enterWord")
                : t("single.enterCode")}
            </span>
            {puzzle.answerType === "digits" ? (
              <CodeSlots
                value={answer}
                displayValue={formatCode(answer, locale)}
                invalid={result === "wrong"}
              />
            ) : (
              <WordSlots
                value={answer}
                placeholder={t("single.wordPlaceholder")}
                invalid={result === "wrong"}
              />
            )}
            {result === "wrong" && (
              <div className="inline-feedback">
                <X size={15} /> {t("single.incorrect")}
              </div>
            )}
            {result === "correct" && (
              <div className="inline-feedback feedback-success">
                <Check size={15} /> {t("single.correct")} ·{" "}
                {puzzle.displayAnswer}
              </div>
            )}
            {room.status === "playing" && (
              <Button
                className="full-button"
                onClick={submit}
                disabled={
                  puzzle.answerType === "digits"
                    ? answer.length !== 4
                    : !answer.trim()
                }
                icon={Send}
              >
                {t("single.submit")}
              </Button>
            )}
          </Card>
        </div>
        {puzzle.answerType === "digits" ? (
          <Numpad
            value={answer}
            onChange={setAnswer}
            onSubmit={submit}
            onClear={() => setAnswer("")}
            t={t}
            locale={locale}
            disabled={room.status !== "playing"}
            inputRef={inputRef}
          />
        ) : (
          <LettersPad
            value={answer}
            onChange={setAnswer}
            onSubmit={submit}
            onClear={() => setAnswer("")}
            t={t}
            locale={locale}
            disabled={room.status !== "playing"}
            inputRef={inputRef}
          />
        )}
        <aside className="match-side">
          <Card className="leaderboard-card">
            <div className="side-card-heading">
              <span className="section-eyebrow">{t("multi.leaderboard")}</span>
              <Trophy size={15} />
            </div>
            <div className="leaderboard-list">
              {sortedPlayers.map((player, index) => (
                <div
                  className={`leader-row ${player.id === currentPlayer?.id ? "you" : ""}`}
                  key={player.id}
                >
                  <span className={`leader-rank rank-${index + 1}`}>
                    {formatLocalizedInteger(index + 1, locale)}
                  </span>
                  <div className="avatar avatar-tiny">
                    <ProfileAvatar
                      profile={player}
                      size="small"
                      reduceMotion={settings.reduceMotion}
                      label={player.name}
                    />
                  </div>
                  <span className="leader-name">
                    {player.name}
                    {player.id === currentPlayer?.id && (
                      <small>{t("multi.you")}</small>
                    )}
                  </span>
                  <strong>
                    {formatLocalizedInteger(player.score || 0, locale)}
                  </strong>
                </div>
              ))}
            </div>
          </Card>
          <Card className="round-card">
            <div className="side-card-heading">
              <span className="section-eyebrow">{t("multi.round")}</span>
              <RefreshCw size={15} />
            </div>
            <strong>
              {formatLocalizedInteger(room.round + 1, locale)}
              <small>
                / {formatLocalizedInteger(room.settings.rounds, locale)}
              </small>
            </strong>
            <ProgressBar
              value={room.round + 1}
              max={room.settings.rounds}
              tone="coral"
            />
          </Card>
          {room.status === "round_won" && (
            <Card className="round-won-card">
              <div className="winner-icon">
                <Trophy size={20} />
              </div>
              <span className="section-eyebrow">{t("multi.winner")}</span>
              <strong>{winner?.name || "—"}</strong>
              {isHost ? (
                <Button size="sm" onClick={onNext} iconAfter={ArrowRight}>
                  {t("common.next")}
                </Button>
              ) : (
                <p>{t("multi.waitingForHost")}</p>
              )}
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function MatchFinished({ room, currentPlayer, onLeave }) {
  const { t, settings } = useApp();
  const locale = settings.locale || "en";
  const winner =
    room.players.find((player) => player.id === room.winnerId) ||
    [...room.players].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  return (
    <div className="match-finished">
      <div className="finished-orbit">
        <div className="finished-card">
          <div className="finished-icon">
            <Trophy size={28} />
          </div>
          <span className="eyebrow">{t("multi.matchFinished")}</span>
          <h1>
            {t("multi.winner")}: {winner?.name || "—"}
          </h1>
          <p>{t("multi.scoreboard")}</p>
          <div className="final-score-list">
            {[...room.players]
              .sort((a, b) => (b.score || 0) - (a.score || 0))
              .map((player, index) => (
                <div key={player.id}>
                  <span>{formatLocalizedInteger(index + 1, locale)}</span>
                  <strong>{player.name}</strong>
                  <b>{formatLocalizedInteger(player.score || 0, locale)}</b>
                </div>
              ))}
          </div>
          <Button onClick={onLeave} icon={ArrowLeft}>
            {t("multi.backToLobby")}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Multiplayer() {
  const { t, profile, multiplayer } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    mode: "first",
    rounds: 5,
    category: "random",
  });
  const [joinCode, setJoinCode] = useState(params.get("room") || "");
  const [isCreating, setIsCreating] = useState(false);
  const [joinPending, setJoinPending] = useState(false);
  const { room, currentPlayer } = multiplayer;
  const joinedFromUrl = useRef(false);
  useEffect(() => {
    if (params.get("room")) setJoinCode(params.get("room").toUpperCase());
  }, [params]);
  useEffect(() => {
    const requested = params.get("room")?.toUpperCase();
    if (
      !requested ||
      !room ||
      room.code !== requested ||
      currentPlayer ||
      joinedFromUrl.current
    )
      return;
    if (!profile) return;
    joinedFromUrl.current = true;
    void multiplayer.joinRoom(requested);
  }, [currentPlayer, multiplayer, params, profile, room]);
  const create = async () => {
    if (!profile) {
      navigate("/multi/auth?next=/multi");
      return;
    }
    setIsCreating(true);
    try {
      await multiplayer.createRoom(settings);
    } finally {
      setIsCreating(false);
    }
  };
  const join = async () => {
    if (!profile) {
      navigate("/multi/auth?next=/multi");
      return;
    }
    setJoinPending(true);
    try {
      await multiplayer.joinRoom(joinCode);
    } finally {
      setJoinPending(false);
    }
  };
  if (
    room?.status === "playing" ||
    room?.status === "round_won" ||
    room?.status === "finished"
  )
    return (
      <main className="page multi-page">
        <Match
          room={room}
          currentPlayer={currentPlayer}
          onLeave={multiplayer.leaveRoom}
        />
      </main>
    );
  return (
    <main className="page multi-page">
      <PageHeader
        eyebrow={t("multi.title")}
        title={t("multi.subtitle")}
        actions={
          <div className="header-action-cluster">
            <LinkButton
              to="/multi/achievements"
              variant="quiet"
              size="sm"
              icon={Award}
            >
              {t("nav.achievements")}
            </LinkButton>
            <LinkButton
              to="/multi/leaderboard"
              variant="quiet"
              size="sm"
              icon={Trophy}
            >
              {t("nav.leaderboard")}
            </LinkButton>
            <LinkButton
              to="/multi/shop"
              variant="quiet"
              size="sm"
              icon={ShoppingBag}
            >
              {t("nav.shop")}
            </LinkButton>
          </div>
        }
      />
      <Lobby
        settings={settings}
        setSettings={setSettings}
        room={room}
        currentPlayer={currentPlayer}
        onCreate={create}
        onJoin={join}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        isCreating={isCreating}
        joinPending={joinPending}
      />
    </main>
  );
}
