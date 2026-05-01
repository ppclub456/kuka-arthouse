"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CATEGORY_TAB_UPPER,
  parseCategoryParam,
} from "@/lib/categories";
import { MOA_FORMAT_OPTIONS, MOA_LICENSE_OPTIONS } from "@/lib/moa-constants";
import type { Product, ProductCategory, ProductLicense } from "@/lib/types";
import { STORE_BRAND } from "@/data/products";

type FilterKey = "all" | ProductCategory;

type FilterState = {
  priceMin: string;
  priceMax: string;
  formats: string[];
  license: "any" | ProductLicense;
};

const defaultFilters: FilterState = {
  priceMin: "",
  priceMax: "",
  formats: [],
  license: "any",
};

function tabClass(active: boolean) {
  return active
    ? "border-cyan-400 text-cyan-300"
    : "border-transparent text-slate-500 hover:text-cyan-400/90";
}

function storeTabClass(active: boolean) {
  return active
    ? "border-cyan-400/60 bg-cyan-500/15 text-cyan-200 shadow-[0_0_20px_rgba(34,211,238,0.12)]"
    : "border-[var(--border-dim)] bg-[var(--card)] text-[var(--muted-foreground)] hover:border-cyan-400/25";
}

function matchesFilters(product: Product, applied: FilterState): boolean {
  const min = applied.priceMin === "" ? null : Number(applied.priceMin);
  const max = applied.priceMax === "" ? null : Number(applied.priceMax);
  if (min !== null && Number.isFinite(min) && product.priceAud < min) {
    return false;
  }
  if (max !== null && Number.isFinite(max) && product.priceAud > max) {
    return false;
  }
  if (applied.formats.length > 0) {
    const ok = applied.formats.some((f) => product.formats.includes(f));
    if (!ok) return false;
  }
  if (applied.license !== "any" && product.license !== applied.license) {
    return false;
  }
  return true;
}

