"use client";

import { FORGOTTEN_DAYS, REPEAT_WARNING_DAYS } from "@/lib/constants";

function daysSince(dateStr) {
  if (!dateStr) return null;
  const then = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export default function ItemCard({ item, onWear, onEdit, onToggleFavorite, onDelete }) {
  const since = daysSince(item.last_worn_date);
  const isForgotten = item.status === "own" && item.times_worn > 0 && since !== null && since >= FORGOTTEN_DAYS;
  const isRecentlyWorn = item.status === "own" && since !== null && since < REPEAT_WARNING_DAYS;
  const costPerWear =
    item.price && item.times_worn > 0 ? (item.price / item.times_worn).toFixed(2) : item.price ? item.price.toFixed(2) : null;

  return (
    <div className="item-card flex flex-col">
      <div className="relative aspect-[3/4] bg-[var(--paper)] border-b-2 border-[var(--ink)] overflow-hidden">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center chrome-font text-4xl text-[var(--ink-soft)]">
            no image.png
          </div>
        )}

        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start">
          {isForgotten && <span className="pill" style={{ background: "#ffd166" }}>! forgotten fit</span>}
          {isRecentlyWorn && <span className="pill" style={{ background: "#ffb4c6" }}>worn {since}d ago</span>}
          {item.is_borrowed && <span className="pill" style={{ background: "#b8d4ff" }}>borrowed out</span>}
        </div>

        <button
          onClick={() => onToggleFavorite(item)}
          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full border-2 border-[var(--ink)] flex items-center justify-center"
          style={{ background: item.is_favorite ? "var(--accent)" : "var(--card)" }}
          title="Favorite"
        >
          {item.is_favorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <div className="flex items-start justify-between gap-1">
          <h3 className="font-semibold text-sm leading-tight">{item.name}</h3>
          <span className="pill text-[10px] shrink-0">{item.location}</span>
        </div>

        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((t) => (
              <span key={t} className="pill text-[10px]">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-[var(--ink-soft)] mt-auto pt-1">
          <span>worn {item.times_worn}x</span>
          {costPerWear && <span>${costPerWear}/wear</span>}
        </div>

        <div className="flex gap-1.5 mt-1">
          {item.status === "own" && (
            <button onClick={() => onWear(item)} className="btn btn-accent-2 text-[11px] py-1 px-2.5 flex-1">
              mark worn today
            </button>
          )}
          <button onClick={() => onEdit(item)} className="btn btn-ghost text-[11px] py-1 px-2.5">
            edit
          </button>
          <button onClick={() => onDelete(item)} className="btn btn-ghost text-[11px] py-1 px-2.5" style={{ color: "var(--danger)" }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
