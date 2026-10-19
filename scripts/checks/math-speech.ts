import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { mathSpeech } from "../../packages/core/src/mathSpeech";
import { splitMath } from "../../apps/web/src/lib/math-segments";

const cases = [
  [String.raw`$2\frac{1}{3}$`, "2又3分之1"],
  ["$1.5/2.5$", "2.5分之1.5"],
  ["$1/2/3$", "$1/2/3$"],
  [String.raw`$\frac{1+2}{3}$`, String.raw`$\frac{1+2}{3}$`],
  [String.raw`$\frac{\frac{1}{2}}{3}$`, String.raw`$\frac{\frac{1}{2}}{3}$`],
  [String.raw`$\pi厘米$`, "派厘米"],
  [String.raw`价格 \$2 与 \$3`, String.raw`价格 \$2 与 \$3`],
  ["未配对 $$1+2$", "未配对 $$1+2$"],
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
assert.deepEqual(splitMath("未配对 $$1+2$"), [{ type: "text", value: "未配对 $$1+2$" }]);
assert.deepEqual(splitMath(String.raw`价格 \$2 与 \$3`), [{ type: "text", value: String.raw`价格 \$2 与 \$3` }]);
assert.deepEqual(splitMath(String.raw`$\text{\$2}+3$`), [{ type: "inline", value: String.raw`\text{\$2}+3` }]);

// Verify the actual shipped corpus, not only hand-picked examples: a single
// Python/JS mismatch gives the collector and web builder different audio hashes.
const texts = new Set<string>(cases.map(([input]) => input));
function collect(value: unknown) {
  if (typeof value === "string") texts.add(value);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === "object") Object.values(value).forEach(collect);
}
for (const subject of ["math", "chinese", "english", "science"]) {
  const dir = path.join("output", subject, "quizzes");
  for (const file of fs.readdirSync(dir).filter(file => file.endsWith(".json"))) {
    collect(JSON.parse(fs.readFileSync(path.join(dir, file), "utf8")));
  }
}
const corpus = [...texts];
const result = spawnSync("python", ["-X", "utf8", "-c", "import sys,json; sys.path.insert(0,'scripts/tts'); from collect_texts import normalize; print(json.dumps([normalize(x) for x in json.load(sys.stdin)]))"],
  { input: JSON.stringify(corpus), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
assert.equal(result.status, 0, result.stderr);
const spoken: string[] = JSON.parse(result.stdout);
corpus.forEach((input, index) => assert.equal(mathSpeech(input), spoken[index], input));
console.log(`PASS: ${corpus.length} unique corpus strings retain identical Python/Web audio identities`);
console.log("PASS: math display delimiters, speech semantics and Python/TypeScript parity");
