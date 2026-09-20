"use client";

import { useMemo, useRef, useState } from "react";
import { OUTFIT_SLOTS } from "@/lib/constants";

const BOARD_W = 480;
const BOARD_H = 560;
const BOX = { top: 130, bottom: 130, shoes: 100, bag: 100, jewelry: 80 };

function defaultLayout(selections) {
  // Simple non-overlapping starting layout — user can drag from here.
  const pos = {};
  let jx = 16;
  selections.jewelry.forEach((id) => {
    pos[id] = { x: jx, y: 16 };
    jx += BOX.jewelry + 12;
  });
  if (selections.top) pos[selections.top] = { x: BOARD_W / 2 - BOX.top / 2, y: 110 };
  if (selections.bag) pos[selections.bag] = { x: 16, y: 260 };
  if (selections.bottom) pos[selections.bottom] = { x: selections.bag ? BOARD_W - BOX.bottom - 16 : BOARD_W / 2 - BOX.bottom / 2, y: 260 };
  if (selections.shoes) pos[selections.shoes] = { x: BOARD_W / 2 - BOX.shoes / 2, y: 420 };
  return pos;
}

function Thumb({ item }) {
  return item?.image_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.image_url} alt={item.name} className="w-full h-full object-contain pointer-events-none" draggable={false} />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-center text-[10px] text-[var(--ink-soft)] p-1 pointer-events-none">
      {item?.name || "no image"}
    </div>
  );
}

