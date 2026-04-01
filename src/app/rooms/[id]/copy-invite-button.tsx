"use client";

import { useState } from "react";

export default function CopyInviteButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded bg-ink/5 px-3 py-1 text-xs font-medium text-ink/60 hover:bg-ink/10"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
