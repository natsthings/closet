"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { slugify } from "@/lib/constants";

const TABS = [
  { key: "categories", label: "Categories", hint: "e.g. hats, swimwear" },
  { key: "locations", label: "Locations", hint: "e.g. car, gym locker" },
  { key: "formality", label: "Formality", hint: "e.g. cocktail, black tie" },
];

export default function CustomOptionsManager({ userId, customOptions, onChange, onClose }) {
  const supabase = createClient();
  const [tab, setTab] = useState("categories");
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function persist(next) {
    setSaving(true);
    await supabase.from("user_settings").upsert({
      user_id: userId,
      custom_categories: next.categories,
      custom_locations: next.locations,
      custom_formality: next.formality,
      updated_at: new Date().toISOString(),
    });
    onChange(next);
    setSaving(false);
  }

  function addOption() {
    const label = draft.trim();
    if (!label) return;
    const value = slugify(label);
    if (!value) return;
    const existing = customOptions[tab] || [];
    if (existing.some((o) => o.value === value)) {
      setDraft("");
      return;
    }
    const next = { ...customOptions, [tab]: [...existing, { value, label }] };
    persist(next);
    setDraft("");
  }

  function removeOption(value) {
    const next = { ...customOptions, [tab]: (customOptions[tab] || []).filter((o) => o.value !== value) };
    persist(next);
  }

  const activeHint = TABS.find((t) => t.key === tab)?.hint;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="win w-full max-w-md">
        <div className="win-titlebar">
          <span className="win-dot" style={{ background: "#ff6161" }} />
          <span className="win-dot" style={{ background: "#ffd166" }} />
          <span className="win-dot" style={{ background: "#8ee08e" }} />
          <div className="win-addressbar">closet://settings/custom-options</div>
          <button onClick={onClose} className="chrome-font text-xl px-1">✕</button>
        </div>

        <div className="p-4">
          <div className="flex gap-1.5 mb-3">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`pill ${tab === t.key ? "pill-active" : ""}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-[var(--ink-soft)] mb-2">Add your own {activeHint}.</p>

          <div className="flex gap-2 mb-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
              placeholder="type a name..."
              className="flex-1"
            />
            <button onClick={addOption} disabled={saving} className="btn btn-accent">
              add
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
            {(customOptions[tab] || []).length === 0 && (
              <p className="text-xs text-[var(--ink-soft)]">No custom {tab} yet.</p>
            )}
            {(customOptions[tab] || []).map((o) => (
              <span key={o.value} className="pill flex items-center gap-1.5">
                {o.label}
                <button onClick={() => removeOption(o.value)} className="text-[var(--danger)] font-bold" title="Remove">
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
