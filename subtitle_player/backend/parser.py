"""
字幕解析：把多种字幕文件解析成统一的 Subtitle 结构。

支持格式：
1. funasr / audio_to_funasr.py 输出的 .txt   —— 每行 `[hh:mm:ss] 文本`
2. .srt   —— 标准 SubRip（带起止时间）
3. .vtt   —— WebVTT（带起止时间）

关键约定（funasr .txt）：
- 每行只有「起始时间」，本段 end = 下一段 start；最后一段用文件总时长兜底。
- 文件末尾有分隔线（一整行 ─）+「完整转写」全文 + 统计行 + 关联总结，需全部跳过。
- 总时长优先从统计行 `音频时长：3061.8s` 提取，提取不到则用「末段 start + 5s」。

语言判定：统计整篇 CJK 字符与拉丁字母占比，多者为源语言（src_lang）。
"""

from __future__ import annotations

import re
from pathlib import Path

from .models import Segment, Subtitle

# [hh:mm:ss] 文本   或   [mm:ss] 文本
_TS_LINE = re.compile(r"^\[(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\]\s*(.*)$")
# 末尾「音频时长：3061.8s」
_DURATION = re.compile(r"音频时长[：:]\s*([\d.]+)\s*s")
# 一整行均为 ─（box drawings light horizontal, U+2500）或常见分隔符
_SEPARATOR = re.compile(r"^[─—\-=_]{10,}\s*$")

# srt / vtt 时间戳：00:00:01,000 --> 00:00:04,000  （vtt 用 . 作毫秒分隔）
_SRT_TIME = re.compile(
    r"(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*"
    r"(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})"
)

_LAST_SEG_PAD = 5.0  # 末段无结束时间时的兜底时长（秒）


def _ts_to_sec(h: str | None, m: str, s: str) -> float:
    return (int(h) if h else 0) * 3600 + int(m) * 60 + int(s)


def _count_cjk(text: str) -> int:
    return sum(1 for ch in text if "\u4e00" <= ch <= "\u9fff")


def _count_latin(text: str) -> int:
    return sum(1 for ch in text if ("a" <= ch.lower() <= "z"))


def detect_lang(text: str) -> str:
    """返回 'zh' 或 'en'：CJK 字符多于拉丁字母即判为中文。"""
    return "zh" if _count_cjk(text) >= _count_latin(text) else "en"


def _read_text(path: Path) -> str:
    # funasr 输出为 utf-8；做一次宽松回退
    for enc in ("utf-8", "utf-8-sig", "gbk"):
        try:
            return path.read_text(encoding=enc)
        except UnicodeDecodeError:
            continue
    return path.read_text(encoding="utf-8", errors="ignore")


def _parse_funasr_txt(raw: str) -> tuple[list[tuple[float, str]], float | None]:
    """解析 funasr .txt，返回 [(start, text), ...] 与可选总时长。"""
    items: list[tuple[float, str]] = []
    duration: float | None = None

    for line in raw.splitlines():
        # 命中分隔线即认为正文结束（后面是全文/统计/总结）
        if _SEPARATOR.match(line):
            break
        m = _TS_LINE.match(line)
        if m:
            start = _ts_to_sec(m.group(1), m.group(2), m.group(3))
            text = m.group(4).strip()
            if text:
                items.append((float(start), text))

    # 总时长从统计行提取（分隔线之后的内容）
    dm = _DURATION.search(raw)
    if dm:
        try:
            duration = float(dm.group(1))
        except ValueError:
            duration = None

    return items, duration


def _parse_srt_vtt(raw: str) -> list[tuple[float, float, str]]:
    """解析 srt/vtt，返回 [(start, end, text), ...]（带结束时间）。"""
    blocks: list[tuple[float, float, str]] = []
    cur_time: tuple[float, float] | None = None
    cur_text: list[str] = []

    def flush() -> None:
        nonlocal cur_time, cur_text
        if cur_time and cur_text:
            text = " ".join(t.strip() for t in cur_text if t.strip())
            if text:
                blocks.append((cur_time[0], cur_time[1], text))
        cur_time = None
        cur_text = []

    for line in raw.splitlines():
        ls = line.strip()
        if ls.upper().startswith("WEBVTT"):
            continue
        tm = _SRT_TIME.search(ls)
        if tm:
            flush()
            start = _ts_to_sec(tm.group(1), tm.group(2), tm.group(3)) + int(tm.group(4)) / 1000
            end = _ts_to_sec(tm.group(5), tm.group(6), tm.group(7)) + int(tm.group(8)) / 1000
            cur_time = (start, end)
            cur_text = []
        elif ls.isdigit() and cur_time is None:
            continue  # srt 序号行
        elif ls == "":
            flush()
        else:
            if cur_time is not None:
                cur_text.append(ls)
    flush()
    return blocks


def parse_subtitle(path: str | Path) -> Subtitle:
    """
    解析字幕文件为 Subtitle。自动识别 .srt/.vtt 与 funasr .txt。

    抛出 FileNotFoundError / ValueError（无可解析内容）。
    """
    p = Path(path).expanduser()
    if not p.exists():
        raise FileNotFoundError(f"字幕文件不存在：{p}")

    raw = _read_text(p)
    suffix = p.suffix.lower()

    triples: list[tuple[float, float, str]]
    if suffix in (".srt", ".vtt"):
        triples = _parse_srt_vtt(raw)
        if not triples:
            raise ValueError(f"未从 {suffix} 文件解析到任何字幕：{p.name}")
        duration = triples[-1][1]
    else:
        items, dur = _parse_funasr_txt(raw)
        if not items:
            raise ValueError(
                f"未从文件解析到任何带时间戳的字幕行：{p.name}\n"
                "（期望每行形如 [hh:mm:ss] 文本）"
            )
        # 用下一段起始补齐 end
        triples = []
        for i, (start, text) in enumerate(items):
            if i + 1 < len(items):
                end = items[i + 1][0]
            else:
                end = dur if dur else start + _LAST_SEG_PAD
            # 保护：end 必须大于 start
            if end <= start:
                end = start + _LAST_SEG_PAD
            triples.append((start, end, text))
        duration = dur if dur else triples[-1][1]

    full_text = " ".join(t for _, _, t in triples)
    src_lang = detect_lang(full_text)

    segments = [
        Segment(
            start=start,
            end=end,
            en=text if src_lang == "en" else "",
            zh=text if src_lang == "zh" else "",
        )
        for start, end, text in triples
    ]

    return Subtitle(
        source_file=str(p),
        src_lang=src_lang,
        duration=float(duration),
        segments=segments,
        translated=False,
    )
