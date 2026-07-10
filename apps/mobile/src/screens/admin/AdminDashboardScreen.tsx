import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApi } from "../../auth/AuthContext";
import { colors, peso, STATUS_META } from "../../theme";
import { Card, ErrorBox } from "../../components/ui";

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

export function AdminDashboardScreen() {
  const api = useApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setStats(await api.get<Stats>("/orders/stats/summary"));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stats");
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (error) {
    return (
      <View style={{ padding: 16 }}>
        <ErrorBox message={error} />
      </View>
    );
  }
  if (!stats) {
    return <Text style={{ padding: 16, color: colors.stone500 }}>Loading dashboard…</Text>;
  }

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.revenue));

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
    >
      <View style={styles.kpiGrid}>
        <Kpi label="Revenue" value={peso(stats.totalRevenue)} bg={colors.sage} />
        <Kpi label="Orders" value={String(stats.totalOrders)} bg={colors.peachSoft} />
        <Kpi label="Units sold" value={String(stats.totalUnits)} bg={colors.mustard} />
        <Kpi label="Avg order" value={peso(stats.avgOrderValue)} bg={colors.sand} />
      </View>

      <Card style={{ marginTop: 16 }}>
        <Text style={styles.sectionTitle}>DAILY REVENUE</Text>
        {stats.daily.length === 0 ? (
          <Text style={{ color: colors.stone500, fontSize: 12 }}>No data yet.</Text>
        ) : (
          stats.daily.map((d) => (
            <View key={d.date} style={styles.dailyRow}>
              <Text style={styles.dailyDate}>
                {new Date(d.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.max(2, (d.revenue / maxDaily) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.dailyValue}>{peso(d.revenue)}</Text>
            </View>
          ))
        )}
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={styles.sectionTitle}>ORDERS BY STATUS</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(stats.statusBreakdown).map(([status, count]) => {
            const meta = STATUS_META[status] ?? { label: status, bg: colors.peachSoft };
            return (
              <View key={status} style={[styles.breakdownPill, { backgroundColor: meta.bg }]}>
                <Text style={[styles.breakdownText, { color: meta.color ?? colors.forest }]}>
                  {meta.label} · {count}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={styles.sectionTitle}>FULFILLMENT & PAYMENT</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {Object.entries(stats.fulfillmentBreakdown).map(([k, v]) => (
            <View key={k} style={[styles.breakdownPill, { backgroundColor: colors.sand }]}>
              <Text style={styles.breakdownText}>{k} · {v}</Text>
            </View>
          ))}
          {Object.entries(stats.paymentBreakdown).map(([k, v]) => (
            <View key={k} style={[styles.breakdownPill, { backgroundColor: colors.sage }]}>
              <Text style={styles.breakdownText}>{k === "at_hub" ? "at hub" : k} · {v}</Text>
            </View>
          ))}
        </View>
      </Card>

      <TopList title="TOP MENU ITEMS" items={stats.topMenu} />
      <TopList title="TOP PRODUCTS" items={stats.topProducts} />
    </ScrollView>
  );
}

function Kpi({ label, value, bg }: { label: string; value: string; bg: string }) {
  return (
    <View style={[styles.kpi, { backgroundColor: bg }]}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );
}

function TopList({ title, items }: { title: string; items: TopItem[] }) {
  return (
    <Card style={{ marginTop: 12 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.length === 0 ? (
        <Text style={{ color: colors.stone500, fontSize: 12 }}>No sales yet.</Text>
      ) : (
        items.map((t, i) => (
          <View key={t.itemId} style={styles.topRow}>
            <Text style={styles.topRank}>{i + 1}</Text>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.topName} numberOfLines={1}>{t.name}</Text>
              <Text style={styles.topMeta}>{t.quantity} sold</Text>
            </View>
            <Text style={{ fontWeight: "900", color: colors.forest, fontSize: 13 }}>
              {peso(t.revenue)}
            </Text>
          </View>
        ))
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  kpi: {
    flexBasis: "47%",
    flexGrow: 1,
    borderRadius: 18,
    padding: 16,
  },
  kpiLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "700",
    color: colors.forest,
    opacity: 0.7,
  },
  kpiValue: { fontSize: 20, fontWeight: "900", color: colors.forest, marginTop: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    color: colors.stone500,
    marginBottom: 10,
  },
  dailyRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  dailyDate: { width: 52, fontSize: 11, color: colors.stone500 },
  barTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.sand,
    overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 5, backgroundColor: colors.peach },
  dailyValue: { width: 84, textAlign: "right", fontSize: 11, fontWeight: "700", color: colors.forest },
  breakdownPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  breakdownText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.forest,
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  topRank: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.peachSoft,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "900",
    fontSize: 11,
    color: colors.forest,
    overflow: "hidden",
  },
  topName: { fontWeight: "700", color: colors.forest, fontSize: 13 },
  topMeta: { fontSize: 11, color: colors.stone500 },
});
