import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Fulfillment, OrderStatus } from "@snb/shared";
import { useApi, useAuth } from "../auth/AuthContext";
import { colors, peso } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { Button, EmptyState, ScreenTitle, StatusBadge } from "../components/ui";

type Order = {
  id: string;
  status: OrderStatus;
  fulfillment: Fulfillment;
  total: string;
  createdAt: string;
};

export function OrdersScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthenticated, isLoading, login } = useAuth();
  const api = useApi();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      setOrders(await api.get<Order[]>("/orders/mine"));
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [api, isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <FlatList
        data={orders}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
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
        ListHeaderComponent={<ScreenTitle script="your sip history" title="MY ORDERS" />}
        ListEmptyComponent={
          !isAuthenticated && !isLoading ? (
            <View>
              <EmptyState
                emoji="🔐"
                title="Sign in to see your orders"
                body="Your order history lives in your Sip 'N Bite account."
              />
              <Button label="Sign in" onPress={login} style={{ marginTop: 12 }} />
            </View>
          ) : loading ? (
            <Text style={{ color: colors.stone500 }}>Loading…</Text>
          ) : (
            <EmptyState
              emoji="🥤"
              title="No orders yet"
              body="Looks like you haven't sipped with us yet. Pick a shake or a snack and we'll get blending."
            />
          )
        }
        renderItem={({ item: o }) => (
          <Pressable
            onPress={() => navigation.navigate("OrderDetail", { id: o.id })}
            style={styles.row}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.rowCaption}>Order</Text>
              <Text style={styles.rowId}>#{o.id.slice(0, 8).toUpperCase()}</Text>
              <Text style={styles.rowMeta}>
                {new Date(o.createdAt).toLocaleString()} · {o.fulfillment}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end", gap: 6 }}>
              <StatusBadge status={o.status} />
              <Text style={styles.rowTotal}>{peso(o.total)}</Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowCaption: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "700",
    color: colors.stone500,
  },
  rowId: { fontSize: 18, fontWeight: "900", color: colors.forest },
  rowMeta: { fontSize: 11, color: colors.stone500, marginTop: 2 },
  rowTotal: { fontSize: 16, fontWeight: "900", color: colors.forest },
});
