import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LANGUAGES, translate } from "./i18n/translations";
import "./styles.css";

if (typeof document !== "undefined") {
  document.documentElement.dataset.reduceMotion = String(
    Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches),
  );
}

function getInitialLocale() {
  const browserLocale =
    typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "en";
  return LANGUAGES.some(([code]) => code === browserLocale) ? browserLocale : "en";
}

const initialLocale = getInitialLocale();
const manifestLink = document.querySelector('link[rel="manifest"]');
if (manifestLink) manifestLink.href = `/manifest.${initialLocale}.webmanifest`;

function getErrorCopy() {
  const browserLocale =
    typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "en";
  const locale = LANGUAGES.some(([code]) => code === browserLocale)
    ? browserLocale
    : "en";
  return {
    title: translate(locale, "error.title"),
    description: translate(locale, "error.description"),
    reload: translate(locale, "error.reload"),
  };
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const copy = getErrorCopy();
      return (
        <main className="fatal-error">
          <div className="fatal-error-mark">!</div>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <button
            className="button button-primary"
            onClick={() => window.location.reload()}
          >
            {copy.reload}
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>,
);
