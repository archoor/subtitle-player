"""
把生成的图标 PNG 处理成 Windows 用的多尺寸 .ico：
1. 裁掉四周白边（按非白像素包围盒）
2. 补成正方形（透明填充）
3. 把残留近白像素（阴影/圆角外）变透明
4. 加圆角遮罩，输出干净的圆角透明图标
5. 保存为含 16/32/48/64/128/256 多尺寸的 .ico

用法（项目根）：
  uv run python subtitle_player/packaging/make_icon.py <src_png> <out_ico>
"""

from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw


def main() -> int:
    src = Path(sys.argv[1])
    out = Path(sys.argv[2])

    img = Image.open(src).convert("RGBA")
    arr = np.array(img)
    rgb = arr[:, :, :3].astype(int)

    # 非近白像素的包围盒
    nonwhite = ~((rgb[:, :, 0] > 248) & (rgb[:, :, 1] > 248) & (rgb[:, :, 2] > 248))
    ys, xs = np.where(nonwhite)
    x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
    crop = img.crop((x0, y0, x1 + 1, y1 + 1))

    # 补成正方形（透明）
    w, h = crop.size
    s = max(w, h)
    square = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    square.paste(crop, ((s - w) // 2, (s - h) // 2))

    # 残留近白（外圈阴影/圆角）变透明
    a = np.array(square)
    white = (a[:, :, 0] > 246) & (a[:, :, 1] > 246) & (a[:, :, 2] > 246)
    a[white, 3] = 0
    square = Image.fromarray(a)

    # 统一到 512，再加圆角遮罩
    size = 512
    square = square.resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=int(size * 0.18), fill=255
    )
    combined = ImageChops.multiply(square.split()[3], mask)
    square.putalpha(combined)

    out.parent.mkdir(parents=True, exist_ok=True)
    square.save(
        out,
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    # 顺手存一份处理后的 PNG 备用
    square.save(out.with_suffix(".png"))
    print(f"icon written: {out}  ({out.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
