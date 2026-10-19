(function () {
  const $ = (sel) => document.querySelector(sel);
  const form = $("#pdp-form");
  const preview = $("#preview");
  const statusEl = $("#status");
  const codeOut = $("#code-out");
  const fragmentOut = $("#fragment-out");

  const FIELDS = [
    "sku",
    "name",
    "nameEn",
    "price",
    "leadTime",
    "productInfo",
    "caution",
    "reviewCount",
    "images",
    "colors",
    "sizes",
    "blocksDsl",
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
    const data = readData();
    const html = window.PDPTemplate.build(data);
    const fragment = window.PDPTemplate.buildCafe24Fragment(data);
    preview.srcdoc = html;
    if (codeOut) codeOut.value = html;
    if (fragmentOut) fragmentOut.value = fragment;
    statusEl.textContent = "미리보기 갱신됨";
    statusEl.classList.remove("copied");
    return { html, fragment };
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      statusEl.textContent = label;
      statusEl.classList.add("copied");
    } catch {
      statusEl.textContent = "복사 실패 — 텍스트 영역을 직접 선택하세요";
    }
  }

  function download(filename, text) {
    const blob = new Blob([text], { type: "text/html;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    statusEl.textContent = `${filename} 다운로드`;
  }

  function openPreview() {
    const { html } = render();
    const w = window.open("", "_blank");
    if (w) {
      w.document.open();
      w.document.write(html);
      w.document.close();
    }
  }

  /** CSV: products.csv columns + blocks.csv joined by sku */
  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;
    const src = String(text).replace(/^\uFEFF/, "");
    for (let i = 0; i < src.length; i++) {
      const ch = src[i];
      const next = src[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cell += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (ch === "\r") {
        /* skip */
      } else {
        cell += ch;
      }
    }
    if (cell.length || row.length) {
      row.push(cell);
      rows.push(row);
    }
    if (!rows.length) return [];
    const headers = rows[0].map((h) => h.trim());
    return rows.slice(1).filter((r) => r.some((c) => c.trim())).map((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = (r[i] ?? "").trim();
      });
      return obj;
    });
  }

  function productFromCsvRow(row, blockRows) {
    const sku = row.sku || row.SKU || "";
    const mine = (blockRows || []).filter((b) => (b.sku || b.SKU) === sku);
    mine.sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
    const blocks = mine.map((b) => {
      const type = (b.block_type || b.type || "text").toLowerCase();
      const items = (b.items || "").split("|").map((s) => s.trim()).filter(Boolean);
      return {
        type,
        title: b.title || "",
        body: b.body || "",
        image_url: b.image_url || b.image || "",
        caption: b.caption || "",
        items,
      };
    });
    return {
      sku,
      name: row.name || "",
      nameEn: row.name_en || row.nameEn || "",
      price: row.price || "",
      leadTime: row.lead_time || row.leadTime || "",
      productInfo: (row.product_info || row.productInfo || "").replace(/\\n/g, "\n"),
      caution: (row.caution || "").replace(/\\n/g, "\n"),
      reviewCount: row.review_count || row.reviewCount || "0",
      images: (row.images || "").split("|").map((s) => s.trim()).filter(Boolean).join("\n"),
      colors: (row.colors || "").split("|").join("\n"),
      sizes: (row.sizes || "").split("|").join("\n"),
      blocksDsl: window.PDPTemplate.blocksToDsl(blocks),
    };
  }

  let csvProducts = [];
  let csvBlocks = [];

  function loadCsvFiles(productFile, blockFile) {
    return Promise.all([
      productFile.text().then(parseCsv),
      blockFile ? blockFile.text().then(parseCsv) : Promise.resolve([]),
    ]).then(([products, blocks]) => {
      csvProducts = products;
      csvBlocks = blocks;
      const select = $("#csv-product-select");
      select.innerHTML = products
        .map((p, i) => `<option value="${i}">${p.sku || i} — ${p.name || "(no name)"}</option>`)
        .join("");
      select.disabled = !products.length;
      $("#btn-load-csv-row").disabled = !products.length;
      statusEl.textContent = `CSV ${products.length}개 상품 / 블록 ${blocks.length}행 로드`;
      if (products.length) {
        writeData(productFromCsvRow(products[0], blocks));
        render();
      }
    });
  }

  const SAMPLE = {
    sku: "HZ-101-M",
    name: "101 시그니처 사첼백 M",
    nameEn: "Signature Satchel M",
    price: "KRW 290,000",
    leadTime: "28일 (주말 및 공휴일 제외)",
    productInfo:
      "이탈리안 베지터블 통가죽\nvegetable tanned full grain leather\n- 태블릿 수납 가능한 A4 사이즈\n- 20mm 통가죽 스트랩·숄더패드 기본 제공",
    caution:
      "작은 스크래치, 주름, 점은 천연 가죽의 자연적 특징입니다.\n소재 특성상 이염 및 물 빠짐이 있을 수 있습니다.",
    reviewCount: "40",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1000&q=80",
      "https://images.unsplash.com/photo-1590874103328-eac38a68373b?w=1000&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1000&q=80",
    ].join("\n"),
    colors: "레디쉬브라운:#8b4513\n모카브라운:#5c4033\n빈티지블랙:#222222",
    sizes: "M\nL",
    blocksDsl: `@intro
손으로 쓰는 시간,
가죽에 남는 이야기.
---
매일의 쓰임이 쌓일수록
표면의 색과 결이 깊어집니다.

@image
https://images.unsplash.com/photo-1590874103328-eac38a68373b?w=1200&q=80
---
Signature Satchel — studio still

@heading
Detail

@text
안감 없이 통가죽만으로 이어 만든 사첼.
불필요한 장식을 덜어내고,
손바느질과 구조에 집중했습니다.

@image
https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=1200&q=80

@heading
Color

@colors
01. 레디쉬 브라운:#8b4513
02. 모카 브라운:#5c4033
03. 빈티지 블랙:#222222

@heading
Size Info

@specs
가방 크기|29 × 24 × 9 cm
수납 공간|28 × 21 × 8 cm
후면 포켓|21 × 11 cm
스트랩|104 × 2 cm
무게|850–870 g

@quote
에이징 전 / 에이징 후 —
같은 가방, 다른 깊이의 색.

@notice
측정 방법·위치에 따라 약간의 오차가 생길 수 있습니다.
각인 옵션 선택 시 제작 중 취소·반품·교환이 불가합니다.
천연 가죽의 스크래치와 주름은 불량이 아닙니다.`,
  };

  form.addEventListener("input", () => {
    window.clearTimeout(form._t);
    form._t = window.setTimeout(render, 180);
  });

  $("#btn-sample").addEventListener("click", () => {
    writeData(SAMPLE);
    render();
  });
  $("#btn-copy").addEventListener("click", () => copyText(render().html, "전체 HTML 복사 완료"));
  $("#btn-copy-fragment").addEventListener("click", () =>
    copyText(render().fragment, "카페24 상세 HTML 조각 복사 완료")
  );
  $("#btn-download").addEventListener("click", () => {
    const data = readData();
    download(`${data.sku || "product"}-detail.html`, render().html);
  });
  $("#btn-open").addEventListener("click", openPreview);
  $("#btn-render").addEventListener("click", render);

  $("#btn-csv-load").addEventListener("click", () => {
    const p = $("#csv-products").files[0];
    const b = $("#csv-blocks").files[0];
    if (!p) {
      statusEl.textContent = "products.csv 파일을 선택하세요";
      return;
    }
    loadCsvFiles(p, b);
  });

  $("#btn-load-csv-row").addEventListener("click", () => {
    const i = Number($("#csv-product-select").value);
    if (!csvProducts[i]) return;
    writeData(productFromCsvRow(csvProducts[i], csvBlocks));
    render();
  });

  writeData(SAMPLE);
  render();
})();
