# GitHub issues 修复与剩余验收

本轮在 `codex/github-issues` 实施，未部署生产。未完成的内容保持开放。

| Issue | 本轮结果 | 尚需完成 |
| --- | --- | --- |
| #23 分数、公式显示与朗读 | Web 支持四种 TeX 分隔符；TTS 将公式中的分数按分母在前朗读，转换常见运算、平方、立方、百分数；Python 收集器与 Web 使用同一语义及内容哈希，防止沿用旧错误音频 | 重新生成受影响音频、教师听审及发布；未带分隔符的斜杠可能是日期或除法，不擅自转换；复杂 LaTeX 仍需逐例补充 |
| #22 语文修订版 | 新增显式教材版本清单、本地 PDF 导入、来源记录和版本输出隔离 | 获取并核对修订版 PDF，生成题库/课文/音频，接入前端版本选择及隔离学习进度 |
| #14 最新数学教材 | 可通过同一版本清单导入新版数学教材 | 真实新版 PDF、逐册适配及审核；没有把旧版数据改标为新版 |
| #7 五四制 | 版本清单支持 `5-4` 学制，与 `6-3` 隔离 | 指定年级、学科和出版社，准备对应教材并完成前端接入 |
| #3 旧 iPad 音频 | 已有 MP3 优先方案；本轮重新通过旧地址回退、播放中断和过期事件回归 | iPad 6 实机验收；本轮无此设备 |
| #12 Web UX | 已有修复保留，本轮 Core 231 测试及类型检查通过 | 教师/儿童/真实设备验收、题量覆盖、音频发布一致性；不能用自动测试替代 |

## 教材导入

将合法取得、已核对版本的 PDF 存入本地目录。清单相对路径以清单自身所在目录为基准，例如 `edition.json`：

```json
{
  "id": "chinese-2022-revised",
  "subject": "chinese",
  "label": "统编版·2022课标修订版",
  "school_system": "6-3",
  "source": "国家中小学智慧教育平台；请补充具体教材页面、版次和核对日期",
  "pdf_dir": "pdfs",
  "textbooks": ["语文五年级上册.pdf"]
}
```

```sh
python scripts/quiz/pipeline.py --subject chinese --edition-config edition.json --dry-run
python scripts/quiz/pipeline.py --subject chinese --edition-config edition.json
```

预览无需 API Key，也不迁移或写入数据。生成仍使用现有模型，需要 `OPENROUTER_API_KEY`。输出位于 `output/editions/chinese-2022-revised/chinese/`，版本来源记录位于上一级 `edition.json`。同一版本 ID 的元数据或 PDF 变化会报错，避免复用旧大纲和题库；改版时使用新 ID。旧命令及旧输出目录保持兼容。五四制使用 `school_system: "5-4"` 和独立 ID。

隔离输出目前用于审核，不会自动进入 Web 课程目录。正式接入需要课程版本 ID、课文/音频映射和学习进度隔离，不能直接覆盖 `output/chinese`。

## 公式音频更新

先运行 `python scripts/tts/collect_texts.py` 重新生成清单，再使用既有 TTS 流程合成缺失项。公式归一化后的文字参与 SHA1，旧音频不会被当作修正音频。Web 构建仅挂载实际存在的新音频；未生成时该段没有朗读地址。合成后运行既有 MP3 转码、完整性检查和人工听审，再发布。

本轮工作区不含音频资源，未调用付费 TTS，未声称已经修复线上声音。独立的 `1/2` 答案也会读作“2分之1”；正文中的未标记斜杠不自动猜测含义。

## 验证命令

```sh
npx tsx scripts/checks/math-speech.ts
python scripts/checks/textbook-editions.py
npx tsx scripts/checks/tts-legacy-audio.ts
npm run type-check
npm test
```

数学回归同时执行 Python 与 TypeScript，对照相同输入的期望朗读结果；包含分母/分子顺序、分隔符、平方/立方、百分比、普通文字和日期不变。新回归纳入 Web UX CI。
