"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import AuthGate from "@/components/AuthGate";
import Sidebar from "@/components/Sidebar";
import ItemCard from "@/components/ItemCard";
import ItemModal from "@/components/ItemModal";
import ThemeSettings from "@/components/ThemeSettings";
import { CATEGORIES, FORGOTTEN_DAYS } from "@/lib/constants";

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

function ClosetApp({ session }) {
  const supabase = createClient();
  const userId = session.user.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [filters, setFilters] = useState({
    status: "own",
    locations: [],
    tags: [],
    formality: "",
    search: "",
    favoritesOnly: false,
    forgottenOnly: false,
  });

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadItems();
  }, []);

  const allTags = useMemo(() => {
    const s = new Set();
    items.forEach((i) => (i.tags || []).forEach((t) => s.add(t)));
    return Array.from(s).sort();
  }, [items]);

  const counts = useMemo(() => {
    const status = {};
    items.forEach((i) => (status[i.status] = (status[i.status] || 0) + 1));
    return { status };
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (filters.status !== "all" && item.status !== filters.status) return false;
      if (filters.locations.length && !filters.locations.includes(item.location)) return false;
      if (filters.formality && item.formality !== filters.formality) return false;
      if (filters.tags.length && !filters.tags.every((t) => item.tags?.includes(t))) return false;
      if (filters.favoritesOnly && !item.is_favorite) return false;
      if (filters.forgottenOnly) {
        const since = daysSince(item.last_worn_date);
        if (!(item.times_worn > 0 && since !== null && since >= FORGOTTEN_DAYS)) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = [item.name, item.color, item.notes, ...(item.tags || []), ...(item.style || [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, category, filters]);

  async function markWorn(item) {
    const { error } = await supabase.rpc("mark_worn", { p_item_id: item.id });
    if (!error) loadItems();
  }

  async function toggleFavorite(item) {
    await supabase.from("items").update({ is_favorite: !item.is_favorite }).eq("id", item.id);
    loadItems();
  }

  async function deleteItem(item) {
    if (!confirm(`Remove "${item.name}" from your closet?`)) return;
    await supabase.from("items").delete().eq("id", item.id);
    loadItems();
  }

  function editItem(item) {
    setEditingItem(item);
    setModalOpen(true);
  }

  const ownedCount = items.filter((i) => i.status === "own").length;
  const wishlistCount = items.filter((i) => i.status === "want").length;
  const totalSpent = items.filter((i) => i.status === "own" && i.price).reduce((sum, i) => sum + Number(i.price), 0);
  const forgottenCount = items.filter((i) => {
    const since = daysSince(i.last_worn_date);
    return i.status === "own" && i.times_worn > 0 && since !== null && since >= FORGOTTEN_DAYS;
  }).length;

  return (
    <div className="min-h-screen p-4 relative z-10 max-w-[1400px] mx-auto flex flex-col gap-4">
      {/* Top browser window: title + tabs + stats */}
      <div className="win">
        <div className="win-titlebar">
          <span className="win-dot" style={{ background: "#ff6161" }} />
          <span className="win-dot" style={{ background: "#ffd166" }} />
          <span className="win-dot" style={{ background: "#8ee08e" }} />
          <div className="win-addressbar">closet://home/{session.user.email}</div>
          <ThemeSettings userId={userId} />
          <button
            className="btn btn-ghost text-sm"
            onClick={async () => {
              await supabase.auth.signOut();
            }}
          >
            log out
          </button>
        </div>

        <div className="p-3.5 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="display text-2xl font-bold">closet.exe</h1>
            <button
              className="btn btn-accent"
              onClick={() => {
                setEditingItem(null);
                setModalOpen(true);
              }}
            >
              + add item
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setCategory("all")} className={`pill ${category === "all" ? "pill-active" : ""}`}>
              all
            </button>
            {CATEGORIES.map((c) => (
              <button key={c.value} onClick={() => setCategory(c.value)} className={`pill ${category === c.value ? "pill-active" : ""}`}>
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-[var(--ink-soft)] chrome-font text-sm pt-1 border-t border-[var(--ink)]/15">
            <span>owned: {ownedCount}</span>
            <span>wishlist: {wishlistCount}</span>
            <span>spent: ${totalSpent.toFixed(2)}</span>
            {forgottenCount > 0 && <span style={{ color: "var(--danger)" }}>! {forgottenCount} forgotten fit{forgottenCount > 1 ? "s" : ""}</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <Sidebar filters={filters} setFilters={setFilters} allTags={allTags} counts={counts} />

        <div className="flex-1 w-full">
          {loading ? (
            <p className="chrome-font text-xl p-6 text-center">loading your closet...</p>
          ) : filtered.length === 0 ? (
            <div className="win p-10 text-center text-[var(--ink-soft)]">
              <p className="chrome-font text-xl mb-1">404 — nothing here yet</p>
              <p className="text-sm">Try clearing filters, or add something new.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filtered.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onWear={markWorn}
                  onEdit={editItem}
                  onToggleFavorite={toggleFavorite}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <ItemModal
          userId={userId}
          initial={editingItem}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            loadItems();
          }}
        />
      )}
    </div>
  );
}

export default function Page() {
  const supabase = createClient();
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return <AuthGate>{session && <ClosetApp session={session} />}</AuthGate>;
}
