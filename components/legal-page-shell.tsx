import type { ReactNode } from "react";

type Props = {
  title: string;
  children: ReactNode;
  /** ISO-style date shown under the title, e.g. for policy reviews. */
  lastUpdated?: string;
};

export function LegalPageShell({ title, lastUpdated, children }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <article className="ai-panel rounded-sm border border-[var(--border)] p-8 sm:p-10">
        <h1 className="bg-gradient-to-r from-cyan-200 to-violet-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
          {title}
        </h1>
        {lastUpdated ? (
          <p className="mt-3 text-xs text-[var(--muted-foreground)]">
            Last updated: {lastUpdated}
          </p>
        ) : null}
        <div className="mt-8 space-y-5 text-sm leading-relaxed text-[var(--muted-foreground)] [&_h2]:mt-8 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[var(--foreground)] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </div>
  );
}
