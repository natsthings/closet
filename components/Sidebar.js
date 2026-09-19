"use client";

import { LOCATIONS, STATUSES, FORMALITY } from "@/lib/constants";

export default function Sidebar({ filters, setFilters, allTags, counts }) {
  function toggleTag(tag) {
    setFilters((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  function toggleLocation(loc) {
    setFilters((f) => ({
      ...f,
      locations: f.locations.includes(loc) ? f.locations.filter((l) => l !== loc) : [...f.locations, loc],
    }));
  }

  return (
    <aside className="win w-full lg:w-60 shrink-0 h-fit">
      <div className="win-titlebar">
        <span className="win-dot" style={{ background: "#ff6161" }} />
        <span className="win-dot" style={{ background: "#ffd166" }} />
        <span className="win-dot" style={{ background: "#8ee08e" }} />
        <div className="win-addressbar">closet://filters</div>
      </div>

      <div className="p-3.5 flex flex-col gap-4 text-sm">
        <div>
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="search name, tag, color..."
            className="w-full"
          />
        </div>

        <div>
          <p className="font-semibold mb-1.5">Status</p>
          <div className="flex flex-col gap-1">
            {STATUSES.map((s) => (
              <label key={s.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={filters.status === s.value}
                  onChange={() => setFilters((f) => ({ ...f, status: s.value }))}
                />
                {s.label}
                <span className="text-[var(--ink-soft)] ml-auto">{counts.status?.[s.value] || 0}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="status" checked={filters.status === "all"} onChange={() => setFilters((f) => ({ ...f, status: "all" }))} />
              All
            </label>
          </div>
        </div>

        <div>
          <p className="font-semibold mb-1.5">Location</p>
          <div className="flex flex-wrap gap-1.5">
            {LOCATIONS.map((l) => (
              <button
                key={l.value}
                onClick={() => toggleLocation(l.value)}
                className={`pill ${filters.locations.includes(l.value) ? "pill-active" : ""}`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-semibold mb-1.5">Formality</p>
          <div className="flex flex-wrap gap-1.5">
            {FORMALITY.map((f) => (
              <button
                key={f.value}
                onClick={() =>
                  setFilters((old) => ({ ...old, formality: old.formality === f.value ? "" : f.value }))
                }
                className={`pill ${filters.formality === f.value ? "pill-active" : ""}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div>
            <p className="font-semibold mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
              {allTags.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)} className={`pill ${filters.tags.includes(tag) ? "pill-active" : ""}`}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 pt-1 border-t border-[var(--ink)]/15">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={filters.favoritesOnly} onChange={(e) => setFilters((f) => ({ ...f, favoritesOnly: e.target.checked }))} />
            Favorites only
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={filters.forgottenOnly} onChange={(e) => setFilters((f) => ({ ...f, forgottenOnly: e.target.checked }))} />
            Forgotten fits (30d+)
          </label>
        </div>

        {(filters.tags.length > 0 || filters.locations.length > 0 || filters.formality || filters.search || filters.favoritesOnly || filters.forgottenOnly) && (
          <button
            className="btn btn-ghost text-xs"
            onClick={() =>
              setFilters((f) => ({ ...f, tags: [], locations: [], formality: "", search: "", favoritesOnly: false, forgottenOnly: false }))
            }
          >
            clear filters
          </button>
        )}
      </div>
    </aside>
  );
}
