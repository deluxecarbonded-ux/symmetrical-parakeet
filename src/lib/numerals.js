export const NUMBERING_SYSTEMS = {
  en: "latn",
  fr: "latn",
  es: "latn",
  de: "latn",
  pt: "latn",
  it: "latn",
  nl: "latn",
  ru: "latn",
  tr: "latn",
  ja: "latn",
  ko: "latn",
  zh: "latn",
  hi: "deva",
  id: "latn",
  ar: "arab",
  ur: "arabext",
};

const DIGITS = {
  latn: "0123456789",
  arab: "٠١٢٣٤٥٦٧٨٩",
  arabext: "۰۱۲۳۴۵۶۷۸۹",
  deva: "०१२३४५६७८९",
};

export function getNumberingSystem(locale = "en") {
  return NUMBERING_SYSTEMS[locale] || "latn";
}

export function getNumberingLocale(locale = "en") {
  return `${locale || "en"}-u-nu-${getNumberingSystem(locale)}`;
}

export function getLocaleDigits(locale = "en") {
  return DIGITS[getNumberingSystem(locale)] || DIGITS.latn;
}

export function formatLocalizedInteger(value, locale = "en", options = {}) {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  try {
    return localizeDigitsInText(
      new Intl.NumberFormat(getNumberingLocale(locale), options).format(
        safeValue,
      ),
      locale,
    );
  } catch {
    return localizeDigitsInText(
      new Intl.NumberFormat(locale || "en", options).format(safeValue),
      locale,
    );
  }
}

export function toCanonicalDigits(value = "") {
  return [...String(value).normalize("NFKC")]
    .map((character) => {
      const code = character.codePointAt(0);
      if (code >= 0x30 && code <= 0x39) return character;
      if (code >= 0x660 && code <= 0x669)
        return String.fromCharCode(code - 0x660 + 0x30);
      if (code >= 0x6f0 && code <= 0x6f9)
        return String.fromCharCode(code - 0x6f0 + 0x30);
      if (code >= 0x966 && code <= 0x96f)
        return String.fromCharCode(code - 0x966 + 0x30);
      if (code >= 0xff10 && code <= 0xff19)
        return String.fromCharCode(code - 0xff10 + 0x30);
      return character;
    })
    .join("");
}

export function normalizeDigits(value = "") {
  return toCanonicalDigits(value).replace(/[^0-9]/g, "");
}

export function formatDigitSequence(value = "", locale = "en") {
  const digits = getLocaleDigits(locale);
  return normalizeDigits(value)
    .split("")
    .map((digit) => digits[Number(digit)])
    .join("");
}

export function formatCode(value = "", locale = "en") {
  return formatDigitSequence(value, locale).slice(0, 4);
}

export function localizeDigitsInText(value = "", locale = "en") {
  const digits = getLocaleDigits(locale);
  return String(value).replace(/[0-9]/g, (digit) => digits[Number(digit)]);
}

export function formatTimer(totalSeconds = 0, locale = "en") {
  const seconds = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${formatCode(String(minutes).padStart(2, "0"), locale)}:${formatCode(
    String(remainder).padStart(2, "0"),
    locale,
  )}`;
}

export function normalizeWord(value = "", locale = "en") {
  let normalized = String(value)
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .normalize("NFKC")
    .toLocaleLowerCase(locale || "en");
  if (locale === "ja") {
    normalized = normalized.replace(/[\u30a1-\u30f6]/g, (character) =>
      String.fromCharCode(character.charCodeAt(0) - 0x60),
    );
  }
  return normalized.replace(/[\s\p{P}\p{S}]/gu, "");
}

export function answersMatch(expected, submitted, locale = "en") {
  const normalizedExpected = normalizeWord(expected, locale);
  const normalizedSubmitted = normalizeWord(submitted, locale);
  return Boolean(
    normalizedExpected && normalizedExpected === normalizedSubmitted,
  );
}

export function isPuzzleAnswerCorrect(
  puzzle,
  submitted,
  expectedAnswer = puzzle?.answer || "",
  locale = "en",
) {
  if (!puzzle || !submitted) return false;
  if (puzzle.answerType === "letters") {
    return (
      answersMatch(expectedAnswer, submitted, locale) ||
      answersMatch(puzzle.answer, submitted, locale)
    );
  }
  return normalizeDigits(submitted) === normalizeDigits(puzzle.answer);
}

export function formatPuzzleAnswer(puzzle, answer, locale = "en") {
  return puzzle?.answerType === "letters"
    ? localizeDigitsInText(answer || "", locale)
    : formatCode(answer || puzzle?.answer || "", locale);
}
