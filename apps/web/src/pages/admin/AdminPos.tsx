import { useCallback, useEffect, useMemo, useState } from "react";
import { OrderStatus } from "@snb/shared";
import { useApi } from "../../hooks/useApi";
import { WalkinModal } from "./WalkinModal";

const FOREST = "#1E3D2F";
const CREAM = "#FBF6EA";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";
const MUSTARD = "#F5C97F";

type Item = {
  id: string;
  nameSnapshot: string;
  quantity: number;
  unitPrice: string;
};

type Order = {
  id: string;
  status: OrderStatus;
  fulfillment: "pickup" | "delivery" | "both";
  paymentMethod: "online" | "at_hub";
  total: string;
  deliveryAddress: string | null;
  notes: string | null;
  items: Item[];
  createdAt: string;
  paidAt: string | null;
  cashReceived: string | null;
};

type Column = {
  key: string;
  title: string;
  hint: string;
  accent: string;
  match: (o: Order) => boolean;
};

const COLUMNS: Column[] = [
  {
    key: "new",
    title: "New",
    hint: "Confirm payment & start prepping",
    accent: PEACH_SOFT,
    match: (o) =>
      o.status === OrderStatus.Pending ||
      o.status === OrderStatus.AwaitingPayment ||
      o.status === OrderStatus.Paid,
  },
  {
    key: "preparing",
    title: "Preparing",
    hint: "Being blended / plated",
    accent: PEACH,
    match: (o) => o.status === OrderStatus.Preparing,
  },
  {
    key: "ready",
    title: "Ready · Handover",
    hint: "Customer pickup / out for delivery",
    accent: MUSTARD,
    match: (o) => o.status === OrderStatus.ReadyForPickup || o.status === OrderStatus.OutForDelivery,
  },
  {
    key: "done",
    title: "Done · Today",
    hint: "Completed orders",
    accent: "#DCE7DA",
    match: (o) =>
      o.status === OrderStatus.Completed &&
      new Date(o.createdAt).toDateString() === new Date().toDateString(),
  },
];

