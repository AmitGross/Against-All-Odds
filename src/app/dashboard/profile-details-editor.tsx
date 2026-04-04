"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "./actions";

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia",
  "Austria","Azerbaijan","Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia and Herzegovina",
  "Brazil","Bulgaria","Cameroon","Canada","Chile","China","Colombia","Costa Rica","Croatia",
  "Cuba","Czech Republic","Denmark","Ecuador","Egypt","El Salvador","England","Estonia",
  "Ethiopia","Finland","France","Georgia","Germany","Ghana","Greece","Guatemala","Honduras",
  "Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica",
  "Japan","Jordan","Kazakhstan","Kenya","Kuwait","Latvia","Lebanon","Libya","Lithuania",
  "Luxembourg","Malaysia","Mexico","Moldova","Montenegro","Morocco","Netherlands","New Zealand",
  "Nicaragua","Nigeria","North Korea","North Macedonia","Norway","Oman","Pakistan","Palestine",
  "Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia",
  "Saudi Arabia","Scotland","Senegal","Serbia","Slovakia","Slovenia","South Africa","South Korea",
  "Spain","Sweden","Switzerland","Syria","Taiwan","Thailand","Tunisia","Turkey","Ukraine",
  "United Arab Emirates","United States","Uruguay","Uzbekistan","Venezuela","Vietnam","Wales","Yemen"
];

const AGES = Array.from({ length: 113 }, (_, i) => i + 8); // 8–120

export default function ProfileDetailsEditor({
  initialAge,
  initialCountry,
}: {
  initialAge: number | null;
  initialCountry: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [age, setAge] = useState<string>(initialAge?.toString() ?? "");
  const [country, setCountry] = useState<string>(initialCountry ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({
        age: age ? parseInt(age) : null,
        country: country || null,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-xs text-ink/40">Age</p>
            <p className="text-sm font-medium">
              {initialAge ?? <span className="text-ink/30 italic">Not set</span>}
            </p>
          </div>
          <div>
            <p className="text-xs text-ink/40">Country</p>
            <p className="text-sm font-medium">
              {initialCountry ?? <span className="text-ink/30 italic">Not set</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="rounded border border-ink/20 px-3 py-1.5 text-xs font-medium hover:bg-ink/5 transition-colors shrink-0"
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4">
        {/* Age */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink/40">Age <span className="text-ink/25">(optional)</span></label>
          <select
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5 text-sm focus:border-field focus:outline-none w-28"
          >
            <option value="">— Not set —</option>
            {AGES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-ink/40">Country <span className="text-ink/25">(optional)</span></label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5 text-sm focus:border-field focus:outline-none w-48"
          >
            <option value="">— Not set —</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-field px-3 py-1.5 text-sm font-semibold text-white hover:bg-field/90 disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={() => {
            setAge(initialAge?.toString() ?? "");
            setCountry(initialCountry ?? "");
            setEditing(false);
            setError(null);
          }}
          disabled={isPending}
          className="rounded border border-ink/20 px-3 py-1.5 text-sm hover:bg-ink/5 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-clay">{error}</p>}
    </div>
  );
}
