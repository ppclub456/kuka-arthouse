import Link from "next/link";
import { Suspense } from "react";
import { StoreSection } from "@/components/store-section";
import { PRODUCTS, STORE_BRAND } from "@/data/products";
import { STORE_SUPPORT_EMAIL } from "@/lib/store-contact";

function StoreLoading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-14 sm:px-6">
      <div className="h-4 w-40 rounded bg-[var(--surface-elevated)]" />
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="aspect-[4/5] rounded-sm bg-[var(--surface-elevated)]" />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <main className="flex flex-1 flex-col">
      <section className="border-b border-[var(--border)]">
        <div className="relative flex min-h-[min(72vh,600px)] w-full items-center justify-center overflow-hidden bg-[#030712]">
          <div
            className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-cyan-400/15"
            aria-hidden
          />
          {/* Tech gradient layers */}
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(34,211,238,0.22),transparent_55%)]"
            aria-hidden
          />
          <div
            className="kuka-hero-blob-a pointer-events-none absolute -left-[20%] top-[-20%] h-[85%] w-[75%] rounded-full bg-cyan-500/25 blur-[100px]"
            aria-hidden
          />
          <div
            className="kuka-hero-blob-b pointer-events-none absolute -right-[25%] bottom-[-15%] h-[75%] w-[65%] rounded-full bg-violet-600/30 blur-[110px]"
            aria-hidden
          />
          <div
            className="kuka-hero-blob-c pointer-events-none absolute left-[20%] bottom-[10%] h-[45%] w-[50%] rounded-full bg-blue-500/20 blur-[80px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.055)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_85%_75%_at_50%_40%,black,transparent)] opacity-70"
            aria-hidden
          />
          <div className="kuka-hero-scan pointer-events-none absolute inset-0 opacity-40" aria-hidden />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#030712]/20 via-transparent to-[#030712]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/35 to-transparent" />
          <div className="relative z-10 flex w-full flex-col justify-center px-4 py-16 sm:px-6 sm:py-20">
            <div className="mx-auto w-full max-w-6xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-400/90">
                {STORE_BRAND}
              </p>
              <p className="mt-3 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
                Curated gallery wall art — physical prints shipped to you
              </p>
              <h1 className="mx-auto mt-5 max-w-3xl bg-gradient-to-b from-white to-slate-300 bg-clip-text text-2xl font-semibold leading-tight tracking-tight text-transparent sm:text-4xl sm:leading-tight">
                Browse fine-art reproductions from Japanese classics, masters, new voices,
                vintage posters, florals &amp; abstract pieces — unified at {`70 × 100 cm`}.
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-slate-400/95">
                Prices in AUD — every SKU is described as physical printed work in a single wall-friendly size.
                Checkout as a
                guest anytime — or use{" "}
                <Link
                  href="/login"
                  className="text-cyan-400/90 underline-offset-4 hover:text-cyan-300 hover:underline"
                >
                  customer login
                </Link>{" "}
                if you already have access. No separate sign-up page.
              </p>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="#store"
                  className="moa-cta inline-flex items-center justify-center px-10 py-3.5 text-[10px] font-semibold uppercase tracking-[0.28em]"
                >
                  Browse the gallery
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center border border-cyan-500/35 bg-[var(--card)] px-8 py-3.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/90 transition hover:border-cyan-400/50 hover:bg-cyan-500/10"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<StoreLoading />}>
        <StoreSection products={PRODUCTS} />
      </Suspense>

      <section
        id="reseller"
        className="border-t border-[var(--border)] bg-[var(--accent-soft)] py-16"
      >
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-400">
            Become a reseller
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
            Apply to sell our catalog to your audience. Share your business details
            and we will review reseller or referral terms by region.
          </p>
          <ul className="mx-auto mt-6 max-w-md space-y-2 text-left text-[13px] text-[var(--muted-foreground)]">
            <li className="flex gap-2">
              <span className="text-cyan-500/70">•</span>
              Earn when someone you refer completes a purchase
            </li>
            <li className="flex gap-2">
              <span className="text-violet-400/70">•</span>
              Share links across your channels
            </li>
            <li className="flex gap-2">
              <span className="text-cyan-500/70">•</span>
              Browse by the same categories as our reference: Japanese, famous
              art, vintage, floral &amp; more
            </li>
          </ul>
          <Link
            href="/reseller"
            className="mt-8 inline-block text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-400 underline-offset-4 hover:text-cyan-300 hover:underline"
          >
            Become a Reseller — register
          </Link>
        </div>
      </section>

      <footer className="ai-panel mt-auto border-t border-[var(--border)] py-14">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-400/90">
              Resources
            </h3>
            <ul className="mt-5 space-y-2.5 text-[13px] text-[var(--muted-foreground)]">
              <li>
                <Link className="transition hover:text-cyan-300" href="/?cat=japanese-art">
                  Japanese Art
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-cyan-300" href="/?cat=famous-art">
                  Famous Art
                </Link>
              </li>
              <li>
                <Link
                  className="transition hover:text-cyan-300"
                  href="/?cat=upcoming-artists"
                >
                  Upcoming Artists
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-cyan-300" href="/?cat=vintage-prints">
                  Vintage Wall Art
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-cyan-300" href="/?cat=flower-art">
                  Floral Art
                </Link>
              </li>
              <li>
                <Link className="transition hover:text-cyan-300" href="/?cat=abstract">
                  Abstract
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.25em] text-violet-400/90">
              Company
            </h3>
            <ul className="mt-5 space-y-2.5 text-[13px] text-[var(--muted-foreground)]">
              <li>
                <Link className="hover:text-cyan-300" href="/about">
                  About
                </Link>
              </li>
              <li>
                <Link className="hover:text-cyan-300" href="/shipping">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link className="hover:text-cyan-300" href="/refunds">
                  Refunds
                </Link>
              </li>
              <li>
                <Link className="hover:text-cyan-300" href="/cookies">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link className="hover:text-cyan-300" href="/terms">
                  Terms Of Service
                </Link>
              </li>
              <li>
                <Link className="hover:text-cyan-300" href="/privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href={`mailto:${STORE_SUPPORT_EMAIL}`} className="hover:text-cyan-300">
                  Contact Us
                </a>
              </li>
              <li>
                <Link href="/reseller" className="hover:text-cyan-300">
                  Become a Reseller
                </Link>
              </li>
            </ul>
          </div>
          <div className="lg:pl-8">
            <p className="text-[13px] leading-relaxed text-[var(--muted-foreground)]">
              {STORE_BRAND} focuses on tactile wall décor: physical prints spanning Japanese and famous works,
              vintage, floral, abstract, and curated sets. Flat-rate checkout shipping applies by default inside
              Australia. Guest checkout; optional login for returning customers.
            </p>
          </div>
        </div>
        <div className="mx-auto mt-14 flex max-w-6xl flex-col items-start justify-between gap-2 border-t border-[var(--border-dim)] px-4 pt-8 text-[11px] text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:px-6">
          <span>
            {year} © {STORE_BRAND} All Rights Reserved
          </span>
        </div>
      </footer>
    </main>
  );
}
