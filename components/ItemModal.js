"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { CATEGORIES, STATUSES, LOCATIONS, FORMALITY } from "@/lib/constants";

const empty = {
  name: "",
  category: "shirt",
  status: "own",
  location: "home",
  color: "",
  formality: "casual",
  tags: "",
  style: "",
  price: "",
  source_url: "",
  notes: "",
  image_url: "",
};

export default function ItemModal({ userId, initial, onClose, onSaved }) {
  const supabase = createClient();
  const [form, setForm] = useState(
    initial
      ? {
          ...initial,
          tags: (initial.tags || []).join(", "),
          style: (initial.style || []).join(", "),
          price: initial.price ?? "",
        }
      : empty
  );
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(initial?.image_url || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      let image_url = form.image_url || null;

      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("closet-images").upload(path, file, {
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("closet-images").getPublicUrl(path);
        image_url = data.publicUrl;
      }

      const payload = {
        user_id: userId,
        name: form.name.trim(),
        category: form.category,
        status: form.status,
        location: form.location,
        color: form.color || null,
        formality: form.formality || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        style: form.style ? form.style.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) : [],
        price: form.price ? parseFloat(form.price) : null,
        source_url: form.source_url || null,
        notes: form.notes || null,
        image_url,
      };

      if (initial?.id) {
        const { error } = await supabase.from("items").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("items").insert(payload);
        if (error) throw error;
      }

      onSaved();
    } catch (err) {
      setError(err.message || "Couldn't save this item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="win w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="win-titlebar sticky top-0 z-10">
          <span className="win-dot" style={{ background: "#ff6161" }} onClick={onClose} />
          <span className="win-dot" style={{ background: "#ffd166" }} />
          <span className="win-dot" style={{ background: "#8ee08e" }} />
          <div className="win-addressbar">closet://{initial ? "edit-item" : "new-item"}</div>
          <button onClick={onClose} className="chrome-font text-xl px-1">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-3">
          <div className="flex gap-3 items-start">
            <label className="w-24 h-32 shrink-0 border-2 border-dashed border-[var(--ink-soft)] rounded-md flex items-center justify-center overflow-hidden bg-[var(--paper)] cursor-pointer text-xs text-center text-[var(--ink-soft)]">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                "add photo"
              )}
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>

            <div className="flex-1 flex flex-col gap-2">
              <label className="text-sm font-medium">
                Name
                <input required value={form.name} onChange={(e) => update("name", e.target.value)} className="w-full mt-1" placeholder="cropped baby tee" />
              </label>
              <label className="text-sm font-medium">
                Image / product link (optional)
                <input value={form.source_url} onChange={(e) => update("source_url", e.target.value)} className="w-full mt-1" placeholder="paste a Google Images / shop link" />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm font-medium">
              Category
              <select value={form.category} onChange={(e) => update("category", e.target.value)} className="w-full mt-1">
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Status
              <select value={form.status} onChange={(e) => update("status", e.target.value)} className="w-full mt-1">
                {STATUSES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Location
              <select value={form.location} onChange={(e) => update("location", e.target.value)} className="w-full mt-1">
                {LOCATIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Formality
              <select value={form.formality} onChange={(e) => update("formality", e.target.value)} className="w-full mt-1">
                {FORMALITY.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium">
              Color
              <input value={form.color} onChange={(e) => update("color", e.target.value)} className="w-full mt-1" placeholder="sage green" />
            </label>
            <label className="text-sm font-medium">
              Price ($)
              <input type="number" step="0.01" value={form.price} onChange={(e) => update("price", e.target.value)} className="w-full mt-1" placeholder="24.99" />
            </label>
          </div>

          <label className="text-sm font-medium">
            Tags (comma separated — city names, vibes, whatever you'd search)
            <input value={form.tags} onChange={(e) => update("tags", e.target.value)} className="w-full mt-1" placeholder="paris, thrifted, comfy" />
          </label>
          <label className="text-sm font-medium">
            Style (comma separated)
            <input value={form.style} onChange={(e) => update("style", e.target.value)} className="w-full mt-1" placeholder="streetwear, y2k" />
          </label>
          <label className="text-sm font-medium">
            Notes
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} className="w-full mt-1" rows={2} placeholder="bought in Tokyo, runs small..." />
          </label>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" disabled={saving} className="btn btn-accent">
              {saving ? "saving..." : initial ? "Save changes" : "Add to closet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
