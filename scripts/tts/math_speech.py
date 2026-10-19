"""Speak explicitly delimited mathematics, preserving prose, dates and URLs."""
import re


def math_segments(text: str):
    def escaped(index):
        count = 0
        while index > 0 and text[index - 1] == "\\":
            count += 1
            index -= 1
        return count % 2 == 1
    parts = []
    plain_start = i = 0
    while i < len(text):
        opener = next((token for token in ("$$", "$", r"\(", r"\[")
                       if text.startswith(token, i)), None) if not escaped(i) else None
        if opener is None:
            i += 1
            continue
        closer = {r"\(": r"\)", r"\[": r"\]"}.get(opener, opener)
        end = i + len(opener)
        while end < len(text):
            if text.startswith(closer, end) and not escaped(end):
                break
            end += 1
        if end == len(text):
            break
        if i > plain_start:
            parts.append(("text", text[plain_start:i], text[plain_start:i]))
        parts.append(("block" if opener in ("$$", r"\[") else "inline",
                      text[i + len(opener):end], text[i:end + len(closer)]))
        i = plain_start = end + len(closer)
    if plain_start < len(text):
        parts.append(("text", text[plain_start:], text[plain_start:]))
    return parts


def math_speech(text: str) -> str:
    text = re.sub(r"^\s*(\d+)\s*/\s*(\d+)\s*$", r"\2分之\1", text)
    def formula(value, raw):
        value = re.sub(r"(\d+)\s*(?=\\(?:dfrac|tfrac|frac)\s*\{)", r"\1又", value)
        value = re.sub(r"\\(?:dfrac|tfrac|frac)\s*\{(\d+(?:\.\d+)?)\}\s*\{(\d+(?:\.\d+)?)\}", r"\2分之\1", value)
        if re.search(r"\\(?:dfrac|tfrac|frac)(?![A-Za-z])", value):
            return raw
        value = re.sub(r"(^|[^\d./])(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)(?![\d./])", r"\1\3分之\2", value)
        if "/" in value:
            return raw
        for pattern, replacement in [
            (r"\\(?:left|right)\b", ""),
            (r"\\(?:mathrm|text)\s*\{([^{}]*)\}", r"\1"),
            (r"\^(?:\{2\}|2(?![0-9]))", "的平方"), (r"\^(?:\{3\}|3(?![0-9]))", "的立方"),
            (r"\\times\b|×", "乘以"), (r"\\div\b|÷", "除以"),
            (r"\\(?:leq|le)\b|≤", "小于或等于"),
            (r"\\(?:geq|ge)\b|≥", "大于或等于"),
            (r"\\neq\b|≠", "不等于"), (r"\\pi\b|π", "派"),
            (r"(\d+(?:\.\d+)?)\s*\\?%", r"百分之\1"),
            ("=", "等于"), (r"\+", "加"), ("-", "减"),
            ("<", "小于"), (">", "大于"),
        ]:
            value = re.sub(pattern.replace(r"\b", r"(?![A-Za-z])"), replacement, value)
        return value
    text = "".join(value if kind == "text" else formula(value, raw)
                   for kind, value, raw in math_segments(text))
    return re.sub(r"\s+", " ", text.strip())
