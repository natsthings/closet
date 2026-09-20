"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import AuthGate from "@/components/AuthGate";
import Sidebar from "@/components/Sidebar";
import ItemCard from "@/components/ItemCard";
import ItemModal from "@/components/ItemModal";
import ThemeSettings from "@/components/ThemeSettings";
import CustomOptionsManager from "@/components/CustomOptionsManager";
import OutfitBuilder from "@/components/OutfitBuilder";
import { CATEGORIES, LOCATIONS, FORMALITY, mergeOptions } from "@/lib/constants";

function ClosetApp({ session }) {
  const supabase = createClient();
  const userId = session.user.id;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [outfitOpen, setOutfitOpen] = useState(false);

  const [customOptions, setCustomOptions] = useState({ categories: [], locations: [], formality: [] });

  const [filters, setFilters] = useState({
    status: "own",
    locations: [],
    tags: [],
    formality: "",
    search: "",
    favoritesOnly: false,
  });

  async function loadItems() {
    setLoading(true);
    const { data, error } = await supabase.from("items").select("*").order("created_at", { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  }

  async function loadSettings() {
    const { data } = await supabase.from("user_settings").select("*").eq("user_id", userId).maybeSingle();
    if (data) {
      setCustomOptions({
        categories: data.custom_categories || [],
        locations: data.custom_locations || [],
        formality: data.custom_formality || [],
      });
    }
  }

  useEffect(() => {
    loadItems();
    loadSettings();
  }, []);

  const categories = useMemo(() => mergeOptions(CATEGORIES, customOptions.categories), [customOptions.categories]);
  const locations = useMemo(() => mergeOptions(LOCATIONS, customOptions.locations), [customOptions.locations]);
  const formalityOptions = useMemo(() => mergeOptions(FORMALITY, customOptions.formality), [customOptions.formality]);

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
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = [item.name, item.color, item.notes, item.size, ...(item.tags || []), ...(item.style || [])].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, category, filters]);

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

  return (
    <div className="min-h-screen p-4 relative z-10 max-w-[1400px] mx-auto flex flex-col gap-4">
      {/* Top browser window: title + tabs + stats */}
      <div className="win">
        <div className="win-titlebar flex-wrap">
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
            <div className="flex gap-2 flex-wrap">
              <button className="btn btn-ghost" onClick={() => setOptionsOpen(true)}>
                ⚙ manage options
              </button>
              <button className="btn btn-accent-2" onClick={() => setOutfitOpen(true)}>
                👗 make an outfit
              </button>
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
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => setCategory("all")} className={`pill ${category === "all" ? "pill-active" : ""}`}>
              all
            </button>
            {categories.map((c) => (
              <button key={c.value} onClick={() => setCategory(c.value)} className={`pill ${category === c.value ? "pill-active" : ""}`}>
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 text-xs text-[var(--ink-soft)] chrome-font text-sm pt-1 border-t border-[var(--ink)]/15">
            <span>owned: {ownedCount}</span>
            <span>wishlist: {wishlistCount}</span>
            <span>spent: ${totalSpent.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <Sidebar
          filters={filters}
          setFilters={setFilters}
          allTags={allTags}
          counts={counts}
          locations={locations}
          formalityOptions={formalityOptions}
        />

        <div className="flex-1 w-full min-w-0">
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
          categories={categories}
          locations={locations}
          formalityOptions={formalityOptions}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            loadItems();
          }}
        />
      )}

      {optionsOpen && (
        <CustomOptionsManager
          userId={userId}
          customOptions={customOptions}
          onChange={setCustomOptions}
          onClose={() => setOptionsOpen(false)}
        />
      )}

      {outfitOpen && <OutfitBuilder items={items} onClose={() => setOutfitOpen(false)} />}
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
