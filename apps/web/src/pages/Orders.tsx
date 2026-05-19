import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { OrderStatus, Fulfillment } from "@snb/shared";
import { useApi } from "../hooks/useApi";

const CREAM = "#FBF6EA";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";
const MUSTARD = "#F5C97F";
const FOREST = "#1E3D2F";

type Order = {
  id: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  total: string;
  createdAt: string;
};

const STATUS_STYLE: Record<string, { label: string; bg: string }> = {
  pending: { label: "Pending", bg: PEACH_SOFT },
  awaiting_payment: { label: "Awaiting payment", bg: MUSTARD },
  paid: { label: "Paid", bg: "#DCE7DA" },
  preparing: { label: "Preparing", bg: PEACH },
  ready_for_pickup: { label: "Ready", bg: MUSTARD },
  out_for_delivery: { label: "Out for delivery", bg: PEACH },
  completed: { label: "Completed", bg: "#DCE7DA" },
  cancelled: { label: "Cancelled", bg: "#F1ECDC" },
};

function peso(n: string) {
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

export function OrdersPage() {
  const api = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<Order[]>("/orders/mine")
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [api]);

  return (
    <section className="py-8" style={{ color: FOREST }}>
      <div className="mb-8">
        <p className="font-script text-3xl md:text-4xl" style={{ color: PEACH }}>
          your sip history
        </p>
        <h1 className="font-display text-4xl md:text-5xl">MY ORDERS</h1>
      </div>

      {loading && (
        <p className="text-stone-500">Loading…</p>
      )}

      {!loading && orders.length === 0 && (
        <div
          className="rounded-3xl p-10 text-center"
          style={{ backgroundColor: CREAM, border: `1px solid ${PEACH_SOFT}` }}
        >
          <div className="text-5xl mb-3">🥤</div>
          <p className="font-display text-2xl">No orders yet</p>
          <p className="text-sm text-stone-600 mt-1 max-w-sm mx-auto">
            Looks like you haven't sipped with us yet. Pick a shake or a snack
            and we'll get blending.
          </p>
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-widest mt-5 shadow-sm hover:opacity-90 transition"
            style={{ backgroundColor: PEACH, color: FOREST }}
          >
            Browse menu ↗
          </Link>
        </div>
      )}

      <div className="grid gap-3">
        {orders.map((o) => {
          const s = STATUS_STYLE[o.status] ?? { label: o.status, bg: PEACH_SOFT };
          return (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="rounded-2xl p-5 shadow-sm hover:shadow-md transition flex items-center justify-between gap-4 flex-wrap"
              style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500">
                  Order
                </p>
                <p className="font-display text-xl leading-none">
                  #{o.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {new Date(o.createdAt).toLocaleString()} · {o.fulfillment}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                  style={{ backgroundColor: s.bg, color: FOREST }}
                >
                  {s.label}
                </span>
                <span className="text-lg font-black" style={{ color: FOREST }}>
                  {peso(o.total)}
                </span>
                <span className="text-xs font-bold opacity-50">↗</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
