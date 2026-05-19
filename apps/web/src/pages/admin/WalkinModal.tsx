import { useEffect, useMemo, useRef, useState } from "react";
import { OrderItemType } from "@snb/shared";
import { useApi } from "../../hooks/useApi";

const FOREST = "#1E3D2F";
const CREAM = "#FBF6EA";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";
const MUSTARD = "#F5C97F";

type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: string;
  isAvailable: boolean;
  imageUrl: string | null;
};

type Product = {
  id: string;
  name: string;
  sku: string;
  price: string;
  stock: number;
  isPreorder: boolean;
  imageUrl: string | null;
};

type Line = {
  key: string; // `${itemType}:${itemId}`
  itemType: OrderItemType;
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  maxQty?: number;
};

function peso(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const API_URL = import.meta.env.VITE_API_URL as string;
function absUrl(u: string | null | undefined) {
  if (!u) return null;
  if (/^https?:/i.test(u)) return u;
  return `${API_URL}${u}`;
}

export function WalkinModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const api = useApi();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tab, setTab] = useState<"menu" | "products">("menu");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [cash, setCash] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    api.get<MenuItem[]>("/menu").then(setMenu).catch(() => setMenu([]));
    api.get<Product[]>("/products").then(setProducts).catch(() => setProducts([]));
  }, [open, api]);

  useEffect(() => {
    if (open) {
      // reset state when reopening
      setLines([]);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      setCash("");
      setError(null);
      setQuery("");
      setTab("menu");
    }
  }, [open]);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Lock body scroll + close on Escape + restore focus on close
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus to the dialog so screen readers + keyboard land here.
    queueMicrotask(() => dialogRef.current?.focus());

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      // Simple focus trap on Tab
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const enabled = Array.from(focusables).filter(
          (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
        );
        if (enabled.length === 0) return;
        const first = enabled[0];
        const last = enabled[enabled.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [open, onClose]);

  const total = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  const cashNum = parseFloat(cash);
  const validCash = !Number.isNaN(cashNum) && cashNum > 0;
  const change = validCash ? cashNum - total : 0;
  const insufficient = validCash && change < 0;

  const filteredMenu = useMemo(() => {
    const q = query.trim().toLowerCase();
    return menu
      .filter((m) => m.isAvailable)
      .filter((m) => !q || m.name.toLowerCase().includes(q));
  }, [menu, query]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => p.isPreorder || p.stock > 0)
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [products, query]);

  function addLine(
    itemType: OrderItemType,
    itemId: string,
    name: string,
    unitPrice: number,
    maxQty?: number,
  ) {
    setLines((prev) => {
      const key = `${itemType}:${itemId}`;
      const existing = prev.find((l) => l.key === key);
      if (existing) {
        if (maxQty !== undefined && existing.quantity >= maxQty) return prev;
        return prev.map((l) => (l.key === key ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { key, itemType, itemId, name, unitPrice, quantity: 1, maxQty }];
    });
  }

  function changeQty(key: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) =>
          l.key === key
            ? { ...l, quantity: Math.max(0, Math.min(l.maxQty ?? 999, l.quantity + delta)) }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }

  async function submit() {
    if (lines.length === 0) {
      setError("Add at least one item.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/orders/walkin", {
        lines: lines.map((l) => ({
          itemType: l.itemType,
          itemId: l.itemId,
          quantity: l.quantity,
        })),
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        notes: notes || null,
        cashReceived: validCash ? cashNum : null,
      });
      onCreated();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-stretch md:items-center justify-center p-0 md:p-4"
      style={{ backgroundColor: "rgba(30,61,47,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="walkin-modal-title"
        tabIndex={-1}
        className="bg-white w-full max-w-5xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[100vh] md:max-h-[88vh] focus:outline-none"
        style={{ color: FOREST }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: picker */}
        <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: CREAM }}>
          {/* Header */}
          <div className="p-5 border-b" style={{ borderColor: PEACH_SOFT }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-script text-xl" style={{ color: PEACH }}>
                  fast service
                </p>
                <h2 id="walkin-modal-title" className="font-display text-2xl md:text-3xl leading-none">NEW WALK-IN ORDER</h2>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-stone-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tabs + search */}
          <div className="px-5 pt-4 flex flex-wrap items-center gap-2">
            <div
              className="inline-flex p-1 rounded-full"
              style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
            >
              {[
                { v: "menu" as const, label: "Menu" },
                { v: "products" as const, label: "Shop" },
              ].map((t) => (
                <button
                  key={t.v}
                  onClick={() => setTab(t.v)}
                  className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest"
                  style={{
                    backgroundColor: tab === t.v ? FOREST : "transparent",
                    color: tab === t.v ? MUSTARD : FOREST,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div
              className="flex-1 flex items-center gap-2 rounded-full px-3 py-1.5"
              style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
            >
              <span className="text-stone-400 text-sm">🔍</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: FOREST }}
              />
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-5 pt-3">
            {tab === "menu" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredMenu.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => addLine(OrderItemType.Menu, m.id, m.name, Number(m.price))}
                    className="rounded-xl p-3 text-left hover:shadow-md transition flex flex-col"
                    style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
                  >
                    <div
                      className="aspect-square rounded-lg overflow-hidden flex items-center justify-center mb-2"
                      style={{ backgroundColor: "#E9EAD8" }}
                    >
                      {m.imageUrl ? (
                        <img src={absUrl(m.imageUrl) ?? ""} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{m.category === "shake" ? "🥤" : "🍪"}</span>
                      )}
                    </div>
                    <p className="text-xs font-extrabold leading-tight line-clamp-2">{m.name}</p>
                    <p className="text-sm font-black mt-auto pt-1">{peso(Number(m.price))}</p>
                  </button>
                ))}
                {filteredMenu.length === 0 && (
                  <p className="col-span-full text-xs text-stone-500 text-center py-6">
                    No menu items match.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() =>
                      addLine(
                        OrderItemType.Product,
                        p.id,
                        p.name,
                        Number(p.price),
                        p.isPreorder ? undefined : p.stock,
                      )
                    }
                    className="rounded-xl p-3 text-left hover:shadow-md transition flex flex-col"
                    style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
                  >
                    <div
                      className="aspect-square rounded-lg overflow-hidden flex items-center justify-center mb-2"
                      style={{ backgroundColor: "#F1ECDC" }}
                    >
                      {p.imageUrl ? (
                        <img src={absUrl(p.imageUrl) ?? ""} alt="" className="w-full h-full object-contain p-1" />
                      ) : (
                        <span className="text-3xl opacity-50">🌿</span>
                      )}
                    </div>
                    <p className="text-xs font-extrabold leading-tight line-clamp-2">{p.name}</p>
                    <div className="flex items-center justify-between mt-auto pt-1">
                      <span className="text-sm font-black">{peso(Number(p.price))}</span>
                      <span className="text-[9px] uppercase tracking-widest text-stone-500 font-bold">
                        {p.isPreorder ? "PO" : `${p.stock} left`}
                      </span>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="col-span-full text-xs text-stone-500 text-center py-6">
                    No products match.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: cart + checkout */}
        <aside
          className="w-full md:w-[360px] flex flex-col border-l"
          style={{ borderColor: PEACH_SOFT, backgroundColor: "white" }}
        >
          <div className="p-5 border-b" style={{ borderColor: PEACH_SOFT }}>
            <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Cart</p>
            <h3 className="font-display text-xl">{lines.length} item{lines.length === 1 ? "" : "s"}</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {lines.length === 0 && (
              <p className="text-xs text-stone-500 italic text-center py-8">
                Tap an item to add it.
              </p>
            )}
            {lines.map((l) => (
              <div
                key={l.key}
                className="rounded-lg p-2 flex items-center gap-2"
                style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold leading-tight line-clamp-1">{l.name}</p>
                  <p className="text-[10px] text-stone-500">{peso(l.unitPrice)} each</p>
                </div>
                <div
                  className="inline-flex items-center gap-1 rounded-full px-1 py-0.5"
                  style={{ backgroundColor: PEACH, color: FOREST }}
                >
                  <button
                    onClick={() => changeQty(l.key, -1)}
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
                  >
                    −
                  </button>
                  <span className="text-xs font-extrabold tabular-nums w-4 text-center">{l.quantity}</span>
                  <button
                    onClick={() => changeQty(l.key, 1)}
                    disabled={l.maxQty !== undefined && l.quantity >= l.maxQty}
                    className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs disabled:opacity-40"
                    style={{ backgroundColor: FOREST, color: PEACH }}
                  >
                    +
                  </button>
                </div>
                <span className="text-xs font-black tabular-nums w-16 text-right">
                  {peso(l.unitPrice * l.quantity)}
                </span>
              </div>
            ))}
          </div>

          {/* Customer + checkout */}
          <div className="p-4 border-t space-y-3" style={{ borderColor: PEACH_SOFT }}>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500 block mb-1">
                Customer name <span className="opacity-50">(optional)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Charlie"
                className="w-full rounded-lg px-2 py-1.5 text-sm outline-none"
                style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500 block mb-1">
                Phone <span className="opacity-50">(optional)</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="09xx xxx xxxx"
                className="w-full rounded-lg px-2 py-1.5 text-sm outline-none"
                style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500 block mb-1">
                Notes <span className="opacity-50">(optional)</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="No ice, less sugar…"
                className="w-full rounded-lg px-2 py-1.5 text-sm outline-none"
                style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}
              />
            </div>

            {/* Cash */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-stone-500 block mb-1">
                Cash received <span className="opacity-50">(optional)</span>
              </label>
              <div
                className="flex items-center rounded-lg px-2 py-1.5 text-sm"
                style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}
              >
                <span className="text-stone-500 mr-1">₱</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={cash}
                  onChange={(e) => setCash(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 bg-transparent outline-none font-bold"
                  style={{ color: FOREST }}
                />
              </div>
              {validCash && (
                <div
                  className="mt-1 rounded-lg px-2 py-1 flex items-center justify-between text-xs"
                  style={{
                    backgroundColor: insufficient ? "#FEE2E2" : "#DCE7DA",
                    color: insufficient ? "#7F1D1D" : FOREST,
                  }}
                >
                  <span className="uppercase tracking-widest font-bold">
                    {insufficient ? "Short" : "Change"}
                  </span>
                  <span className="font-black">{peso(Math.abs(change))}</span>
                </div>
              )}
            </div>

            <div className="flex items-baseline justify-between pt-2 border-t" style={{ borderColor: PEACH_SOFT }}>
              <span className="text-xs uppercase tracking-widest font-bold text-stone-500">Total</span>
              <span className="text-2xl font-black">{peso(total)}</span>
            </div>

            {error && (
              <div className="text-xs rounded-lg p-2 bg-red-50 text-red-800 border border-red-200">
                {error}
              </div>
            )}

            <button
              onClick={submit}
              disabled={submitting || lines.length === 0}
              className="w-full rounded-full px-4 py-3 text-xs font-bold uppercase tracking-widest shadow-sm disabled:opacity-40 flex items-center justify-between"
              style={{ backgroundColor: FOREST, color: CREAM }}
            >
              <span>{submitting ? "Placing…" : "Place walk-in order"}</span>
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px]"
                style={{ backgroundColor: PEACH, color: FOREST }}
              >
                ↗
              </span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
