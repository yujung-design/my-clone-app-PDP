# HEVITZ-style PDP Generator

헤비츠(Cafe24) 상세페이지의 **여백·센터 정렬·챕터형 스토리텔링** 패턴을 참고한  
모듈형 상품 상세 HTML 생성기입니다. 텍스트·이미지 URL만 엑셀/CSV/AI로 넣으면  
카페24 상세설명에 붙일 HTML 조각이 나옵니다.

## 실행

```bash
npm start
```

→ http://localhost:3456

CSV 배치 생성 (Node 권장):

```bash
npm run generate
```

Python이 있으면:

```bash
npm run generate:py
```

→ `output/{sku}-preview.html`, `output/{sku}-cafe24-fragment.html`

## 구성

| 경로 | 역할 |
| --- | --- |
| `public/` | 로컬 웹툴 (폼 + 실시간 미리보기 + CSV 로드) |
| `data/products.csv` | 상품 마스터 |
| `data/blocks.csv` | 반복 상세 블록 |
| `data/SCHEMA.md` | 컬럼/블록 타입 명세 |
| `scripts/generate_pdp.py` | CSV → HTML 배치 |
| `templates/cafe24-detail.css` | 카페24용 블록 CSS |
| `ANALYSIS.md` | 헤비츠 레이아웃 패턴 분석 |

## 블록 타입

`intro` · `image` · `heading` · `text` · `colors` · `specs` · `quote` · `notice`

웹툴 DSL 예시:

```
@intro
제목
---
본문

@image
https://...
---
캡션

@heading
Detail

@specs
가방 크기|29 × 24 × 9 cm
무게|850g
```

## 카페24 적용

1. 웹툴에서 **카페24 조각 복사** 또는 `output/*-cafe24-fragment.html` 사용  
2. 상품 관리 → 상세설명(HTML)에 붙여넣기  
3. 이미지 URL을 자사 업로드 URL로 교체  
4. 상단 구매 영역(`product_detail` 모듈)은 기존 스킨 유지

## 샘플 CSV URL

- http://localhost:3456/data/products.csv  
- http://localhost:3456/data/blocks.csv  
- http://localhost:3456/output/ (파이썬 생성 후)

> 원본 쇼핑몰의 이미지·카피·상표권은 권리자에게 있습니다.  
> 이 툴은 교육·프로토타이핑용 레이아웃 템플릿입니다.
