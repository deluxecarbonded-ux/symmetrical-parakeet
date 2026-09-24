import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Award,
  CircleUserRound,
  Gamepad2,
  Globe2,
  LayoutDashboard,
  LogIn,
  LogOut,
  Moon,
  Settings2,
  ShoppingBag,
  Sparkles,
  Sun,
  Trophy,
  UsersRound,
  Zap,
} from "lucide-react";
import { useApp } from "../App";
import { LANGUAGES } from "../i18n/translations";
import ProfileAvatar from "./ProfileMedia";
import SelectMenu from "./SelectMenu";

const primaryNav = [
  { to: "/", key: "nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/single", key: "nav.single", icon: Gamepad2, end: true },
  { to: "/multi", key: "nav.multi", icon: UsersRound, end: true },
];

function navigationForMode(mode = "single") {
  const prefix = mode === "multi" ? "/multi" : "/single";
  return [
    ...primaryNav,
    { to: `${prefix}/achievements`, key: "nav.achievements", icon: Award },
    { to: `${prefix}/leaderboard`, key: "nav.leaderboard", icon: Trophy },
    { to: `${prefix}/shop`, key: "nav.shop", icon: ShoppingBag },
    { to: `${prefix}/profile`, key: "nav.profile", icon: CircleUserRound },
    { to: "/settings", key: "nav.settings", icon: Settings2 },
  ];
}

function Brand({ compact = false }) {
  const navigate = useNavigate();
  const { t } = useApp();
  return (
    <button
      className={`brand ${compact ? "brand-compact" : ""}`}
      onClick={() => navigate("/")}
      aria-label={t("app.homeLabel")}
    >
      <span className="brand-mark">
        <Sparkles size={18} strokeWidth={2.4} />
      </span>
      <span className="brand-word">{t("app.wordmark")}</span>
      <span className="brand-dot">.</span>
    </button>
  );
}

function NavItem({ item, onNavigate }) {
  const { t } = useApp();
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
    >
      <Icon size={18} strokeWidth={2.2} />
      <span>{t(item.key)}</span>
      {item.to === "/multi" && <span className="nav-live-dot" />}
    </NavLink>
  );
}

