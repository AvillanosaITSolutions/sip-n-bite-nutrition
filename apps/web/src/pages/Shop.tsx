import { useEffect, useMemo, useState } from "react";
import { Fulfillment, OrderItemType } from "@snb/shared";
import { useApi } from "../hooks/useApi";
import { CartActionButton } from "../components/CartActionButton";
import { Highlight } from "../components/Highlight";

const CREAM = "#FBF6EA";
const FOREST = "#1E3D2F";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";

type Product = {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: string;
  stock: number;
  isPreorder: boolean;
  fulfillment: Fulfillment;
  imageUrl: string | null;
};

export function ShopPage() {
  const api = useApi();
  const [items, setItems] = useState<Product[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.get<Product[]>("/products").then(setItems).catch(() => setItems([]));
  }, [api]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }, [items, query]);

  return (
    <section className="py-8">
      <div className="mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
            straight from the hub
          </p>
          <h1 className="font-display text-4xl md:text-5xl" style={{ color: FOREST }}>
            HERBALIFE SHOP
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2 flex-1 md:w-80"
            style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
          >
            <span className="text-stone-400">🔍</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, SKUs…"
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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((p) => {
          const inStock = p.stock > 0;
          const isLowStock = !p.isPreorder && inStock && p.stock <= 5;
          const statusLabel = p.isPreorder
            ? "Preorder"
            : !inStock
              ? "Sold out"
              : isLowStock
                ? `Only ${p.stock} left`
                : `${p.stock} in stock`;
          const statusBg = p.isPreorder
            ? PEACH_SOFT
            : !inStock
              ? "#F1ECDC"
              : isLowStock
                ? "#FBD9B8"
                : "#DCE7DA";

          return (
            <article
              key={p.id}
              className="group relative rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow flex flex-col"
              style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}
            >
              {/* Full-bleed image */}
              <div
                className="relative aspect-square overflow-hidden"
                style={{ backgroundColor: "#F1ECDC" }}
              >
                {p.imageUrl ? (
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl opacity-40">
                    🌿
                  </div>
                )}

                {/* Status pill */}
                <span
                  className="absolute top-3 left-3 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: statusBg, color: FOREST }}
                >
                  {statusLabel}
                </span>

                {/* Price tag */}
                <div
                  className="absolute bottom-3 right-3 rounded-full px-3 py-1.5 text-sm font-black shadow-sm"
                  style={{ backgroundColor: "white", color: FOREST }}
                >
                  ₱{Number(p.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Info row */}
              <div className="p-4 flex flex-col flex-1">
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                  Herbalife
                </p>
                <h3
                  className="font-extrabold leading-snug mt-1"
                  style={{ color: FOREST }}
                >
                  <Highlight text={p.name} query={query} />
                </h3>
                {p.description && (
                  <p className="text-xs text-stone-500 mt-1">
                    <Highlight text={p.description} query={query} />
                  </p>
                )}

                <div className="mt-auto pt-3">
                  <CartActionButton
                    fullWidth
                    itemId={p.id}
                    itemType={OrderItemType.Product}
                    name={p.name}
                    unitPrice={Number(p.price)}
                    imageUrl={p.imageUrl}
                    label={p.isPreorder ? "Preorder" : "Add to Cart"}
                    doneLabel={p.isPreorder ? "Reserved" : "Added"}
                    disabled={!p.isPreorder && !inStock}
                    maxQuantity={p.isPreorder ? undefined : p.stock}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="py-16 text-center text-stone-500">
          {items.length === 0 ? (
            <>No products yet. Run <code>pnpm --filter @snb/api seed:herbalife</code> to populate.</>
          ) : (
            <>No matches for "{query}".</>
          )}
        </div>
      )}
    </section>
  );
}
