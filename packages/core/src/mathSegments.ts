export type MathSegment = { type: "text" | "inline" | "block"; value: string; raw: string };

/** Scan delimiters without lookbehind (also runs on older Safari). */
export function mathSegments(text: string): MathSegment[] {
  const parts: MathSegment[] = [];
  const escaped = (index: number) => {
    let count = 0;
    while (index > 0 && text[--index] === "\\") count++;
    return count % 2 === 1;
  };
  let plainStart = 0;
  let i = 0;
  while (i < text.length) {
    const open = !escaped(i) ? ["$$", "$", "\\(", "\\["].find(token => text.startsWith(token, i)) : undefined;
    if (!open) { i++; continue; }
    const close = open === "\\(" ? "\\)" : open === "\\[" ? "\\]" : open;
    let end = i + open.length;
    while (end < text.length) {
      if (text.startsWith(close, end) && !escaped(end)) break;
      end++;
    }
    // Keep an unclosed opener literal, including its inner dollar characters.
    if (end === text.length) break;
    if (i > plainStart) parts.push({ type: "text", value: text.slice(plainStart, i), raw: text.slice(plainStart, i) });
    parts.push({ type: open === "$$" || open === "\\[" ? "block" : "inline",
      value: text.slice(i + open.length, end), raw: text.slice(i, end + close.length) });
    i = end + close.length;
    plainStart = i;
  }
  if (plainStart < text.length) parts.push({ type: "text", value: text.slice(plainStart), raw: text.slice(plainStart) });
  return parts;
}
