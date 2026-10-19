# 엑셀 / CSV 데이터 스키마

대량 생성은 **상품 시트 + 블록 시트** 2개로 나눕니다.  
Google Sheets / Excel에서 작성 후 UTF-8 CSV로보내기 → `scripts/generate_pdp.py` 또는 웹툴 CSV 로드.

## products.csv

| 컬럼 | 필수 | 설명 | 예시 |
| --- | --- | --- | --- |
| `sku` | ✅ | 상품 키 (블록 조인) | `HZ-101-M` |
| `name` | ✅ | 한글 상품명 | `101 시그니처 사첼백 M` |
| `name_en` | | 영문 서브타이틀 | `Signature Satchel M` |
| `price` | | 판매가 표시 문자열 | `KRW 290,000` |
| `lead_time` | | 제작정보 | `28일 (주말 및 공휴일 제외)` |
| `product_info` | | 제품정보 (`\n` = 줄바꿈) | `이탈리안 베지터블...` |
| `caution` | | 주의사항 | `천연 가죽의...` |
| `review_count` | | 후기 수 | `40` |
| `images` | | 갤러리 URL, `\|` 구분 | `https://a.jpg\|https://b.jpg` |
| `colors` | | `이름:#hex`, `\|` 구분 | `모카:#5c4033\|블랙:#222` |
| `sizes` | | 옵션, `\|` 구분 | `M\|L` |

## blocks.csv

| 컬럼 | 필수 | 설명 |
| --- | --- | --- |
| `sku` | ✅ | `products.sku`와 동일 |
| `sort` | ✅ | 출력 순서 (10, 20, 30…) |
| `block_type` | ✅ | 아래 타입 중 하나 |
| `title` | | intro / heading 제목 (`\n` 허용) |
| `body` | | 본문 |
| `image_url` | | `image` 타입 URL |
| `caption` | | 이미지 캡션 |
| `items` | | colors/specs용. 항목을 `\|`로 연결 |

### block_type

| type | 사용 필드 | 비고 |
| --- | --- | --- |
| `intro` | title, body | 오프닝 카피 (센터) |
| `image` | image_url, caption | 한 장 = 한 비트 |
| `heading` | title, body | `Detail ㅡ` 스타일 챕터 |
| `text` | body | 짧은 본문 |
| `colors` | items | `01. 이름:#hex\|02. ...` |
| `specs` | items | `라벨\|값\|라벨\|값` 또는 `라벨\|값` 행 반복 |
| `quote` | body | 이탤릭 한 줄 |
| `notice` | body | 하단 고지 박스 |

### specs items 규칙

파이썬 생성기는 둘 다 허용합니다.

1. 페어 나열: `가방 크기|29cm|무게|850g`
2. 이미 `라벨|값` 단위로 쪼개진 셀 값

## AI 대량 작성 프롬프트 예시

```
다음 SKU용 blocks.csv 행을 작성해줘.
- block_type은 intro → image → heading(Detail) → text → heading(Color) → colors → heading(Size Info) → specs → notice 순
- 문체는 짧고 절제된 공예 브랜드 톤
- 이미지는 플레이스홀더 URL 사용
- items는 | 로 구분
```

## 카페24 적용

1. `output/{sku}-cafe24-fragment.html` 내용 복사  
2. 상품 관리 → 상세설명(HTML)에 붙여넣기  
3. 이미지 URL은 카페24 파일 업로드 URL로 교체  
4. 상단 구매 모듈(`detailArea`)은 스킨 HTML 유지, 본 조각은 `#prdDetail` / `{$product_detail}` 영역용
