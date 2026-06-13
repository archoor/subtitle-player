"""
数据模型：字幕段与整份字幕文档。

设计要点：
- 每段固定有 en / zh 两个字段，便于前端「双栏 / 单栏英 / 单栏中」统一渲染。
- 源语言放在 src 字段（'en' 或 'zh'），另一语言为译文，未翻译时为空串。
- 时间一律用秒（float）。funasr 文本只有起始时间，end 由解析器用「下一段起始」兜底。
"""

from __future__ import annotations

from dataclasses import dataclass, asdict, field


@dataclass
class Segment:
    """一段字幕。"""
    start: float            # 起始时间（秒）
    end: float              # 结束时间（秒）
    en: str = ""            # 英文文本（源或译文）
    zh: str = ""            # 中文文本（源或译文）

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class Subtitle:
    """一份字幕文档。"""
    source_file: str                       # 原始字幕文件路径
    src_lang: str                          # 源语言：'en' | 'zh'
    duration: float                        # 总时长（秒），用于最后一段兜底 / 进度条
    segments: list[Segment] = field(default_factory=list)
    translated: bool = False               # 译文是否已就绪（另一语言已填充）

    def to_dict(self) -> dict:
        return {
            "source_file": self.source_file,
            "src_lang": self.src_lang,
            "duration": self.duration,
            "translated": self.translated,
            "segments": [s.to_dict() for s in self.segments],
        }
