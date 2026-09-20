"use client";

export default function ItemCard({ item, onEdit, onToggleFavorite, onDelete }) {
  return (
    <div className="item-card flex flex-col w-full min-w-0">
      <div className="relative aspect-[3/4] bg-[var(--paper)] border-b-2 border-[var(--ink)] overflow-hidden">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center chrome-font text-4xl text-[var(--ink-soft)]">
            no image.png
          </div>
        )}

        {item.is_borrowed && (
          <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start max-w-[75%]">
            <span className="pill" style={{ background: "#b8d4ff" }}>borrowed out</span>
          </div>
        )}

        <button
          onClick={() => onToggleFavorite(item)}
          className="absolute top-1.5 right-1.5 w-7 h-7 shrink-0 rounded-full border-2 border-[var(--ink)] flex items-center justify-center"
          style={{ background: item.is_favorite ? "var(--accent)" : "var(--card)" }}
          title="Favorite"
        >
          {item.is_favorite ? "♥" : "♡"}
        </button>
      </div>

      <div className="p-2.5 flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight break-words min-w-0">{item.name}</h3>
          <span className="pill text-[10px] shrink-0">{item.location}</span>
        </div>

        {(item.size || item.tags?.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {item.size && <span className="pill text-[10px]">size {item.size}</span>}
            {item.tags?.slice(0, 3).map((t) => (
              <span key={t} className="pill text-[10px]">
                #{t}
              </span>
            ))}
          </div>
        )}

        {item.price != null && (
          <p className="text-[12px] font-semibold text-[var(--ink-soft)] mt-auto pt-1">${Number(item.price).toFixed(2)}</p>
        )}

        <div className="flex items-center gap-1.5 mt-1 w-full justify-end">
          <button
            onClick={() => onEdit(item)}
            className="btn btn-ghost text-[12px] w-7 h-7 shrink-0 !p-0 flex items-center justify-center"
            title="Edit"
          >
            ✎
          </button>
          <button
            onClick={() => onDelete(item)}
            className="btn btn-ghost text-[12px] w-7 h-7 shrink-0 !p-0 flex items-center justify-center"
            style={{ color: "var(--danger)" }}
            title="Delete"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
