"use client";

import { useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { label: "24 hours", value: "24h" },
  { label: "2 days",   value: "2d"  },
  { label: "1 week",   value: "1w"  },
  { label: "1 year",   value: "1y"  }, // QA only — remove later
];

export default function WindowPicker({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("window", val);
    router.push(`/dashboard?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink/40">Show:</span>
      <div className="flex rounded-lg border border-ink/10 overflow-hidden text-xs font-medium">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            onClick={() => handleChange(o.value)}
            className={`px-3 py-1.5 transition-colors ${
              current === o.value
                ? "bg-field text-white"
                : "bg-white text-ink hover:bg-ink/5"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
