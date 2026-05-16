/**
 * Download each URL in data/inka-product-image-src.ts into public/catalog/
 * and rewrite the map to same-origin paths: /catalog/inka-XXX.ext
 *
 * Run after sync:inka-images whenever the remote Shopify URLs change.
 *   npm run download:inka-images
 *
 * Requires rights to reproduce/sell — only use assets you’re licensed for.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const MAP_PATH = path.join(ROOT, "data/inka-product-image-src.ts");
const OUT_DIR = path.join(ROOT, "public/catalog");

const UA =
  "my-art-shop-image-mirror/1.0 (local catalog; contact site owner)";

function parseMapFile() {
  const text = fs.readFileSync(MAP_PATH, "utf8");
  const re = /"(inka-\d+)":\s*"([^"]+)"/g;
  const rows = [];
  for (const m of text.matchAll(re)) {
    rows.push({ id: m[1], url: m[2] });
  }
  return rows;
}

function extFromType(ct) {
  const t = (ct || "").split(";")[0].trim().toLowerCase();
  if (t === "image/jpeg" || t === "image/jpg") return ".jpg";
  if (t === "image/png") return ".png";
  if (t === "image/webp") return ".webp";
  if (t === "image/gif") return ".gif";
  return ".jpg";
}

function extFromUrl(u) {
  try {
    const p = new URL(u).pathname.toLowerCase();
    if (p.endsWith(".png")) return ".png";
    if (p.endsWith(".webp")) return ".webp";
    if (p.endsWith(".gif")) return ".gif";
  } catch {
    /* ignore */
  }
  return ".jpg";
}

async function downloadOne(id, url, force) {
  if (url.startsWith("/catalog/")) {
    const rel = url.replace(/^\//, "");
    const localPath = path.join(ROOT, "public", rel);
    if (fs.existsSync(localPath) && fs.statSync(localPath).size > 512) {
      return { id, href: url, skipped: true };
    }
    console.warn(`${id}: map points to ${url} but file missing — refresh remote map first`);
    return { id, href: url, error: "missing-local" };
  }

  const hintExt = extFromUrl(url);

  let res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "image/*" },
    redirect: "follow",
  });

  /** Shopify CDN sometimes needs a trailing format — retry once without narrow Accept */
  if (!res.ok) {
    res = await fetch(url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
  }

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${id}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!/^image\//i.test(ct) && !/octet-stream/i.test(ct)) {
    console.warn(`${id}: unexpected content-type ${ct}, still writing bytes`);
  }

  const ext = /^image\//i.test(ct) ? extFromType(ct) : hintExt;
  const filename = `${id}${ext}`;
  const filePath = path.join(OUT_DIR, filename);
  const href = `/catalog/${filename}`;

  if (!force && fs.existsSync(filePath) && fs.statSync(filePath).size > 512) {
    return { id, href, skipped: true };
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 256) {
    throw new Error(`${id}: response too small (${buf.length} bytes)`);
  }

  fs.writeFileSync(filePath, buf);
  return { id, href, bytes: buf.length };
}

async function poolMap(items, limit, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    for (;;) {
      const j = i;
      i += 1;
      if (j >= items.length) break;
      out[j] = await fn(items[j], j);
    }
  });
  await Promise.all(workers);
  return out;
}

function writeMapFile(rows) {
  const lines = [
    "// Product images served from /public/catalog (see npm run download:inka-images).",
    "// To refresh remote URLs first: npm run sync:inka-images",
    "",
    "export const INKA_PRODUCT_IMAGE_SRC: Record<string, string> = {",
  ];
  for (const { id, href } of rows) {
    lines.push(`  ${JSON.stringify(id)}: ${JSON.stringify(href)},`);
  }
  lines.push("};");
  lines.push("");
  fs.writeFileSync(MAP_PATH, lines.join("\n"), "utf8");
}

async function main() {
  const force = process.argv.includes("--force");
  const rows = parseMapFile();
  if (!rows.length) {
    console.error("No entries parsed from data/inka-product-image-src.ts");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = await poolMap(rows, 4, async ({ id, url }) => {
    try {
      return await downloadOne(id, url, force);
    } catch (e) {
      console.error(`${id}:`, e.message || e);
      return { id, href: url, error: String(e.message || e) };
    }
  });

  let ok = 0;
  let skip = 0;
  let fail = 0;
  const mapped = [];

  for (let i = 0; i < rows.length; i++) {
    const r = results[i];
    const id = rows[i].id;
    if (!r || r.error) {
      fail += 1;
      mapped.push({ id, href: rows[i].url });
      continue;
    }
    if (r.skipped) skip += 1;
    else ok += 1;
    mapped.push({ id, href: r.href });
  }

  writeMapFile(mapped.sort((a, b) => a.id.localeCompare(b.id)));

  console.log(`\nDownloaded new: ${ok}, skipped existing: ${skip}, failed (kept remote URL): ${fail}`);
  console.log(`Wrote ${path.relative(ROOT, MAP_PATH)}`);
  console.log(`Files directory: ${path.relative(ROOT, OUT_DIR)}`);
  if (fail) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