export function StoreSection({ products }: { products: Product[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catRaw = searchParams.get("cat") ?? undefined;
  const fromUrl = parseCategoryParam(catRaw);

  const [showFilters, setShowFilters] = useState(false);
  const [draft, setDraft] = useState<FilterState>(defaultFilters);
  const [applied, setApplied] = useState<FilterState>(defaultFilters);

  const activeFilter: FilterKey = fromUrl;

  const setFilter = useCallback(
    (next: FilterKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") {
        params.delete("cat");
      } else {
        params.set("cat", next);
      }
      const q = params.toString();
      router.replace(q ? `/?${q}` : "/", { scroll: false });
    },
    [router, searchParams],
  );

  const filtered = useMemo(() => {
    let list =
      activeFilter === "all"
        ? products
        : products.filter((p) => p.category === activeFilter);
    list = list.filter((p) => matchesFilters(p, applied));
    return list;
  }, [products, activeFilter, applied]);

  function toggleDraftFormat(fmt: string) {
    setDraft((d) => ({
      ...d,
      formats: d.formats.includes(fmt)
        ? d.formats.filter((x) => x !== fmt)
        : [...d.formats, fmt],
    }));
  }

  function applyFilters() {
    setApplied({ ...draft });
  }

  function clearAllFilters() {
    setDraft(defaultFilters);
    setApplied(defaultFilters);
    setFilter("all");
  }

  return (
    <>
      <section
        className="ai-panel border-b border-[var(--border)]"
        aria-labelledby="resources-heading"
      >
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2
            id="resources-heading"
            className="text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-400/90"
          >
            Looking for art resources ?
          </h2>
          <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--foreground)]">
            We got you covered.
          </p>
          <nav
            className="mt-12 flex flex-wrap justify-center gap-x-3 gap-y-2 sm:gap-x-5"
            aria-label="Browse by category"
          >
            {CATEGORY_ORDER.map((key) => (
              <Link
                key={key}
                href={`/?cat=${key}`}
                scroll={false}
                className={`border-b-2 border-transparent px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] transition ${tabClass(activeFilter === key)}`}
              >
                {CATEGORY_TAB_UPPER[key]}
              </Link>
            ))}
            <Link
              href="/"
              scroll={false}
              className={`border-b-2 border-transparent px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] transition ${tabClass(activeFilter === "all")}`}
            >
              BROWSE ALL
            </Link>
          </nav>
        </div>
      </section>

      <section id="store" className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-center text-[11px] font-semibold uppercase tracking-[0.38em] text-violet-400/90">
          Store
        </h2>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 lg:flex-1 lg:gap-1">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`shrink-0 rounded-sm border px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] transition ${storeTabClass(activeFilter === "all")}`}
            >
              ALL
            </button>
            {CATEGORY_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`shrink-0 rounded-sm border px-2.5 py-2 text-[9px] font-semibold uppercase tracking-[0.1em] transition ${storeTabClass(activeFilter === key)}`}
              >
                {CATEGORY_TAB_UPPER[key]}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="shrink-0 self-end text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-400 underline-offset-4 hover:text-violet-300 hover:underline lg:self-center"
          >
            {showFilters ? "HIDE FILTERS" : "SHOW FILTERS"}
          </button>
        </div>

        {showFilters && (
          <div className="ai-panel mt-8 border border-[var(--border)] p-6 shadow-[0_0_40px_rgba(99,102,241,0.06)]">
            <div className="grid gap-8 lg:grid-cols-2 xl:grid-cols-4">
              <fieldset>
                <legend className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80">
                  Category
                </legend>
                <ul className="mt-4 space-y-2 text-[12px] text-[var(--foreground)]">
                  <li>
                    <button
                      type="button"
                      onClick={() => setFilter("all")}
                      className={`text-left hover:underline ${activeFilter === "all" ? "font-semibold" : ""}`}
                    >
                      All
                    </button>
                  </li>
                  {CATEGORY_ORDER.map((key) => (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => setFilter(key)}
                        className={`text-left hover:underline ${activeFilter === key ? "font-semibold" : ""}`}
                      >
                        {CATEGORY_LABELS[key]}
                      </button>
                    </li>
                  ))}
                </ul>
              </fieldset>

              <fieldset>
                <legend className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80">
                  Price Range
                </legend>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={draft.priceMin}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, priceMin: e.target.value }))
                    }
                    className="w-full border border-[var(--border)] bg-[var(--input-bg)] px-2 py-2 text-sm text-[var(--foreground)]"
                  />
                  <span className="text-slate-500">—</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="1000"
                    value={draft.priceMax}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, priceMax: e.target.value }))
                    }
                    className="w-full border border-[var(--border)] bg-[var(--input-bg)] px-2 py-2 text-sm text-[var(--foreground)]"
                  />
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80">
                  File Format
                </legend>
                <ul className="mt-4 space-y-2">
                  {MOA_FORMAT_OPTIONS.map((fmt) => (
                    <li key={fmt}>
                      <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[var(--foreground)]">
                        <input
                          type="checkbox"
                          checked={draft.formats.includes(fmt)}
                          onChange={() => toggleDraftFormat(fmt)}
                          className="rounded border-cyan-500/40 bg-[var(--input-bg)]"
                        />
                        {fmt}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>

              <fieldset>
                <legend className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-500/80">
                  License Type
                </legend>
                <ul className="mt-4 space-y-2">
                  <li>
                    <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[var(--foreground)]">
                      <input
                        type="radio"
                        name="moa-license"
                        checked={draft.license === "any"}
                        onChange={() =>
                          setDraft((d) => ({ ...d, license: "any" }))
                        }
                        className="border-cyan-500/40 bg-[var(--input-bg)]"
                      />
                      Any
                    </label>
                  </li>
                  {MOA_LICENSE_OPTIONS.map((opt) => (
                    <li key={opt.id}>
                      <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[var(--foreground)]">
                        <input
                          type="radio"
                          name="moa-license"
                          checked={draft.license === opt.id}
                          onChange={() =>
                            setDraft((d) => ({ ...d, license: opt.id }))
                          }
                          className="border-cyan-500/40 bg-[var(--input-bg)]"
                        />
                        {opt.label}
                      </label>
                    </li>
                  ))}
                </ul>
              </fieldset>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 border-t border-[var(--border-dim)] pt-6">
              <button
                type="button"
                onClick={clearAllFilters}
                className="border border-[var(--border)] bg-[var(--surface-elevated)] px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--foreground)] transition hover:border-cyan-400/50"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={applyFilters}
                className="moa-cta px-6 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em]"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-[10px] uppercase tracking-[0.2em] text-slate-500">
          {activeFilter === "all"
            ? "ALL"
            : CATEGORY_TAB_UPPER[activeFilter]}{" "}
          · {filtered.length} results
        </p>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-14 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              brandName={STORE_BRAND}
            />
          ))}
        </div>
      </section>
    </>
  );
}
