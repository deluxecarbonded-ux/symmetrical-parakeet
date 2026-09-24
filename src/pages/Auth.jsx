import { useEffect, useRef, useState } from "react";
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
import { isSupabaseConfigured, supabase } from "../lib/supabase";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidUsername(value) {
  const username = normalizeUsername(value);
  return (
    username.length >= 3 &&
    username.length <= 24 &&
    !/[\s\u0000-\u001f\u007f]/u.test(username)
  );
}

function availabilityMessageKey(field, status) {
  const keys = {
    checking: `auth.${field}Checking`,
    available: `auth.${field}Available`,
    taken: `auth.${field}Taken`,
    invalid: `auth.${field}Invalid`,
    unavailable: "auth.validationUnavailable",
  };
  return keys[status] || null;
}

export default function Auth({ scope = "single" }) {
  const { t, signIn, signUp, signInGuest, authBusy, showToast } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [availability, setAvailability] = useState({
    email: "idle",
    username: "idle",
  });
  const availabilityRequests = useRef({ email: 0, username: 0 });
  const next = params.get("next") || (scope === "multi" ? "/multi" : "/");
  const scopeLabel =
    scope === "multi" ? t("dashboard.multiMode") : t("dashboard.singleMode");
  const update = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }));
  useEffect(() => {
    if (mode !== "signup") return undefined;
    const email = form.email.trim();
    const requestId = ++availabilityRequests.current.email;
    if (!email) {
      setAvailability((current) => ({ ...current, email: "idle" }));
      return undefined;
    }
    if (!EMAIL_PATTERN.test(email)) {
      setAvailability((current) => ({ ...current, email: "invalid" }));
      return undefined;
    }
    setAvailability((current) => ({ ...current, email: "checking" }));
    const timeout = window.setTimeout(async () => {
      if (!isSupabaseConfigured) {
        if (requestId === availabilityRequests.current.email)
          setAvailability((current) => ({ ...current, email: "unavailable" }));
        return;
      }
      const { data, error } = await supabase.rpc("check_signup_email", {
        p_email: email.toLowerCase(),
      });
      if (requestId !== availabilityRequests.current.email) return;
      if (error) {
        setAvailability((current) => ({ ...current, email: "unavailable" }));
      } else if (data?.available) {
        setAvailability((current) => ({ ...current, email: "available" }));
      } else {
        setAvailability((current) => ({
          ...current,
          email: data?.reason === "taken" ? "taken" : "invalid",
        }));
      }
    }, 400);
    return () => {
      window.clearTimeout(timeout);
      availabilityRequests.current.email += 1;
    };
  }, [form.email, mode]);

  useEffect(() => {
    if (mode !== "signup") return undefined;
    const username = normalizeUsername(form.username);
    const requestId = ++availabilityRequests.current.username;
    if (!username) {
      setAvailability((current) => ({ ...current, username: "idle" }));
      return undefined;
    }
    if (!isValidUsername(username)) {
      setAvailability((current) => ({ ...current, username: "invalid" }));
      return undefined;
    }
    setAvailability((current) => ({ ...current, username: "checking" }));
    const timeout = window.setTimeout(async () => {
      if (!isSupabaseConfigured) {
        if (requestId === availabilityRequests.current.username)
          setAvailability((current) => ({
            ...current,
            username: "unavailable",
          }));
        return;
      }
      const { data, error } = await supabase.rpc(
        "check_username_availability",
        { p_username: username },
      );
      if (requestId !== availabilityRequests.current.username) return;
      if (error) {
        setAvailability((current) => ({ ...current, username: "unavailable" }));
      } else if (data?.available) {
        setAvailability((current) => ({ ...current, username: "available" }));
      } else {
        setAvailability((current) => ({
          ...current,
          username: data?.reason === "taken" ? "taken" : "invalid",
        }));
      }
    }, 400);
    return () => {
      window.clearTimeout(timeout);
      availabilityRequests.current.username += 1;
    };
  }, [form.username, mode]);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setAvailability({ email: "idle", username: "idle" });
  };

  const submit = async (event) => {
    event.preventDefault();
    if (mode === "signup") {
      const username = normalizeUsername(form.username);
      const email = form.email.trim().toLowerCase();
      if (!EMAIL_PATTERN.test(email) || !isValidUsername(username)) {
        setAvailability((current) => ({
          ...current,
          email: EMAIL_PATTERN.test(email) ? current.email : "invalid",
          username: isValidUsername(username) ? current.username : "invalid",
        }));
        showToast("auth.signupValidation");
        return;
      }
      if (
        availability.email !== "available" ||
        availability.username !== "available"
      ) {
        if (
          availability.email === "unavailable" ||
          availability.username === "unavailable"
        ) {
          showToast("auth.validationUnavailable");
        } else if (availability.email === "taken") {
          showToast("auth.emailTaken");
        } else if (availability.username === "taken") {
          showToast("auth.usernameTaken");
        }
        return;
      }
      const result = await signUp({
        ...form,
        email,
        username,
        name: form.name.trim() || username,
      });
      if (result) navigate(next, { replace: true });
      return;
    }
    const result = await signIn({
      email: form.email,
      password: form.password,
      name: form.name,
    });
    if (result) navigate(next, { replace: true });
  };
  const guest = async () => {
    const result = await signInGuest(
      form.name.trim() || form.username.trim() || DEFAULT_GUEST_NAME,
    );
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
              onClick={() => changeMode("signin")}
            >
              {t("auth.signIn")}
            </button>
            <button
              className={mode === "signup" ? "active" : ""}
              onClick={() => changeMode("signup")}
            >
              {t("auth.signUp")}
            </button>
          </div>
          <form onSubmit={submit}>
            {mode === "signup" && (
              <label className="form-field">
                <span>{t("auth.username")}</span>
                <div className={`input-wrap ${availability.username}`}>
                  <UserRound size={16} />
                  <input
                    required
                    minLength={3}
                    maxLength={24}
                    autoComplete="username"
                    dir="ltr"
                    value={form.username}
                    onChange={update("username")}
                    placeholder={t("auth.usernamePlaceholder")}
                    aria-invalid={
                      availability.username === "invalid" ||
                      availability.username === "taken"
                    }
                  />
                </div>
                <small className="field-hint">{t("auth.usernameHint")}</small>
                {availability.username !== "idle" && (
                  <small
                    className={`field-status ${availability.username}`}
                    role="status"
                  >
                    {t(
                      availabilityMessageKey("username", availability.username),
                    )}
                  </small>
                )}
              </label>
            )}
            <label className="form-field">
              <span>{t("auth.email")}</span>
              <div className={`input-wrap ${availability.email}`}>
                <Mail size={16} />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  dir="ltr"
                  value={form.email}
                  onChange={update("email")}
                  placeholder={t("auth.emailPlaceholder")}
                  aria-invalid={
                    availability.email === "invalid" ||
                    availability.email === "taken"
                  }
                />
              </div>
              {availability.email !== "idle" && (
                <small
                  className={`field-status ${availability.email}`}
                  role="status"
                >
                  {t(availabilityMessageKey("email", availability.email))}
                </small>
              )}
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
