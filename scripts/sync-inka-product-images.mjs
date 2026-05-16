/**
 * Fetch live Shopify product images from https://inkaarthouse.com/products.json,
 * fuzzy-match catalogue titles from data/products.ts, and write data/inka-product-image-src.ts.
 *
 * Run: node scripts/sync-inka-product-images.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PRODUCTS_PATH = path.join(ROOT, "data/products.ts");
const OUT_PATH = path.join(ROOT, "data/inka-product-image-src.ts");

async function fetchAllProducts() {
  const all = [];
  let page = 1;
  for (;;) {
    const url = `https://inkaarthouse.com/products.json?limit=250&page=${page}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Fetch ${url}: ${r.status}`);
    const j = await r.json();
    const rows = j.products ?? [];
    if (!rows.length) break;
    all.push(...rows);
    if (rows.length < 250) break;
    page += 1;
  }
  return all;
}

function parseCatalogue(path) {
  const text = fs.readFileSync(path, "utf8");
  /** @note titles are single-line in products.ts — no escapes expected */
  const reSimple = /\bid:\s*"(inka-\d+)",\s*\n\s*title:\s*"([^"]+)",/g;
  const pairs = [];
  for (const m of text.matchAll(reSimple)) {
    pairs.push({ id: m[1], title: m[2] });
  }
  const seen = new Set();
  const out = [];
  for (const p of pairs) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

