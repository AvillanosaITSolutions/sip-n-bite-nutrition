import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OrderStatus } from "@snb/shared";
import { useApi } from "../../auth/AuthContext";
import { colors, peso, STATUS_META } from "../../theme";
import type { RootStackParamList } from "../../navigation/types";
import { EmptyState, SearchBar, StatusBadge } from "../../components/ui";

type Row = {
  id: string;
  status: OrderStatus;
  fulfillment: string;
  total: string;
  createdAt: string;
};

const STATUSES = Object.values(OrderStatus);

export function AdminOrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const api = useApi();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.get<Row[]>("/orders"));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function setStatus(id: string, status: OrderStatus) {
    await api.patch(`/orders/${id}/status`, { status });
    setExpandedId(null);
    load();
  }

  async function markPaid(id: string) {
    await api.patch(`/orders/${id}/paid`, {});
    setExpandedId(null);
    load();
  }

  const visible = useMemo(() => {
    const byStatus = statusFilter === "all" ? rows : rows.filter((r) => r.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter((r) => r.id.toLowerCase().includes(q));
  }, [rows, query, statusFilter]);

  return (
    <FlatList
      data={visible}
      keyExtractor={(r) => r.id}
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
      ListHeaderComponent={
        <View>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search by order ID…" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <FilterChip
                label="All"
                active={statusFilter === "all"}
                onPress={() => setStatusFilter("all")}
              />
              {STATUSES.map((s) => (
                <FilterChip
                  key={s}
                  label={STATUS_META[s]?.label ?? s}
                  active={statusFilter === s}
                  onPress={() => setStatusFilter(s)}
                />
              ))}
            </View>
          </ScrollView>
        </View>
      }
      ListEmptyComponent={
        loading ? (
          <Text style={{ color: colors.stone500 }}>Loading…</Text>
        ) : (
          <EmptyState emoji="📦" title="No orders" body="Nothing matches this filter." />
        )
      }
      renderItem={({ item: o }) => {
        const expanded = expandedId === o.id;
        return (
          <View style={styles.card}>
            <Pressable
              onPress={() => navigation.navigate("OrderDetail", { id: o.id })}
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowId}>#{o.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={styles.rowMeta}>
                  {new Date(o.createdAt).toLocaleString()} · {o.fulfillment}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <StatusBadge status={o.status} />
                <Text style={{ fontWeight: "900", color: colors.forest }}>{peso(o.total)}</Text>
              </View>
            </Pressable>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
              <Pressable
                onPress={() => setExpandedId(expanded ? null : o.id)}
                style={styles.actionBtn}
              >
                <Text style={styles.actionText}>{expanded ? "Hide status ▲" : "Set status ▼"}</Text>
              </Pressable>
              <Pressable onPress={() => markPaid(o.id)} style={[styles.actionBtn, { backgroundColor: colors.sage }]}>
                <Text style={styles.actionText}>Mark paid</Text>
              </Pressable>
            </View>

            {expanded && (
              <View style={styles.statusGrid}>
                {STATUSES.map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(o.id, s)}
                    style={[
                      styles.statusOption,
                      {
                        backgroundColor: STATUS_META[s]?.bg ?? colors.peachSoft,
                        opacity: s === o.status ? 0.4 : 1,
                      },
                    ]}
                    disabled={s === o.status}
                  >
                    <Text style={styles.statusOptionText}>{STATUS_META[s]?.label ?? s}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.forest : colors.white,
          borderColor: active ? colors.forest : colors.peachSoft,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.cream : colors.forest },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  rowId: { fontSize: 16, fontWeight: "900", color: colors.forest },
  rowMeta: { fontSize: 11, color: colors.stone500, marginTop: 2 },
  actionBtn: {
    backgroundColor: colors.peachSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.forest,
  },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  statusOption: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusOptionText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.forest,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
