import { useEffect, useMemo, useState } from "react";
import { MenuCategory, OrderItemType } from "@snb/shared";
import { useApi } from "../hooks/useApi";
import { CartActionButton } from "../components/CartActionButton";
import { Highlight } from "../components/Highlight";

const CREAM = "#FBF6EA";
const FOREST = "#1E3D2F";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";
const MUSTARD = "#F5C97F";

type Item = {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  calories: number;
  benefits: string[];
  price: string;
  isAvailable: boolean;
  imageUrl: string | null;
};

type Filter = "all" | MenuCategory;

const FILTERS: { v: Filter; label: string }[] = [
  { v: "all", label: "All" },
  { v: MenuCategory.Shake, label: "Shakes" },
  { v: MenuCategory.Snack, label: "Snacks" },
];

function peso(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function MenuPage() {
  const api = useApi();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get<Item[]>("/menu").then(setItems).catch(() => setItems([]));
  }, [api]);

  const visible = useMemo(() => {
    const byCategory = filter === "all" ? items : items.filter((i) => i.category === filter);
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.benefits.some((b) => b.toLowerCase().includes(q)),
    );
  }, [items, filter, query]);

  // Pick a hero item for the editorial banner — first shake if available.
  const hero = useMemo(
    () => items.find((i) => i.category === MenuCategory.Shake && i.imageUrl) ?? items[0],
    [items],
  );

  return (
    <section className="py-8" style={{ color: FOREST }}>
      {/* ============ Hero banner ============ */}
      <div
        className="rounded-3xl overflow-hidden mb-10 relative grid md:grid-cols-2 gap-6 items-center"
        style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}
      >
        <div className="p-8 md:p-12">
          <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
            crafted fresh, daily —
          </p>
          <h1 className="font-display text-4xl md:text-6xl leading-[0.95]" style={{ color: FOREST }}>
            THE SIP 'N BITE<br />MENU
          </h1>
          <p className="text-stone-600 mt-4 max-w-md leading-relaxed">
            Premium and classic Herbalife shakes, snacks, and high-protein meals.
            Pickup or delivery — your call.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-bold uppercase tracking-widest" style={{ backgroundColor: MUSTARD, color: FOREST }}>
              22 oz Premium
            </span>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-bold uppercase tracking-widest" style={{ backgroundColor: PEACH_SOFT, color: FOREST }}>
              19 Vitamins & Minerals
            </span>
            <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-bold uppercase tracking-widest border" style={{ borderColor: FOREST, color: FOREST }}>
              Low Glycemic
            </span>
          </div>
        </div>
        <div className="relative aspect-[5/4] md:aspect-auto md:h-full" style={{ backgroundColor: "#E9EAD8" }}>
          <img
            src={`${import.meta.env.VITE_API_URL}/uploads/menu/hero.jpg`}
            alt="Sip 'N Bite menu hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

      {/* ============ Filter bar ============ */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="inline-flex p-1 rounded-full" style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}>
          {FILTERS.map((f) => {
            const active = filter === f.v;
            return (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition"
                style={{
                  backgroundColor: active ? PEACH : "transparent",
                  color: FOREST,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 flex-1 md:flex-none md:min-w-[280px] justify-end">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 flex-1 md:w-72"
            style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
          >
            <span className="text-stone-400">🔍</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shakes, snacks, flavors…"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-stone-400"
              style={{ color: FOREST }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-stone-400 hover:text-stone-600 text-sm"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-xs uppercase tracking-widest text-stone-500 font-bold whitespace-nowrap">
            {visible.length} {visible.length === 1 ? "item" : "items"}
          </p>
        </div>
      </div>

      {/* ============ Grid ============ */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((item) => {
          const isShake = item.category === MenuCategory.Shake;
          return (
            <article
              key={item.id}
              className="group rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow flex flex-col"
              style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
            >
              {/* image */}
              <div className="relative aspect-square overflow-hidden" style={{ backgroundColor: isShake ? "#E9EAD8" : "#F1ECDC" }}>
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-7xl opacity-70">
                    {isShake ? "🥤" : "🍪"}
                  </div>
                )}

                {/* category pill */}
                <span
                  className="absolute top-3 left-3 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: isShake ? PEACH_SOFT : MUSTARD, color: FOREST }}
                >
                  {item.category}
                </span>

                {/* unavailable overlay */}
                {!item.isAvailable && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(30,61,47,0.55)" }}>
                    <span className="text-white font-display text-2xl tracking-widest">SOLD OUT</span>
                  </div>
                )}

                {/* price tag */}
                <div
                  className="absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-sm font-black shadow-sm"
                  style={{ backgroundColor: "white", color: FOREST }}
                >
                  {peso(Number(item.price))}
                </div>
              </div>

              {/* info */}
              <div className="p-4 flex flex-col flex-1">
                <h3
                  className="font-extrabold leading-snug"
                  style={{ color: FOREST }}
                >
                  <Highlight text={item.name} query={query} />
                </h3>
                <p className="text-xs text-stone-500 mt-1">
                  <Highlight text={item.description} query={query} />
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {item.benefits.slice(0, 3).map((b) => (
                    <span
                      key={b}
                      className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "#F1ECDC", color: FOREST }}
                    >
                      <Highlight text={b} query={query} />
                    </span>
                  ))}
                </div>

                <div className="text-[11px] text-stone-500 mt-2">
                  {item.calories > 0 ? `${item.calories} kcal` : "Mix-to-order"}
                </div>

                <div className="mt-auto pt-3">
                  <CartActionButton
                    fullWidth
                    itemId={item.id}
                    itemType={OrderItemType.Menu}
                    name={item.name}
                    unitPrice={Number(item.price)}
                    imageUrl={item.imageUrl}
                    label="Add to Cart"
                    disabled={!item.isAvailable}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="py-16 text-center text-stone-500">
          {items.length === 0
            ? "No menu items yet. Add them in /admin → Menu."
            : query
              ? `No matches for "${query}".`
              : `No ${filter === "all" ? "items" : filter + "s"} available right now.`}
        </div>
      )}
    </section>
  );
}