const STATUS_BG: Record<string, string> = {
  pending: PEACH_SOFT,
  awaiting_payment: MUSTARD,
  paid: "#DCE7DA",
  preparing: PEACH,
  ready_for_pickup: MUSTARD,
  out_for_delivery: PEACH,
  completed: "#DCE7DA",
  cancelled: "#F1ECDC",
  refunded: "#F1ECDC",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  awaiting_payment: "Awaiting payment",
  paid: "Paid",
  preparing: "Preparing",
  ready_for_pickup: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function peso(n: number | string) {
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AdminPos() {
  const api = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [openCash, setOpenCash] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [walkinOpen, setWalkinOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const list = await api.get<Order[]>("/orders");
      setOrders(list);
      setError(null);
      // Seed the cash-received input from the order's recorded cashOnHand,
      // but don't overwrite anything the operator has already typed.
      setOpenCash((prev) => {
        const next = { ...prev };
        for (const o of list) {
          if (o.cashReceived && !(o.id in next)) {
            next[o.id] = Number(o.cashReceived).toString();
          }
        }
        return next;
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load orders");
    }
  }, [api]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [refresh]);

  async function setStatus(id: string, status: OrderStatus) {
    await api.patch(`/orders/${id}/status`, { status });
    await refresh();
  }

  /** New column → Preparing (one click, also marks paid if at-hub unpaid). */
  async function acceptAndStart(o: Order) {
    await api.patch(`/orders/${o.id}/status`, { status: OrderStatus.Preparing });
    await refresh();
  }
  async function markPaidOnly(o: Order) {
    // Stamp paidAt without touching status, so we can mark paid even after
    // the order has advanced to "preparing".
    await api.patch(`/orders/${o.id}/paid`, {});
    await refresh();
  }
  async function markReady(o: Order) {
    const next = o.fulfillment === "delivery" ? OrderStatus.OutForDelivery : OrderStatus.ReadyForPickup;
    await setStatus(o.id, next);
  }
  async function handover(o: Order) {
    await setStatus(o.id, OrderStatus.Completed);
  }
  async function cancel(o: Order) {
    if (!confirm(`Cancel order #${o.id.slice(0, 8).toUpperCase()}?`)) return;
    await setStatus(o.id, OrderStatus.Cancelled);
  }

  const grouped = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const col of COLUMNS) map.set(col.key, []);
    for (const o of orders) {
      for (const col of COLUMNS) {
        if (col.match(o)) {
          map.get(col.key)!.push(o);
          break;
        }
      }
    }
    // Sort: oldest first for active columns, newest first for done
    for (const col of COLUMNS) {
      const arr = map.get(col.key)!;
      arr.sort((a, b) =>
        col.key === "done"
          ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          : new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    }
    return map;
  }, [orders]);

  const queueValue = orders
    .filter((o) =>
      ([
        OrderStatus.Pending,
        OrderStatus.AwaitingPayment,
        OrderStatus.Paid,
        OrderStatus.Preparing,
        OrderStatus.ReadyForPickup,
        OrderStatus.OutForDelivery,
      ] as OrderStatus[]).includes(o.status),
    )
    .reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="space-y-6" style={{ color: FOREST }}>
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatTile
          label="Active"
          value={
            (grouped.get("new")?.length ?? 0) +
            (grouped.get("preparing")?.length ?? 0) +
            (grouped.get("ready")?.length ?? 0)
          }
          bg={FOREST}
          fg={MUSTARD}
        />
        <StatTile label="Pending value" value={peso(queueValue)} bg={PEACH_SOFT} fg={FOREST} />
        <StatTile
          label="Done today"
          value={grouped.get("done")?.length ?? 0}
          bg={MUSTARD}
          fg={FOREST}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => setWalkinOpen(true)}
          className="text-xs font-bold uppercase tracking-widest rounded-full px-5 py-2.5 shadow-sm hover:opacity-90 inline-flex items-center gap-2"
          style={{ backgroundColor: FOREST, color: CREAM }}
        >
          <span className="text-lg leading-none">+</span>
          <span>New walk-in order</span>
        </button>
        <button
          onClick={refresh}
          className="text-xs font-bold uppercase tracking-widest rounded-full px-4 py-1.5 shadow-sm hover:opacity-90"
          style={{ backgroundColor: PEACH, color: FOREST }}
        >
          ↻ Refresh
        </button>
      </div>

      <WalkinModal
        open={walkinOpen}
        onClose={() => setWalkinOpen(false)}
        onCreated={refresh}
      />

      {error && (
        <div className="rounded-2xl p-4 text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Kanban */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((col) => {
          const cards = grouped.get(col.key) ?? [];
          return (
            <div
              key={col.key}
              className="rounded-2xl flex flex-col min-h-[400px]"
              style={{ backgroundColor: "rgba(255,255,255,0.6)", border: `1px solid ${PEACH_SOFT}` }}
            >
              {/* Column header */}
              <div
                className="px-4 py-3 rounded-t-2xl flex items-center justify-between"
                style={{ backgroundColor: col.accent, color: FOREST }}
              >
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold opacity-80">
                    {col.hint}
                  </p>
                  <h2 className="font-display text-lg leading-tight">{col.title}</h2>
                </div>
                <span
                  className="w-8 h-8 rounded-full inline-flex items-center justify-center font-black"
                  style={{ backgroundColor: "white", color: FOREST }}
                >
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="p-3 flex flex-col gap-3 flex-1">
                {cards.length === 0 && (
                  <div className="flex-1 flex items-center justify-center text-xs text-stone-400 italic min-h-[80px]">
                    Empty
                  </div>
                )}
                {cards.map((o) => (
                  <Card
                    key={o.id}
                    order={o}
                    column={col.key}
                    cash={openCash[o.id] ?? ""}
                    onCashChange={(v) => setOpenCash((s) => ({ ...s, [o.id]: v }))}
                    onAcceptAndStart={() => acceptAndStart(o)}
                    onMarkPaid={() => markPaidOnly(o)}
                    onMarkReady={() => markReady(o)}
                    onHandover={() => handover(o)}
                    onCancel={() => cancel(o)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  bg,
  fg,
}: {
  label: string;
  value: string | number;
  bg: string;
  fg: string;
}) {
  return (
    <div
      className="rounded-2xl p-3 md:p-4 shadow-sm overflow-hidden"
      style={{ backgroundColor: bg, color: fg }}
    >
      <p className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold opacity-80 truncate">
        {label}
      </p>
      <p className="text-lg md:text-3xl font-black leading-none mt-1 truncate">{value}</p>
    </div>
  );
}

function Card({
  order,
  column,
  cash,
  onCashChange,
  onAcceptAndStart,
  onMarkPaid,
  onMarkReady,
  onHandover,
  onCancel,
}: {
  order: Order;
  column: string;
  cash: string;
  onCashChange: (v: string) => void;
  onAcceptAndStart: () => void;
  onMarkPaid: () => void;
  onMarkReady: () => void;
  onHandover: () => void;
  onCancel: () => void;
}) {
  const isAtHub = order.paymentMethod === "at_hub";
  const isPaid =
    !!order.paidAt ||
    order.status === OrderStatus.Paid ||
    order.status === OrderStatus.Completed;
  const owesCash = isAtHub && !isPaid;

  const cashNum = parseFloat(cash);
  const validCash = !Number.isNaN(cashNum) && cashNum > 0;
  const change = validCash ? cashNum - Number(order.total) : 0;
  const insufficient = validCash && change < 0;

  return (
    <article
      className="rounded-xl overflow-hidden shadow-sm bg-white flex flex-col"
      style={{ border: `1px solid ${PEACH_SOFT}` }}
    >
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ backgroundColor: CREAM }}>
        <div className="min-w-0">
          <a
            href={`/orders/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-display text-sm leading-none truncate inline-flex items-center gap-1 hover:underline"
            style={{ color: FOREST }}
            title="Open full order details in a new tab"
          >
            <span>#{order.id.slice(0, 8).toUpperCase()}</span>
            <span className="text-[10px] opacity-60">↗</span>
          </a>
          <p className="text-[10px] text-stone-500 mt-0.5">{timeAgo(order.createdAt)}</p>
        </div>
        <span
          className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest whitespace-nowrap"
          style={{ backgroundColor: STATUS_BG[order.status] ?? PEACH_SOFT, color: FOREST }}
        >
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {/* Items (compact list) */}
      <ul className="px-3 py-2 space-y-1 text-xs">
        {order.items.slice(0, 4).map((i) => (
          <li key={i.id} className="flex items-center gap-2">
            <span className="font-black w-6 text-center" style={{ color: PEACH }}>
              ×{i.quantity}
            </span>
            <span className="flex-1 truncate">{i.nameSnapshot}</span>
          </li>
        ))}
        {order.items.length > 4 && (
          <li className="text-[10px] text-stone-500 italic pl-8">
            +{order.items.length - 4} more
          </li>
        )}
      </ul>

      {/* Meta strip */}
      <div className="px-3 pb-2 flex items-center justify-between text-[10px] uppercase tracking-widest font-bold">
        <span style={{ color: FOREST }}>
          {order.fulfillment === "delivery" ? "🚚 Delivery" : "🥤 Pickup"}
        </span>
        <span style={{ color: isPaid ? FOREST : "#a06424" }}>
          {isAtHub ? "💵 At hub" : "💳 Online"} · {isPaid ? "Paid" : "Unpaid"}
        </span>
      </div>

      {order.deliveryAddress && (
        <p className="px-3 pb-2 text-[11px] text-stone-600">📍 {order.deliveryAddress}</p>
      )}
      {order.notes && (
        <p className="px-3 pb-2 text-[11px] text-stone-700 italic">"{order.notes}"</p>
      )}

      {/* Total */}
      <div
        className="px-3 py-2 flex items-center justify-between border-t"
        style={{ backgroundColor: CREAM, borderColor: PEACH_SOFT }}
      >
        <span className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Total</span>
        <span className="text-lg font-black">{peso(order.total)}</span>
      </div>

      {/* Cash input (only if cash still owed AND in the New column) */}
      {owesCash && column === "new" && (
        <div className="px-3 py-2 border-t" style={{ borderColor: PEACH_SOFT }}>
          <label className="text-[9px] uppercase tracking-widest font-bold text-stone-500 block mb-1">
            Cash received
          </label>
          <div
            className="flex items-center rounded-lg px-2 py-1.5 text-xs"
            style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
          >
            <span className="text-stone-500 mr-1">₱</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={cash}
              onChange={(e) => onCashChange(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent outline-none font-bold"
              style={{ color: FOREST }}
            />
            {cash && (
              <button
                type="button"
                onClick={() => onCashChange("")}
                className="text-stone-400 hover:text-stone-600 text-xs ml-1"
              >
                ✕
              </button>
            )}
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
      )}

      {/* Actions per column */}
      <div className="px-3 py-2 flex flex-col gap-1.5 border-t" style={{ borderColor: PEACH_SOFT }}>
        {/* Cash-owed reminder available in any active column */}
        {owesCash && column !== "done" && (
          <button
            onClick={onMarkPaid}
            className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ backgroundColor: MUSTARD, color: FOREST }}
          >
            💵 Mark as paid
          </button>
        )}
        {column === "new" && (
          <PrimaryBtn onClick={onAcceptAndStart}>
            {owesCash ? "Accept & start" : "Start preparing"}
          </PrimaryBtn>
        )}
        {column === "preparing" && (
          <PrimaryBtn onClick={onMarkReady}>
            {order.fulfillment === "delivery" ? "🚚 Out for delivery" : "✓ Mark ready"}
          </PrimaryBtn>
        )}
        {column === "ready" && (
          <PrimaryBtn onClick={onHandover}>
            🤝 Handover · Complete
          </PrimaryBtn>
        )}
        {column === "done" ? (
          <span className="text-[10px] uppercase tracking-widest font-bold text-stone-400 text-center py-1">
            Completed
          </span>
        ) : (
          <button
            onClick={onCancel}
            className="text-[10px] uppercase tracking-widest font-bold text-stone-400 hover:text-red-600 py-1"
          >
            Cancel order
          </button>
        )}
      </div>
    </article>
  );
}

function PrimaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-2 text-[10px] font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition flex items-center justify-between gap-2"
      style={{ backgroundColor: FOREST, color: CREAM }}
    >
      <span>{children}</span>
      <span
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px]"
        style={{ backgroundColor: PEACH, color: FOREST }}
      >
        ↗
      </span>
    </button>
  );
}
