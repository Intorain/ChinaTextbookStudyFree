import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mathSpeech } from "../../packages/core/src/mathSpeech";
import { splitMath } from "../../apps/web/src/lib/math-segments";

const cases = [
  ["1/2", "2分之1"],
  [String.raw`求 $\frac{1}{2}+\dfrac{3}{4}$`, "求 2分之1加4分之3"],
  [String.raw`\(1/2\times 4=2\)`, "2分之1乘以 4等于2"],
  [String.raw`\[3^{2}+2^3\]`, "3的平方加2的立方"],
  ["$2^20$", "2^20"],
  ["$$25%≤50%$$", "百分之25小于或等于百分之50"],
  ["2026/10/19 https://example.com/a/b", "2026/10/19 https://example.com/a/b"],
  ["普通课文 Hello world", "普通课文 Hello world"],
];
for (const [input, expected] of cases) assert.equal(mathSpeech(input), expected);
const python = spawnSync("python", ["-X", "utf8", "-c", "import sys,json; sys.path.insert(0,'scripts/tts'); from math_speech import math_speech; print(json.dumps([math_speech(x) for x in json.load(sys.stdin)]))"],
  { input: JSON.stringify(cases.map(([input]) => input)), encoding: "utf8" });
assert.equal(python.status, 0, python.stderr);
assert.deepEqual(JSON.parse(python.stdout), cases.map(([, expected]) => expected));
assert.deepEqual(splitMath(String.raw`算 \(\frac{1}{2}\)，\[x^2\]，$3$，$$4$$`), [
  { type: "text", value: "算 " }, { type: "inline", value: String.raw`\frac{1}{2}` },
  { type: "text", value: "，" }, { type: "block", value: "x^2" },
  { type: "text", value: "，" }, { type: "inline", value: "3" },
  { type: "text", value: "，" }, { type: "block", value: "4" },
]);
assert.deepEqual(splitMath("未配对 $3"), [{ type: "text", value: "未配对 $3" }]);
console.log("PASS: math display delimiters, speech semantics and Python/TypeScript parity");
