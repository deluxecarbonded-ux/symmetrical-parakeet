import { useEffect, useState } from "react";
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
import { formatDate, formatNumber, getInitials } from "../lib/storage";

export default function Profile({ mode = "single" }) {
  const { t, profile, progress, wallet, settings, saveDisplayName, signOut } =
    useApp();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.displayName || "");
  const [editing, setEditing] = useState(false);
  const isSingle = mode === "single";
  const data = isSingle ? progress.single : progress.multi;
  useEffect(() => setName(profile?.displayName || ""), [profile?.displayName]);
  const solved = data?.solved || 0;
  const score = data?.score || 0;
  const rounds = isSingle ? solved : data?.matches || 0;
  const history = data?.history || [];

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
      <div className="profile-layout">
        <div className="profile-main">
          <Card className="profile-identity-card">
            <div className="profile-avatar-large">
              {profile ? (
                getInitials(profile.displayName)
              ) : (
                <CircleUserRound size={31} />
              )}
              <span className="avatar-status" />
            </div>
            <div className="profile-identity-copy">
              <span className="section-eyebrow">
                {isSingle
                  ? t("profile.soloProgress")
                  : t("profile.multiplayerProgress")}
              </span>
              <h2>{profile?.displayName || t("nav.signIn")}</h2>
              <p>{profile?.email || t("nav.signIn")}</p>
              <div className="identity-pills">
                <Pill tone="lime" icon={ShieldCheck}>
                  {profile ? t("profile.connected") : t("nav.signIn")}
                </Pill>
              </div>
            </div>
            {profile && (
              <button
                className="icon-button profile-edit"
                onClick={() => setEditing((value) => !value)}
                aria-label={t("profile.editName")}
              >
                <Edit3 size={17} />
              </button>
            )}
            {editing && (
              <div className="profile-edit-form">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={t("profile.displayName")}
                />
                <Button
                  size="sm"
                  onClick={() => {
                    saveDisplayName(name);
                    setEditing(false);
                  }}
                  icon={Save}
                >
                  {t("common.save")}
                </Button>
              </div>
            )}
          </Card>
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
                <p>{profile.email || t("nav.signIn")}</p>
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
