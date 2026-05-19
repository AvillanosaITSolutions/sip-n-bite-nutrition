import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Fulfillment, OrderItemType, type MenuCategory } from "@snb/shared";
import { useApi } from "../hooks/useApi";
import { useCart } from "../store/cart";
import { CartActionButton } from "../components/CartActionButton";
import { StoreMap, DirectionsLink } from "../components/StoreMap";
import { Reveal } from "../components/Reveal";
import { absUrl } from "../lib/absUrl";

const STORE_LAT = 9.761516860381166;
const STORE_LNG = 118.74527723616771;

type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  calories: number;
  benefits: string[];
  price: string;
  imageUrl: string | null;
};

// --- design tokens (Alpino-inspired, Sip 'N Bite palette) ---
const CREAM = "#FBF6EA";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";
const MUSTARD = "#F5C97F";
const FOREST = "#1E3D2F";

function PeachPill({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-sm hover:opacity-90 transition"
      style={{ backgroundColor: PEACH }}
    >
      {children}
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full"
        style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
      >
        ↗
      </span>
    </Link>
  );
}

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

export function Home() {
  const api = useApi();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const add = useCart((s) => s.add);

  useEffect(() => {
    api.get<MenuItem[]>("/menu").then(setMenu).catch(() => setMenu([]));
    api.get<Product[]>("/products").then(setProducts).catch(() => setProducts([]));
  }, [api]);

  const finest = menu.slice(0, 3);
  const herbalife = products.slice(0, 4);
  // Feature the French Vanilla canister for the "Honest Ingredients" hero shot.
  const heroProduct =
    products.find((p) => /french\s*vanilla/i.test(p.name) && !!p.imageUrl) ??
    products.find((p) => !!p.imageUrl);

  return (
    <div className="w-full" style={{ backgroundColor: CREAM, color: FOREST }}>
      {/* ============== HERO ============== */}
      <section className="px-6 md:px-10 pt-10 pb-14">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="font-script text-3xl md:text-4xl -mb-2" style={{ color: PEACH }}>
              Indulge without guilt,
            </p>
            <h1
              className="font-display text-5xl md:text-7xl leading-[0.95] tracking-tight"
              style={{ color: FOREST }}
            >
              CRAFTED FOR<br />WELLNESS
            </h1>
            <p className="mt-5 max-w-md text-stone-600 leading-relaxed">
              Crafted with care, every shake and snack delivers pure herbal
              ingredients, simple pleasures, and guilt-free indulgence.
            </p>
            <div className="mt-6">
              <PeachPill to="/menu">Explore Now</PeachPill>
            </div>

            <p className="mt-10 uppercase tracking-[0.25em] text-xs font-bold text-stone-700">
              Our Core Products
            </p>
            <div className="mt-3 flex gap-3">
              {["🥤", "🍵", "🥗"].map((e, i) => (
                <div
                  key={i}
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm"
                  style={{
                    backgroundColor: [PEACH_SOFT, FOREST, MUSTARD][i],
                    color: i === 1 ? "white" : FOREST,
                  }}
                >
                  {e}
                </div>
              ))}
            </div>
          </div>

          {/* hero right: product + price card */}
          <div className="relative">
            <div
              className="aspect-[4/5] rounded-[2rem] shadow-xl relative overflow-hidden"
              style={{ backgroundColor: "#E9EAD8" }}
            >
              <img
                src={`${import.meta.env.VITE_API_URL}/uploads/landing/hero.jpg`}
                alt="Sip 'N Bite signature shake"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute top-6 left-6 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow"
                style={{ backgroundColor: FOREST, color: "white" }}
              >
                Sip 'N Bite
              </div>
            </div>
            <div
              className="absolute -bottom-6 -right-2 md:-right-6 w-56 rounded-2xl p-4 shadow-lg"
              style={{ backgroundColor: MUSTARD }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: FOREST, color: MUSTARD }}
                >
                  Snack
                </span>
                <span className="text-xl font-black" style={{ color: FOREST }}>
                  ₱200
                </span>
              </div>
              <p className="text-sm font-extrabold leading-tight mt-2" style={{ color: FOREST }}>
                High Protein Overnight Oats
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============== STAT BAND ============== */}
      <Reveal as="section" className="px-6 md:px-10 py-12">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <h2 className="text-4xl md:text-5xl font-black leading-[0.95]" style={{ color: FOREST }}>
            CLEAN INGREDIENTS<br />DEEP FLAVOR
          </h2>
          <div
            className="rounded-2xl flex items-center justify-between px-6 py-5 shadow-sm"
            style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
          >
            <div>
              <p className="text-3xl font-black" style={{ color: FOREST }}>500ml</p>
              <p className="text-xs uppercase tracking-widest text-stone-500">Herbal Shake</p>
            </div>
            <div className="text-3xl">🌿</div>
            <div>
              <p className="text-3xl font-black" style={{ color: FOREST }}>20g</p>
              <p className="text-xs uppercase tracking-widest text-stone-500">Pure Protein</p>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ============== 3-UP MODULAR ============== */}
      <Reveal as="section" className="px-6 md:px-10 pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
          <div
            className="rounded-2xl p-6 flex flex-col justify-between min-h-[200px]"
            style={{ backgroundColor: MUSTARD }}
          >
            <div>
              <p className="text-xl font-extrabold leading-tight" style={{ color: FOREST }}>
                A WELLNESS<br />RITUAL
              </p>
            </div>
            <div className="flex items-end justify-between">
              <Link to="/menu" className="text-xs font-bold uppercase tracking-widest" style={{ color: FOREST }}>
                Sip Today ↗
              </Link>
              <div className="text-4xl">🌾</div>
            </div>
          </div>

          <div
            className="rounded-2xl p-6 flex flex-col justify-between min-h-[200px] relative overflow-hidden"
            style={{ backgroundColor: FOREST, color: "white" }}
          >
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: MUSTARD }}>
              Authentic Herbalife
            </p>
            <div className="flex items-end justify-between">
              <p className="text-lg font-extrabold leading-tight max-w-[55%]">
                Real products,<br />real results.
              </p>
              <div className="text-5xl">🥤</div>
            </div>
            <Link to="/shop" className="absolute top-6 right-6 text-xs font-bold uppercase tracking-widest" style={{ color: MUSTARD }}>
              Shop ↗
            </Link>
          </div>

          <div
            className="rounded-2xl p-6 flex flex-col justify-between min-h-[200px]"
            style={{ backgroundColor: PEACH_SOFT }}
          >
            <p className="text-xl font-extrabold leading-tight" style={{ color: FOREST }}>
              SNACK SMART<br />ALL DAY
            </p>
            <div className="flex items-end justify-between">
              <Link to="/menu" className="text-xs font-bold uppercase tracking-widest" style={{ color: FOREST }}>
                Browse Snacks ↗
              </Link>
              <div className="text-4xl">🍪</div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ============== CRAFTED WITH SIMPLICITY ============== */}
      <Reveal as="section" className="px-6 md:px-10 py-16" style={{ backgroundColor: "#F1ECDC" }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2">
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95]" style={{ color: FOREST }}>
              CRAFTED <span className="font-script text-5xl md:text-7xl" style={{ color: PEACH }}>with nature</span><br />CELEBRATED IN FLAVOR
            </h2>
          </div>
          <div>
            <p className="text-stone-600 leading-relaxed">
              More than a drink, this is a daily ritual — herbal blends, slow-shaken,
              and served with calm.
            </p>
            <div className="mt-4">
              <PeachPill to="/menu">Taste Better</PeachPill>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 grid md:grid-cols-2 gap-8 items-center">
          <div className="grid grid-cols-2 gap-4">
            <div
              className="aspect-[4/5] rounded-2xl overflow-hidden shadow-md"
              style={{ backgroundColor: "#E2E3CC" }}
            >
              <img
                src={`${import.meta.env.VITE_API_URL}/uploads/landing/crafted-with-the-nature-banana-bowl.jpg`}
                alt="Banana bowl crafted with nature"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
            <div
              className="aspect-[4/5] rounded-2xl overflow-hidden shadow-md mt-8"
              style={{ backgroundColor: "#E2E3CC" }}
            >
              <img
                src={`${import.meta.env.VITE_API_URL}/uploads/landing/crafted-with-the-nature-strawberry-bowl.jpg`}
                alt="Strawberry bowl crafted with nature"
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div
                className="aspect-[4/5] rounded-2xl overflow-hidden shadow-md"
                style={{ backgroundColor: "#E2E3CC" }}
              >
                <img
                  src={`${import.meta.env.VITE_API_URL}/uploads/landing/crafted-with-the-nature-waffle-with-drink.jpg`}
                  alt="Protein waffle paired with a shake"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className="aspect-[4/5] rounded-2xl overflow-hidden shadow-md mt-8"
                style={{ backgroundColor: "#E2E3CC" }}
              >
                <img
                  src={`${import.meta.env.VITE_API_URL}/uploads/landing/crafted-with-the-nature-shake.jpg`}
                  alt="Signature protein shake crafted with nature"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className="text-3xl font-black leading-tight" style={{ color: FOREST }}>
              Ingredients you can recognize — <span className="text-stone-600">taste you won't forget.</span>
            </p>
          </div>
        </div>
      </Reveal>

      {/* ============== OUR FINEST SELECTIONS ============== */}
      <Reveal as="section" className="px-6 md:px-10 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-4xl md:text-5xl font-black" style={{ color: FOREST }}>
              OUR FINEST SELECTIONS
            </h2>
            <Link
              to="/menu"
              className="hidden md:inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
              style={{ backgroundColor: PEACH, color: FOREST }}
            >
              Add to Cart ↗
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {finest.length === 0 &&
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl h-72 flex items-center justify-center text-stone-400"
                  style={{ backgroundColor: "#F1ECDC" }}
                >
                  Add menu items in /admin
                </div>
              ))}
            {finest.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl overflow-hidden flex flex-col shadow-sm group"
                style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
              >
                <div
                  className="aspect-square overflow-hidden"
                  style={{ backgroundColor: "#E9EAD8" }}
                >
                  {item.imageUrl ? (
                    <img
                      src={absUrl(item.imageUrl) ?? ""}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-7xl">
                      {item.category === "shake" ? "🥤" : "🍪"}
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs uppercase tracking-widest text-stone-500">
                    {item.category}
                  </p>
                  <h3 className="text-lg font-extrabold mt-1" style={{ color: FOREST }}>
                    {item.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">{item.calories} kcal</p>
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xl font-black" style={{ color: FOREST }}>
                      ₱{item.price}
                    </span>
                    <CartActionButton
                      itemId={item.id}
                      itemType={OrderItemType.Menu}
                      name={item.name}
                      unitPrice={Number(item.price)}
                      imageUrl={item.imageUrl}
                      label="Add to Cart"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ============== HERBALIFE PICKS RAIL ============== */}
      <Reveal as="section" className="px-6 md:px-10 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
                straight from the hub
              </p>
              <h2 className="font-display text-3xl md:text-5xl leading-[0.95]" style={{ color: FOREST }}>
                HERBALIFE PICKS
              </h2>
            </div>
            <Link
              to="/shop"
              className="hidden md:inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
              style={{ backgroundColor: PEACH, color: FOREST }}
            >
              View All ↗
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {herbalife.length === 0 &&
              [0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl h-64 flex items-center justify-center text-stone-400"
                  style={{ backgroundColor: "#F1ECDC" }}
                >
                  Seed products to populate
                </div>
              ))}
            {herbalife.map((p, idx) => {
              const palette = ["#E9EAD8", "#F1ECDC", "#FBD9B8", "#E2E3CC"][idx % 4];
              const inStock = p.stock > 0;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl overflow-hidden flex flex-col shadow-sm group"
                  style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
                >
                  <div
                    className="aspect-square overflow-hidden"
                    style={{ backgroundColor: palette }}
                  >
                    {p.imageUrl ? (
                      <img
                        src={absUrl(p.imageUrl) ?? ""}
                        alt={p.name}
                        loading="lazy"
                        className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl opacity-50">
                        🌿
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-widest text-stone-500">
                        Herbalife
                      </p>
                      {(() => {
                        const isLow = !p.isPreorder && inStock && p.stock <= 5;
                        const label = p.isPreorder
                          ? "Preorder"
                          : !inStock
                            ? "Sold out"
                            : isLow
                              ? `Only ${p.stock} left`
                              : "In stock";
                        const bg = p.isPreorder
                          ? PEACH_SOFT
                          : !inStock
                            ? "#E7D5D0"
                            : isLow
                              ? "#FBD9B8"
                              : "#DCE7DA";
                        const color = !p.isPreorder && !inStock ? "#7A4438" : FOREST;
                        return (
                          <span
                            className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: bg, color }}
                          >
                            {label}
                          </span>
                        );
                      })()}
                    </div>
                    <h3 className="text-sm font-extrabold mt-1 leading-snug line-clamp-2" style={{ color: FOREST }}>
                      {p.name}
                    </h3>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="text-lg font-black" style={{ color: FOREST }}>
                        ₱{p.price}
                      </span>
                      <CartActionButton
                        variant="compact"
                        itemId={p.id}
                        itemType={OrderItemType.Product}
                        name={p.name}
                        unitPrice={Number(p.price)}
                        imageUrl={p.imageUrl}
                        label={p.isPreorder ? "Preorder" : "Add"}
                        doneLabel={p.isPreorder ? "Reserved" : "Added"}
                        disabled={!p.isPreorder && !inStock}
                        maxQuantity={p.isPreorder ? undefined : p.stock}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* ============== HONEST INGREDIENTS / FORMULA 1 SPECS ============== */}
      <Reveal as="section" className="px-6 md:px-10 py-16" style={{ backgroundColor: "#F1ECDC" }}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
              the foundation
            </p>
            <h2 className="text-3xl md:text-5xl font-black leading-[0.95]" style={{ color: FOREST }}>
              HONEST INGREDIENTS · ELEVATED FLAVOR
            </h2>
            <p className="mt-4 max-w-xl text-stone-600 leading-relaxed">
              Every Sip 'N Bite shake starts with <strong>Herbalife Formula 1</strong> —
              a complete, nutrient-rich meal in a glass.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 items-center">
            {/* Specs grid */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "9g", label: "Protein" },
                  { value: "90", label: "Calories" },
                  { value: "19", label: "Vitamins & Minerals" },
                  { value: "A, C, E", label: "Antioxidants" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl p-5 shadow-sm"
                    style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
                  >
                    <p className="text-3xl md:text-4xl font-black leading-none" style={{ color: FOREST }}>
                      {stat.value}
                    </p>
                    <p className="text-[11px] uppercase tracking-widest text-stone-500 font-bold mt-2">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { icon: "💪", label: "Weight Management" },
                  { icon: "🏋️", label: "Fitness Goals" },
                  { icon: "☀️", label: "Everyday Health" },
                ].map((b) => (
                  <div
                    key={b.label}
                    className="rounded-full px-4 py-2 flex items-center gap-2 text-sm font-bold"
                    style={{ backgroundColor: MUSTARD, color: FOREST }}
                  >
                    <span className="text-base">{b.icon}</span>
                    <span>{b.label}</span>
                  </div>
                ))}
              </div>

              {/* Flavors */}
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest font-bold text-stone-500 mb-3">
                  Available in 5 flavors
                </p>
                <div className="flex flex-wrap gap-2">
                  {["French Vanilla", "Dutch Chocolate", "Wild Berry", "Cookies & Cream", "Dulce de Leche"].map((f) => (
                    <span
                      key={f}
                      className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <p className="text-xs text-stone-500 mt-6 leading-relaxed">
                Net wt. 19.4 oz (550g) · Perfect with <strong>Formula 3 Personalized Protein</strong> &
                <strong> Simply Probiotic</strong>.
              </p>
            </div>

            {/* Canister image */}
            <div className="relative">
              <div
                className="aspect-square rounded-2xl overflow-hidden flex items-center justify-center relative"
                style={{
                  background:
                    "radial-gradient(circle at 50% 35%, #FFFFFF 0%, #E9EAD8 45%, #CFD3B7 100%)",
                }}
              >
                {/* soft top vignette */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.55), transparent 60%)",
                  }}
                />
                {/* ground shadow */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: "8%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "55%",
                    height: "8%",
                    background:
                      "radial-gradient(ellipse, rgba(30,61,47,0.35) 0%, rgba(30,61,47,0.18) 40%, transparent 75%)",
                    filter: "blur(6px)",
                  }}
                />
                {heroProduct?.imageUrl ? (
                  <img
                    src={absUrl(heroProduct.imageUrl) ?? ""}
                    alt={heroProduct.name}
                    className="relative w-full h-full object-contain p-8 transition-transform duration-500 hover:-translate-y-1"
                    style={{
                      filter:
                        "drop-shadow(0 18px 18px rgba(30,61,47,0.25)) drop-shadow(0 4px 6px rgba(30,61,47,0.15))",
                    }}
                  />
                ) : (
                  <span className="text-8xl relative">🥛</span>
                )}
                {/* subtle floor reflection */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "10%",
                    background:
                      "linear-gradient(to top, rgba(207,211,183,0.6), transparent)",
                  }}
                />
              </div>
              <div
                className="absolute -bottom-4 -left-4 md:-left-6 w-44 rounded-2xl p-4 shadow-lg"
                style={{ backgroundColor: FOREST, color: "white" }}
              >
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: MUSTARD }}>
                  Formula 1
                </p>
                <p className="text-sm font-extrabold leading-tight mt-1">
                  Nutritional Shake Mix
                </p>
                <p className="text-[11px] mt-1 opacity-80">
                  9g protein · 90 cal · 19 V&M
                </p>
              </div>
              <div className="mt-20 md:mt-16 flex justify-end">
                <PeachPill to="/shop">Shop Formula 1</PeachPill>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ============== ZERO TRICKS JUST TASTE ============== */}
      <Reveal as="section" className="px-6 md:px-10 py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-5">
          <div
            className="relative rounded-2xl overflow-hidden min-h-[220px]"
            style={{ backgroundColor: FOREST }}
          >
            <img
              src={`${import.meta.env.VITE_API_URL}/uploads/landing/zero-tricks-just-taste1.jpg`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(30,61,47,0.85), rgba(30,61,47,0.25))" }} />
            <div className="relative p-6 flex flex-col justify-between min-h-[220px] h-full">
              <p
                className="text-3xl font-black leading-[0.95]"
                style={{ color: MUSTARD }}
              >
                ZERO TRICKS<br />JUST TASTE
              </p>
            </div>
          </div>
          <div
            className="relative rounded-2xl overflow-hidden min-h-[220px]"
            style={{ backgroundColor: MUSTARD }}
          >
            <img
              src={`${import.meta.env.VITE_API_URL}/uploads/landing/zero-tricks-just-taste2.jpg`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(245,201,127,0.75), rgba(245,201,127,0.15))" }} />
            <div className="relative p-6 flex flex-col justify-between min-h-[220px] h-full">
              <p className="text-3xl font-black leading-[0.95]" style={{ color: FOREST }}>
                ZERO TRICKS<br />JUST TASTE
              </p>
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-2xl md:text-3xl font-black leading-tight" style={{ color: FOREST }}>
              FUEL WITH REAL,<br />FEEL THE DIFFERENCE NATURALLY
            </h3>
            <div className="mt-4">
              <Link to="/menu" className="text-sm font-bold uppercase tracking-widest" style={{ color: FOREST }}>
                Taste the Craft ↗
              </Link>
            </div>
            <div
              className="mt-5 rounded-xl p-4 flex items-center gap-3"
              style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: PEACH_SOFT }}
              >
                🍃
              </div>
              <div>
                <p className="font-extrabold text-sm" style={{ color: FOREST }}>
                  Healthy & Pure
                </p>
                <p className="text-xs text-stone-500">Herbal goodness, slow-shaken by nature</p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ============== LOVED BY OUR CUSTOMERS ============== */}
      <Reveal as="section" className="px-6 md:px-10 py-16" style={{ backgroundColor: CREAM }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
                from the community
              </p>
              <h2 className="font-display text-4xl md:text-6xl leading-[0.95]" style={{ color: FOREST }}>
                LOVED BY OUR<br />CUSTOMERS
              </h2>
            </div>
            <div
              className="hidden md:flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
              style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
            >
              <span className="text-lg leading-none">★★★★★</span>
              <span>5.0 · Google reviews</span>
            </div>
          </div>

          {/* customer photo strip */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {["customer.jpg", "customer1.jpg", "customers2.jpg"].map((file) => (
              <div
                key={file}
                className="aspect-[4/3] rounded-2xl overflow-hidden shadow-sm"
                style={{ backgroundColor: "#E9EAD8" }}
              >
                <img
                  src={`${import.meta.env.VITE_API_URL}/uploads/customers/${file}`}
                  alt="Happy Sip 'N Bite customer"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                quote:
                  "Genuinely one of the best protein shakes I've ever had. Avocado flavour is a must try! The owners made me feel so welcome as a solo traveller.",
                name: "Charlie Heath",
                role: "Solo traveller",
                bg: PEACH_SOFT,
              },
              {
                quote:
                  "Best protein shake I've ever had! Blueberry cheesecake and salted caramel — both unbelievable. The protein waffles and overnight oats were so delicious.",
                name: "Rachel Pritchard",
                role: "Google review",
                bg: MUSTARD,
              },
              {
                quote:
                  "One of the best restaurants that serve protein-based shakes and snacks! Perfect for those trying to hit their protein goals without compromising their health.",
                name: "Czarina Reynoso",
                role: "Local Guide",
                bg: "#E9EAD8",
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl p-6 flex flex-col justify-between shadow-sm"
                style={{ backgroundColor: t.bg, color: FOREST }}
              >
                <div>
                  <span className="text-3xl leading-none" aria-hidden>“</span>
                  <blockquote className="mt-2 text-base font-semibold leading-snug">
                    {t.quote}
                  </blockquote>
                </div>
                <figcaption className="mt-6 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black"
                    style={{ backgroundColor: FOREST, color: CREAM }}
                  >
                    {t.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-extrabold leading-tight">{t.name}</p>
                    <p className="text-xs opacity-70">{t.role}</p>
                  </div>
                  <span className="ml-auto text-xs font-bold tracking-widest">★★★★★</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ============== LET THE GREEN SHINE ============== */}
      <Reveal as="section" className="px-6 md:px-10 py-20" style={{ backgroundColor: "#F1ECDC" }}>
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-script text-4xl md:text-5xl mb-2" style={{ color: PEACH }}>
            let the
          </p>
          <h2
            className="font-display text-6xl md:text-8xl leading-[0.9]"
            style={{ color: FOREST }}
          >
            GREEN SHINE
          </h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6 items-center">
            <div
              className="aspect-square rounded-2xl flex items-center justify-center text-7xl"
              style={{ backgroundColor: "#E9EAD8" }}
            >
              🥬
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-extrabold" style={{ color: FOREST }}>
                INDULGE FOR LESS,<br />UP TO 20G PROTEIN
              </p>
              <div className="mt-5">
                <PeachPill to="/menu">Shop Now</PeachPill>
              </div>
            </div>
            <div
              className="aspect-square rounded-2xl flex items-center justify-center text-7xl"
              style={{ backgroundColor: "#E9EAD8" }}
            >
              🍯
            </div>
          </div>
        </div>
      </Reveal>

      {/* ============== CONNECT WITH US ============== */}
      <Reveal as="section" className="px-6 md:px-10 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
              stay in the loop
            </p>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95]" style={{ color: FOREST }}>
              CONNECT WITH US
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-stone-600 leading-relaxed">
              New flavors, behind-the-scenes prep, and wellness tips — say hi on
              the channel that suits you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                href: "https://www.instagram.com/sip.n.bitenutrition",
                external: true,
                label: "Instagram",
                handle: "@sip.n.bitenutrition",
                emoji: "📷",
                bg: PEACH_SOFT,
                cta: "Follow",
              },
              {
                href: "https://www.facebook.com/profile.php?id=100077877788737",
                external: true,
                label: "Facebook",
                handle: "Sip 'N Bite Nutrition",
                emoji: "💬",
                bg: MUSTARD,
                cta: "Message",
              },
              {
                href: "tel:+639988845795",
                external: false,
                label: "Phone",
                handle: "0998 884 5795",
                emoji: "📞",
                bg: "#E9EAD8",
                cta: "Call",
              },
              {
                href: "mailto:rosalie_ropero@yahoo.com",
                external: false,
                label: "Email",
                handle: "rosalie_ropero@yahoo.com",
                emoji: "✉️",
                bg: "#F1ECDC",
                cta: "Email",
              },
            ].map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                className="group rounded-2xl p-5 flex flex-col justify-between min-h-[180px] shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                style={{ backgroundColor: c.bg, color: FOREST }}
              >
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{c.emoji}</div>
                  <span
                    className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-full"
                    style={{ backgroundColor: "rgba(30,61,47,0.12)", color: FOREST }}
                  >
                    {c.cta} ↗
                  </span>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-widest font-bold opacity-70">
                    {c.label}
                  </p>
                  <p className="font-extrabold mt-1 leading-snug break-all">
                    {c.handle}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </Reveal>

      {/* ============== VISIT US ============== */}
      <Reveal as="section" className="px-6 md:px-10 py-16" style={{ backgroundColor: CREAM }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
              come say hi
            </p>
            <h2 className="font-display text-4xl md:text-6xl leading-[0.95]" style={{ color: FOREST }}>
              VISIT OUR HUB
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {/* Storefront photo */}
            <div
              className="rounded-3xl overflow-hidden shadow-md relative aspect-[4/3] md:aspect-auto"
              style={{ backgroundColor: "#E9EAD8" }}
            >
              <img
                src={`${import.meta.env.VITE_API_URL}/uploads/landing/storefront.jpg`}
                alt="Sip 'N Bite Nutrition storefront"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute bottom-4 left-4 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest shadow"
                style={{ backgroundColor: FOREST, color: "white" }}
              >
                The Hub
              </div>
            </div>

            {/* Map + address */}
            <div
              className="rounded-3xl overflow-hidden shadow-md flex flex-col"
              style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
            >
              <div className="relative w-full h-[320px] md:h-[360px] bg-stone-100">
                <StoreMap lat={STORE_LAT} lng={STORE_LNG} label="Sip 'N Bite Nutrition location" />
              </div>
              <div className="p-6">
                <p className="text-xs uppercase tracking-widest font-bold" style={{ color: PEACH }}>
                  Find Us
                </p>
                <p className="font-extrabold mt-1 leading-snug" style={{ color: FOREST }}>
                  Sip 'N Bite Nutrition
                </p>
                <p className="text-sm text-stone-600 mt-1 leading-relaxed">
                  In front of Breadlane Homebakes,<br />
                  3rd Castro Street, L Nadayao Rd,<br />
                  Puerto Princesa City, 5300 Palawan, Philippines
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <DirectionsLink
                    lat={STORE_LAT}
                    lng={STORE_LNG}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition"
                    style={{ backgroundColor: PEACH, color: FOREST }}
                  >
                    Get Directions ↗
                  </DirectionsLink>
                  <a
                    href={`https://www.google.com/maps?q=${STORE_LAT},${STORE_LNG}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
                    style={{ backgroundColor: "white", color: FOREST, border: `1px solid ${FOREST}20` }}
                  >
                    View on Maps
                  </a>
                </div>
                <p className="text-[11px] text-stone-500 mt-4 uppercase tracking-widest">
                  Mon – Sat · 7am – 8pm · Closed Sundays
                </p>

                {/* Social row */}
                <div className="mt-4 flex items-center gap-2">
                  <a
                    href="https://www.instagram.com/sip.n.bitenutrition"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-9 h-9 rounded-full inline-flex items-center justify-center text-sm font-bold transition hover:opacity-80"
                    style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
                  >
                    IG
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=100077877788737"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-9 h-9 rounded-full inline-flex items-center justify-center text-sm font-bold transition hover:opacity-80"
                    style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
                  >
                    FB
                  </a>
                  <a
                    href="tel:+639988845795"
                    aria-label="Call"
                    className="w-9 h-9 rounded-full inline-flex items-center justify-center text-sm transition hover:opacity-80"
                    style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
                  >
                    📞
                  </a>
                  <a
                    href="mailto:rosalie_ropero@yahoo.com"
                    aria-label="Email"
                    className="w-9 h-9 rounded-full inline-flex items-center justify-center text-sm transition hover:opacity-80"
                    style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
                  >
                    ✉
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ============== FOOTER ============== */}
      <footer className="px-6 md:px-10 py-12" style={{ backgroundColor: FOREST, color: "#DCE7DA" }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 text-sm">
          <div>
            <p
              className="text-2xl text-white"
              style={{ fontFamily: '"Archivo Black", "DM Sans", sans-serif' }}
            >
              SIP 'N BITE.
            </p>
            <p className="mt-3 max-w-xs opacity-80">
              Indulge without guilt — herbal shakes, snacks, and Herbalife products,
              freshly served.
            </p>
          </div>
          <div>
            <p className="text-white font-bold mb-3">Shop</p>
            <ul className="space-y-1 opacity-80">
              <li><Link to="/menu">Menu</Link></li>
              <li><Link to="/shop">Herbalife Products</Link></li>
              <li><Link to="/orders">My Orders</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-bold mb-3">Find Us</p>
            <ul className="space-y-1.5 opacity-90">
              <li>
                <a
                  href={`https://www.google.com/maps?q=${STORE_LAT},${STORE_LNG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:opacity-80"
                >
                  📍 <span>Sip 'N Bite Hub, Castro St.</span>
                </a>
              </li>
              <li>
                <a href="tel:+639988845795" className="inline-flex items-center gap-2 hover:opacity-80">
                  📞 <span>0998 884 5795</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/sip.n.bitenutrition"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:opacity-80"
                >
                  📷 <span>@sip.n.bitenutrition</span>
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/profile.php?id=100077877788737"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:opacity-80"
                >
                  💬 <span>Message us on Facebook</span>
                </a>
              </li>
              <li>
                <a href="mailto:rosalie_ropero@yahoo.com" className="inline-flex items-center gap-2 hover:opacity-80">
                  ✉️ <span>rosalie_ropero@yahoo.com</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-white font-bold mb-3">Hours</p>
            <ul className="space-y-1 opacity-90">
              <li>Mon – Sat · 7am – 8pm</li>
              <li className="opacity-60">Sun · Closed</li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-white/10 text-xs opacity-70 flex justify-between">
          <span>© {new Date().getFullYear()} Sip 'N Bite Nutrition</span>
          <span>Indulge without guilt 🌿</span>
        </div>
      </footer>
    </div>
  );
}
