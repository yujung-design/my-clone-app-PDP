# HEVITZ-style PDP — Layout Pattern Analysis

**Reference:** Cafe24 skin HTML (`product_detail` / `product_additional`) + live HEVITZ PDP structure  
**Scope:** Layout rhythm, grid, typography — not proprietary assets or copy.

## 1. Page anatomy (from provided HTML)

```
┌─────────────────────────────────────────────────────────┐
│  detailArea (2-column buy module)                       │
│  ┌──────────────────────┬─────────────────────────────┐ │
│  │ imgArea              │ infoArea                    │ │
│  │  · keyImg (main)     │  · headingArea {$name}      │ │
│  │  · listImg (thumbs)  │  · info table (price/spec)  │ │
│  │  · colorchip         │  · options + qty            │ │
│  │                      │  · BUY / CART / WISH LIST   │ │
│  └──────────────────────┴─────────────────────────────┘ │
│  coupon_productdetail (optional)                        │
│  #prdDetail → {$product_detail}  ← editorial long-form  │
│  RELATED PRODUCTS                                       │
│  REVIEW / Q&A boards                                    │
└─────────────────────────────────────────────────────────┘
```

The emotional storytelling lives almost entirely inside `{$product_detail}`.  
The buy module above it is a **sparse two-column grid** with English CTAs and thin table rows.

## 2. Buy-module design patterns

| Pattern | Observation |
| --- | --- |
| Grid | Image ≈ 50% / Info ≈ 50%, generous top padding (`br` spacers in source) |
| Title | Product name as primary heading; English subtitle often under Korean name |
| Spec table | Label–value rows: 판매가, 제작정보, 제품정보, 주의사항, 수량, 사용후기 |
| CTA | Stacked text buttons: `BUY IT NOW` / `ADD TO CART` / `WISH LIST` / `SOLD OUT` |
| Tone | Quiet chrome — few icons, no badge clutter, board-like info density |

## 3. Detail-body (`#prdDetail`) patterns

Typical HEVITZ editorial rhythm (center-aligned column ~720–860px):

1. **Intro copy** — 2–4 short centered lines, wide line-height, breathing room  
2. **Full-bleed / centered product image** — one image per beat, large vertical gaps  
3. **Section label** — English or Korean title + thin rule / em-dash (`Detail ㅡ`)  
4. **Repeatable chapters** — Color / Size Info / Care / Engraving / Kit contents  
5. **Numbered color list** — `01. 레디쉬 브라운` style enumeration  
6. **Spec block** — dimension lines, material notes, small disclaimer footnotes  
7. **Closing notice** — aging, dye transfer, handmade variance

### Spacing rhythm

- Section vertical margin: ~64–96px between chapters  
- Image → text gap: ~28–40px  
- Paragraph max-width: ~520–640px when centered  
- Prefer **one job per block**: either image OR short text OR labeled list

### What to avoid when cloning the feel

- Dense card grids, pill clusters, floating badges on images  
- Dashboard-like multi-column stats in the first detail viewport  
- Over-decorated gradients; keep atmosphere via warm neutrals + photography

## 4. Data-binding strategy (this repo)

Detail HTML is built from **ordered repeatable blocks**:

| `block_type` | Role | Key fields |
| --- | --- | --- |
| `intro` | Opening story | `title`, `body` |
| `image` | Visual beat | `image_url`, `caption` |
| `heading` | Chapter label | `title`, `subtitle` |
| `text` | Body copy | `body` |
| `colors` | Swatch / named list | `items` (`Name:#hex` or `01. Name`) |
| `specs` | Size / material rows | `items` (`Label\|Value`) |
| `notice` | Care / warning | `body` |
| `quote` | Short centered line | `body` |

Excel/CSV → Python (or browser tool) → Cafe24-ready HTML fragment for the product detail editor.

## 5. Legal note

HEVITZ branding, photography, and marketing copy belong to their rights holders.  
This project provides a **layout template and generation pipeline** for your own catalog.