/** Normalise for fuzzy compare */
function canon(s) {
  return (
    s
      .trim()
      .toLowerCase()
      .normalize("NFKC")
      // Unicode variants for "×" used in storefront
      .replace(/×|✕/g, "x")
      .replace(/[|'’`´]/g, "'")
      // normalise separators
      .replace(/\|\s*/g, " | ")
      .replace(/\s+/g, " ")
      .replace(/\b(and|by|the|print|prints|wall art|art prints?)\b/g, "")
      .replace(/\b(\d+)\s*x\s+/gi, "$1x ")
      .replace(/[^a-z0-9x| ]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function scoreMatch(localTitle, remoteTitle, remoteHandle) {
  const lt = canon(localTitle);
  const rt = canon(remoteTitle);
  const rh = remoteHandle.replace(/-/g, " ").toLowerCase();

  const pick = canon(localTitle.replace(/\|\s*/, " "));
  let s = 0;
  if (lt === rt) s = 1100;
  else if (lt === canon(remoteTitle.replace(/\s*\|.*/, ""))) s = 1080;
  else if (rt.startsWith(lt) || lt.startsWith(rt)) s = 920 + Math.min(lt.length, rt.length);
  else if (
    lt.length >= 10 &&
    (rt.includes(lt) || lt.includes(rt) || rt.includes(pick.replace(/\|.*/, "").trim()))
  )
    s = 760 + Math.min(lt.length, rt.length);

  /** Handle often mirrors title slug (no pipe) — strong signal */
  const ltSlugLike = canon(localTitle.replace(/\|.*$/, "")).replace(/ /g, "");
  const rhSlug = remoteHandle.replace(/-/g, "");
  const rtSlug = rt.replace(/ /g, "");
  const compactLt = canon(localTitle).replace(/\s+/g, "");
  const compactRt = rt.replace(/\s+/g, "");

  if (rhSlug.includes(compactLt) || rtSlug.includes(compactLt.slice(4))) {
    /** avoid tiny false positives when compactLt is short */
    if (compactLt.length >= 14) s = Math.max(s, 740);
  }
  if (
    rh.includes(compactLt.replace(/\s/g, "").slice(0, 18)) &&
    compactLt.length >= 14
  ) {
    s = Math.max(s, 720);
  }

  /** token overlap bonus */
  const toks = (x) =>
    x
      .split(/[|\s]+/)
      .map((w) => w.trim())
      .filter((w) => w.length >= 4);
  const A = new Set(toks(localTitle.toLowerCase()));
  const B = new Set(toks(remoteTitle.toLowerCase()));
  let overlap = 0;
  for (const a of A) {
    if (B.has(a)) overlap += a.length;
  }
  const union = Math.max(A.size + B.size, 1);
  if (overlap >= 24) {
    s = Math.max(s, 620 + overlap);
    if (
      [...A].every(
        (a) =>
          [...B].some(
            (b) => b.includes(a.slice(0, Math.min(a.length - 2, a.length))) || b === a,
          ) || [...B].some((b) => b.includes(a)),
      )
    )
      s = Math.max(s, 690 + overlap / 6);
  }

  /** prefer handle contains key phrase from title (before pipe) */
  const beforePipe = canon(localTitle.split("|")[0] ?? "").replace(/ /g, "-");
  if (beforePipe.length >= 14 && remoteHandle.includes(beforePipe.slice(3, 30))) {
    s = Math.max(s, 650);
  }

  return s + (overlap > 40 ? overlap / 20 : 0) + rt.length * 0.001;
}

/** Prefer flat product art (skip interior mockups with frame in filename / alt). */
function bestImage(product) {
  const imgs = [...(product.images ?? [])].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0),
  );
  if (!imgs.length) return "";
  const isRoomMock = (i) =>
    /-framed-print-/i.test(i.src ?? "") ||
    /\b(framed\s+print|living\s+room|room\s+setting|gallery\s+wall\s+mock)\b/i.test(
      i.alt ?? "",
    );
  const flat = imgs.find((i) => !isRoomMock(i));
  return (flat ?? imgs[0]).src ?? "";
}

function resizeShopify(img, maxW = 1200) {
  if (!img) return "";
  const u = img.includes("?") ? `${img}&width=${maxW}` : `${img}?width=${maxW}`;
  return u;
}

async function main() {
  const catalogue = parseCatalogue(PRODUCTS_PATH);
  const remote = await fetchAllProducts();
  console.log(`Catalogue: ${catalogue.length} SKU(s)`);
  console.log(`Inka Shopify: ${remote.length} products`);

  const assignments = {};
  const usedRemote = new Set();

  /** Sort catalogue by title length descending to match more specific listings first */
  const ordered = [...catalogue].sort((a, b) => b.title.length - a.title.length);

  for (const row of ordered) {
    let best = { product: null, score: -1 };
    for (const p of remote) {
      if (usedRemote.has(p.id)) continue;
      const sc = scoreMatch(row.title, p.title, p.handle || "");
      if (sc > best.score && sc >= 600) best = { product: p, score: sc };
    }
    /** relax threshold for hard cases — still require minimum overlap heuristic */
    if (!best.product) {
      let bestLoose = { product: null, score: -1 };
      for (const p of remote) {
        if (usedRemote.has(p.id)) continue;
        const sc = scoreMatch(row.title, p.title, p.handle || "");
        if (sc > bestLoose.score) bestLoose = { product: p, score: sc };
      }
      /** only accept loose if clearly related (overlap / long substring) */
      if (bestLoose.score >= 420) best = bestLoose;
      else best = { product: null, score: 0 };
    }

    const src =
      best.product && typeof best.product.id === "number"
        ? resizeShopify(bestImage(best.product))
        : "";
    if (best.product && src) {
      usedRemote.add(best.product.id);
      assignments[row.id] = { src, shopifyTitle: best.product.title, score: best.score };
    } else {
      assignments[row.id] = { src: "", shopifyTitle: null, score: 0 };
    }
  }

  const misses = catalogue.filter(({ id }) => !assignments[id]?.src).map((x) => x);

  console.log("\nMatched:", catalogue.length - misses.length, "/", catalogue.length);
  if (misses.length) {
    console.log("\nUnmatched SKU (please add manual aliases or fix titles):");
    for (const m of misses) {
      console.log(`  ${m.id}  ${JSON.stringify(m.title)}`);
    }
  }

  const lines = [
    "// Auto-generated — remote Shopify CDN URLs.",
    '// Source: https://inkaarthouse.com/products.json',
    '//   npm run sync:inka-images',
    "// Self-host:",
    '//   npm run download:inka-images',
    "//",
    "export const INKA_PRODUCT_IMAGE_SRC: Record<string, string> = {",
  ];

  for (const { id } of catalogue) {
    const entry = assignments[id];
    const url = entry?.src ?? "";
    lines.push(`  ${JSON.stringify(id)}: ${JSON.stringify(url)},`);
  }

  lines.push("};");

  fs.writeFileSync(
    OUT_PATH,
    `${lines.join("\n")}\n`,
    "utf8",
  );
  console.log(`\nWrote ${path.relative(ROOT, OUT_PATH)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