function Sidebar({ onNavigate }) {
  const { t, profile, settings, signOut } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isMulti = location.pathname.startsWith("/multi");
  const prefix = isMulti ? "/multi" : "/single";
  const authPath = `${prefix}/auth`;
  const modeLibraryNav = [
    { to: `${prefix}/shop`, key: "nav.shop", icon: ShoppingBag },
    { to: `${prefix}/profile`, key: "nav.profile", icon: CircleUserRound },
    { to: "/settings", key: "nav.settings", icon: Settings2 },
  ];
  const modeCompetitionNav = [
    { to: `${prefix}/achievements`, key: "nav.achievements", icon: Award },
    { to: `${prefix}/leaderboard`, key: "nav.leaderboard", icon: Trophy },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Brand />
        <div className="sidebar-label">{t("app.tagline")}</div>
      </div>
      <div className="sidebar-scroll">
        <div className="nav-group">
          <div className="nav-group-label">{t("nav.dashboard")}</div>
          {primaryNav.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="nav-group">
          <div className="nav-group-label">{t("nav.achievements")}</div>
          {modeCompetitionNav.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="nav-group">
          <div className="nav-group-label">{t("nav.profile")}</div>
          {modeLibraryNav.map((item) => (
            <NavItem key={item.to} item={item} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="sidebar-promo">
          <div className="promo-orb">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <strong>{t("dashboard.setGoal")}</strong>
            <span>{t("dashboard.subtitle")}</span>
          </div>
          <ArrowUpRight size={16} />
        </div>
      </div>
      <div className="sidebar-bottom">
        <div className="sidebar-user">
          <div className="avatar avatar-small">
            {profile ? (
              <ProfileAvatar
                profile={profile}
                size="small"
                reduceMotion={settings.reduceMotion}
                label={t("profile.username")}
              />
            ) : (
              "E"
            )}
          </div>
          <div className="user-copy">
            <strong>
              {profile?.username || profile?.displayName || t("nav.signIn")}
            </strong>
            <span>{profile ? t("profile.connected") : t("nav.signIn")}</span>
          </div>
          {profile ? (
            <button
              className="icon-button subtle sidebar-logout"
              onClick={() => {
                signOut();
                navigate("/");
              }}
              aria-label={t("nav.signOut")}
            >
              <LogOut size={16} />
            </button>
          ) : (
            <button
              className="icon-button subtle"
              onClick={() => navigate(authPath)}
              aria-label={t("nav.signIn")}
            >
              <LogIn size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

function Topbar({ onLanguageMenuChange }) {
  const { t, settings, updateSettings, profile, realtimeStatus } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isMulti = location.pathname.startsWith("/multi");
  const pageTitle =
    location.pathname === "/"
      ? t("nav.dashboard")
      : location.pathname.includes("achievements")
        ? t("nav.achievements")
        : location.pathname.includes("leaderboard")
          ? t("nav.leaderboard")
          : location.pathname.includes("shop")
            ? t("nav.shop")
            : location.pathname.includes("profile")
              ? t("nav.profile")
              : location.pathname.includes("settings")
                ? t("nav.settings")
                : isMulti
                  ? t("nav.multi")
                  : t("nav.single");
  return (
    <header className="topbar">
      <div className="topbar-context">
        <span className="context-kicker">
          {isMulti ? t("app.contextDuel") : t("app.contextSolo")}
        </span>
        <strong>{pageTitle}</strong>
      </div>
      <div className="topbar-actions">
        <span
          className={`realtime-indicator realtime-${realtimeStatus}`}
          role="status"
          aria-label={
            realtimeStatus === "live"
              ? t("settings.realtimeReady")
              : t("toast.syncUnavailable")
          }
          title={
            realtimeStatus === "live"
              ? t("settings.realtimeReady")
              : t("toast.syncUnavailable")
          }
        >
          <i aria-hidden="true" />
        </span>
        <div className="language-control">
          <Globe2 size={16} />
          <SelectMenu
            className="topbar-language-menu"
            value={settings.locale}
            options={LANGUAGES.map(([code, label]) => ({
              value: code,
              label,
            }))}
            onChange={(value) => updateSettings({ locale: value })}
            onOpenChange={onLanguageMenuChange}
            ariaLabel={t("language")}
          />
        </div>
        <button
          className="theme-toggle"
          onClick={() =>
            updateSettings({
              theme: settings.theme === "dark" ? "light" : "dark",
            })
          }
          aria-label={t(
            settings.theme === "dark" ? "theme.light" : "theme.dark",
          )}
        >
          {settings.theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          <span>
            {t(settings.theme === "dark" ? "theme.light" : "theme.dark")}
          </span>
        </button>
        <button
          className="top-avatar"
          onClick={() =>
            navigate(
              profile
                ? isMulti
                  ? "/multi/profile"
                  : "/single/profile"
                : isMulti
                  ? "/multi/auth"
                  : "/single/auth",
            )
          }
          aria-label={t("nav.profile")}
        >
          {profile ? (
            <ProfileAvatar
              profile={profile}
              size="small"
              reduceMotion={settings.reduceMotion}
              label={t("profile.username")}
            />
          ) : (
            <LogIn size={16} />
          )}
        </button>
      </div>
    </header>
  );
}

function MobileNav({ onNavigate }) {
  const { t } = useApp();
  const location = useLocation();
  const mode = location.pathname.startsWith("/multi") ? "multi" : "single";
  const items = navigationForMode(mode);
  return (
    <nav className="mobile-nav" aria-label={t("nav.openNavigation")}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `mobile-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Icon size={18} />
            <span>{t(item.key)}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Shell() {
  const {
    t,
    languageMenuOpen,
    languageMenuClosing,
    onLanguageMenuChange,
  } = useApp();
  return (
    <div className="app-shell">
      <div className="sidebar-wrap">
        <Sidebar />
      </div>
      <div
        className={`main-shell ${
          languageMenuOpen ? "language-menu-open" : ""
        } ${languageMenuClosing ? "language-menu-closing" : ""}`}
      >
        <Topbar onLanguageMenuChange={onLanguageMenuChange} />
        <div className="page-scroll">
          <Outlet />
        </div>
        <MobileNav />
      </div>
    </div>
  );
}
