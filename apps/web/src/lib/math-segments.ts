export type MathSegment = { type: "text" | "inline" | "block"; value: string };

/** Recognize both TeX delimiter conventions; escaped dollars remain prose. */
export function splitMath(text: string): MathSegment[] {
  const parts: MathSegment[] = [];
  const pattern = /(?<!\\)(\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\])/g;
  let start = 0;
  for (const match of text.matchAll(pattern)) {
    const index = match.index!;
    if (index > start) parts.push({ type: "text", value: text.slice(start, index) });
    parts.push({ type: match[2] !== undefined || match[5] !== undefined ? "block" : "inline",
      value: match[2] ?? match[3] ?? match[4] ?? match[5] });
    start = index + match[0].length;
  }
  if (start < text.length) parts.push({ type: "text", value: text.slice(start) });
  return parts;
}
