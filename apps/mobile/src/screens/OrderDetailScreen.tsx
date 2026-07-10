import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as WebBrowser from "expo-web-browser";
import { useApi } from "../auth/AuthContext";
import { colors, peso } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { Button, Card, EmptyState, StatusBadge } from "../components/ui";

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

type Props = NativeStackScreenProps<RootStackParamList, "OrderDetail">;

export function OrderDetailScreen({ route }: Props) {
  const { id, placed } = route.params;
  const api = useApi();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setOrder(await api.get<Order>(`/orders/${id}`));
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={{ padding: 32, alignItems: "center" }}>
        <Text style={{ color: colors.stone500 }}>Loading your order…</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ padding: 16 }}>
        <EmptyState
          emoji="🤔"
          title="Order not found"
          body="It may have been cancelled or the link is wrong."
        />
      </View>
    );
  }

  const isPaid = order.status === "paid" || order.status === "completed";
  const needsPayment = order.status === "awaiting_payment" && order.paymongoCheckoutUrl;

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
      {placed && (
        <View style={styles.celebrate}>
          <Text style={{ fontSize: 30 }}>🎉</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.celebrateScript}>cheers!</Text>
            <Text style={styles.celebrateTitle}>Your order is in.</Text>
            <Text style={styles.celebrateBody}>
              We're getting it ready. Pull to refresh for status updates.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.header}>
        <View>
          <Text style={styles.caption}>Order</Text>
          <Text style={styles.orderId}>#{order.id.slice(0, 8).toUpperCase()}</Text>
          {order.createdAt && (
            <Text style={styles.meta}>Placed {new Date(order.createdAt).toLocaleString()}</Text>
          )}
        </View>
        <StatusBadge status={order.status} />
      </View>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <View style={styles.fulfillmentRow}>
          <View>
            <Text style={styles.caption}>Fulfillment</Text>
            <Text style={styles.strong}>{order.fulfillment}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.caption}>Payment</Text>
            <Text style={styles.strong}>
              {order.paymentMethod === "online" ? "Online" : "At the hub"}
            </Text>
          </View>
        </View>
        {order.items.map((i) => (
          <View key={i.id} style={styles.itemRow}>
            <View style={styles.qtyBox}>
              <Text style={{ fontWeight: "900", fontSize: 11, color: colors.forest }}>
                ×{i.quantity}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.itemName}>{i.nameSnapshot}</Text>
              <Text style={styles.meta}>{peso(i.unitPrice)} each</Text>
            </View>
            <Text style={{ fontWeight: "900", color: colors.forest }}>
              {peso(Number(i.unitPrice) * i.quantity)}
            </Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.caption}>Total</Text>
          <Text style={{ fontSize: 22, fontWeight: "900", color: colors.forest }}>
            {peso(order.total)}
          </Text>
        </View>
      </Card>

      {order.deliveryAddress && (
        <Card style={{ marginTop: 12 }}>
          <Text style={styles.caption}>Deliver to</Text>
          <Text style={[styles.strong, { marginTop: 4 }]}>{order.deliveryAddress}</Text>
        </Card>
      )}

      {order.paymentMethod === "at_hub" && !isPaid && (
        <View style={styles.payNotice}>
          <Text style={{ fontSize: 22 }}>💵</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "800", color: colors.forest }}>
              {order.fulfillment === "delivery" ? "Cash on delivery" : "Pay at the hub"}
            </Text>
            <Text style={{ fontSize: 13, color: colors.forest, marginTop: 2, lineHeight: 18 }}>
              {order.fulfillment === "delivery"
                ? `Have ${peso(order.total)} ready when our courier arrives.`
                : `Show this order at the Sip 'N Bite hub and settle ${peso(order.total)} at the counter.`}
            </Text>
          </View>
        </View>
      )}

      {needsPayment && (
        <Button
          label="Continue to payment ↗"
          onPress={() => WebBrowser.openBrowserAsync(order.paymongoCheckoutUrl!)}
          style={{ marginTop: 12 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  celebrate: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: colors.mustard,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  celebrateScript: { fontStyle: "italic", fontSize: 18, color: colors.forest },
  celebrateTitle: { fontSize: 20, fontWeight: "900", color: colors.forest },
  celebrateBody: { fontSize: 12, color: colors.forest, marginTop: 2 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  caption: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "700",
    color: colors.stone500,
  },
  orderId: { fontSize: 26, fontWeight: "900", color: colors.forest },
  meta: { fontSize: 11, color: colors.stone500, marginTop: 2 },
  strong: { fontWeight: "800", color: colors.forest, textTransform: "capitalize" },
  fulfillmentRow: {
    backgroundColor: colors.cream,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.peachSoft,
  },
  qtyBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.peachSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  itemName: { fontWeight: "800", color: colors.forest, fontSize: 13 },
  totalRow: {
    backgroundColor: colors.cream,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  payNotice: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: colors.mustard,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    alignItems: "flex-start",
  },
});
