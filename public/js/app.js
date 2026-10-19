(function () {
  const $ = (sel) => document.querySelector(sel);
  const form = $("#pdp-form");
  const preview = $("#preview");
  const statusEl = $("#status");
  const codeOut = $("#code-out");

  const FIELDS = [
    "brand",
    "name",
    "summary",
    "displayTitle",
    "displayTagline",
    "originPrice",
    "salePrice",
    "shippingScope",
    "shippingMethod",
    "shippingFee",
    "reviewCount",
    "images",
    "colors",
    "sizes",
    "notice",
    "anchors",
    "features",
    "sections",
    "faq",
    "legal",
  ];

  function readData() {
    const data = {};
    for (const key of FIELDS) {
      const el = form.elements.namedItem(key);
      data[key] = el ? el.value : "";
    }
    return data;
  }

  function writeData(data) {
    for (const key of FIELDS) {
      if (data[key] == null) continue;
      const el = form.elements.namedItem(key);
      if (el) el.value = data[key];
    }
  }

  function render() {
    const html = window.PDPTemplate.build(readData());
    preview.srcdoc = html;
    if (codeOut) codeOut.value = html;
    statusEl.textContent = "미리보기 갱신됨";
    statusEl.classList.remove("copied");
    return html;
  }

  async function copyHtml() {
    const html = render();
    try {
      await navigator.clipboard.writeText(html);
      statusEl.textContent = "HTML 복사 완료";
      statusEl.classList.add("copied");
    } catch {
      codeOut?.select();
      document.execCommand("copy");
      statusEl.textContent = "HTML 복사 완료 (fallback)";
      statusEl.classList.add("copied");
    }
  }

  function downloadHtml() {
    const html = render();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "product-detail.html";
    a.click();
    URL.revokeObjectURL(a.href);
    statusEl.textContent = "product-detail.html 다운로드";
  }

  function openPreview() {
    const html = render();
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  }

  const SAMPLE = {
    brand: "SSOOOK",
    name: "[사전주문] 프리미엄 보아 침낭백 [DEMO-001]",
    summary: "집에서는 편안한 쿠션, 외출 시에는 포근한 침낭백",
    displayTitle: "보아 침낭백",
    displayTagline: "집에서는 편안한 쿠션.\n외출 시에는 포근한 침낭.",
    originPrice: "₩239,900",
    salePrice: "SOLD OUT",
    shippingScope: "국내배송",
    shippingMethod: "택배",
    shippingFee: "₩3,000 (₩50,000 이상 구매 시 무료)",
    reviewCount: "0",
    images: [
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1000&q=80",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1000&q=80",
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=1000&q=80",
    ].join("\n"),
    colors: "15 BEIGE:#e8d9c8\n503 PINK:#f0c9d0\n999 BLACK:#222222",
    sizes: "S\nM\nL",
    notice:
      "구매 전 아래 배송정보를 확인해주세요!\n\n프리오더 기간: 재고 소진 시까지\n배송일정: 순차 배송\n※ 프리오더 상품은 일반배송과 합배송이 불가합니다.",
    anchors: "포인트\n디테일\n소재\n세탁방법\n구성품\n사이즈 가이드\n자주 묻는 질문",
    features: [
      "유모차 라이너와 침낭을 하나로 | 집에서는 쿠션, 외출에서는 침낭으로 유연하게 사용해요.",
      "포근한 보아 솔루션 | 내부에는 부드러운 보아 원단을 매치해 포근함을 유지해요.",
      "복원력 좋은 충전재 | 풍부한 볼륨으로 편안하게 쉴 수 있어요.",
      "분리 세탁 가능 | 내부 쿠션만 따로 세탁해 위생적으로 관리해요.",
    ].join("\n"),
    sections: `## 밖에서는
포근한 침낭으로.
유모차에 넣어 이동할 때에도 아늑한 공간을 만들어줘요.
!(https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1200&q=80)

## 가까이 볼수록,
아이를 생각한 설계.
탄력 있는 테두리, 논슬립 어깨패드, 사이드 포켓과 D링까지.
핵심 디테일을 담았어요.
!(https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1200&q=80)

## 가볍지만 따뜻하게.
프리미엄 충전재로 가볍지만 뛰어난 보온성과 복원력을 줘요.`,
    faq: `Q: 우리 아이에게 맞는 사이즈는 어떻게 고르나요?
A: 몸무게를 기준으로 S는 3kg까지, M은 5kg까지, L은 7kg까지 권장해요. 모량이 많거나 체형이 길면 한 사이즈 업을 추천해요.

Q: 집에서도 쓸 수 있나요?
A: 네. 실내에서는 오픈형 쿠션으로, 외출 시에는 침낭으로 사용할 수 있어요.

Q: 오염되면 어떻게 관리하나요?
A: 오염 시 바로 부분 세탁을 권장해요. 내부 쿠션은 분리해 따로 세탁할 수 있어요.`,
    legal:
      "본 페이지는 SSOOOK 상세페이지의 레이아웃/타이포 스타일을 참고한 교육용 템플릿입니다.\n원본 쇼핑몰의 이미지·카피·상표는 해당 권리자에게 있습니다.",
  };

  form.addEventListener("input", () => {
    window.clearTimeout(form._t);
    form._t = window.setTimeout(render, 180);
  });

  $("#btn-sample").addEventListener("click", () => {
    writeData(SAMPLE);
    render();
  });
  $("#btn-copy").addEventListener("click", copyHtml);
  $("#btn-download").addEventListener("click", downloadHtml);
  $("#btn-open").addEventListener("click", openPreview);
  $("#btn-render").addEventListener("click", render);

  writeData(SAMPLE);
  render();
})();
