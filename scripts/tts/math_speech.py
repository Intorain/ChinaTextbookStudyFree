"""Speak explicitly delimited mathematics, preserving prose, dates and URLs."""
import re


def math_speech(text: str) -> str:
    text = re.sub(r"^\s*(\d+)\s*/\s*(\d+)\s*$", r"\2分之\1", text)
    def formula(match):
        value = next(group for group in match.groups() if group is not None)
        while True:
            updated = re.sub(r"\\(?:dfrac|tfrac|frac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}", r"\2分之\1", value)
            if updated == value:
                break
            value = updated
        for pattern, replacement in [
            (r"(\d+)\s*/\s*(\d+)", r"\2分之\1"),
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
            value = re.sub(pattern, replacement, value)
        return value
    text = re.sub(r"\$\$([\s\S]*?)\$\$|\$([^$\n]+)\$|\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]", formula, text)
    return re.sub(r"\s+", " ", text.strip())
