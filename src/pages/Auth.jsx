import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../App";
import { Button, Card, Pill } from "../components/Primitives";
import { DEFAULT_GUEST_NAME } from "../lib/storage";

export default function Auth({ scope = "single" }) {
  const { t, signIn, signUp, signInGuest, authBusy } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const next = params.get("next") || (scope === "multi" ? "/multi" : "/");
  const scopeLabel =
    scope === "multi" ? t("dashboard.multiMode") : t("dashboard.singleMode");
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    const result =
      mode === "signin"
        ? await signIn({
            email: form.email,
            password: form.password,
            name: form.name,
          })
        : await signUp(form);
    if (result) navigate(next, { replace: true });
  };
  const guest = async () => {
    const result = await signInGuest(form.name || DEFAULT_GUEST_NAME);
    if (result) navigate(next, { replace: true });
  };
  return (
    <main className="auth-page" data-auth-scope={scope}>
      <div className="auth-backdrop" />
      <div className="auth-top">
        <Link to="/" className="auth-brand">
          <span className="brand-mark">
            <Sparkles size={18} />
          </span>
          <span>{t("app.name")}</span>
        </Link>
        <Link to="/" className="auth-back">
          <ArrowLeft size={15} /> {t("common.back")}
        </Link>
      </div>
      <div className="auth-layout">
        <div className="auth-pitch">
          <Pill tone="lime" icon={Zap}>
            {t("app.tagline")}
          </Pill>
          <h1>{t("auth.title")}</h1>
          <p>{t("auth.subtitle")}</p>
          <div className="auth-pitch-list">
            <div>
              <span>
                <KeyRound size={16} />
              </span>
              <strong>{t("single.title")}</strong>
              <small>{t("auth.ninetyLevels")}</small>
            </div>
            <div>
              <span>
                <Zap size={16} />
              </span>
              <strong>{t("multi.title")}</strong>
              <small>{t("auth.liveDuels")}</small>
            </div>
            <div>
              <span>
                <LockKeyhole size={16} />
              </span>
              <strong>{t("auth.secureNote")}</strong>
              <small>{t("auth.privateByDesign")}</small>
            </div>
          </div>
          <div className="auth-orbit" aria-hidden="true">
            <div />
            <div />
            <div />
            <span>
              <Sparkles size={18} />
            </span>
          </div>
        </div>
        <Card className="auth-card">
          <div className="auth-scope-label">{scopeLabel}</div>
          <div className="auth-card-heading">
            <div>
              <span className="section-eyebrow">{t("auth.identity")}</span>
              <h2>{mode === "signin" ? t("auth.signIn") : t("auth.signUp")}</h2>
            </div>
            <div className="auth-icon">
              <UserRound size={20} />
            </div>
          </div>
          <div className="auth-tabs">
            <button
              className={mode === "signin" ? "active" : ""}
              onClick={() => setMode("signin")}
            >
              {t("auth.signIn")}
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => setMode("signup")}
            >
              {t("auth.signUp")}
            </button>
          </div>
          <form onSubmit={submit}>
            {mode === "signup" && (
              <label className="form-field">
                <span>{t("auth.name")}</span>
                <div className="input-wrap">
                  <UserRound size={16} />
                  <input
                    required
                    value={form.name}
                    onChange={update("name")}
                    placeholder={t("auth.playerPlaceholder")}
                  />
                </div>
              </label>
            )}
            <label className="form-field">
              <span>{t("auth.email")}</span>
              <div className="input-wrap">
                <Mail size={16} />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  placeholder={t("auth.emailPlaceholder")}
                />
              </div>
            </label>
            <label className="form-field">
              <span>{t("auth.password")}</span>
              <div className="input-wrap">
                <LockKeyhole size={16} />
                <input
                  required
                  minLength={6}
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder={t("auth.passwordPlaceholder")}
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword
                      ? t("auth.hidePassword")
                      : t("auth.showPassword")
                  }
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <Button
              className="full-button auth-submit"
              type="submit"
              disabled={authBusy}
              iconAfter={ArrowRight}
            >
              {authBusy
                ? t("common.loading")
                : mode === "signin"
                  ? t("auth.signIn")
                  : t("auth.signUp")}
            </Button>
          </form>
          <div className="auth-divider">
            <span>{t("auth.or")}</span>
          </div>
          <Button
            variant="quiet"
            className="full-button"
            onClick={guest}
            icon={Sparkles}
          >
            {t("auth.continueGuest")}
          </Button>
          <p className="auth-terms">{t("auth.terms")}</p>
        </Card>
      </div>
      <div className="auth-footer">
        <span>{t("app.footer")}</span>
        <span>{t("auth.secureNote")}</span>
      </div>
    </main>
  );
}
