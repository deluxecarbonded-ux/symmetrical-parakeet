import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  CircleUserRound,
  Gamepad2,
  Globe2,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Settings2,
  ShoppingBag,
  Sparkles,
  Sun,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { useApp } from "../App";
import { LANGUAGES } from "../i18n/translations";
import { getInitials } from "../lib/storage";
import SelectMenu from "./SelectMenu";

const primaryNav = [
  { to: "/", key: "nav.dashboard", icon: LayoutDashboard, end: true },
  { to: "/single", key: "nav.single", icon: Gamepad2 },
  { to: "/multi", key: "nav.multi", icon: UsersRound },
];

const libraryNav = [
  { to: "/single/shop", key: "nav.shop", icon: ShoppingBag },
  { to: "/single/profile", key: "nav.profile", icon: CircleUserRound },
  { to: "/settings", key: "nav.settings", icon: Settings2 },
];

const allNavItems = [...primaryNav, ...libraryNav];

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
      <span className="brand-word">EXOTIC</span>
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
  const { t, profile, signOut } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const authPath = location.pathname.startsWith("/multi")
    ? "/multi/auth"
    : "/single/auth";
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
          <div className="nav-group-label">{t("nav.shop")}</div>
          {libraryNav.map((item) => (
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
            {profile ? getInitials(profile.displayName) : "E"}
          </div>
          <div className="user-copy">
            <strong>{profile?.displayName || t("dashboard.guest")}</strong>
            <span>
              {profile
                ? profile.isGuest
                  ? t("profile.local")
                  : t("profile.connected")
                : t("dashboard.guest")}
            </span>
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

function Topbar({ onMenu }) {
  const { t, settings, updateSettings, profile } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const isMulti = location.pathname.startsWith("/multi");
  const pageTitle =
    location.pathname === "/"
      ? t("nav.dashboard")
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
      <button
        className="mobile-menu icon-button"
        onClick={onMenu}
        aria-label={t("nav.openNavigation")}
      >
        <Menu size={21} />
      </button>
      <div className="topbar-context">
        <span className="context-kicker">
          {isMulti ? t("app.contextDuel") : t("app.contextSolo")}
        </span>
        <strong>{pageTitle}</strong>
      </div>
      <div className="topbar-actions">
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
          {profile ? getInitials(profile.displayName) : <LogIn size={16} />}
        </button>
      </div>
    </header>
  );
}

function MobileNav({ onNavigate }) {
  const { t } = useApp();
  return (
    <nav className="mobile-nav" aria-label={t("nav.openNavigation")}>
      {allNavItems.map((item) => {
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
  const [menuOpen, setMenuOpen] = useState(false);
  const { toast, t } = useApp();
  return (
    <div className="app-shell">
      <div
        className={`mobile-drawer-backdrop ${menuOpen ? "visible" : ""}`}
        onClick={() => setMenuOpen(false)}
      />
      <div className={`sidebar-wrap ${menuOpen ? "open" : ""}`}>
        <button
          className="drawer-close icon-button"
          onClick={() => setMenuOpen(false)}
          aria-label={t("common.close")}
        >
          <X size={20} />
        </button>
        <Sidebar onNavigate={() => setMenuOpen(false)} />
      </div>
      <div className="main-shell">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <div className="page-scroll">
          <Outlet />
        </div>
        <MobileNav onNavigate={() => setMenuOpen(false)} />
      </div>
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span className="toast-mark">
            <Sparkles size={14} />
          </span>
          <span>{t(toast.key, toast.values)}</span>
        </div>
      )}
    </div>
  );
}
