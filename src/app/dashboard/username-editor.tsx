"use client";

import { useState, useTransition } from "react";
import { updateUsername } from "./actions";

export default function UsernameEditor({
  current,
  isSet,
}: {
  current: string;
  isSet: boolean;
}) {
  const [editing, setEditing] = useState(!isSet); // auto-open if username never set
  const [value, setValue] = useState(isSet ? current : "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateUsername(value);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs text-ink/40">Username</p>
          <p className="text-lg font-bold">{current}</p>
        </div>
        <button
          onClick={() => { setValue(current); setEditing(true); }}
          className="rounded border border-ink/20 px-3 py-1.5 text-xs font-medium hover:bg-ink/5 transition-colors shrink-0"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink/40">
        {isSet ? "Change username" : "Choose your username"}
      </p>
      {!isSet && (
        <p className="text-xs text-clay font-medium">
          Your username is currently set to your email. Please choose a real username.
        </p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={30}
          autoFocus
          placeholder="e.g. goat_predictor"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape" && isSet) { setEditing(false); setError(null); }
          }}
          className="rounded border border-ink/20 px-3 py-1.5 text-sm focus:border-field focus:outline-none w-48"
        />
        <button
          onClick={handleSave}
          disabled={isPending || !value.trim()}
          className="rounded bg-field px-3 py-1.5 text-sm font-semibold text-white hover:bg-field/90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        {isSet && (
          <button
            onClick={() => { setEditing(false); setError(null); }}
            disabled={isPending}
            className="rounded border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
      {error && <p className="text-xs text-clay">{error}</p>}
      <p className="text-xs text-ink/30">3–30 chars · letters, numbers, underscores only</p>
    </div>
  );
}
