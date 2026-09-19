"use client";

import { useMemo, useState } from "react";
import { OUTFIT_SLOTS } from "@/lib/constants";

function ItemThumb({ item, small }) {
  return item?.image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" />
  ) : (
    <div className={`w-full h-full flex items-center justify-center text-center text-[var(--ink-soft)] chrome-font ${small ? "text-xs p-1" : "text-base p-2"}`}>
      {item ? item.name : "empty"}
    </div>
  );
}

export default function OutfitBuilder({ items, onClose }) {
  const ownedItems = useMemo(() => items.filter((i) => i.status === "own"), [items]);

  const poolBySlot = useMemo(() => {
    const pools = {};
    for (const slot of OUTFIT_SLOTS) {
      pools[slot.key] = ownedItems.filter((i) => slot.categories.includes(i.category));
    }
    return pools;
  }, [ownedItems]);

  const [selections, setSelections] = useState({ top: "", bottom: "", shoes: "", bag: "", jewelry: [] });

  function selectSingle(slotKey, itemId) {
    setSelections((s) => ({ ...s, [slotKey]: itemId }));
  }

  function toggleJewelry(itemId) {
    setSelections((s) => ({
      ...s,
      jewelry: s.jewelry.includes(itemId) ? s.jewelry.filter((id) => id !== itemId) : [...s.jewelry, itemId],
    }));
  }

  function findItem(id) {
    return ownedItems.find((i) => i.id === id) || null;
  }

  const top = findItem(selections.top);
  const bottom = findItem(selections.bottom);
  const shoes = findItem(selections.shoes);
  const bag = findItem(selections.bag);
  const jewelryItems = selections.jewelry.map(findItem).filter(Boolean);

  const hasAnything = top || bottom || shoes || bag || jewelryItems.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="win w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="win-titlebar sticky top-0 z-10">
          <span className="win-dot" style={{ background: "#ff6161" }} />
          <span className="win-dot" style={{ background: "#ffd166" }} />
          <span className="win-dot" style={{ background: "#8ee08e" }} />
          <div className="win-addressbar">closet://dressing-room</div>
          <button onClick={onClose} className="chrome-font text-xl px-1">✕</button>
        </div>

        <div className="p-4 flex flex-col md:flex-row gap-4">
          {/* Picker panel */}
          <div className="md:w-64 shrink-0 flex flex-col gap-3">
            <h2 className="display font-bold text-lg">build a fit</h2>

            {OUTFIT_SLOTS.filter((s) => !s.multi).map((slot) => (
              <label key={slot.key} className="text-sm font-medium block">
                {slot.label} {!slot.required && <span className="text-[var(--ink-soft)] font-normal">(optional)</span>}
                <select
                  value={selections[slot.key]}
                  onChange={(e) => selectSingle(slot.key, e.target.value)}
                  className="w-full mt-1"
                >
                  <option value="">— none —</option>
                  {poolBySlot[slot.key].map((i) => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
                {poolBySlot[slot.key].length === 0 && (
                  <span className="text-[11px] text-[var(--ink-soft)]">no {slot.label.toLowerCase()} in your closet yet</span>
                )}
              </label>
            ))}

            <div>
              <p className="text-sm font-medium mb-1">Jewelry <span className="text-[var(--ink-soft)] font-normal">(any amount)</span></p>
              {poolBySlot.jewelry.length === 0 ? (
                <p className="text-[11px] text-[var(--ink-soft)]">no jewelry in your closet yet</p>
              ) : (
                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
                  {poolBySlot.jewelry.map((i) => (
                    <label key={i.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={selections.jewelry.includes(i.id)} onChange={() => toggleJewelry(i.id)} />
                      {i.name}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button
              className="btn btn-ghost text-xs mt-1"
              onClick={() => setSelections({ top: "", bottom: "", shoes: "", bag: "", jewelry: [] })}
            >
              clear all
            </button>
          </div>

          {/* Layout preview — CSS grid so nothing ever overlaps */}
          <div className="flex-1 win !shadow-none bg-[var(--paper)] p-3">
            {!hasAnything ? (
              <div className="h-80 flex items-center justify-center text-center text-[var(--ink-soft)] chrome-font text-lg">
                pick some pieces to lay out your fit
              </div>
            ) : (
              <div
                className="grid gap-3"
                style={{
                  gridTemplateAreas: bag
                    ? `"jewelry jewelry" "top top" "bag bottom" "shoes shoes"`
                    : `"jewelry jewelry" "top top" "bottom bottom" "shoes shoes"`,
                  gridTemplateColumns: "1fr 1fr",
                }}
              >
                {jewelryItems.length > 0 && (
                  <div style={{ gridArea: "jewelry" }} className="flex flex-wrap gap-2 justify-center">
                    {jewelryItems.map((j) => (
                      <div key={j.id} className="win w-20 h-20 shrink-0">
                        <ItemThumb item={j} small />
                      </div>
                    ))}
                  </div>
                )}

                {top && (
                  <div style={{ gridArea: "top" }} className="win h-48 mx-auto w-40">
                    <ItemThumb item={top} />
                  </div>
                )}

                {bag && (
                  <div style={{ gridArea: "bag" }} className="win h-40">
                    <ItemThumb item={bag} />
                  </div>
                )}

                {bottom && (
                  <div style={{ gridArea: "bottom" }} className="win h-40 mx-auto w-40">
                    <ItemThumb item={bottom} />
                  </div>
                )}

                {shoes && (
                  <div style={{ gridArea: "shoes" }} className="win h-28 mx-auto w-40">
                    <ItemThumb item={shoes} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
