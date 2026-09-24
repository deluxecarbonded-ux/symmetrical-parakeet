import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  Check,
  CircleUserRound,
  Clock3,
  Coins,
  Edit3,
  Gamepad2,
  KeyRound,
  LogIn,
  LogOut,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Upload,
  UsersRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../App";
import {
  Button,
  Card,
  LinkButton,
  PageHeader,
  Pill,
  ProgressBar,
  SectionHeading,
  StatCard,
} from "../components/Primitives";
import { formatDate, formatNumber } from "../lib/storage";
import ProfileAvatar from "../components/ProfileMedia";
import ValidationMessage from "../components/FormValidation";
import { isValidUsername, normalizeUsername } from "../lib/identity";

const MEDIA_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "avif",
  "heic",
  "heif",
  "svg",
  "mp4",
  "m4v",
  "mov",
  "webm",
  "ogv",
  "3gp",
  "3g2",
  "mkv",
]);

function isSupportedMediaFile(file) {
  const type = String(file?.type || "").toLowerCase();
  if (type.startsWith("image/") || type.startsWith("video/")) return true;
  const extension = String(file?.name || "")
    .split(".")
    .pop()
    ?.toLowerCase();
  return MEDIA_EXTENSIONS.has(extension);
}

export default function Profile({ mode = "single" }) {
  const {
    t,
    profile,
    progress,
    wallet,
    settings,
    saveUsername,
    uploadAvatar,
    signOut,
  } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.username || profile?.displayName || "");
  const [usernameError, setUsernameError] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [editing, setEditing] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const mediaInputRef = useRef(null);
  const isSingle = mode === "single";
  const data = isSingle ? progress.single : progress.multi;
  useEffect(() => {
    setName(profile?.username || profile?.displayName || "");
    setUsernameError("");
    setMediaError("");
  }, [profile?.displayName, profile?.username]);
  const solved = data?.solved || 0;
  const score = data?.score || 0;
  const rounds = isSingle ? solved : data?.matches || 0;
  const history = data?.history || [];
  const handleMediaChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!isSupportedMediaFile(file) || file.size > 25 * 1024 * 1024) {
      setMediaError("profile.mediaInvalid");
      return;
    }
    setMediaError("");
    setUploadingMedia(true);
    try {
      const uploaded = await uploadAvatar(file);
      if (!uploaded) setMediaError("profile.mediaUploadFailed");
    } finally {
      setUploadingMedia(false);
    }
  };

  const saveName = async () => {
    const normalized = normalizeUsername(name);
    if (!isValidUsername(normalized)) {
      setUsernameError("validation.username");
      return;
    }
    setUsernameError("");
    if (await saveUsername(normalized)) setEditing(false);
  };

  return (
    <main className="page profile-page">
      <PageHeader
        eyebrow={t("nav.profile")}
        title={t("profile.title")}
        description={t("profile.subtitle")}
        actions={
          <div className="profile-mode-toggle">
            <LinkButton
              to="/single/profile"
              variant={isSingle ? "primary" : "quiet"}
              size="sm"
            >
              {t("dashboard.singleMode")}
            </LinkButton>
            <LinkButton
              to="/multi/profile"
              variant={!isSingle ? "primary" : "quiet"}
              size="sm"
            >
              {t("dashboard.multiMode")}
            </LinkButton>
          </div>
        }
      />
      {profile && (
        <div className="profile-records-nav">
          <LinkButton
            to={`/${mode}/achievements`}
            variant="quiet"
            size="sm"
            icon={Award}
          >
            {t("nav.achievements")}
          </LinkButton>
          <LinkButton
            to={`/${mode}/leaderboard`}
            variant="quiet"
            size="sm"
            icon={BarChart3}
          >
            {t("nav.leaderboard")}
          </LinkButton>
        </div>
      )}
      <div className="profile-layout">
        <div className="profile-main">
          <Card className="profile-identity-card">
            <div className="profile-avatar-large">
              {profile ? (
                <ProfileAvatar
                  profile={profile}
                  size="large"
                  showSoundToggle
                  reduceMotion={settings.reduceMotion}
                  label={t("profile.username")}
                  videoLabel={t("profile.avatarVideo")}
                  muteLabel={t("profile.muteAvatar")}
                  unmuteLabel={t("profile.unmuteAvatar")}
                />
              ) : (
                <CircleUserRound size={31} />
              )}
              {profile && <span className="avatar-status" />}
            </div>
            <div className="profile-identity-copy">
              <span className="section-eyebrow">
                {isSingle
                  ? t("profile.soloProgress")
                  : t("profile.multiplayerProgress")}
              </span>
              <h2>{profile?.username || profile?.displayName || t("nav.signIn")}</h2>
              <p>
                {profile
                  ? `@${profile.username || profile.displayName}`
                  : t("nav.signIn")}
              </p>
              <div className="identity-pills">
                <Pill tone="lime" icon={ShieldCheck}>
                  {profile ? t("profile.connected") : t("nav.signIn")}
                </Pill>
              </div>
            </div>
            {profile && (
              <button
                className="icon-button profile-edit"
                onClick={() => {
                  const nextEditing = !editing;
                  setEditing(nextEditing);
                  if (!nextEditing) setUsernameError("");
                }}
                aria-label={t("profile.editUsername")}
              >
                <Edit3 size={17} />
              </button>
            )}
            {editing && (
              <div
                className={`profile-edit-form ${
                  usernameError ? "has-error" : ""
                }`}
              >
                <input
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    setUsernameError("");
                  }}
                  placeholder={t("profile.username")}
                  autoComplete="username"
                  dir="ltr"
                  aria-invalid={Boolean(usernameError)}
                  aria-describedby="profile-username-error"
                />
                <ValidationMessage
                  id="profile-username-error"
                  visible={Boolean(usernameError)}
                >
                  {usernameError ? t(usernameError) : null}
                </ValidationMessage>
                <Button size="sm" onClick={saveName} icon={Save}>
                  {t("common.save")}
                </Button>
              </div>
            )}
          </Card>
          {profile && (
            <Card className="profile-media-card">
              <div className="profile-media-copy">
                <div>
                  <span className="section-eyebrow">{t("profile.media")}</span>
                  <strong>{t("profile.mediaHint")}</strong>
                </div>
                <ProfileAvatar
                  profile={profile}
                  size="default"
                  showSoundToggle
                  reduceMotion={settings.reduceMotion}
                  label={t("profile.username")}
                  videoLabel={t("profile.avatarVideo")}
                  muteLabel={t("profile.muteAvatar")}
                  unmuteLabel={t("profile.unmuteAvatar")}
                />
              </div>
              <input
                ref={mediaInputRef}
                className="visually-hidden-input"
                type="file"
                aria-describedby="profile-media-error"
                onChange={handleMediaChange}
              />
              <Button
                variant="quiet"
                size="sm"
                icon={Upload}
                disabled={uploadingMedia}
                onClick={() => mediaInputRef.current?.click()}
              >
                {uploadingMedia
                  ? t("common.loading")
                  : profile?.avatar_url || profile?.avatar_path || profile?.avatarUrl
                    ? t("profile.mediaReplace")
                    : t("profile.mediaUpload")}
              </Button>
              <ValidationMessage
                id="profile-media-error"
                visible={Boolean(mediaError)}
              >
                {mediaError ? t(mediaError) : null}
              </ValidationMessage>
            </Card>
          )}
          <div className="profile-stat-grid">
            <StatCard
              label={t("profile.sessions")}
              value={formatNumber(rounds, settings.locale)}
              hint={
                isSingle
                  ? t("profile.soloProgress")
                  : t("profile.multiplayerProgress")
              }
              icon={Gamepad2}
              tone="lime"
            />
            <StatCard
              label={t("profile.lifetime")}
              value={formatNumber(solved, settings.locale)}
              hint={t("dashboard.codesCracked")}
              icon={KeyRound}
              tone="violet"
            />
            <StatCard
              label={t("dashboard.accuracy")}
              value={
                isSingle && data?.attempts
                  ? `${formatNumber(
                      Math.round((solved / data.attempts) * 100),
                      settings.locale,
                    )}%`
                  : solved
                    ? `${formatNumber(100, settings.locale)}%`
                    : "—"
              }
              hint={t("profile.noStats")}
              icon={Target}
              tone="coral"
            />
          </div>
          <SectionHeading
            eyebrow={t("dashboard.dailyPulse")}
            title={t("dashboard.noActivity")}
          />
          <Card className="profile-history-card">
            {history.length ? (
              <div className="profile-history-list">
                {history.slice(0, 8).map((entry) => (
                  <div className="profile-history-row" key={entry.id}>
                    <span
                      className={`history-icon ${isSingle ? "lime" : "violet"}`}
                    >
                      {isSingle ? (
                        <KeyRound size={15} />
                      ) : (
                        <UsersRound size={15} />
                      )}
                    </span>
                    <div>
                      <strong>
                        {isSingle
                          ? `${t("single.title")} · ${t("single.level")} ${formatNumber(entry.level, settings.locale)}`
                          : `${t("multi.title")} · ${t("multi.round")} ${formatNumber(entry.round, settings.locale)}`}
                      </strong>
                      <span>{formatDate(entry.at, settings.locale)}</span>
                    </div>
                    <b>
                      {isSingle
                        ? `${formatNumber(entry.score, settings.locale)} ${t("single.score")}`
                        : `+${formatNumber(entry.score || 0, settings.locale)}`}
                    </b>
                  </div>
                ))}
              </div>
            ) : (
              <div className="profile-no-history">
                <div className="empty-icon">
                  <Sparkles size={20} />
                </div>
                <strong>{t("profile.noStats")}</strong>
                <p>{t("dashboard.noActivity")}</p>
                <LinkButton
                  to={isSingle ? "/single" : "/multi"}
                  size="sm"
                  icon={ArrowRight}
                >
                  {t("common.start")}
                </LinkButton>
              </div>
            )}
          </Card>
        </div>
        <aside className="profile-side">
          <Card className="profile-wallet-card">
            <div className="side-card-heading">
              <span className="section-eyebrow">{t("shop.title")}</span>
              <Coins size={15} />
            </div>
            <div className="profile-wallet-row">
              <div className="wallet-orb">
                <Coins size={16} />
              </div>
              <div>
                <strong>
                  {formatNumber(wallet[mode] || 0, settings.locale)}
                </strong>
                <span>
                  {isSingle ? t("shop.singleBalance") : t("shop.multiBalance")}
                </span>
              </div>
            </div>
            <LinkButton
              to={mode === "single" ? "/single/shop" : "/multi/shop"}
              variant="quiet"
              size="sm"
              icon={ArrowRight}
            >
              {t("nav.shop")}
            </LinkButton>
          </Card>
          <Card className="account-card">
            <div className="side-card-heading">
              <span className="section-eyebrow">{t("profile.account")}</span>
              <ShieldCheck size={15} />
            </div>
            {profile ? (
              <>
                <div className="account-state">
                  <span className="status-dot online" />
                  <strong>{t("profile.connected")}</strong>
                </div>
                <p>@{profile.username || profile.displayName}</p>
                <Button
                  variant="quiet"
                  className="full-button logout-button"
                  onClick={() => {
                    signOut();
                    navigate("/");
                  }}
                  icon={LogOut}
                >
                  {t("nav.signOut")}
                </Button>
              </>
            ) : (
              <>
                <div className="account-state">
                  <span className="status-dot" />
                  <strong>{t("nav.signIn")}</strong>
                </div>
                <p>{t("auth.subtitle")}</p>
                <Button
                  className="full-button"
                  onClick={() =>
                    navigate(isSingle ? "/single/auth" : "/multi/auth")
                  }
                  icon={LogIn}
                >
                  {t("nav.signIn")}
                </Button>
              </>
            )}
          </Card>
          <div className="profile-quote">
            <Sparkles size={15} />
            <span>{t("app.tagline")}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
