export const CATEGORIES = [
  { value: "shirt", label: "Shirts" },
  { value: "pants", label: "Pants" },
  { value: "shorts", label: "Shorts" },
  { value: "skirt", label: "Skirts" },
  { value: "outerwear", label: "Outerwear" },
  { value: "shoes", label: "Shoes" },
  { value: "bag", label: "Bags" },
  { value: "jewelry", label: "Jewelry" },
  { value: "accessory", label: "Accessories" },
  { value: "other", label: "Other" },
];

export const STATUSES = [
  { value: "own", label: "Own it" },
  { value: "want", label: "Wishlist" },
  { value: "seen", label: "Just seen" },
];

export const LOCATIONS = [
  { value: "home", label: "Home closet" },
  { value: "dorm", label: "Dorm" },
  { value: "hamper", label: "Hamper" },
  { value: "laundry", label: "In laundry" },
  { value: "storage", label: "Seasonal storage" },
];

export const FORMALITY = [
  { value: "casual", label: "Casual" },
  { value: "business_casual", label: "Business casual" },
  { value: "formal", label: "Formal" },
];

export const FORGOTTEN_DAYS = 30; // "forgotten fit" threshold
export const REPEAT_WARNING_DAYS = 14; // don't repeat within this window

// Outfit-builder slot categories — single-select except jewelry, which is multi-select.
export const OUTFIT_SLOTS = [
  { key: "top", label: "Top", categories: ["shirt"], multi: false, required: true },
  { key: "bottom", label: "Bottom", categories: ["pants", "shorts", "skirt"], multi: false, required: true },
  { key: "shoes", label: "Shoes", categories: ["shoes"], multi: false, required: true },
  { key: "bag", label: "Bag", categories: ["bag"], multi: false, required: false },
  { key: "jewelry", label: "Jewelry", categories: ["jewelry"], multi: true, required: false },
];

// Merge a user's saved custom options (from user_settings) into a base list,
// de-duping on value. Custom entries are stored as [{ value, label }, ...].
export function mergeOptions(base, custom) {
  if (!custom || custom.length === 0) return base;
  const seen = new Set(base.map((o) => o.value));
  const extra = custom.filter((o) => o?.value && !seen.has(o.value));
  return [...base, ...extra];
}

// Turn a free-typed label into a safe `value` slug for storage.
export function slugify(label) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
