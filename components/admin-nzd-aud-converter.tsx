"use client";

import { useEffect, useMemo, useState } from "react";
import { convertNzdToAud } from "@/lib/fx/nzd-aud";

type Props = {
  /** Fills the active AUD amount field in the payment link tool. */
  onApplyAud?: (aud: string) => void;
  className?: string;
};

export function AdminNzdAudConverter({ onApplyAud, className = "" }: Props) {
  const [nzdInput, setNzdInput] = useState("");
  const [rate, setRate] = useState<number | null>(null);
  const [rateDate, setRateDate] = useState<string | null>(null);
  const [rateError, setRateError] = useState("");
  const [rateLoading, setRateLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRate() {
      setRateLoading(true);
      setRateError("");
      try {
        const res = await fetch("/api/admin/fx/nzd-aud", { credentials: "include" });
        const data = (await res.json().catch(() => ({}))) as {
          rate?: number;
          date?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok || typeof data.rate !== "number") {
          setRate(null);
          setRateDate(null);
          setRateError(data.error ?? "无法加载当日汇率。");
          return;
        }
        setRate(data.rate);
        setRateDate(typeof data.date === "string" ? data.date : null);
      } catch {
        if (!cancelled) {
          setRate(null);
          setRateDate(null);
          setRateError("网络错误，请稍后重试。");
        }
      } finally {
        if (!cancelled) setRateLoading(false);
      }
    }

    void loadRate();
    return () => {
      cancelled = true;
    };
  }, []);

  const nzdAmount = useMemo(() => {
    const n = Number.parseFloat(nzdInput.trim().replace(/,/g, ""));
    return Number.isFinite(n) && n >= 0 ? n : null;
  }, [nzdInput]);

  const audAmount = useMemo(() => {
    if (nzdAmount == null || rate == null) return null;
    return convertNzdToAud(nzdAmount, rate);
  }, [nzdAmount, rate]);

  const audFormatted =
    audAmount != null ? audAmount.toFixed(2) : nzdInput.trim() ? "—" : "";

  const inputClass =
    "mt-2 w-full border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2.5 text-base text-[var(--foreground)] focus:border-cyan-400/50 focus:outline-none";

  return (
    <div
      className={`rounded-sm border border-sky-200/80 bg-sky-50/40 p-5 sm:p-6 ${className}`}
    >
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-800">
        NZD → AUD 换算
      </h3>
      <p className="mt-2 text-sm text-zinc-600">
        输入客人新西兰元金额，按当日汇率自动换算为澳元（用于下方付款链接的 AUD 金额）。
      </p>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="nzd-in"
            className="text-sm font-medium uppercase tracking-wide text-zinc-700"
          >
            客人金额 (NZD)
          </label>
          <input
            id="nzd-in"
            inputMode="decimal"
            value={nzdInput}
            onChange={(e) => setNzdInput(e.target.value)}
            className={inputClass}
            placeholder="0.00"
            autoComplete="off"
          />
        </div>
        <div>
          <label
            htmlFor="aud-out"
            className="text-sm font-medium uppercase tracking-wide text-zinc-700"
          >
            换算结果 (AUD)
          </label>
          <output
            id="aud-out"
            htmlFor="nzd-in"
            className={`${inputClass} block tabular-nums font-semibold text-sky-900`}
          >
            {audFormatted || "0.00"}
          </output>
        </div>
      </div>

      <p className="mt-3 text-sm text-zinc-600">
        {rateLoading ? (
          "正在加载当日汇率…"
        ) : rate != null ? (
          <>
            汇率 1 NZD = <span className="font-mono font-medium">{rate.toFixed(4)}</span> AUD
            {rateDate ? (
              <>
                {" "}
                · 日期 <span className="font-mono">{rateDate}</span>
              </>
            ) : null}
            {nzdAmount != null && audAmount != null ? (
              <>
                {" "}
                · {nzdAmount.toFixed(2)} NZD ≈{" "}
                <span className="font-semibold text-sky-800">{audFormatted} AUD</span>
              </>
            ) : null}
          </>
        ) : null}
      </p>

      {rateError ? (
        <p className="mt-2 text-sm font-medium text-red-700" role="alert">
          {rateError}
        </p>
      ) : null}

      {onApplyAud && audAmount != null && audAmount > 0 ? (
        <button
          type="button"
          onClick={() => onApplyAud(audFormatted)}
          className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-sky-800 underline-offset-4 hover:text-sky-950 hover:underline"
        >
          填入下方 AUD 金额
        </button>
      ) : null}
    </div>
  );
}
