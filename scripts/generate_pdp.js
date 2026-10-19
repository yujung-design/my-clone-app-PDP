/**
 * CSV → HEVITZ-style Cafe24 detail HTML (Node, no deps)
 * Usage: node scripts/generate_pdp.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PRODUCTS = path.join(ROOT, "data", "products.csv");
const BLOCKS = path.join(ROOT, "data", "blocks.csv");
const OUT = path.join(ROOT, "output");
const CSS_PATH = path.join(ROOT, "templates", "cafe24-detail.css");

// Load shared template (browser IIFE also works under Node via globalThis)
require(path.join(ROOT, "public", "js", "template.js"));
const { build, buildCafe24Fragment, blocksToDsl } = globalThis.PDPTemplate;

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
    } else if (ch !== "\r") {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows
    .slice(1)
    .filter((r) => r.some((c) => String(c).trim()))
    .map((r) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = String(r[i] ?? "").trim();
      });
      return obj;
    });
}

function productFromRow(row, blockRows) {
  const sku = row.sku || row.SKU || "";
  const mine = blockRows
    .filter((b) => (b.sku || b.SKU) === sku)
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  const blocks = mine.map((b) => ({
    type: (b.block_type || b.type || "text").toLowerCase(),
    title: (b.title || "").replace(/\\n/g, "\n"),
    body: (b.body || "").replace(/\\n/g, "\n"),
    image_url: b.image_url || b.image || "",
    caption: b.caption || "",
    items: (b.items || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean),
  }));
  return {
    sku,
    name: row.name || "",
    nameEn: row.name_en || "",
    price: row.price || "",
    leadTime: row.lead_time || "",
    productInfo: (row.product_info || "").replace(/\\n/g, "\n"),
    caution: (row.caution || "").replace(/\\n/g, "\n"),
    reviewCount: row.review_count || "0",
    images: (row.images || "").split("|").map((s) => s.trim()).filter(Boolean).join("\n"),
    colors: (row.colors || "").split("|").join("\n"),
    sizes: (row.sizes || "").split("|").join("\n"),
    blocks,
    blocksDsl: blocksToDsl(blocks),
  };
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const products = parseCsv(fs.readFileSync(PRODUCTS, "utf8"));
  const blocks = parseCsv(fs.readFileSync(BLOCKS, "utf8"));
  // Ensure CSS file is readable for humans; fragment embeds via template.js css()
  if (!fs.existsSync(CSS_PATH)) {
    console.warn("warn: templates/cafe24-detail.css missing");
  }

  const indexLinks = [];
  for (const row of products) {
    const data = productFromRow(row, blocks);
    const safe = (data.sku || "product").replace(/[^\w.-]+/g, "_");
    const preview = build(data);
    const fragment = buildCafe24Fragment(data);
    fs.writeFileSync(path.join(OUT, `${safe}-preview.html`), preview, "utf8");
    fs.writeFileSync(path.join(OUT, `${safe}-cafe24-fragment.html`), fragment, "utf8");
    indexLinks.push(`<li><a href="${safe}-preview.html">${data.sku} — ${data.name}</a></li>`);
    console.log(`✓ ${data.sku}`);
  }

  fs.writeFileSync(
    path.join(OUT, "index.html"),
    `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>PDP Output</title></head>
<body><h1>Generated PDP previews</h1><ul>${indexLinks.join("")}</ul>
<p><a href="/">← Generator UI</a></p></body></html>`,
    "utf8"
  );
  console.log(`\nDone → ${OUT}`);
}

main();
