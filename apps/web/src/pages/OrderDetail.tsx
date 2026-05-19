import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useApi } from "../hooks/useApi";

const CREAM = "#FBF6EA";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";
const MUSTARD = "#F5C97F";
const FOREST = "#1E3D2F";

type Order = {
  id: string;
  status: string;
  fulfillment: string;
  paymentMethod: "online" | "at_hub";
  total: string;
  deliveryAddress: string | null;
  paymongoCheckoutUrl: string | null;
  items: { id: string; nameSnapshot: string; quantity: number; unitPrice: string }[];
  createdAt?: string;
};

const STATUS_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  pending: { label: "Pending", bg: PEACH_SOFT, color: FOREST },
  awaiting_payment: { label: "Awaiting payment", bg: MUSTARD, color: FOREST },
  paid: { label: "Paid", bg: "#DCE7DA", color: FOREST },
  preparing: { label: "Preparing", bg: PEACH, color: FOREST },
  ready_for_pickup: { label: "Ready", bg: MUSTARD, color: FOREST },
  out_for_delivery: { label: "Out for delivery", bg: PEACH, color: FOREST },
  completed: { label: "Completed", bg: "#DCE7DA", color: FOREST },
  cancelled: { label: "Cancelled", bg: "#F1ECDC", color: "#888" },
};

function peso(n: number | string) {
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [search] = useSearchParams();
  const justPlaced = search.get("placed") === "1";
  const api = useApi();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get<Order>(`/orders/${id}`)
      .then((o) => setOrder(o))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [api, id]);

  if (loading) {
    return (
      <section className="py-12 text-center text-stone-500">
        Loading your order…
      </section>
    );
  }

  if (!order) {
    return (
      <section className="py-12 text-center">
        <p className="font-display text-3xl" style={{ color: FOREST }}>Order not found</p>
        <p className="text-stone-500 mt-2">It may have been cancelled or the link is wrong.</p>
        <Link
          to="/orders"
          className="inline-block mt-6 rounded-full px-5 py-2.5 text-sm font-bold uppercase tracking-widest"
          style={{ backgroundColor: PEACH, color: FOREST }}
        >
          See my orders
        </Link>
      </section>
    );
  }

  const status = STATUS_LABELS[order.status] ?? { label: order.status, bg: PEACH_SOFT, color: FOREST };
  const isPaid = order.status === "paid" || order.status === "completed";
  const needsPayment = order.status === "awaiting_payment" && order.paymongoCheckoutUrl;

  return (
    <section className="py-8 max-w-3xl mx-auto" style={{ color: FOREST }}>
      {/* Celebration banner */}
      {justPlaced && (
        <div
          className="rounded-3xl p-6 mb-6 shadow-sm relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${MUSTARD} 0%, ${PEACH} 100%)`,
            animation: "orderPlacedIn 500ms cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-sm"
              style={{ backgroundColor: "white" }}
            >
              🎉
            </div>
            <div className="flex-1">
              <p className="font-script text-2xl md:text-3xl" style={{ color: FOREST }}>
                cheers!
              </p>
              <p className="font-display text-2xl md:text-3xl leading-tight" style={{ color: FOREST }}>
                Your order is in.
              </p>
              <p className="text-sm mt-1 text-stone-800">
                We're getting it ready. You'll see status updates right here.
              </p>
            </div>
          </div>
          <style>{`
            @keyframes orderPlacedIn {
              from { opacity: 0; transform: translateY(-12px) scale(0.98); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-stone-500">Order</p>
          <h1 className="font-display text-3xl md:text-4xl leading-none">
            #{order.id.slice(0, 8).toUpperCase()}
          </h1>
          {order.createdAt && (
            <p className="text-xs text-stone-500 mt-1">
              Placed {new Date(order.createdAt).toLocaleString()}
            </p>
          )}
        </div>
        <span
          className="rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
          style={{ backgroundColor: status.bg, color: status.color }}
        >
          {status.label}
        </span>
      </div>

      {/* Card */}
      <div
        className="rounded-3xl overflow-hidden shadow-sm"
        style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
      >
        {/* Fulfillment row */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: CREAM }}>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500">
              Fulfillment
            </p>
            <p className="font-extrabold capitalize">{order.fulfillment}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500">
              Payment
            </p>
            <p className="font-extrabold capitalize">
              {order.paymentMethod === "online" ? "Online" : "At the hub"}
            </p>
          </div>
        </div>

        {/* Items */}
        <ul className="divide-y" style={{ borderColor: PEACH_SOFT }}>
          {order.items.map((i) => (
            <li key={i.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0"
                  style={{ backgroundColor: PEACH_SOFT, color: FOREST }}
                >
                  ×{i.quantity}
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold leading-tight">{i.nameSnapshot}</p>
                  <p className="text-xs text-stone-500">
                    {peso(i.unitPrice)} each
                  </p>
                </div>
              </div>
              <span className="font-black whitespace-nowrap">
                {peso(Number(i.unitPrice) * i.quantity)}
              </span>
            </li>
          ))}
        </ul>

        {/* Total */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ backgroundColor: CREAM }}
        >
          <span className="text-xs uppercase tracking-widest font-bold text-stone-500">
            Total
          </span>
          <span className="text-2xl font-black" style={{ color: FOREST }}>
            {peso(order.total)}
          </span>
        </div>
      </div>

      {/* Delivery address */}
      {order.deliveryAddress && (
        <div
          className="mt-4 rounded-2xl p-5"
          style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
        >
          <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500">
            Deliver to
          </p>
          <p className="font-extrabold mt-1 leading-snug">{order.deliveryAddress}</p>
        </div>
      )}

      {/* Payment instruction */}
      {order.paymentMethod === "at_hub" && !isPaid && (
        <div
          className="mt-4 rounded-2xl p-5 flex items-start gap-3"
          style={{ backgroundColor: MUSTARD, color: FOREST }}
        >
          <div className="text-2xl">💵</div>
          <div className="flex-1">
            <p className="font-extrabold leading-tight">
              {order.fulfillment === "delivery" ? "Cash on delivery" : "Pay at the hub"}
            </p>
            <p className="text-sm mt-1 leading-relaxed">
              {order.fulfillment === "delivery"
                ? `Have ${peso(order.total)} ready when our courier arrives.`
                : `Show this order at the Sip 'N Bite hub and settle ${peso(order.total)} at the counter.`}
            </p>
          </div>
        </div>
      )}

      {/* Continue to payment */}
      {needsPayment && (
        <a
          href={order.paymongoCheckoutUrl!}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 text-sm font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition"
          style={{ backgroundColor: PEACH, color: FOREST }}
        >
          Continue to payment ↗
        </a>
      )}

      {/* Footer actions */}
      <div className="mt-6 flex flex-wrap gap-3 justify-between items-center">
        <Link
          to="/orders"
          className="text-xs font-bold uppercase tracking-widest hover:opacity-70"
          style={{ color: FOREST }}
        >
          ← All my orders
        </Link>
        <Link
          to="/menu"
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest"
          style={{ backgroundColor: "white", color: FOREST, border: `1px solid ${FOREST}20` }}
        >
          Order again ↗
        </Link>
      </div>
    </section>
  );
}
