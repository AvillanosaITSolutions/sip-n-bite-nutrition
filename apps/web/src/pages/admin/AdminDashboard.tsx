import { useEffect, useState } from "react";
import { useApi } from "../../hooks/useApi";

const FOREST = "#1E3D2F";
const CREAM = "#FBF6EA";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";
const MUSTARD = "#F5C97F";

type TopItem = {
  itemId: string;
  itemType: string;
  name: string;
  quantity: number;
  revenue: number;
};

type Stats = {
  totalRevenue: number;
  totalOrders: number;
  totalUnits: number;
  avgOrderValue: number;
  statusBreakdown: Record<string, number>;
  fulfillmentBreakdown: Record<string, number>;
  paymentBreakdown: Record<string, number>;
  topMenu: TopItem[];
  topProducts: TopItem[];
  daily: { date: string; orders: number; revenue: number }[];
};

function peso(n: number) {
  return `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

const STATUS_BG: Record<string, string> = {
  pending: PEACH_SOFT,
  awaiting_payment: MUSTARD,
  paid: "#DCE7DA",
  preparing: PEACH,
  ready_for_pickup: MUSTARD,
  out_for_delivery: PEACH,
  completed: "#DCE7DA",
  cancelled: "#F1ECDC",
};

export function AdminDashboard() {
  const api = useApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Stats>("/orders/stats/summary")
      .then(setStats)
      .catch((e) => setError(e?.message ?? "Failed to load stats"));
  }, [api]);

  if (error) {
    return (
      <div className="rounded-2xl p-6 bg-red-50 border border-red-200 text-red-800 text-sm">
        {error}
      </div>
    );
  }

  if (!stats) {
    return <p className="text-stone-500">Loading dashboard…</p>;
  }

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.revenue));

  return (
    <div className="space-y-6" style={{ color: FOREST }}>
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total revenue", value: peso(stats.totalRevenue), bg: FOREST, fg: MUSTARD, dark: true },
          { label: "Orders", value: stats.totalOrders.toLocaleString(), bg: MUSTARD, fg: FOREST },
          { label: "Items sold", value: stats.totalUnits.toLocaleString(), bg: PEACH_SOFT, fg: FOREST },
          { label: "Avg. order", value: peso(stats.avgOrderValue), bg: PEACH, fg: FOREST },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl p-5 shadow-sm"
            style={{ backgroundColor: k.bg, color: k.fg }}
          >
            <p className="text-[11px] uppercase tracking-widest font-bold opacity-80">{k.label}</p>
            <p className="text-2xl md:text-3xl font-black mt-2 leading-none">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Daily revenue chart */}
      <div
        className="rounded-2xl p-4 md:p-5 shadow-sm overflow-hidden"
        style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
      >
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest font-bold text-stone-500">Last 14 days</p>
            <h2 className="font-display text-xl md:text-2xl">REVENUE TREND</h2>
          </div>
          <p className="text-xs text-stone-500">
            Peak: <strong className="text-stone-700">{peso(maxDaily)}</strong>
          </p>
        </div>
        <div className="flex items-stretch gap-0.5 sm:gap-1.5 h-40 md:h-48 pb-6">
          {stats.daily.map((d) => {
            const h = maxDaily ? Math.max(2, (d.revenue / maxDaily) * 100) : 2;
            return (
              <div
                key={d.date}
                className="flex-1 relative flex flex-col justify-end group"
                title={`${shortDate(d.date)} · ${peso(d.revenue)} · ${d.orders} orders`}
              >
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: `${h}%`,
                    backgroundColor: d.revenue > 0 ? PEACH : "#F1ECDC",
                  }}
                />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 hidden sm:block text-[9px] text-stone-500 whitespace-nowrap">
                  {shortDate(d.date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top items */}
      <div className="grid md:grid-cols-2 gap-6">
        <TopList title="TOP SHAKES & SNACKS" emoji="🥤" items={stats.topMenu} />
        <TopList title="TOP HERBALIFE PRODUCTS" emoji="🌿" items={stats.topProducts} />
      </div>

      {/* Breakdown cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <BreakdownCard title="ORDER STATUS" data={stats.statusBreakdown} colorize={(k) => STATUS_BG[k] ?? PEACH_SOFT} />
        <BreakdownCard title="FULFILLMENT" data={stats.fulfillmentBreakdown} colorize={() => PEACH_SOFT} />
        <BreakdownCard title="PAYMENT METHOD" data={stats.paymentBreakdown} colorize={() => MUSTARD} />
      </div>
    </div>
  );
}

function TopList({ title, emoji, items }: { title: string; emoji: string; items: TopItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.quantity));
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
    >
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest font-bold text-stone-500">Best sellers</p>
          <h2 className="font-display text-xl md:text-2xl">{title}</h2>
        </div>
        <span className="text-2xl">{emoji}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500">No sales yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, idx) => (
            <li key={it.itemId}>
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span
                    className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{ backgroundColor: idx < 3 ? MUSTARD : "#F1ECDC", color: FOREST }}
                  >
                    {idx + 1}
                  </span>
                  <p className="font-extrabold text-sm truncate" title={it.name}>{it.name}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black tabular-nums">{it.quantity}<span className="text-stone-500 font-normal ml-1">sold</span></p>
                  <p className="text-[11px] text-stone-500">{peso(it.revenue)}</p>
                </div>
              </div>
              <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F1ECDC" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(it.quantity / max) * 100}%`,
                    backgroundColor: PEACH,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BreakdownCard({
  title,
  data,
  colorize,
}: {
  title: string;
  data: Record<string, number>;
  colorize: (key: string) => string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
    >
      <h2 className="font-display text-xl md:text-2xl mb-4">{title}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-stone-500">No data yet.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map(([k, v]) => {
            const pct = total ? Math.round((v / total) * 100) : 0;
            return (
              <li key={k}>
                <div className="flex items-center justify-between text-xs">
                  <span className="capitalize font-bold">{k.replace(/_/g, " ")}</span>
                  <span className="font-black">{v} · {pct}%</span>
                </div>
                <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#F1ECDC" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: colorize(k) }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
