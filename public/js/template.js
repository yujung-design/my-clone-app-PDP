/**
 * SSOOOK-inspired PDP HTML builder
 * Style tokens observed from live PDP (white minimal, cyan accent, editorial 64px heads).
 */
(function (global) {
  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function nl2br(s) {
    return esc(s).replace(/\n/g, "<br>");
  }

  function parseLines(text) {
    return String(text || "")
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
  }

  function parseSections(raw) {
    // Format: ## 제목\n본문...\n![이미지URL] (optional)
    const blocks = String(raw || "").trim();
    if (!blocks) return [];
    return blocks
      .split(/\n(?=##\s)/)
      .map((chunk) => {
        const lines = chunk.trim().split("\n");
        const title = (lines[0] || "").replace(/^##\s*/, "").trim();
        let image = "";
        const bodyLines = [];
        for (let i = 1; i < lines.length; i++) {
          const m = lines[i].match(/^!\[([^\]]*)\]\(([^)]+)\)|^!\(([^)]+)\)|^IMAGE:\s*(.+)$/i);
          if (m) {
            image = m[2] || m[3] || m[4] || "";
          } else {
            bodyLines.push(lines[i]);
          }
        }
        return { title, body: bodyLines.join("\n").trim(), image: image.trim() };
      })
      .filter((b) => b.title || b.body || b.image);
  }

  function parseFaq(raw) {
    // Q: ...\nA: ...
    const items = [];
    const parts = String(raw || "").split(/\n(?=Q\s*:)/i);
    for (const part of parts) {
      const qm = part.match(/Q\s*:\s*([\s\S]*?)(?:\nA\s*:|$)/i);
      const am = part.match(/A\s*:\s*([\s\S]*)/i);
      if (qm) {
        items.push({
          q: qm[1].trim(),
          a: am ? am[1].trim() : "",
        });
      }
    }
    return items;
  }

  function parseOptions(raw) {
    return parseLines(raw).map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: (label || "").trim(), hint: rest.join("|").trim() };
    });
  }

  function buildGallery(images, name) {
    if (!images.length) {
      return `<div class="pdp-gallery-empty">이미지를 입력하세요</div>`;
    }
    const main = images[0];
    const thumbs = images
      .map(
        (src, i) =>
          `<button type="button" class="pdp-thumb${i === 0 ? " is-active" : ""}" data-src="${esc(src)}"><img src="${esc(src)}" alt="${esc(name)} ${i + 1}"></button>`
      )
      .join("");
    return `
      <div class="pdp-gallery">
        <div class="pdp-gallery-main"><img id="pdpMainImg" src="${esc(main)}" alt="${esc(name)}"></div>
        <div class="pdp-thumbs">${thumbs}</div>
      </div>`;
  }

  function buildInfoRows(data) {
    const rows = [
      ["국내·해외배송", data.shippingScope || "국내배송"],
      ["배송방법", data.shippingMethod || "택배"],
      ["배송비", data.shippingFee || "₩3,000"],
      ["사용후기", data.reviewCount || "0"],
    ];
    return rows
      .map(
        ([k, v]) =>
          `<div class="pdp-row"><span class="pdp-label">${esc(k)}</span><span class="pdp-value">${esc(v)}</span></div>`
      )
      .join("");
  }

  function buildColorOpts(colors) {
    if (!colors.length) return "";
    const chips = colors
      .map((c) => {
        const [name, hex] = c.split(":").map((s) => s.trim());
        const bg = hex || "#ddd";
        return `<span class="pdp-color" title="${esc(name)}" style="background:${esc(bg)}"></span>`;
      })
      .join("");
    return `<div class="pdp-opt"><div class="pdp-opt-label">COLOR</div><div class="pdp-colors">${chips}</div><p class="pdp-req">[필수] 옵션을 선택해 주세요</p></div>`;
  }

  function buildSizeOpts(sizes) {
    if (!sizes.length) return "";
    const chips = sizes
      .map((s) => `<span class="pdp-size">${esc(s)}</span>`)
      .join("");
    return `<div class="pdp-opt"><div class="pdp-opt-label">SIZE</div><div class="pdp-sizes">${chips}</div><p class="pdp-req">[필수] 옵션을 선택해 주세요</p></div>`;
  }

  function buildSections(sections) {
    return sections
      .map((sec, i) => {
        const img = sec.image
          ? `<figure class="pdp-sec-media"><img src="${esc(sec.image)}" alt="${esc(sec.title)}"></figure>`
          : "";
        return `
        <section class="pdp-sec" id="sec-${i}">
          <p class="pdp-sec-eyebrow">0${i + 1}</p>
          <h3 class="pdp-sec-title">${nl2br(sec.title)}</h3>
          <div class="pdp-sec-body">${nl2br(sec.body)}</div>
          ${img}
        </section>`;
      })
      .join("");
  }

  function buildFaq(items) {
    if (!items.length) return "";
    const list = items
      .map(
        (it) => `
      <details class="pdp-faq-item">
        <summary>${esc(it.q)}</summary>
        <div class="pdp-faq-a">${nl2br(it.a)}</div>
      </details>`
      )
      .join("");
    return `
      <section class="pdp-sec">
        <h3 class="pdp-sec-title">자주 묻는 질문.</h3>
        <div class="pdp-faq">${list}</div>
      </section>`;
  }

  function buildFeatures(lines) {
    if (!lines.length) return "";
    const cards = lines
      .map((line) => {
        const [title, ...rest] = line.split("|");
        return `<article class="pdp-reason"><h4>${esc(title.trim())}</h4><p>${esc(rest.join("|").trim())}</p></article>`;
      })
      .join("");
    return `
      <section class="pdp-sec">
        <p class="pdp-sec-eyebrow">Suitability Guide</p>
        <h3 class="pdp-sec-title">이 제품을<br>선택해야 하는 이유.</h3>
        <div class="pdp-reasons">${cards}</div>
      </section>`;
  }

  function css() {
    return `
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800&family=Noto+Sans+KR:wght@400;500;600;700;800&family=Roboto:wght@400;500;700&display=swap');

:root {
  --bg: #ffffff;
  --ink: #000000;
  --ink-soft: #1d1d1f;
  --muted: #888888;
  --line: #e3e3e3;
  --accent: #008bcc;
  --rail: 72px;
  --content: 1160px;
  --font: Roboto, "Noto Sans KR", sans-serif;
  --display: Montserrat, "Noto Sans KR", sans-serif;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: var(--bg); color: var(--ink); font-family: var(--font); font-size: 13px; line-height: 1.5; }
img { max-width: 100%; display: block; }
button { font: inherit; cursor: pointer; }

.pdp-shell { display: flex; min-height: 100vh; }
.pdp-rail {
  position: sticky; top: 0; align-self: flex-start;
  width: var(--rail); height: 100vh;
  border-right: 1px solid var(--line);
  display: flex; flex-direction: column; align-items: center;
  justify-content: space-between; padding: 28px 0; background: #fff; z-index: 20;
}
.pdp-rail-brand {
  writing-mode: vertical-rl; transform: rotate(180deg);
  font-family: var(--display); font-weight: 800; font-size: 18px;
  letter-spacing: 0.08em; color: var(--ink);
}
.pdp-rail-icons { display: flex; flex-direction: column; gap: 22px; color: #111; }
.pdp-rail-icons span { font-size: 16px; opacity: 0.85; }

.pdp-main { flex: 1; min-width: 0; }
.pdp-top {
  max-width: var(--content); margin: 0 auto;
  display: grid; grid-template-columns: 1fr 1fr; gap: 48px;
  padding: 40px 40px 56px;
}
.pdp-gallery-main {
  aspect-ratio: 1 / 1; background: #f7f7f7; overflow: hidden;
}
.pdp-gallery-main img { width: 100%; height: 100%; object-fit: cover; }
.pdp-thumbs { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.pdp-thumb {
  width: 64px; height: 64px; padding: 0; border: 1px solid transparent; background: #f5f5f5; overflow: hidden;
}
.pdp-thumb.is-active { border-color: #111; }
.pdp-thumb img { width: 100%; height: 100%; object-fit: cover; }
.pdp-gallery-empty {
  aspect-ratio: 1; display: grid; place-items: center;
  background: #f5f5f5; color: var(--muted); border: 1px dashed #ccc;
}

.pdp-info { padding-top: 8px; }
.pdp-name {
  margin: 0 0 10px; font-size: 18px; font-weight: 700; line-height: 1.35; letter-spacing: -0.02em;
}
.pdp-summary { margin: 0 0 18px; color: var(--muted); font-size: 13px; }
.pdp-price-row { display: flex; align-items: baseline; gap: 12px; margin-bottom: 18px; }
.pdp-price-origin { color: #aaa; text-decoration: line-through; font-size: 14px; }
.pdp-price-sale { font-size: 20px; font-weight: 700; color: var(--ink); }
.pdp-price-sale.is-accent { color: var(--accent); }
.pdp-divider { border: 0; border-top: 1px solid var(--line); margin: 0 0 16px; }
.pdp-row {
  display: grid; grid-template-columns: 110px 1fr; gap: 12px;
  padding: 9px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px;
}
.pdp-label { font-weight: 700; }
.pdp-value { color: #333; }
.pdp-opt { margin-top: 22px; }
.pdp-opt-label { font-weight: 700; margin-bottom: 10px; letter-spacing: 0.04em; }
.pdp-colors { display: flex; gap: 10px; }
.pdp-color {
  width: 42px; height: 42px; border-radius: 50%;
  border: 1px solid #ddd; display: inline-block;
}
.pdp-sizes { display: flex; gap: 8px; }
.pdp-size {
  width: 42px; height: 42px; border-radius: 50%;
  background: #cfcfcf; color: #fff; display: grid; place-items: center;
  font-weight: 600; font-size: 12px;
}
.pdp-req { margin: 8px 0 0; color: #aaa; font-size: 12px; }
.pdp-cta {
  margin-top: 28px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.pdp-cta button {
  height: 48px; border: 1px solid #111; background: #111; color: #fff; font-weight: 600;
}
.pdp-cta button.ghost { background: #fff; color: #111; }

.pdp-tabs {
  position: sticky; top: 0; z-index: 15;
  background: rgba(255,255,255,0.96); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  backdrop-filter: blur(8px);
}
.pdp-tabs ul {
  max-width: var(--content); margin: 0 auto; padding: 0 40px;
  list-style: none; display: flex; gap: 36px;
}
.pdp-tabs a {
  display: block; padding: 18px 0; color: #111; text-decoration: none;
  font-weight: 600; font-size: 13px; border-bottom: 2px solid transparent;
}
.pdp-tabs a.is-active { border-bottom-color: #111; }

.pdp-detail {
  max-width: 980px; margin: 0 auto; padding: 64px 40px 120px;
}
.pdp-notice {
  background: #fafafa; border: 1px solid var(--line); padding: 28px 32px; margin-bottom: 72px;
}
.pdp-notice h4 {
  margin: 0 0 12px; font-family: var(--display); letter-spacing: 0.12em; font-size: 12px;
}
.pdp-notice p { margin: 0; color: #444; line-height: 1.7; }

.pdp-hero { text-align: center; margin: 0 0 80px; }
.pdp-hero h2 {
  margin: 0 0 18px; font-size: clamp(36px, 6vw, 64px); font-weight: 800;
  color: var(--ink-soft); letter-spacing: -0.035em; line-height: 1.05;
}
.pdp-hero p {
  margin: 0 auto; max-width: 520px; font-size: 16px; color: #444; line-height: 1.7;
}
.pdp-anchors {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin: 36px 0 0;
}
.pdp-anchors a {
  text-decoration: none; color: #111; border: 1px solid #ddd; padding: 8px 14px;
  font-size: 12px; border-radius: 999px;
}

.pdp-sec { margin: 0 0 96px; }
.pdp-sec-eyebrow {
  margin: 0 0 14px; color: var(--muted); font-size: 13px; letter-spacing: 0.04em;
}
.pdp-sec-title {
  margin: 0 0 24px; font-size: clamp(32px, 5vw, 56px); font-weight: 700;
  color: var(--ink-soft); letter-spacing: -0.03em; line-height: 1.18;
}
.pdp-sec-body {
  font-size: 15px; line-height: 1.85; color: #333; max-width: 640px; margin-bottom: 28px;
}
.pdp-sec-media { margin: 0; }
.pdp-sec-media img { width: 100%; }

.pdp-reasons { display: grid; gap: 16px; }
.pdp-reason {
  border-top: 1px solid var(--line); padding: 22px 0;
}
.pdp-reason h4 { margin: 0 0 8px; font-size: 16px; }
.pdp-reason p { margin: 0; color: #555; line-height: 1.7; }

.pdp-faq-item {
  border-bottom: 1px solid var(--line); padding: 18px 0;
}
.pdp-faq-item summary {
  cursor: pointer; font-weight: 600; font-size: 15px; list-style: none;
}
.pdp-faq-item summary::-webkit-details-marker { display: none; }
.pdp-faq-a { margin-top: 12px; color: #555; line-height: 1.75; }

.pdp-legal {
  margin-top: 80px; padding-top: 40px; border-top: 1px solid var(--line);
  color: #777; font-size: 12px; line-height: 1.7;
}
.pdp-legal strong { color: #111; display: block; margin-bottom: 8px; font-size: 14px; }

.pdp-float {
  position: fixed; right: 24px; bottom: 24px; z-index: 30;
  width: 72px; height: 72px; border-radius: 50%; border: 0;
  background: #111; color: #fff; font-size: 11px; font-weight: 600;
  display: grid; place-items: center; text-align: center; line-height: 1.3;
}

@media (max-width: 900px) {
  .pdp-rail { display: none; }
  .pdp-top { grid-template-columns: 1fr; gap: 28px; padding: 24px 20px 40px; }
  .pdp-tabs ul { padding: 0 20px; gap: 20px; overflow-x: auto; }
  .pdp-detail { padding: 40px 20px 100px; }
  .pdp-cta { grid-template-columns: 1fr; }
}
`;
  }

  function script() {
    return `
document.querySelectorAll('.pdp-thumb').forEach(btn => {
  btn.addEventListener('click', () => {
    const main = document.getElementById('pdpMainImg');
    if (main) main.src = btn.dataset.src;
    document.querySelectorAll('.pdp-thumb').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  });
});
`;
  }

  function build(data) {
    const brand = data.brand || "BRAND";
    const name = data.name || "상품명";
    const summary = data.summary || "";
    const images = parseLines(data.images);
    const colors = parseLines(data.colors);
    const sizes = parseLines(data.sizes);
    const sections = parseSections(data.sections);
    const faq = parseFaq(data.faq);
    const features = parseLines(data.features);
    const anchors = parseLines(data.anchors);
    const saleIsAccent = /sold\s*out|품절|매진/i.test(data.salePrice || "");

    const anchorHtml = anchors.length
      ? `<nav class="pdp-anchors">${anchors.map((a) => `<a href="#sec-0">${esc(a)}</a>`).join("")}</nav>`
      : "";

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(name)} - ${esc(brand)}</title>
<style>${css()}</style>
</head>
<body>
<div class="pdp-shell">
  <aside class="pdp-rail" aria-label="brand rail">
    <div class="pdp-rail-icons"><span>☰</span></div>
    <div class="pdp-rail-brand">${esc(brand)}${brand.includes("®") ? "" : "®"}</div>
    <div class="pdp-rail-icons"><span>🛍</span><span>👤</span><span>⌕</span></div>
  </aside>
  <div class="pdp-main">
    <section class="pdp-top">
      ${buildGallery(images, name)}
      <div class="pdp-info">
        <h1 class="pdp-name">${esc(name)}</h1>
        ${summary ? `<p class="pdp-summary">${esc(summary)}</p>` : ""}
        <div class="pdp-price-row">
          ${data.originPrice ? `<span class="pdp-price-origin">${esc(data.originPrice)}</span>` : ""}
          <span class="pdp-price-sale${saleIsAccent ? " is-accent" : ""}">${esc(data.salePrice || "")}</span>
        </div>
        <hr class="pdp-divider">
        ${buildInfoRows(data)}
        ${buildColorOpts(colors)}
        ${buildSizeOpts(sizes)}
        <div class="pdp-cta">
          <button type="button">BUY IT NOW</button>
          <button type="button" class="ghost">CART</button>
        </div>
      </div>
    </section>

    <nav class="pdp-tabs" aria-label="detail tabs">
      <ul>
        <li><a class="is-active" href="#detail">상세정보</a></li>
        <li><a href="#guide">구매안내</a></li>
        <li><a href="#reviews">사용후기${esc(data.reviewCount || "0")}</a></li>
        <li><a href="#qna">Q&amp;A</a></li>
      </ul>
    </nav>

    <div class="pdp-detail" id="detail">
      ${
        data.notice
          ? `<div class="pdp-notice"><h4>DELIVERY NOTICE</h4><p>${nl2br(data.notice)}</p></div>`
          : ""
      }

      <header class="pdp-hero">
        <h2>${esc(data.displayTitle || name)}</h2>
        <p>${nl2br(data.displayTagline || summary)}</p>
        ${anchorHtml}
      </header>

      ${buildFeatures(features)}
      ${buildSections(sections)}
      ${buildFaq(faq)}

      <footer class="pdp-legal" id="guide">
        <strong>${esc(brand)}</strong>
        ${nl2br(data.legal || "본 페이지는 레이아웃 템플릿 미리보기입니다.")}
      </footer>
    </div>
  </div>
</div>
<button class="pdp-float" type="button">1:1<br>문의하기</button>
<script>${script()}<\/script>
</body>
</html>`;
  }

  global.PDPTemplate = { build, parseSections, parseFaq };
})(typeof window !== "undefined" ? window : globalThis);
