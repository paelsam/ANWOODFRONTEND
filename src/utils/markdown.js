/**
 * Elimina marcadores markdown para síntesis de voz.
 */
export function stripMarkdownForSpeech(text) {
  if (!text) return "";

  return formatColombianPricesForSpeech(
    text
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/_(.+?)_/g, "$1")
      .replace(/`(.+?)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/\n{2,}/g, " ")
      .replace(/\n/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim(),
  );
}

const COP_PRICE_PATTERN =
  /\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/g;

function parseColombianPrice(raw) {
  const [integerPart, decimalPart] = raw.split(",");
  const normalized = integerPart.replace(/\./g, "");
  const value = Number(normalized);
  if (Number.isNaN(value)) return null;
  if (decimalPart != null) return value + Number(`0.${decimalPart}`);
  return value;
}

function speakColombianPesos(amount) {
  const n = Math.round(amount);
  if (n <= 0) return "0 pesos";

  if (n >= 1_000_000) {
    const millions = Math.floor(n / 1_000_000);
    const remainder = n % 1_000_000;
    const millionWord = millions === 1 ? "1 millón" : `${millions} millones`;

    if (remainder === 0) return `${millionWord} de pesos`;
    if (remainder % 1000 === 0) {
      const thousands = remainder / 1000;
      return `${millionWord} ${thousands} mil pesos`;
    }
    return `${millionWord} ${remainder} pesos`;
  }

  if (n >= 1000) {
    if (n % 1000 === 0) return `${n / 1000} mil pesos`;
    return `${Math.floor(n / 1000)} mil ${n % 1000} pesos`;
  }

  return `${n} pesos`;
}

/** Convierte precios con $ a texto en pesos colombianos para TTS. */
export function formatColombianPricesForSpeech(text) {
  if (!text) return "";

  return text
    .replace(COP_PRICE_PATTERN, (_, raw) => {
      const value = parseColombianPrice(raw);
      return value == null ? `$${raw}` : speakColombianPesos(value);
    })
    .replace(/\bUSD\b/gi, "dólares estadounidenses")
    .replace(/\bd[oó]lares(?!\s+estadounidenses)\b/gi, "pesos");
}

const INLINE_PATTERN = /(\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`(.+?)`)/g;

export function parseInlineMarkdown(text, keyPrefix = "md") {
  if (!text) return [];

  const parts = [];
  let lastIndex = 0;
  let match;
  let index = 0;

  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const key = `${keyPrefix}-${index++}`;
    if (match[2] != null) {
      parts.push({ type: "strong", key, text: match[2] });
    } else if (match[3] != null) {
      parts.push({ type: "em", key, text: match[3] });
    } else if (match[4] != null) {
      parts.push({ type: "em", key, text: match[4] });
    } else if (match[5] != null) {
      parts.push({ type: "code", key, text: match[5] });
    }

    lastIndex = INLINE_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

export function splitMarkdownParagraphs(text) {
  if (!text) return [];
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}
