"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

const DEFAULTS = { chrome: "#cdbdf0", accent: "#ff6fa5", accent2: "#c8f169" };
const PRESETS = [
  { name: "lavender pop", chrome: "#cdbdf0", accent: "#ff6fa5", accent2: "#c8f169" },
  { name: "baby blue", chrome: "#bcd8ff", accent: "#5b7fff", accent2: "#ffe066" },
  { name: "matcha", chrome: "#d7e8c5", accent: "#7a9a5e", accent2: "#ffb4c6" },
  { name: "grayscale web1.0", chrome: "#d9d9d9", accent: "#222222", accent2: "#f2f2f2" },
];

function applyTheme(t) {
  const root = document.documentElement;
  root.style.setProperty("--chrome", t.chrome);
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--accent-2", t.accent2);
}

export default function ThemeSettings({ userId }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(DEFAULTS);

  useEffect(() => {
    const saved = localStorage.getItem("closet-theme");
    if (saved) {
      const t = JSON.parse(saved);
      setTheme(t);
      applyTheme(t);
    }
  }, []);

  async function saveTheme(t) {
    setTheme(t);
    applyTheme(t);
    localStorage.setItem("closet-theme", JSON.stringify(t));
    if (userId) {
      await supabase.from("user_settings").upsert({
        user_id: userId,
        chrome_color: t.chrome,
        accent_color: t.accent,
        accent2_color: t.accent2,
        updated_at: new Date().toISOString(),
      });
    }
  }

  return (
    <div className="relative">
      <button className="btn btn-ghost text-sm" onClick={() => setOpen((o) => !o)}>
        🎨 theme
      </button>
      {open && (
        <div className="win absolute right-0 top-10 z-40 w-64 p-3.5">
          <p className="font-semibold text-sm mb-2">customize colors</p>
          <div className="flex flex-col gap-2 mb-3">
            {[
              ["chrome", "window chrome"],
              ["accent", "primary accent"],
              ["accent2", "secondary accent"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between text-xs">
                {label}
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(e) => saveTheme({ ...theme, [key]: e.target.value })}
                  className="w-10 h-7 p-0 border-2 border-[var(--ink)] rounded"
                />
              </label>
            ))}
          </div>
          <p className="font-semibold text-sm mb-1.5">presets</p>
          <div className="flex flex-col gap-1">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => saveTheme(p)} className="btn btn-ghost text-xs justify-start flex items-center gap-2">
                <span className="flex gap-0.5">
                  <span className="w-3 h-3 rounded-full border border-[var(--ink)]" style={{ background: p.chrome }} />
                  <span className="w-3 h-3 rounded-full border border-[var(--ink)]" style={{ background: p.accent }} />
                  <span className="w-3 h-3 rounded-full border border-[var(--ink)]" style={{ background: p.accent2 }} />
                </span>
                {p.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
