import { useState } from "react";
import {
  Check,
  Globe2,
  Languages,
  Moon,
  Palette,
  RefreshCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useApp } from "../App";
import {
  Card,
  PageHeader,
  SectionHeading,
  Button,
} from "../components/Primitives";
import { LANGUAGES } from "../i18n/translations";
import { formatDigitSequence, getNumberingSystem } from "../lib/numerals";
import SelectMenu from "../components/SelectMenu";

export default function Settings() {
  const { t, settings, updateSettings, resetProgress, showToast } = useApp();
  const [confirmReset, setConfirmReset] = useState(false);
  return (
    <main className="page settings-page">
      <PageHeader
        eyebrow={t("nav.settings")}
        title={t("settings.title")}
        description={t("settings.subtitle")}
      />
      <div className="settings-layout">
        <div className="settings-main">
          <Card className="settings-card">
            <SectionHeading
              eyebrow={t("settings.appearance")}
              title={t("settings.appearance")}
            />
            <div className="theme-choice-grid">
              <button
                className={`theme-choice ${settings.theme === "light" ? "active" : ""}`}
                onClick={() => updateSettings({ theme: "light" })}
              >
                <div className="theme-preview preview-light">
                  <span />
                  <span />
                  <span />
                </div>
                <div>
                  <strong>{t("theme.light")}</strong>
                  <small>{t("settings.lightHint")}</small>
                </div>
                {settings.theme === "light" && <Check size={16} />}
              </button>
              <button
                className={`theme-choice ${settings.theme === "dark" ? "active" : ""}`}
                onClick={() => updateSettings({ theme: "dark" })}
              >
                <div className="theme-preview preview-dark">
                  <span />
                  <span />
                  <span />
                </div>
                <div>
                  <strong>{t("theme.dark")}</strong>
                  <small>{t("settings.darkHint")}</small>
                </div>
                {settings.theme === "dark" && <Check size={16} />}
              </button>
            </div>
          </Card>
          <Card className="settings-card">
            <SectionHeading
              eyebrow={t("settings.languageSection")}
              title={t("language")}
            />
            <div className="settings-language-row">
              <div className="settings-row-icon">
                <Languages size={18} />
              </div>
              <div>
                <strong>{t("language")}</strong>
                <p>{t("settings.saved")}</p>
              </div>
              <div className="language-select">
                <Globe2 size={15} />
                <SelectMenu
                  value={settings.locale}
                  options={LANGUAGES.map(([code, label]) => ({
                    value: code,
                    label,
                  }))}
                  onChange={(value) => updateSettings({ locale: value })}
                  ariaLabel={t("language")}
                />
              </div>
            </div>
            <div className="language-rtl-note">
              <Sparkles size={14} /> {t("settings.rtlNote")}
            </div>
            <div className="numeral-locale-note">
              <span className="numeral-preview" aria-hidden="true">
                {formatDigitSequence("0123456789", settings.locale)}
              </span>
              <span>
                <strong>{t("input.localizedNumerals")}</strong>
                <small>
                  {t("input.localizedNumeralsDescription")} ·{" "}
                  {getNumberingSystem(settings.locale)}
                </small>
              </span>
            </div>
          </Card>
          <Card className="settings-card">
            <SectionHeading
              eyebrow={t("settings.soundSection")}
              title={t("sound")}
            />
            <ToggleRow
              icon={settings.sound ? Volume2 : VolumeX}
              title={t("sound")}
              description={t("settings.soundDescription")}
              value={settings.sound}
              onChange={(value) => updateSettings({ sound: value })}
            />
            <ToggleRow
              icon={SlidersHorizontal}
              title={t("reduceMotion")}
              description={t("settings.reduceMotionDescription")}
              value={settings.reduceMotion}
              onChange={(value) => updateSettings({ reduceMotion: value })}
            />
          </Card>
        </div>
        <aside className="settings-side">
          <Card className="settings-about-card">
            <div className="settings-about-icon">
              <Sparkles size={20} />
            </div>
            <span className="section-eyebrow">{t("app.editionMarker")}</span>
            <h2>{t("app.tagline")}</h2>
            <p>{t("dashboard.subtitle")}</p>
            <div className="about-row">
              <span>
                <Palette size={14} />{" "}
                {t("settings.languageCount", { count: 16 })}
              </span>
              <span>
                <Check size={14} /> {t("multi.ready")}
              </span>
            </div>
          </Card>
          <Card className="reset-card">
            <div className="side-card-heading">
              <span className="section-eyebrow">{t("settings.reset")}</span>
              <RefreshCcw size={15} />
            </div>
            <p>{t("settings.resetConfirm")}</p>
            {confirmReset ? (
              <div className="reset-confirm">
                <Button
                  size="sm"
                  onClick={() => {
                    resetProgress();
                    setConfirmReset(false);
                    showToast("settings.saved");
                  }}
                  icon={Check}
                >
                  {t("settings.reset")}
                </Button>
                <Button
                  size="sm"
                  variant="quiet"
                  onClick={() => setConfirmReset(false)}
                >
                  {t("common.cancel")}
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="quiet"
                onClick={() => setConfirmReset(true)}
                icon={RefreshCcw}
              >
                {t("settings.reset")}
              </Button>
            )}
          </Card>
          <div className="settings-save-note">
            <Save size={14} />
            <span>{t("settings.saved")}</span>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ToggleRow({ icon: Icon, title, description, value, onChange }) {
  return (
    <div className="toggle-row">
      <div className="settings-row-icon">
        <Icon size={17} />
      </div>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button
        className={`toggle ${value ? "on" : ""}`}
        onClick={() => onChange(!value)}
        aria-label={title}
      >
        <span />
      </button>
    </div>
  );
}
