"use client";

import { useMemo, useRef, useState } from "react";
import { OUTFIT_SLOTS } from "@/lib/constants";

const BOARD_W = 480;
const BOARD_H = 560;
const MIN_SIZE = 36;
const MAX_SIZE = 320;

// default starting width/height per slot type — user can resize freely after
const DEFAULT_DIMS = {
  top: { w: 130, h: 160 },
  bottom: { w: 120, h: 170 },
  shoes: { w: 120, h: 80 },
  bag: { w: 100, h: 100 },
  jewelry: { w: 70, h: 70 },
};

function defaultLayout(selections) {
  const pos = {};
  let jx = 16;
  selections.jewelry.forEach((id) => {
    const d = DEFAULT_DIMS.jewelry;
    pos[id] = { x: jx, y: 16, w: d.w, h: d.h };
    jx += d.w + 12;
  });
  if (selections.top) {
    const d = DEFAULT_DIMS.top;
    pos[selections.top] = { x: BOARD_W / 2 - d.w / 2, y: 110, w: d.w, h: d.h };
  }
  if (selections.bag) {
    const d = DEFAULT_DIMS.bag;
    pos[selections.bag] = { x: 16, y: 280, w: d.w, h: d.h };
  }
  if (selections.bottom) {
    const d = DEFAULT_DIMS.bottom;
    pos[selections.bottom] = { x: selections.bag ? BOARD_W - d.w - 16 : BOARD_W / 2 - d.w / 2, y: 280, w: d.w, h: d.h };
  }
  if (selections.shoes) {
    const d = DEFAULT_DIMS.shoes;
    pos[selections.shoes] = { x: BOARD_W / 2 - d.w / 2, y: 460, w: d.w, h: d.h };
  }
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
  const dragRef = useRef(null); // move drag: { key, startX, startY, origX, origY, w, h }
  const resizeRef = useRef(null); // resize drag: { key, startX, startY, startW, startH }

  function findItem(id) {
    return ownedItems.find((i) => i.id === id) || null;
  }

  function currentPos(key) {
    return positions[key] || defaultLayout(selections)[key] || { x: 16, y: 16, ...DEFAULT_DIMS.jewelry };
  }

  function ensurePosition(key) {
    setPositions((p) => {
      if (p[key]) return p;
      const layout = defaultLayout(selections);
      return { ...p, [key]: layout[key] || { x: 16, y: 16, ...DEFAULT_DIMS.jewelry } };
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

  // --- move ---
  function startDrag(e, key) {
    ensurePosition(key);
    const point = "touches" in e ? e.touches[0] : e;
    const current = currentPos(key);
    dragRef.current = { key, startX: point.clientX, startY: point.clientY, origX: current.x, origY: current.y, w: current.w, h: current.h };
    window.addEventListener("mousemove", onDrag);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onDrag, { passive: false });
    window.addEventListener("touchend", endDrag);
  }

  function onDrag(e) {
    if (!dragRef.current) return;
    e.preventDefault?.();
    const point = "touches" in e ? e.touches[0] : e;
    const { key, startX, startY, origX, origY, w, h } = dragRef.current;
    const dx = point.clientX - startX;
    const dy = point.clientY - startY;
    const x = Math.min(Math.max(origX + dx, 0), Math.max(BOARD_W - w, 0));
    const y = Math.min(Math.max(origY + dy, 0), Math.max(BOARD_H - h, 0));
    setPositions((p) => ({ ...p, [key]: { ...p[key], x, y, w, h } }));
  }

  function endDrag() {
    dragRef.current = null;
    window.removeEventListener("mousemove", onDrag);
    window.removeEventListener("mouseup", endDrag);
    window.removeEventListener("touchmove", onDrag);
    window.removeEventListener("touchend", endDrag);
  }

  // --- resize ---
  function startResize(e, key) {
    e.stopPropagation();
    ensurePosition(key);
    const point = "touches" in e ? e.touches[0] : e;
    const current = currentPos(key);
    resizeRef.current = { key, startX: point.clientX, startY: point.clientY, startW: current.w, startH: current.h, x: current.x, y: current.y };
    window.addEventListener("mousemove", onResize);
    window.addEventListener("mouseup", endResize);
    window.addEventListener("touchmove", onResize, { passive: false });
    window.addEventListener("touchend", endResize);
  }

  function onResize(e) {
    if (!resizeRef.current) return;
    e.preventDefault?.();
    const point = "touches" in e ? e.touches[0] : e;
    const { key, startX, startY, startW, startH, x, y } = resizeRef.current;
    const dx = point.clientX - startX;
    const dy = point.clientY - startY;
    const w = Math.min(Math.max(startW + dx, MIN_SIZE), MAX_SIZE);
    const h = Math.min(Math.max(startH + dy, MIN_SIZE), MAX_SIZE);
    setPositions((p) => ({ ...p, [key]: { ...p[key], x, y, w, h } }));
  }

  function endResize() {
    resizeRef.current = null;
    window.removeEventListener("mousemove", onResize);
    window.removeEventListener("mouseup", endResize);
    window.removeEventListener("touchmove", onResize);
    window.removeEventListener("touchend", endResize);
  }

  const boardItems = [];
  const top = findItem(selections.top);
  const bottom = findItem(selections.bottom);
  const shoes = findItem(selections.shoes);
  const bag = findItem(selections.bag);
  if (top) boardItems.push({ key: "top", item: top });
  if (bottom) boardItems.push({ key: "bottom", item: bottom });
  if (shoes) boardItems.push({ key: "shoes", item: shoes });
  if (bag) boardItems.push({ key: "bag", item: bag });
  selections.jewelry.forEach((id) => {
    const j = findItem(id);
    if (j) boardItems.push({ key: id, item: j });
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
            <p className="text-[11px] text-[var(--ink-soft)] -mt-2">tap to pick · drag to move · drag the corner dot to resize</p>

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

          {/* Drag-and-drop, resizable board — images sit borderless right on the paper */}
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

              {boardItems.map(({ key, item }) => {
                const pos = currentPos(key);
                return (
                  <div
                    key={key}
                    onMouseDown={(e) => startDrag(e, key)}
                    onTouchStart={(e) => startDrag(e, key)}
                    className="absolute cursor-grab active:cursor-grabbing select-none group"
                    style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h, touchAction: "none" }}
                  >
                    <Thumb item={item} />
                    <div
                      onMouseDown={(e) => startResize(e, key)}
                      onTouchStart={(e) => startResize(e, key)}
                      className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 opacity-0 group-hover:opacity-100"
                      style={{
                        background: "var(--accent)",
                        borderColor: "var(--ink)",
                        cursor: "nwse-resize",
                        touchAction: "none",
                        transform: "translate(30%, 30%)",
                      }}
                    />
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
