import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth0 } from "@auth0/auth0-react";
import { Fulfillment, PaymentMethod, createOrderSchema, type CreateOrderInput } from "@snb/shared";
import { useApi } from "../hooks/useApi";
import { useCart } from "../store/cart";
import { absUrl } from "../lib/absUrl";

const CREAM = "#FBF6EA";
const FOREST = "#1E3D2F";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";

type CheckoutForm = {
  fulfillment: Fulfillment;
  paymentMethod: PaymentMethod;
  deliveryAddress?: string;
  notes?: string;
};

function peso(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

export function CartPage() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.total());
  const api = useApi();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [cashOnHand, setCashOnHand] = useState<string>("");

  const { register, handleSubmit, watch, formState } = useForm<CheckoutForm>({
    defaultValues: { fulfillment: Fulfillment.Pickup, paymentMethod: PaymentMethod.AtHub },
  });
  const fulfillment = watch("fulfillment");
  const paymentMethod = watch("paymentMethod");

  async function onCheckout(values: CheckoutForm) {
    setError(null);
    if (!isAuthenticated) {
      await loginWithRedirect();
      return;
    }
    const cashNum = parseFloat(cashOnHand);
    const cashValid =
      values.paymentMethod === PaymentMethod.AtHub && !Number.isNaN(cashNum) && cashNum > 0;
    const payload: CreateOrderInput = {
      lines: lines.map((l) => ({ itemType: l.itemType, itemId: l.itemId, quantity: l.quantity })),
      fulfillment: values.fulfillment === Fulfillment.Both ? Fulfillment.Pickup : values.fulfillment,
      paymentMethod: values.paymentMethod,
      deliveryAddress: values.deliveryAddress ?? null,
      notes: values.notes ?? null,
      cashOnHand: cashValid ? cashNum : null,
    };
    const parsed = createOrderSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Cart contents look invalid. Try removing and re-adding the items.");
      return;
    }

    let order: { id: string; paymongoCheckoutUrl: string | null };
    try {
      order = await api.post("/orders", parsed.data);
    } catch (e: any) {
      console.error("Order placement failed:", e);
      setError(
        `We couldn't place your order. ${e?.message ?? ""}`.trim() +
          " · Check that you're signed in and that the API is running.",
      );
      return;
    }

    // Clear immediately + flush to localStorage so the empty state survives the
    // hard redirect to PayMongo (or the SPA navigate to the order page).
    useCart.getState().clear();
    try {
      window.localStorage.setItem("snb-cart", JSON.stringify({ state: { lines: [] }, version: 0 }));
    } catch {
      // ignore — persist middleware will still write on the next tick
    }

    if (values.paymentMethod === PaymentMethod.Online && order.paymongoCheckoutUrl) {
      window.location.href = order.paymongoCheckoutUrl;
    } else {
      navigate(`/orders/${order.id}?placed=1`);
    }
  }

  return (
    <section className="py-8" style={{ color: FOREST }}>
      <div className="mb-8">
        <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
          almost there,
        </p>
        <h1 className="font-display text-4xl md:text-5xl">YOUR CART</h1>
      </div>

      {lines.length === 0 ? (
        <div
          className="rounded-3xl p-12 text-center"
          style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}
        >
          <div className="text-5xl mb-3">🛒</div>
          <p className="font-extrabold text-lg" style={{ color: FOREST }}>Your cart is empty</p>
          <p className="text-stone-500 mt-1 mb-5">Browse the menu or our Herbalife shop to start an order.</p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/menu"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest shadow-sm"
              style={{ backgroundColor: PEACH, color: FOREST }}
            >
              Browse Menu ↗
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-widest border"
              style={{ borderColor: FOREST, color: FOREST }}
            >
              Shop Herbalife ↗
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* line items */}
          <div className="lg:col-span-2 space-y-4">
            {lines.map((l) => (
              <article
                key={l.itemId}
                className="rounded-2xl p-3 flex items-center gap-4 shadow-sm"
                style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
              >
                <div
                  className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#E9EAD8" }}
                >
                  {l.imageUrl ? (
                    <img src={absUrl(l.imageUrl) ?? ""} alt={l.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <span className="text-3xl">{l.itemType === "menu" ? "🥤" : "🌿"}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">
                    {l.itemType === "menu" ? "Sip 'N Bite menu" : "Herbalife"}
                  </p>
                  <p className="font-extrabold leading-tight line-clamp-2" style={{ color: FOREST }}>
                    {l.name}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {peso(l.unitPrice)} <span className="opacity-60">each</span>
                  </p>
                </div>

                {(() => {
                  const atMax = l.maxQuantity !== undefined && l.quantity >= l.maxQuantity;
                  return (
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-1.5 py-1"
                      style={{ backgroundColor: PEACH, color: FOREST }}
                    >
                      <button
                        type="button"
                        aria-label="Decrease"
                        onClick={() => (l.quantity > 1 ? setQty(l.itemId, l.quantity - 1) : remove(l.itemId))}
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold"
                        style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
                      >
                        −
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={l.maxQuantity}
                        value={l.quantity}
                        aria-label="Quantity"
                        onChange={(e) => {
                          const n = parseInt(e.target.value, 10);
                          if (Number.isNaN(n)) return;
                          const clamped =
                            l.maxQuantity !== undefined
                              ? Math.min(Math.max(1, n), l.maxQuantity)
                              : Math.max(1, n);
                          setQty(l.itemId, clamped);
                        }}
                        onFocus={(e) => e.currentTarget.select()}
                        className="w-10 bg-transparent border-0 outline-none text-center font-extrabold tabular-nums text-sm p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        style={{ color: FOREST, boxShadow: "none" }}
                      />
                      <button
                        type="button"
                        aria-label={atMax ? "Stock limit reached" : "Increase"}
                        onClick={() => {
                          if (atMax) return;
                          setQty(l.itemId, l.quantity + 1);
                        }}
                        disabled={atMax}
                        title={atMax ? `Only ${l.maxQuantity} in stock` : undefined}
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: FOREST,
                          color: PEACH,
                          opacity: atMax ? 0.35 : 1,
                        }}
                      >
                        +
                      </button>
                    </div>
                  );
                })()}

                <div className="text-right shrink-0 w-24">
                  <p className="font-black" style={{ color: FOREST }}>
                    {peso(l.unitPrice * l.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(l.itemId)}
                    className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-red-600 mt-1"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={clear}
                className="text-xs uppercase tracking-widest text-stone-500 hover:text-red-600"
              >
                Clear cart
              </button>
              <Link
                to="/shop"
                className="text-xs uppercase tracking-widest font-bold"
                style={{ color: FOREST }}
              >
                ← Keep shopping
              </Link>
            </div>
          </div>

          {/* summary + checkout */}
          <aside
            className="rounded-3xl p-6 sticky top-20 shadow-sm"
            style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}
          >
            <h2 className="font-display text-2xl mb-4" style={{ color: FOREST }}>
              ORDER SUMMARY
            </h2>

            <form onSubmit={handleSubmit(onCheckout)} className="space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">
                  Fulfillment
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: Fulfillment.Pickup, label: "Pickup" },
                    { v: Fulfillment.Delivery, label: "Delivery" },
                  ].map((o) => (
                    <label
                      key={o.v}
                      className={
                        "cursor-pointer rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest text-center transition " +
                        (fulfillment === o.v ? "shadow-sm" : "")
                      }
                      style={{
                        backgroundColor: fulfillment === o.v ? PEACH : "white",
                        color: FOREST,
                        border: `1px solid ${fulfillment === o.v ? PEACH : PEACH_SOFT}`,
                      }}
                    >
                      <input type="radio" value={o.v} {...register("fulfillment")} className="sr-only" />
                      {o.label}
                    </label>
                  ))}
                </div>
              </div>

              {fulfillment === Fulfillment.Delivery && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold block mb-1">
                    Delivery address
                  </label>
                  <textarea
                    rows={3}
                    required
                    {...register("deliveryAddress", { required: true })}
                    className="w-full rounded-xl px-3 py-2 text-sm"
                    style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
                  />
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase tracking-widest text-stone-500 font-bold mb-2">
                  Payment method
                </p>
                <div className="space-y-2">
                  {[
                    {
                      v: PaymentMethod.AtHub,
                      title: fulfillment === Fulfillment.Delivery ? "Cash on delivery" : "Pay at the hub",
                      sub:
                        fulfillment === Fulfillment.Delivery
                          ? "Settle in cash when your order is delivered."
                          : "Settle in cash or card when you pick up at the Sip 'N Bite hub.",
                    },
                    {
                      v: PaymentMethod.Online,
                      title: "Pay online",
                      sub: "Secure PayMongo checkout — card, GCash, GrabPay, Maya.",
                    },
                  ].map((o) => {
                    const active = paymentMethod === o.v;
                    return (
                      <label
                        key={o.v}
                        className="block cursor-pointer rounded-xl px-3 py-2.5 transition"
                        style={{
                          backgroundColor: active ? PEACH : "white",
                          border: `1px solid ${active ? PEACH : PEACH_SOFT}`,
                        }}
                      >
                        <input type="radio" value={o.v} {...register("paymentMethod")} className="sr-only" />
                        <div className="flex items-center justify-between">
                          <p className="font-extrabold text-sm" style={{ color: FOREST }}>{o.title}</p>
                          <span
                            className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: FOREST, backgroundColor: active ? FOREST : "transparent" }}
                          >
                            {active && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PEACH }} />}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-0.5">{o.sub}</p>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold block mb-1">
                  Notes (optional)
                </label>
                <textarea
                  rows={2}
                  {...register("notes")}
                  className="w-full rounded-xl px-3 py-2 text-sm"
                  style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
                />
              </div>

              {paymentMethod === PaymentMethod.AtHub && (() => {
                const cash = parseFloat(cashOnHand);
                const validCash = !Number.isNaN(cash) && cash > 0;
                const change = validCash ? cash - total : 0;
                const insufficient = validCash && change < 0;
                return (
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold block mb-1">
                      Cash on hand <span className="opacity-60 normal-case tracking-normal">(optional — for change preview)</span>
                    </label>
                    <div
                      className="flex items-center rounded-xl px-3 py-2 text-sm"
                      style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
                    >
                      <span className="text-stone-500 mr-1">₱</span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="0.01"
                        value={cashOnHand}
                        onChange={(e) => setCashOnHand(e.target.value)}
                        placeholder="e.g. 3000"
                        className="flex-1 bg-transparent outline-none"
                        style={{ color: FOREST }}
                      />
                      {cashOnHand && (
                        <button
                          type="button"
                          onClick={() => setCashOnHand("")}
                          className="text-stone-400 hover:text-stone-600 text-xs ml-2"
                          aria-label="Clear cash amount"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    {validCash && (
                      <div
                        className="mt-2 rounded-xl px-3 py-2 flex items-center justify-between text-sm"
                        style={{
                          backgroundColor: insufficient ? "#FEE2E2" : "#DCE7DA",
                          color: insufficient ? "#7F1D1D" : FOREST,
                        }}
                      >
                        <span className="text-xs uppercase tracking-widest font-bold">
                          {insufficient ? "Short by" : "Your change"}
                        </span>
                        <span className="font-black">
                          {peso(Math.abs(change))}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="pt-2 space-y-2 border-t" style={{ borderColor: PEACH_SOFT }}>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Subtotal</span>
                  <span className="font-bold">{peso(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-600">
                  <span>Fulfillment</span>
                  <span className="font-bold">{fulfillment === Fulfillment.Delivery ? "Calculated at next step" : "Free pickup"}</span>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-xs uppercase tracking-widest text-stone-500 font-bold">Total</span>
                  <span className="font-black text-2xl" style={{ color: FOREST }}>{peso(total)}</span>
                </div>
              </div>

              {error && (
                <div className="rounded-xl px-3 py-2 text-xs leading-relaxed" style={{ backgroundColor: "#FEE2E2", color: "#7F1D1D", border: "1px solid #FCA5A5" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={formState.isSubmitting || lines.length === 0}
                className="w-full inline-flex items-center justify-between rounded-full px-5 py-3 text-sm font-bold uppercase tracking-widest shadow-sm disabled:opacity-50"
                style={{ backgroundColor: FOREST, color: CREAM }}
              >
                <span>
                  {paymentMethod === PaymentMethod.Online
                    ? "Pay with PayMongo"
                    : "Place order"}
                </span>
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px]"
                  style={{ backgroundColor: PEACH, color: FOREST }}
                >
                  ↗
                </span>
              </button>
              <p className="text-[10px] text-stone-500 text-center">
                {paymentMethod === PaymentMethod.Online
                  ? "You'll be redirected to a secure PayMongo checkout."
                  : fulfillment === Fulfillment.Delivery
                  ? "Your order will be prepared and our team will collect payment on delivery."
                  : "Your order will be prepared. Show your order ID at the hub to pay and pick up."}
              </p>
            </form>
          </aside>
        </div>
      )}
    </section>
  );
}
