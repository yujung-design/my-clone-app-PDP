#!/usr/bin/env python3
"""
CSV → HEVITZ-style Cafe24 detail HTML batch generator.

Usage:
  python scripts/generate_pdp.py
  python scripts/generate_pdp.py --products data/products.csv --blocks data/blocks.csv --out output

Excel tip:
  Save sheets as UTF-8 CSV (products / blocks), or export with
  LibreOffice / Google Sheets → CSV.
"""

from __future__ import annotations

import argparse
import csv
import html
import re
from pathlib import Path
from typing import Any


BLOCK_TYPES = {
    "intro",
    "image",
    "heading",
    "text",
    "colors",
    "specs",
    "notice",
    "quote",
}


def esc(s: Any) -> str:
    return html.escape(str(s or ""), quote=True)


def nl2br(s: str) -> str:
    return esc(s).replace("\n", "<br>")


def split_pipe(value: str) -> list[str]:
    if not value:
        return []
    return [p.strip() for p in value.split("|") if p.strip()]


def normalize_newlines(value: str) -> str:
    return (value or "").replace("\\n", "\n")


def read_csv(path: Path) -> list[dict[str, str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def detail_css() -> str:
    css_path = Path(__file__).resolve().parents[1] / "templates" / "cafe24-detail.css"
    if css_path.exists():
        return css_path.read_text(encoding="utf-8")
    return "/* missing templates/cafe24-detail.css */"


def render_colors(items: list[str]) -> str:
    rows = []
    for i, line in enumerate(items):
        parts = [p.strip() for p in line.split(":", 1)]
        label = parts[0]
        hex_color = parts[1] if len(parts) > 1 else ""
        if not re.match(r"^\d+\.", label):
            label = f"{i + 1:02d}. {label}"
        swatch = (
            f'<span class="hz-swatch" style="background:{esc(hex_color)}"></span>'
            if hex_color
            else ""
        )
        rows.append(f"<li>{swatch}<span>{esc(label)}</span></li>")
    return f'<ul class="hz-colors">{"".join(rows)}</ul>'


def render_specs(items: list[str]) -> str:
    # items may be flat pairs: k|v|k|v  OR already "k|v" rows from pipe-split of pairs
    pairs: list[tuple[str, str]] = []
    if items and all("|" not in x for x in items) and len(items) % 2 == 0:
        for i in range(0, len(items), 2):
            pairs.append((items[i], items[i + 1]))
    else:
        for line in items:
            if "|" in line:
                k, v = line.split("|", 1)
                pairs.append((k.strip(), v.strip()))
            else:
                pairs.append((line, ""))
    rows = "".join(
        f'<div class="hz-spec-row"><dt>{esc(k)}</dt><dd>{esc(v)}</dd></div>'
        for k, v in pairs
    )
    return f'<dl class="hz-specs">{rows}</dl>'


def render_block(block: dict[str, Any], index: int) -> str:
    t = (block.get("block_type") or block.get("type") or "text").lower()
    title = normalize_newlines(block.get("title") or "")
    body = normalize_newlines(block.get("body") or "")
    image_url = block.get("image_url") or block.get("image") or ""
    caption = block.get("caption") or ""
    items = block.get("items") or []
    if isinstance(items, str):
        items = split_pipe(items)

    if t == "intro":
        return f"""
        <section class="hz-block hz-intro" data-block="{index}">
          {f'<h2 class="hz-intro-title">{nl2br(title)}</h2>' if title else ""}
          {f'<p class="hz-intro-body">{nl2br(body)}</p>' if body else ""}
        </section>"""
    if t == "image":
        return f"""
        <figure class="hz-block hz-figure" data-block="{index}">
          <img src="{esc(image_url)}" alt="{esc(caption)}" loading="lazy">
          {f"<figcaption>{esc(caption)}</figcaption>" if caption else ""}
        </figure>"""
    if t == "heading":
        return f"""
        <header class="hz-block hz-heading" data-block="{index}">
          <h3>{esc(title)}</h3>
          <span class="hz-rule" aria-hidden="true"></span>
          {f"<p>{nl2br(body)}</p>" if body else ""}
        </header>"""
    if t == "text":
        return f"""
        <section class="hz-block hz-text" data-block="{index}">
          <p>{nl2br(body)}</p>
        </section>"""
    if t == "quote":
        return f"""
        <section class="hz-block hz-quote" data-block="{index}">
          <p>{nl2br(body)}</p>
        </section>"""
    if t == "colors":
        return f'<section class="hz-block" data-block="{index}">{render_colors(items)}</section>'
    if t == "specs":
        return f'<section class="hz-block" data-block="{index}">{render_specs(items)}</section>'
    if t == "notice":
        return f"""
        <aside class="hz-block hz-notice" data-block="{index}">
          <p>{nl2br(body)}</p>
        </aside>"""
    return ""


def build_fragment(product: dict[str, str], blocks: list[dict[str, Any]]) -> str:
    sku = product.get("sku") or product.get("SKU") or ""
    inner = "\n".join(render_block(b, i) for i, b in enumerate(blocks))
    return f"""<!-- HEVITZ-style modular detail | product: {esc(sku)} -->
<div class="hz-detail hz-cafe24">
{inner}
</div>
<style>
{detail_css()}
</style>
"""


def build_preview_page(product: dict[str, str], blocks: list[dict[str, Any]]) -> str:
    name = product.get("name") or "상품명"
    name_en = product.get("name_en") or ""
    price = product.get("price") or ""
    lead = product.get("lead_time") or ""
    info = normalize_newlines(product.get("product_info") or "")
    caution = normalize_newlines(product.get("caution") or "")
    images = split_pipe(product.get("images") or "")
    colors = split_pipe(product.get("colors") or "")
    sizes = split_pipe(product.get("sizes") or "")

    main = images[0] if images else ""
    thumbs = "".join(
        f'<button type="button" class="hz-thumb{" is-active" if i == 0 else ""}" data-src="{esc(src)}">'
        f'<img src="{esc(src)}" alt=""></button>'
        for i, src in enumerate(images)
    )
    color_chips = "".join(
        f'<span class="hz-chip">{esc(c.split(":")[0])}</span>' for c in colors
    )
    size_chips = "".join(f'<span class="hz-chip">{esc(s)}</span>' for s in sizes)
    fragment_inner = "\n".join(render_block(b, i) for i, b in enumerate(blocks))

    return f"""<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{esc(name)}</title>
<style>
{detail_css()}
.hz-buy {{
  max-width: 1100px; margin: 0 auto; display: grid; grid-template-columns: 1fr 1fr;
  gap: 56px; padding: 64px 32px 48px; background: #fff;
}}
.hz-gallery-main {{ aspect-ratio: 1; background: #f0ebe3; overflow: hidden; }}
.hz-gallery-main img {{ width: 100%; height: 100%; object-fit: cover; }}
.hz-thumbs {{ display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }}
.hz-thumb {{ width: 60px; height: 60px; padding: 0; border: 1px solid transparent; background: #f0ebe3; overflow: hidden; cursor: pointer; }}
.hz-thumb.is-active {{ border-color: #1a1814; }}
.hz-thumb img {{ width: 100%; height: 100%; object-fit: cover; }}
.hz-name {{ margin: 0 0 6px; font-family: "Cormorant Garamond", serif; font-size: 28px; font-weight: 600; }}
.hz-name-en {{ margin: 0 0 28px; color: #6e675c; font-size: 13px; }}
.hz-table {{ width: 100%; border-collapse: collapse; margin-bottom: 28px; }}
.hz-table th, .hz-table td {{ border-bottom: 1px solid #ddd8d0; padding: 12px 0; text-align: left; vertical-align: top; font-size: 13px; font-weight: 400; }}
.hz-table th {{ width: 96px; color: #6e675c; }}
.hz-opt {{ margin: 18px 0; }}
.hz-opt-label {{ font-size: 12px; font-weight: 500; margin-bottom: 10px; letter-spacing: 0.06em; }}
.hz-opt-chips {{ display: flex; flex-wrap: wrap; gap: 8px; }}
.hz-chip {{ min-width: 36px; height: 36px; padding: 0 10px; border: 1px solid #ddd8d0; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; color: #6e675c; }}
.hz-cta {{ display: grid; gap: 8px; margin-top: 28px; }}
.hz-cta button {{ height: 48px; border: 1px solid #1a1814; font-size: 12px; letter-spacing: 0.14em; cursor: pointer; }}
.hz-cta .buy {{ background: #1a1814; color: #fff; }}
.hz-cta .ghost {{ background: #fff; }}
@media (max-width: 860px) {{ .hz-buy {{ grid-template-columns: 1fr; }} }}
</style>
</head>
<body style="margin:0;background:#faf9f7;font-family:'Noto Sans KR',sans-serif;">
<section class="hz-buy">
  <div>
    <div class="hz-gallery-main"><img id="hzMainImg" src="{esc(main)}" alt="{esc(name)}"></div>
    <div class="hz-thumbs">{thumbs}</div>
  </div>
  <div>
    <h1 class="hz-name">{esc(name)}</h1>
    {f'<p class="hz-name-en">{esc(name_en)}</p>' if name_en else ""}
    <table class="hz-table"><tbody>
      <tr><th>판매가</th><td>{esc(price)}</td></tr>
      <tr><th>제작정보</th><td>{esc(lead)}</td></tr>
      <tr><th>제품정보</th><td>{nl2br(info)}</td></tr>
      <tr><th>주의사항</th><td>{nl2br(caution)}</td></tr>
    </tbody></table>
    {f'<div class="hz-opt"><div class="hz-opt-label">COLOR</div><div class="hz-opt-chips">{color_chips}</div></div>' if color_chips else ""}
    {f'<div class="hz-opt"><div class="hz-opt-label">SIZE</div><div class="hz-opt-chips">{size_chips}</div></div>' if size_chips else ""}
    <div class="hz-cta">
      <button type="button" class="buy">BUY IT NOW</button>
      <button type="button" class="ghost">ADD TO CART</button>
      <button type="button" class="ghost">WISH LIST</button>
    </div>
  </div>
</section>
<div class="hz-detail">
{fragment_inner}
</div>
<script>
document.querySelectorAll('.hz-thumb').forEach(btn => {{
  btn.addEventListener('click', () => {{
    const main = document.getElementById('hzMainImg');
    if (main) main.src = btn.dataset.src;
    document.querySelectorAll('.hz-thumb').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  }});
}});
</script>
</body>
</html>
"""


def group_blocks(rows: list[dict[str, str]]) -> dict[str, list[dict[str, Any]]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for row in rows:
        sku = row.get("sku") or row.get("SKU") or ""
        if not sku:
            continue
        btype = (row.get("block_type") or row.get("type") or "text").lower()
        if btype not in BLOCK_TYPES:
            btype = "text"
        block = {
            "block_type": btype,
            "title": row.get("title") or "",
            "body": row.get("body") or "",
            "image_url": row.get("image_url") or row.get("image") or "",
            "caption": row.get("caption") or "",
            "items": split_pipe(row.get("items") or ""),
            "sort": int(row.get("sort") or 0),
        }
        grouped.setdefault(sku, []).append(block)
    for sku in grouped:
        grouped[sku].sort(key=lambda b: b["sort"])
    return grouped


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description="Generate HEVITZ-style PDP HTML from CSV")
    parser.add_argument("--products", type=Path, default=root / "data" / "products.csv")
    parser.add_argument("--blocks", type=Path, default=root / "data" / "blocks.csv")
    parser.add_argument("--out", type=Path, default=root / "output")
    args = parser.parse_args()

    products = read_csv(args.products)
    blocks_by_sku = group_blocks(read_csv(args.blocks)) if args.blocks.exists() else {}
    args.out.mkdir(parents=True, exist_ok=True)

    for product in products:
        sku = product.get("sku") or product.get("SKU") or "product"
        blocks = blocks_by_sku.get(sku, [])
        safe = re.sub(r"[^\w.-]+", "_", sku)
        fragment_path = args.out / f"{safe}-cafe24-fragment.html"
        preview_path = args.out / f"{safe}-preview.html"
        fragment_path.write_text(build_fragment(product, blocks), encoding="utf-8")
        preview_path.write_text(build_preview_page(product, blocks), encoding="utf-8")
        print(f"✓ {sku} → {fragment_path.name}, {preview_path.name}")

    index = ["<!DOCTYPE html><html lang='ko'><head><meta charset='utf-8'><title>PDP Output</title></head><body>"]
    index.append("<h1>Generated PDP previews</h1><ul>")
    for product in products:
        sku = product.get("sku") or "product"
        safe = re.sub(r"[^\w.-]+", "_", sku)
        index.append(f"<li><a href='{safe}-preview.html'>{esc(sku)} — {esc(product.get('name'))}</a></li>")
    index.append("</ul><p><a href='/'>← Generator UI</a></p></body></html>")
    (args.out / "index.html").write_text("\n".join(index), encoding="utf-8")
    print(f"\nDone → {args.out}")


if __name__ == "__main__":
    main()
