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
import ValidationMessage from "../components/FormValidation";
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
  const { t, signIn, signUp, authBusy, showToast } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [mode, setMode] = useState("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [availability, setAvailability] = useState({
    email: "idle",
    username: "idle",
  });
  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
  });
  const fieldRefs = useRef({});
  const availabilityRequests = useRef({ email: 0, username: 0 });
  const next = params.get("next") || (scope === "multi" ? "/multi" : "/");
  const scopeLabel =
    scope === "multi" ? t("dashboard.multiMode") : t("dashboard.singleMode");
  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
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
    setErrors({ email: "", username: "", password: "" });
  };

  const focusFirstError = (nextErrors) => {
    const firstField = ["username", "email", "password"].find(
      (field) => nextErrors[field],
    );
    if (!firstField) return;
    window.requestAnimationFrame(() => fieldRefs.current[firstField]?.focus());
  };

  const validate = () => {
    const nextErrors = { email: "", username: "", password: "" };
    const email = form.email.trim();
    const username = normalizeUsername(form.username);
    const password = form.password;

    if (!email) nextErrors.email = "validation.required";
    else if (!EMAIL_PATTERN.test(email)) nextErrors.email = "validation.email";

    if (mode === "signup") {
      if (!username) nextErrors.username = "validation.required";
      else if (!isValidUsername(username)) {
        nextErrors.username = "validation.username";
      }
    }

    if (!password) nextErrors.password = "validation.required";
    else if (password.length < 6) nextErrors.password = "validation.password";

    setErrors(nextErrors);
    return nextErrors;
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.values(nextErrors).some(Boolean)) {
      showToast("validation.fixErrors");
      focusFirstError(nextErrors);
      return;
    }

    const username = normalizeUsername(form.username);
    const email = form.email.trim().toLowerCase();
    if (mode === "signup") {
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
        } else {
          showToast("auth.validationUnavailable");
        }
        return;
      }
      const result = await signUp({
        ...form,
        email,
        username,
        name: username,
      });
      if (result) navigate(next, { replace: true });
      return;
    }
    const result = await signIn({
      email,
      password: form.password,
    });
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
          <form onSubmit={submit} noValidate>
            {mode === "signup" && (
              <label className="form-field">
                <span>{t("auth.username")}</span>
                <div
                  className={`input-wrap ${availability.username} ${
                    errors.username ? "has-error" : ""
                  }`}
                >
                  <UserRound size={16} />
                  <input
                    ref={(node) => {
                      fieldRefs.current.username = node;
                    }}
                    autoComplete="username"
                    dir="ltr"
                    inputMode="text"
                    value={form.username}
                    onChange={update("username")}
                    placeholder={t("auth.usernamePlaceholder")}
                    aria-invalid={Boolean(
                      errors.username ||
                        availability.username === "invalid" ||
                        availability.username === "taken",
                    )}
                    aria-describedby="auth-username-hint auth-username-status auth-username-error"
                  />
                </div>
                <small id="auth-username-hint" className="field-hint">
                  {t("auth.usernameHint")}
                </small>
                {availability.username !== "idle" && (
                  <small
                    id="auth-username-status"
                    className={`field-status ${availability.username}`}
                    role="status"
                  >
                    {t(
                      availabilityMessageKey("username", availability.username),
                    )}
                  </small>
                )}
                <ValidationMessage
                  id="auth-username-error"
                  visible={Boolean(errors.username)}
                >
                  {errors.username ? t(errors.username) : null}
                </ValidationMessage>
              </label>
            )}
            <label className="form-field">
              <span>{t("auth.email")}</span>
              <div
                className={`input-wrap ${availability.email} ${
                  errors.email ? "has-error" : ""
                }`}
              >
                <Mail size={16} />
                <input
                  ref={(node) => {
                    fieldRefs.current.email = node;
                  }}
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  value={form.email}
                  onChange={update("email")}
                  placeholder={t("auth.emailPlaceholder")}
                  aria-invalid={Boolean(
                    errors.email ||
                      availability.email === "invalid" ||
                      availability.email === "taken",
                  )}
                  aria-describedby="auth-email-status auth-email-error"
                />
              </div>
              {availability.email !== "idle" && (
                <small
                  id="auth-email-status"
                  className={`field-status ${availability.email}`}
                  role="status"
                >
                  {t(availabilityMessageKey("email", availability.email))}
                </small>
              )}
              <ValidationMessage
                id="auth-email-error"
                visible={Boolean(errors.email)}
              >
                {errors.email ? t(errors.email) : null}
              </ValidationMessage>
            </label>
            <label className="form-field">
              <span>{t("auth.password")}</span>
              <div
                className={`input-wrap ${errors.password ? "has-error" : ""}`}
              >
                <LockKeyhole size={16} />
                <input
                  ref={(node) => {
                    fieldRefs.current.password = node;
                  }}
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder={t("auth.passwordPlaceholder")}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby="auth-password-error"
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
              <ValidationMessage
                id="auth-password-error"
                visible={Boolean(errors.password)}
              >
                {errors.password ? t(errors.password) : null}
              </ValidationMessage>
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
