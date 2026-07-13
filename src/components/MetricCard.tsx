"use client";
import { useEffect, useState } from "react";

type Props = {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  icon: React.ReactNode;
  warn?: boolean;
  pulse?: boolean;
  updatedAt?: string | null;
};

export default function MetricCard({
  label,
  value,
  unit,
  icon,
  warn = false,
  pulse = false,
  updatedAt
}: Props) {
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    setFadeKey((k) => k + 1);
  }, [value, updatedAt]);

  const displayValue = value === null || value === undefined || value === "" ? "—" : value;

  return (
    <div
      className={
        "bg-surface border rounded-xl p-4 shadow-card transition-colors " +
        (warn ? "border-accent" : "border-line")
      }
    >
      <div className="flex items-center justify-between text-muted">
        <span className="text-xs font-medium tracking-wide uppercase">{label}</span>
        <span
          className={
            (warn ? "text-accent" : "text-ink") +
            " " +
            (pulse ? "animate-heartbeat" : "")
          }
        >
          {icon}
        </span>
      </div>
      <div
        key={fadeKey}
        className="mt-2 flex items-baseline gap-1 animate-fadein"
      >
        <span
          className={
            "text-3xl font-semibold tracking-tight " + (warn ? "text-accent" : "text-ink")
          }
        >
          {displayValue}
        </span>
        {unit && displayValue !== "—" && (
          <span className="text-sm text-muted">{unit}</span>
        )}
      </div>
    </div>
  );
}
