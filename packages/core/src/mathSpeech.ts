/** Keep in sync with scripts/tts/math_speech.py; parity is checked in CI. */
export function mathSpeech(text: string): string {
  // A standalone answer/option is unambiguous; slashes inside prose may be dates.
  text = text.replace(/^\s*(\d+)\s*\/\s*(\d+)\s*$/, "$2分之$1");
  const formula = (value: string): string => {
    let previous: string;
    do {
      previous = value;
      value = value.replace(/\\(?:dfrac|tfrac|frac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "$2分之$1");
    } while (value !== previous);
    return value
      .replace(/(\d+)\s*\/\s*(\d+)/g, "$2分之$1")
      .replace(/\\(?:left|right)\b/g, "")
      .replace(/\\(?:mathrm|text)\s*\{([^{}]*)\}/g, "$1")
      .replace(/\^(?:\{2\}|2(?![0-9]))/g, "的平方")
      .replace(/\^(?:\{3\}|3(?![0-9]))/g, "的立方")
      .replace(/\\times\b|×/g, "乘以")
      .replace(/\\div\b|÷/g, "除以")
      .replace(/\\(?:leq|le)\b|≤/g, "小于或等于")
      .replace(/\\(?:geq|ge)\b|≥/g, "大于或等于")
      .replace(/\\neq\b|≠/g, "不等于")
      .replace(/\\pi\b|π/g, "派")
      .replace(/(\d+(?:\.\d+)?)\s*\\?%/g, "百分之$1")
      .replace(/=/g, "等于").replace(/\+/g, "加").replace(/-/g, "减")
      .replace(/</g, "小于").replace(/>/g, "大于");
  };
  return text.replace(/\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]/g,
    (_, a, b, c, d) => formula(a ?? b ?? c ?? d)).trim().replace(/\s+/g, " ");
}
