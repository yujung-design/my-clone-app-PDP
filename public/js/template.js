/**
 * HEVITZ-inspired modular PDP builder
 * Repeatable blocks bind from form / CSV / Python JSON.
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

  /**
   * Block DSL (one product detail body):
   *
   * @intro
   * title lines...
   * ---
   * body...
   *
   * @image
   * https://...
   * ---
   * optional caption
   *
   * @heading
   * Detail
   * ---
   * optional subtitle
   *
   * @text
   * body...
   *
   * @colors
   * 01. REDDISH BROWN:#8b4513
   * 02. MOCHA:#5c4033
   *
   * @specs
   * 가방 크기|29 x 24 x 9 cm
   * 무게|850g
   *
   * @notice
   * body...
   *
   * @quote
   * short line
   */
  function parseBlocks(raw) {
    const text = String(raw || "").trim();
    if (!text) return [];

    const chunks = text.split(/\n(?=@[a-z]+\b)/i);
    return chunks
      .map((chunk) => {
        const lines = chunk.trim().split("\n");
        const head = (lines[0] || "").match(/^@([a-z]+)\b/i);
        if (!head) return null;
        const type = head[1].toLowerCase();
        const rest = lines.slice(1).join("\n").trim();
        const parts = rest.split(/\n---\n/);
        const primary = (parts[0] || "").trim();
        const secondary = (parts[1] || "").trim();

        if (type === "image") {
          return { type, image_url: primary.split("\n")[0].trim(), caption: secondary || "" };
        }
        if (type === "intro" || type === "heading") {
          return { type, title: primary, body: secondary };
        }
        if (type === "colors" || type === "specs") {
          return { type, items: parseLines(primary) };
        }
        if (type === "text" || type === "notice" || type === "quote") {
          return { type, body: primary };
        }
        return { type, title: primary, body: secondary };
      })
      .filter(Boolean);
  }

  function blocksToDsl(blocks) {
    return (blocks || [])
      .map((b) => {
        const t = b.type || b.block_type;
        if (t === "image") {
          return `@image\n${b.image_url || ""}${b.caption ? `\n---\n${b.caption}` : ""}`;
        }
        if (t === "intro" || t === "heading") {
          return `@${t}\n${b.title || ""}${b.body ? `\n---\n${b.body}` : ""}`;
        }
        if (t === "colors" || t === "specs") {
          const items = Array.isArray(b.items) ? b.items.join("\n") : b.items || "";
          return `@${t}\n${items}`;
        }
        if (t === "text" || t === "notice" || t === "quote") {
          return `@${t}\n${b.body || ""}`;
        }
        return `@text\n${b.body || b.title || ""}`;
      })
      .join("\n\n");
  }

  function renderColors(items) {
    const rows = items
      .map((line, i) => {
        const [labelPart, hexPart] = line.split(":").map((s) => s.trim());
        const num = String(i + 1).padStart(2, "0");
        const hasNum = /^\d+\./.test(labelPart);
        const label = hasNum ? labelPart : `${num}. ${labelPart}`;
        const swatch = hexPart
          ? `<span class="hz-swatch" style="background:${esc(hexPart)}"></span>`
          : "";
        return `<li>${swatch}<span>${esc(label)}</span></li>`;
      })
      .join("");
    return `<ul class="hz-colors">${rows}</ul>`;
  }

  function renderSpecs(items) {
    const pairs = [];
    const flat = items.every((x) => !String(x).includes("|")) && items.length % 2 === 0;
    if (flat) {
      for (let i = 0; i < items.length; i += 2) {
        pairs.push([items[i], items[i + 1]]);
      }
    } else {
      for (const line of items) {
        const [k, ...rest] = String(line).split("|");
        pairs.push([(k || "").trim(), rest.join("|").trim()]);
      }
    }
    const rows = pairs
      .map(([k, v]) => `<div class="hz-spec-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
      .join("");
    return `<dl class="hz-specs">${rows}</dl>`;
  }

  function renderBlock(block, index) {
    const type = block.type || block.block_type;
    switch (type) {
      case "intro":
        return `
        <section class="hz-block hz-intro" data-block="${index}">
          ${block.title ? `<h2 class="hz-intro-title">${nl2br(block.title)}</h2>` : ""}
          ${block.body ? `<p class="hz-intro-body">${nl2br(block.body)}</p>` : ""}
        </section>`;
      case "image":
        return `
        <figure class="hz-block hz-figure" data-block="${index}">
          <img src="${esc(block.image_url)}" alt="${esc(block.caption || "")}" loading="lazy">
          ${block.caption ? `<figcaption>${esc(block.caption)}</figcaption>` : ""}
        </figure>`;
      case "heading":
        return `
        <header class="hz-block hz-heading" data-block="${index}">
          <h3>${esc(block.title || "")}</h3>
          <span class="hz-rule" aria-hidden="true"></span>
          ${block.body ? `<p>${nl2br(block.body)}</p>` : ""}
        </header>`;
      case "text":
        return `
        <section class="hz-block hz-text" data-block="${index}">
          <p>${nl2br(block.body || "")}</p>
        </section>`;
      case "quote":
        return `
        <section class="hz-block hz-quote" data-block="${index}">
          <p>${nl2br(block.body || "")}</p>
        </section>`;
      case "colors":
        return `
        <section class="hz-block" data-block="${index}">
          ${renderColors(block.items || [])}
        </section>`;
      case "specs":
        return `
        <section class="hz-block" data-block="${index}">
          ${renderSpecs(block.items || [])}
        </section>`;
      case "notice":
        return `
        <aside class="hz-block hz-notice" data-block="${index}">
          <p>${nl2br(block.body || "")}</p>
        </aside>`;
      default:
        return "";
    }
  }

  function detailCss() {
    return `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Noto+Sans+KR:wght@300;400;500;600&display=swap');

:root {
  --hz-bg: #faf9f7;
  --hz-paper: #ffffff;
  --hz-ink: #1a1814;
  --hz-muted: #6e675c;
  --hz-line: #ddd8d0;
  --hz-soft: #f0ebe3;
  --hz-accent: #3d3429;
  --hz-content: 820px;
  --hz-display: "Cormorant Garamond", "Noto Serif KR", serif;
  --hz-body: "Noto Sans KR", sans-serif;
}

* { box-sizing: border-box; }
html, body {
  margin: 0; padding: 0;
  background: var(--hz-bg); color: var(--hz-ink);
  font-family: var(--hz-body); font-size: 14px; font-weight: 300;
  line-height: 1.75; -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; display: block; vertical-align: top; }
a { color: inherit; }

.hz-page { min-height: 100vh; }

/* —— Buy module (Cafe24-like top) —— */
.hz-buy {
  max-width: 1100px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 1fr; gap: 56px;
  padding: 64px 32px 48px; background: var(--hz-paper);
}
.hz-gallery-main {
  aspect-ratio: 1 / 1; background: var(--hz-soft); overflow: hidden;
}
.hz-gallery-main img { width: 100%; height: 100%; object-fit: cover; }
.hz-thumbs { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.hz-thumb {
  width: 60px; height: 60px; padding: 0; border: 1px solid transparent;
  background: var(--hz-soft); overflow: hidden; cursor: pointer;
}
.hz-thumb.is-active { border-color: var(--hz-ink); }
.hz-thumb img { width: 100%; height: 100%; object-fit: cover; }

.hz-info { padding-top: 8px; }
.hz-name {
  margin: 0 0 6px; font-family: var(--hz-display);
  font-size: 28px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.25;
}
.hz-name-en {
  margin: 0 0 28px; color: var(--hz-muted); font-size: 13px; letter-spacing: 0.04em;
}
.hz-table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
.hz-table th, .hz-table td {
  border-bottom: 1px solid var(--hz-line); padding: 12px 0;
  text-align: left; vertical-align: top; font-weight: 400; font-size: 13px;
}
.hz-table th {
  width: 96px; color: var(--hz-muted); font-weight: 500; padding-right: 16px;
}
.hz-price { font-weight: 500; font-size: 15px; }
.hz-opt { margin: 18px 0; }
.hz-opt-label { font-size: 12px; font-weight: 500; margin-bottom: 10px; letter-spacing: 0.06em; }
.hz-opt-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.hz-chip {
  min-width: 36px; height: 36px; padding: 0 10px;
  border: 1px solid var(--hz-line); background: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--hz-muted);
}
.hz-cta { display: grid; gap: 8px; margin-top: 28px; }
.hz-cta button {
  height: 48px; border: 1px solid var(--hz-ink);
  font-family: var(--hz-body); font-size: 12px; font-weight: 500;
  letter-spacing: 0.14em; cursor: pointer;
}
.hz-cta .buy { background: var(--hz-ink); color: #fff; }
.hz-cta .cart, .hz-cta .wish { background: #fff; color: var(--hz-ink); }

/* —— Editorial detail (inject into Cafe24 {$product_detail}) —— */
.hz-detail {
  max-width: var(--hz-content); margin: 0 auto;
  padding: 72px 24px 120px; text-align: center;
}
.hz-block { margin: 0 0 72px; }
.hz-intro-title {
  margin: 0 0 20px; font-family: var(--hz-display);
  font-size: clamp(26px, 4vw, 36px); font-weight: 500; line-height: 1.35;
}
.hz-intro-body, .hz-text p, .hz-quote p {
  margin: 0 auto; max-width: 520px; color: #3a342c; font-size: 14px; line-height: 1.95;
}
.hz-figure { margin: 0 auto 72px; }
.hz-figure img { width: 100%; margin: 0 auto; }
.hz-figure figcaption {
  margin-top: 14px; color: var(--hz-muted); font-size: 12px; letter-spacing: 0.02em;
}
.hz-heading { margin: 0 0 40px; }
.hz-heading h3 {
  margin: 0 0 12px; font-family: var(--hz-display);
  font-size: 22px; font-weight: 500; letter-spacing: 0.08em; text-transform: none;
}
.hz-rule {
  display: block; width: 28px; height: 1px; background: var(--hz-ink); margin: 0 auto 16px;
}
.hz-heading p { margin: 0; color: var(--hz-muted); font-size: 13px; }
.hz-colors {
  list-style: none; margin: 0; padding: 0;
  display: grid; gap: 14px; justify-items: center;
}
.hz-colors li {
  display: flex; align-items: center; gap: 12px; font-size: 13px; letter-spacing: 0.04em;
}
.hz-swatch {
  width: 18px; height: 18px; border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.12); flex-shrink: 0;
}
.hz-specs {
  margin: 0 auto; max-width: 420px; text-align: left;
}
.hz-spec-row {
  display: grid; grid-template-columns: 120px 1fr; gap: 12px;
  padding: 10px 0; border-bottom: 1px solid var(--hz-line); font-size: 13px;
}
.hz-spec-row dt { color: var(--hz-muted); margin: 0; }
.hz-spec-row dd { margin: 0; color: var(--hz-ink); }
.hz-notice {
  max-width: 520px; margin: 0 auto; padding: 24px 20px;
  background: var(--hz-soft); text-align: left;
}
.hz-notice p { margin: 0; font-size: 12px; color: #5a5348; line-height: 1.8; }
.hz-quote p {
  font-family: var(--hz-display); font-size: 20px; font-style: italic;
  color: var(--hz-accent); line-height: 1.6;
}

.hz-related {
  max-width: 1100px; margin: 0 auto; padding: 48px 32px 80px;
  border-top: 1px solid var(--hz-line);
}
.hz-related h3 {
  margin: 0 0 28px; text-align: center; font-family: var(--hz-display);
  font-size: 16px; letter-spacing: 0.2em; font-weight: 500;
}

@media (max-width: 860px) {
  .hz-buy { grid-template-columns: 1fr; gap: 28px; padding: 32px 20px; }
  .hz-detail { padding: 48px 16px 96px; }
  .hz-block { margin-bottom: 56px; }
  .hz-spec-row { grid-template-columns: 1fr; gap: 4px; }
}
`;
  }

  function galleryHtml(images, name) {
    if (!images.length) {
      return `<div class="hz-gallery-main" style="display:grid;place-items:center;color:#999">이미지 URL을 입력하세요</div>`;
    }
    const thumbs = images
      .map(
        (src, i) =>
          `<button type="button" class="hz-thumb${i === 0 ? " is-active" : ""}" data-src="${esc(src)}"><img src="${esc(src)}" alt="${esc(name)} ${i + 1}"></button>`
      )
      .join("");
    return `
      <div class="hz-gallery">
        <div class="hz-gallery-main"><img id="hzMainImg" src="${esc(images[0])}" alt="${esc(name)}"></div>
        <div class="hz-thumbs">${thumbs}</div>
      </div>`;
  }

  function infoRows(data) {
    const rows = [
      ["판매가", `<span class="hz-price">${esc(data.price || "")}</span>`],
      ["제작정보", esc(data.leadTime || "")],
      ["제품정보", nl2br(data.productInfo || "")],
      ["주의사항", nl2br(data.caution || "")],
      ["사용후기", esc(data.reviewCount || "0")],
    ].filter(([, v]) => v && v !== '<span class="hz-price"></span>');
    return rows
      .map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${v}</td></tr>`)
      .join("");
  }

  function optionChips(raw, label) {
    const items = parseLines(raw);
    if (!items.length) return "";
    const chips = items.map((s) => `<span class="hz-chip">${esc(s.split(":")[0].trim())}</span>`).join("");
    return `<div class="hz-opt"><div class="hz-opt-label">${esc(label)}</div><div class="hz-opt-chips">${chips}</div></div>`;
  }

  function buildDetailFragment(blocks) {
    return blocks.map(renderBlock).join("\n");
  }

  /** Cafe24 product detail editor paste fragment (no full page chrome) */
  function buildCafe24Fragment(data) {
    const blocks =
      Array.isArray(data.blocks) && data.blocks.length
        ? data.blocks
        : parseBlocks(data.blocksDsl || data.sections || "");
    const inner = buildDetailFragment(blocks);
    return `<!-- HEVITZ-style modular detail | product: ${esc(data.sku || data.name || "")} -->
<div class="hz-detail hz-cafe24">
${inner}
</div>
<style>
${detailCss()}
.hz-cafe24 { background: transparent; }
.hz-page { background: transparent; }
</style>`;
  }

  function build(data) {
    const name = data.name || "상품명";
    const nameEn = data.nameEn || "";
    const images = parseLines(data.images);
    const blocks =
      Array.isArray(data.blocks) && data.blocks.length
        ? data.blocks
        : parseBlocks(data.blocksDsl || data.sections || "");

    return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(name)}</title>
<style>${detailCss()}</style>
</head>
<body>
<div class="hz-page">
  <section class="hz-buy">
    ${galleryHtml(images, name)}
    <div class="hz-info">
      <h1 class="hz-name">${esc(name)}</h1>
      ${nameEn ? `<p class="hz-name-en">${esc(nameEn)}</p>` : ""}
      <table class="hz-table"><tbody>${infoRows(data)}</tbody></table>
      ${optionChips(data.colors, "COLOR")}
      ${optionChips(data.sizes, "SIZE / OPTION")}
      <div class="hz-cta">
        <button type="button" class="buy">BUY IT NOW</button>
        <button type="button" class="cart">ADD TO CART</button>
        <button type="button" class="wish">WISH LIST</button>
      </div>
    </div>
  </section>

  <div class="hz-detail" id="prdDetail">
    ${buildDetailFragment(blocks)}
  </div>

  <section class="hz-related">
    <h3>RELATED PRODUCTS</h3>
  </section>
</div>
<script>
document.querySelectorAll('.hz-thumb').forEach(btn => {
  btn.addEventListener('click', () => {
    const main = document.getElementById('hzMainImg');
    if (main) main.src = btn.dataset.src;
    document.querySelectorAll('.hz-thumb').forEach(b => b.classList.remove('is-active'));
    btn.classList.add('is-active');
  });
});
<\/script>
</body>
</html>`;
  }

  global.PDPTemplate = {
    build,
    buildCafe24Fragment,
    parseBlocks,
    blocksToDsl,
    detailCss,
  };
})(typeof window !== "undefined" ? window : globalThis);
