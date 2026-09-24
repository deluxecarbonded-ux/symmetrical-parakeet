import { Delete, RotateCcw } from "lucide-react";
import { formatCode, normalizeDigits } from "../lib/numerals";
import { getLetterCharacters } from "../lib/letterSets";

function appendDigit(value, digit, maxLength) {
  return normalizeDigits(`${value}${digit}`).slice(0, maxLength);
}

function cleanWord(value, maxLength = 40) {
  return [...String(value)]
    .filter((character) => /[\p{L}\p{M}\s]/u.test(character))
    .join("")
    .replace(/\s+/g, " ")
    .trimStart()
    .slice(0, maxLength);
}

export function Numpad({
  value,
  onChange,
  onSubmit,
  onClear,
  t,
  locale = "en",
  disabled = false,
  inputRef,
  maxLength = 4,
}) {
  const focusInput = () => {
    window.setTimeout(() => inputRef?.current?.focus(), 0);
  };
  const updateDigit = (digit) => {
    if (disabled) return;
    onChange(appendDigit(value, digit, maxLength));
    focusInput();
  };
  const removeDigit = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
    focusInput();
  };
  const clear = () => {
    if (disabled) return;
    onClear?.();
    onChange("");
    focusInput();
  };

  return (
    <div className="answer-pad numpad answer-pad-card">
      <div className="answer-pad-heading">
        <div>
          <span className="section-eyebrow">{t("input.digits")}</span>
          <small>{t("input.digitsDescription")}</small>
        </div>
        <button
          className="clear-code"
          type="button"
          onClick={clear}
          disabled={disabled}
        >
          {t("single.clear")}
        </button>
      </div>
      <input
        ref={inputRef}
        className="code-input"
        aria-label={t("single.enterCode")}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={maxLength}
        value={value}
        onChange={(event) => {
          if (!disabled)
            onChange(normalizeDigits(event.target.value).slice(0, maxLength));
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit?.();
          }
          if (event.key === "Backspace") {
            event.preventDefault();
            removeDigit();
          }
        }}
      />
      <div
        className="keypad numpad-grid"
        role="group"
        aria-label={t("input.digits")}
      >
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            className="key"
            type="button"
            key={digit}
            onClick={() => updateDigit(digit)}
            disabled={disabled}
          >
            {formatCode(digit, locale)}
          </button>
        ))}
        <button
          className="key key-muted"
          type="button"
          onClick={clear}
          disabled={disabled}
          aria-label={t("single.clear")}
        >
          <RotateCcw size={15} />
        </button>
        <button
          className="key"
          type="button"
          onClick={() => updateDigit("0")}
          disabled={disabled}
        >
          {formatCode("0", locale)}
        </button>
        <button
          className="key key-muted"
          type="button"
          onClick={removeDigit}
          disabled={disabled}
          aria-label={t("input.backspace")}
        >
          <Delete size={16} />
        </button>
      </div>
    </div>
  );
}

export function LettersPad({
  value,
  onChange,
  onSubmit,
  onClear,
  t,
  locale = "en",
  disabled = false,
  inputRef,
  maxLength = 40,
}) {
  const characters = getLetterCharacters(locale);
  const rtl = locale === "ar" || locale === "ur";
  const updateWord = (next) => onChange(cleanWord(next, maxLength));
  const appendCharacter = (character) => {
    if (disabled) return;
    updateWord(`${value}${character}`);
    window.setTimeout(() => inputRef?.current?.focus(), 0);
  };
  const removeCharacter = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
    window.setTimeout(() => inputRef?.current?.focus(), 0);
  };
  const clear = () => {
    if (disabled) return;
    onClear?.();
    onChange("");
    window.setTimeout(() => inputRef?.current?.focus(), 0);
  };

  return (
    <div className="answer-pad letters-pad answer-pad-card">
      <div className="answer-pad-heading">
        <div>
          <span className="section-eyebrow">{t("input.letters")}</span>
          <small>{t("input.lettersDescription")}</small>
        </div>
        <button
          className="clear-code"
          type="button"
          onClick={clear}
          disabled={disabled}
        >
          {t("single.clear")}
        </button>
      </div>
      <input
        ref={inputRef}
        className="letters-input"
        aria-label={t("single.enterWord")}
        lang={locale}
        dir={rtl ? "rtl" : "ltr"}
        autoComplete="off"
        spellCheck={false}
        maxLength={maxLength}
        value={value}
        placeholder={t("single.wordPlaceholder")}
        onChange={(event) => {
          if (!disabled) updateWord(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit?.();
          }
          if (event.key === "Backspace") {
            event.preventDefault();
            removeCharacter();
          }
        }}
      />
      <div className="letters-pad-actions">
        <button
          className="key key-muted letters-pad-action"
          type="button"
          onClick={() => appendCharacter(" ")}
          disabled={disabled}
          aria-label={t("input.space")}
        >
          <span aria-hidden="true">␣</span>
        </button>
        <button
          className="key key-muted letters-pad-action"
          type="button"
          onClick={removeCharacter}
          disabled={disabled}
          aria-label={t("input.backspace")}
        >
          <Delete size={16} />
        </button>
      </div>
      <div
        className="letters-pad-grid"
        role="group"
        aria-label={t("input.letters")}
      >
        {characters.map((character) => (
          <button
            className="key letter-key"
            type="button"
            key={character}
            onClick={() => appendCharacter(character)}
            disabled={disabled}
            aria-label={character}
          >
            {character}
          </button>
        ))}
      </div>
    </div>
  );
}
