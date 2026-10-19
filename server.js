const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3456;
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, "public");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

function resolveFile(urlPath) {
  if (urlPath === "/" || urlPath === "") {
    return path.join(PUBLIC, "index.html");
  }
  // Allow /data/*, /output/*, /templates/* for local testing
  if (
    urlPath.startsWith("/data/") ||
    urlPath.startsWith("/output/") ||
    urlPath.startsWith("/templates/")
  ) {
    return path.join(ROOT, urlPath.slice(1));
  }
  return path.join(PUBLIC, urlPath);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const filePath = resolveFile(urlPath);
  const allowedRoots = [PUBLIC, path.join(ROOT, "data"), path.join(ROOT, "output"), path.join(ROOT, "templates")];

  if (!allowedRoots.some((root) => filePath.startsWith(root))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`HEVITZ-style PDP Generator → http://localhost:${PORT}`);
  console.log(`  UI:       http://localhost:${PORT}/`);
  console.log(`  CSV:      http://localhost:${PORT}/data/products.csv`);
  console.log(`  Output:   http://localhost:${PORT}/output/`);
});
