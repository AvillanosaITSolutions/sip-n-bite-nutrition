import { useEffect, useMemo, useState } from "react";
import { Select, Table } from "flowbite-react";
import { OrderStatus } from "@snb/shared";
import { useApi } from "../../hooks/useApi";
import { Highlight } from "../../components/Highlight";

const FOREST = "#1E3D2F";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";
const MUSTARD = "#F5C97F";

type Row = {
  id: string;
  status: OrderStatus;
  fulfillment: string;
  total: string;
  createdAt: string;
};

const statuses = Object.values(OrderStatus);

const STATUS_BG: Record<string, string> = {
  pending: PEACH_SOFT,
  awaiting_payment: MUSTARD,
  paid: "#DCE7DA",
  preparing: PEACH,
  ready_for_pickup: MUSTARD,
  out_for_delivery: PEACH,
  completed: "#DCE7DA",
  cancelled: "#E7D5D0",
  refunded: "#E7D5D0",
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

export function AdminOrders() {
  const api = useApi();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");

  async function refresh(silent = false) {
    if (!silent) setLoading(true);
    try {
      setRows(await api.get<Row[]>("/orders"));
    } finally {
      if (!silent) setLoading(false);
    }
  }
  useEffect(() => {
    refresh().catch(() => {
      setRows([]);
      setLoading(false);
    });
  }, []);

  async function setStatus(id: string, status: OrderStatus) {
    await api.patch(`/orders/${id}/status`, { status });
    refresh(true);
  }

  const visible = useMemo(() => {
    const byStatus = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.fulfillment.toLowerCase().includes(q) ||
        STATUS_LABEL[r.status]?.toLowerCase().includes(q),
    );
  }, [rows, query, statusFilter]);

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-white border border-stone-200 flex-1 max-w-md">
          <span className="text-stone-400">🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order ID, status…"
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-stone-400 hover:text-stone-600 text-sm"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            sizing="sm"
          >
            <option value="all">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
            ))}
          </Select>
          <p className="text-xs uppercase tracking-widest font-bold text-stone-500 whitespace-nowrap">
            {loading ? "Loading…" : `${visible.length} of ${rows.length}`}
          </p>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded border p-10 text-center text-stone-500 text-sm">
          <span className="inline-block w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin align-middle mr-2" />
          Loading orders…
        </div>
      )}
      {!loading && visible.length === 0 && (
        <div className="bg-white rounded border p-10 text-center text-stone-500 text-sm">
          {rows.length === 0 ? "No orders yet." : "No orders match your filters."}
        </div>
      )}

      {/* Mobile cards */}
      {!loading && visible.length > 0 && (
        <div className="md:hidden space-y-3">
          {visible.map((o) => (
            <div key={o.id} className="bg-white rounded-lg border border-stone-200 p-3">
              <div className="flex items-start justify-between gap-2">
                <a
                  href={`/orders/${o.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs font-bold hover:underline inline-flex items-center gap-1"
                  style={{ color: FOREST }}
                >
                  <Highlight text={`#${o.id.slice(0, 8).toUpperCase()}`} query={query} />
                  <span className="opacity-50 text-[10px]">↗</span>
                </a>
                <span className="font-black text-sm">₱{o.total}</span>
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">
                {new Date(o.createdAt).toLocaleString()}
              </p>
              <div className="flex items-center justify-between mt-3 gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-stone-500 capitalize">
                  {o.fulfillment}
                </span>
                <Select
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                  sizing="sm"
                  style={{
                    backgroundColor: STATUS_BG[o.status] ?? PEACH_SOFT,
                    fontWeight: 600,
                  }}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                  ))}
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="hidden md:block bg-white rounded border overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.HeadCell>Order</Table.HeadCell>
              <Table.HeadCell>Fulfillment</Table.HeadCell>
              <Table.HeadCell>Total</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Placed</Table.HeadCell>
              <Table.HeadCell>
                <span className="sr-only">Actions</span>
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {visible.map((o) => (
                <Table.Row key={o.id} className="hover:bg-amber-50/40">
                  <Table.Cell>
                    <a
                      href={`/orders/${o.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs font-bold hover:underline inline-flex items-center gap-1"
                      style={{ color: FOREST }}
                      title="Open full order detail in a new tab"
                    >
                      <Highlight text={`#${o.id.slice(0, 8).toUpperCase()}`} query={query} />
                      <span className="opacity-50 text-[10px]">↗</span>
                    </a>
                  </Table.Cell>
                  <Table.Cell className="capitalize">
                    <Highlight text={o.fulfillment} query={query} />
                  </Table.Cell>
                  <Table.Cell className="font-bold">₱{o.total}</Table.Cell>
                  <Table.Cell>
                    <Select
                      value={o.status}
                      onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                      sizing="sm"
                      style={{
                        backgroundColor: STATUS_BG[o.status] ?? PEACH_SOFT,
                        fontWeight: 600,
                      }}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
                      ))}
                    </Select>
                  </Table.Cell>
                  <Table.Cell className="text-xs text-stone-500 whitespace-nowrap">
                    {new Date(o.createdAt).toLocaleString()}
                  </Table.Cell>
                  <Table.Cell>
                    <a
                      href={`/orders/${o.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold uppercase tracking-widest hover:underline"
                      style={{ color: PEACH }}
                    >
                      View ↗
                    </a>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
    </div>
  );
}