function PickerGrid({ pool, selectedIds, onToggle }) {
  if (pool.length === 0) return <p className="text-[11px] text-[var(--ink-soft)]">nothing here yet</p>;
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {pool.map((i) => {
        const active = selectedIds.includes(i.id);
        return (
          <button
            key={i.id}
            onClick={() => onToggle(i.id)}
            title={i.name}
            className="aspect-square rounded-md overflow-hidden border-2"
            style={{
              borderColor: active ? "var(--accent)" : "var(--ink)",
              boxShadow: active ? "0 0 0 2px var(--accent)" : "none",
              background: "var(--paper)",
            }}
          >
            <Thumb item={i} />
          </button>
        );
      })}
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
  const [positions, setPositions] = useState({});

  const boardRef = useRef(null);
  const dragRef = useRef(null); // { key, offsetX, offsetY, boxW, boxH }

  function findItem(id) {
    return ownedItems.find((i) => i.id === id) || null;
  }

  function ensurePosition(key) {
    setPositions((p) => {
      if (p[key]) return p;
      const layout = defaultLayout(selections);
      return { ...p, [key]: layout[key] || { x: 16, y: 16 } };
    });
  }

  function selectSingle(slotKey, itemId) {
    setSelections((s) => {
      const prevId = s[slotKey];
      const next = { ...s, [slotKey]: s[slotKey] === itemId ? "" : itemId };
      if (prevId && prevId !== next[slotKey]) {
        setPositions((p) => {
          const copy = { ...p };
          delete copy[prevId];
          return copy;
        });
      }
      return next;
    });
  }

  function toggleJewelry(itemId) {
    setSelections((s) => {
      const has = s.jewelry.includes(itemId);
      if (has) {
        setPositions((p) => {
          const copy = { ...p };
          delete copy[itemId];
          return copy;
        });
      }
      return { ...s, jewelry: has ? s.jewelry.filter((id) => id !== itemId) : [...s.jewelry, itemId] };
    });
  }

  // --- dragging ---
  function startDrag(e, key, boxSize) {
    ensurePosition(key);
    const point = "touches" in e ? e.touches[0] : e;
    const current = positions[key] || defaultLayout(selections)[key] || { x: 16, y: 16 };
    dragRef.current = {
      key,
      boxSize,
      startX: point.clientX,
      startY: point.clientY,
      origX: current.x,
      origY: current.y,
    };
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onDrag, { passive: false });
    window.addEventListener("touchend", endDrag);
  }

  function onDrag(e) {
    if (!dragRef.current) return;
    e.preventDefault?.();
    const point = "touches" in e ? e.touches[0] : e;
    const { key, boxSize, startX, startY, origX, origY } = dragRef.current;
    const dx = point.clientX - startX;
    const dy = point.clientY - startY;
    const maxX = BOARD_W - boxSize;
    const maxY = BOARD_H - boxSize;
    const x = Math.min(Math.max(origX + dx, 0), Math.max(maxX, 0));
    const y = Math.min(Math.max(origY + dy, 0), Math.max(maxY, 0));
    setPositions((p) => ({ ...p, [key]: { x, y } }));
  }

  function endDrag() {
    dragRef.current = null;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", endDrag);
    window.removeEventListener("touchmove", onDrag);
    window.removeEventListener("touchend", endDrag);
  }

  const boardItems = [];
  const top = findItem(selections.top);
  const bottom = findItem(selections.bottom);
  const shoes = findItem(selections.shoes);
  const bag = findItem(selections.bag);
  if (top) boardItems.push({ key: "top", item: top, size: BOX.top });
  if (bottom) boardItems.push({ key: "bottom", item: bottom, size: BOX.bottom });
  if (shoes) boardItems.push({ key: "shoes", item: shoes, size: BOX.shoes });
  if (bag) boardItems.push({ key: "bag", item: bag, size: BOX.bag });
  selections.jewelry.forEach((id) => {
    const j = findItem(id);
    if (j) boardItems.push({ key: id, item: j, size: BOX.jewelry });
  });

  const hasAnything = boardItems.length > 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="win w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="win-titlebar sticky top-0 z-10">
          <span className="win-dot" style={{ background: "#ff6161" }} />
          <span className="win-dot" style={{ background: "#ffd166" }} />
          <span className="win-dot" style={{ background: "#8ee08e" }} />
          <div className="win-addressbar">closet://dressing-room</div>
          <button onClick={onClose} className="chrome-font text-xl px-1">✕</button>
        </div>

        <div className="p-4 flex flex-col md:flex-row gap-4">
          {/* Picker panel — image thumbnails, click to select/deselect */}
          <div className="md:w-64 shrink-0 flex flex-col gap-3">
            <h2 className="display font-bold text-lg">build a fit</h2>
            <p className="text-[11px] text-[var(--ink-soft)] -mt-2">tap to pick, drag on the board to arrange</p>

            {OUTFIT_SLOTS.filter((s) => !s.multi).map((slot) => (
              <div key={slot.key}>
                <p className="text-sm font-medium mb-1">
                  {slot.label} {!slot.required && <span className="text-[var(--ink-soft)] font-normal">(optional)</span>}
                </p>
                <PickerGrid
                  pool={poolBySlot[slot.key]}
                  selectedIds={selections[slot.key] ? [selections[slot.key]] : []}
                  onToggle={(id) => selectSingle(slot.key, id)}
                />
              </div>
            ))}

            <div>
              <p className="text-sm font-medium mb-1">Jewelry <span className="text-[var(--ink-soft)] font-normal">(any amount)</span></p>
              <PickerGrid pool={poolBySlot.jewelry} selectedIds={selections.jewelry} onToggle={toggleJewelry} />
            </div>

            <button
              className="btn btn-ghost text-xs mt-1"
              onClick={() => {
                setSelections({ top: "", bottom: "", shoes: "", bag: "", jewelry: [] });
                setPositions({});
              }}
            >
              clear all
            </button>
          </div>

          {/* Drag-and-drop board */}
          <div className="flex-1 flex justify-center">
            <div
              ref={boardRef}
              className="relative win !shadow-none bg-[var(--paper)] overflow-hidden shrink-0"
              style={{ width: BOARD_W, height: BOARD_H, maxWidth: "100%" }}
            >
              {!hasAnything && (
                <div className="absolute inset-0 flex items-center justify-center text-center text-[var(--ink-soft)] chrome-font text-lg px-6">
                  pick some pieces on the left — they&apos;ll show up here to drag around
                </div>
              )}

              {boardItems.map(({ key, item, size }) => {
                const pos = positions[key] || defaultLayout(selections)[key] || { x: 16, y: 16 };
                return (
                  <div
                    key={key}
                    onMouseDown={(e) => startDrag(e, key, size)}
                    onTouchStart={(e) => startDrag(e, key, size)}
                    className="absolute win cursor-grab active:cursor-grabbing select-none"
                    style={{ left: pos.x, top: pos.y, width: size, height: size, touchAction: "none" }}
                  >
                    <Thumb item={item} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
