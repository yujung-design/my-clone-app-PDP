# SSOOOK PDP — Design & Layout Analysis

**Target:** https://ssoook.co.kr/product/.../362/  
**Method:** Live browser observation (CDP style/layout probe) + page content structure.  
**Note:** REA MCP was not registered in this Cursor session (`registration:cursor` missing). Analysis used runtime browser evidence instead.

## Observed design system

| Token | Value |
| --- | --- |
| Background | `#FFFFFF` |
| Primary text | `#000000` / editorial `#1D1D1F` |
| Muted text | `#888` / `#AAA` |
| Dividers | `#DDD` / `#E3E3E3` |
| Accent (SOLD OUT) | `rgb(0, 139, 204)` ≈ `#008BCC` |
| Body font | `Roboto, "Noto Sans KR", sans-serif` (13px) |
| Display font | `Montserrat` + Noto for some UI |
| Editorial H2/H3 | ~64px / 700–800 weight, letter-spacing ≈ -1.5px |

## Layout structure

```
┌────┬──────────────────────────────────────────────┐
│Rail│  Main content (~1158px)                      │
│    │  ┌─────────────────┬───────────────────────┐ │
│Logo│  │ Gallery (~582)  │ Info (~521)           │ │
│Nav │  │ Product image   │ Title / price / opts  │ │
│    │  └─────────────────┴───────────────────────┘ │
│    │  Tabs: 상세정보 | 구매안내 | 후기 | Q&A      │
│    │  Editorial long-form detail (#prdDetail)     │
│    │  - Hero title (centered, huge)               │
│    │  - Story / gallery / points / fabric / FAQ   │
│    │  - Related products + legal notices          │
└────┴──────────────────────────────────────────────┘
```

## Editorial content pattern (detail body)

1. Delivery / preorder notice strip  
2. Centered product display title + short tagline  
3. Anchor chips (포인트 / 소재 / 세탁 / 구성품 / …)  
4. Section blocks: large left-aligned headline + body copy + full-bleed imagery  
5. Numbered “Point 0N” feature chapters  
6. Spec grids (colors, size guide, FAQ accordion)  
7. Footer brand legal block  

## Tool scope

The generator recreates this **structure and visual language** as a reusable template. It does **not** copy proprietary assets or full marketing copy from the live site.
