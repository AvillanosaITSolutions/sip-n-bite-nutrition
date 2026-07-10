import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as WebBrowser from "expo-web-browser";
import {
  Fulfillment,
  PaymentMethod,
  createOrderSchema,
  type CreateOrderInput,
} from "@snb/shared";
import { useApi, useAuth } from "../auth/AuthContext";
import { useCart } from "../store/cart";
import { absUrl } from "../lib/absUrl";
import { colors, peso } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import {
  Button,
  Card,
  EmptyState,
  ErrorBox,
  Input,
  Label,
  QtyStepper,
  ScreenTitle,
} from "../components/ui";

type PlacedOrder = { id: string; paymongoCheckoutUrl: string | null };

export function CartScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isAuthenticated, login } = useAuth();
  const api = useApi();
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.total());

  const [fulfillment, setFulfillment] = useState<typeof Fulfillment.Pickup | typeof Fulfillment.Delivery>(
    Fulfillment.Pickup,
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.AtHub);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [cashOnHand, setCashOnHand] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onCheckout() {
    setError(null);
    if (!isAuthenticated) {
      await login();
      return;
    }
    if (fulfillment === Fulfillment.Delivery && !deliveryAddress.trim()) {
      setError("Please enter a delivery address.");
      return;
    }
    const cashNum = parseFloat(cashOnHand);
    const cashValid =
      paymentMethod === PaymentMethod.AtHub && !Number.isNaN(cashNum) && cashNum > 0;
    const payload: CreateOrderInput = {
      lines: lines.map((l) => ({ itemType: l.itemType, itemId: l.itemId, quantity: l.quantity })),
      fulfillment,
      paymentMethod,
      deliveryAddress: deliveryAddress.trim() || null,
      notes: notes.trim() || null,
      cashOnHand: cashValid ? cashNum : null,
    };
    const parsed = createOrderSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Cart contents look invalid. Try removing and re-adding the items.");
      return;
    }
    setSubmitting(true);
    let order: PlacedOrder;
    try {
      order = await api.post<PlacedOrder>("/orders", parsed.data);
    } catch (e) {
      setError(
        `We couldn't place your order. ${e instanceof Error ? e.message : ""}`.trim() +
          " · Check that you're signed in and that the API is reachable.",
      );
      setSubmitting(false);
      return;
    }
    clear();
    setSubmitting(false);
    if (paymentMethod === PaymentMethod.Online && order.paymongoCheckoutUrl) {
      await WebBrowser.openBrowserAsync(order.paymongoCheckoutUrl);
    }
    navigation.navigate("OrderDetail", { id: order.id, placed: true });
  }

  const cash = parseFloat(cashOnHand);
  const validCash = !Number.isNaN(cash) && cash > 0;
  const change = validCash ? cash - total : 0;
  const insufficient = validCash && change < 0;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          <ScreenTitle script="almost there," title="YOUR CART" />

          {lines.length === 0 ? (
            <EmptyState
              emoji="🛒"
              title="Your cart is empty"
              body="Browse the menu or our Herbalife shop to start an order."
            />
          ) : (
            <>
              {lines.map((l) => {
                const img = absUrl(l.imageUrl);
                return (
                  <Card key={l.itemId} style={styles.lineCard}>
                    <View style={styles.lineImage}>
                      {img ? (
                        <Image
                          source={{ uri: img }}
                          style={{ width: "100%", height: "100%" }}
                          resizeMode="contain"
                        />
                      ) : (
                        <Text style={{ fontSize: 26 }}>{l.itemType === "menu" ? "🥤" : "🌿"}</Text>
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.lineKind}>
                        {l.itemType === "menu" ? "Sip 'N Bite menu" : "Herbalife"}
                      </Text>
                      <Text style={styles.lineName} numberOfLines={2}>
                        {l.name}
                      </Text>
                      <Text style={styles.lineEach}>{peso(l.unitPrice)} each</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
                        <QtyStepper
                          quantity={l.quantity}
                          max={l.maxQuantity}
                          onChange={(n) => (n <= 0 ? remove(l.itemId) : setQty(l.itemId, n))}
                        />
                        <Text style={styles.lineTotal}>{peso(l.unitPrice * l.quantity)}</Text>
                      </View>
                    </View>
                    <Pressable onPress={() => remove(l.itemId)} hitSlop={8}>
                      <Text style={styles.removeText}>✕</Text>
                    </Pressable>
                  </Card>
                );
              })}

              <Pressable onPress={clear} style={{ alignSelf: "flex-start", marginVertical: 8 }}>
                <Text style={styles.clearText}>Clear cart</Text>
              </Pressable>

              {/* Checkout */}
              <Card style={{ backgroundColor: colors.cream, marginTop: 8 }}>
                <Text style={styles.summaryTitle}>ORDER SUMMARY</Text>

                <Label>Fulfillment</Label>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                  {[
                    { v: Fulfillment.Pickup, label: "Pickup" },
                    { v: Fulfillment.Delivery, label: "Delivery" },
                  ].map((o) => {
                    const active = fulfillment === o.v;
                    return (
                      <Pressable
                        key={o.v}
                        onPress={() => setFulfillment(o.v)}
                        style={[
                          styles.choice,
                          { backgroundColor: active ? colors.peach : colors.white },
                        ]}
                      >
                        <Text style={styles.choiceText}>{o.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {fulfillment === Fulfillment.Delivery && (
                  <View style={{ marginBottom: 14 }}>
                    <Label>Delivery address</Label>
                    <Input
                      value={deliveryAddress}
                      onChangeText={setDeliveryAddress}
                      multiline
                      numberOfLines={3}
                      style={{ minHeight: 70, textAlignVertical: "top" }}
                    />
                  </View>
                )}

                <Label>Payment method</Label>
                <View style={{ gap: 8, marginBottom: 14 }}>
                  {[
                    {
                      v: PaymentMethod.AtHub,
                      title:
                        fulfillment === Fulfillment.Delivery ? "Cash on delivery" : "Pay at the hub",
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
                      <Pressable
                        key={o.v}
                        onPress={() => setPaymentMethod(o.v)}
                        style={[
                          styles.payChoice,
                          {
                            backgroundColor: active ? colors.peach : colors.white,
                            borderColor: active ? colors.peach : colors.peachSoft,
                          },
                        ]}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                          <Text style={{ fontWeight: "800", fontSize: 13, color: colors.forest }}>
                            {o.title}
                          </Text>
                          <View
                            style={[
                              styles.radio,
                              { backgroundColor: active ? colors.forest : "transparent" },
                            ]}
                          >
                            {active && <View style={styles.radioDot} />}
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: colors.stone600, marginTop: 2 }}>
                          {o.sub}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Label>Notes (optional)</Label>
                <Input
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={2}
                  style={{ minHeight: 54, textAlignVertical: "top", marginBottom: 14 }}
                />

                {paymentMethod === PaymentMethod.AtHub && (
                  <View style={{ marginBottom: 14 }}>
                    <Label>Cash on hand (optional — for change preview)</Label>
                    <Input
                      value={cashOnHand}
                      onChangeText={setCashOnHand}
                      keyboardType="decimal-pad"
                      placeholder="e.g. 3000"
                    />
                    {validCash && (
                      <View
                        style={[
                          styles.changeRow,
                          { backgroundColor: insufficient ? colors.redBg : colors.sage },
                        ]}
                      >
                        <Text
                          style={[
                            styles.changeLabel,
                            { color: insufficient ? colors.redText : colors.forest },
                          ]}
                        >
                          {insufficient ? "Short by" : "Your change"}
                        </Text>
                        <Text
                          style={{
                            fontWeight: "900",
                            color: insufficient ? colors.redText : colors.forest,
                          }}
                        >
                          {peso(Math.abs(change))}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={styles.totalsBlock}>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalMuted}>Subtotal</Text>
                    <Text style={[styles.totalMuted, { fontWeight: "700" }]}>{peso(total)}</Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalMuted}>Fulfillment</Text>
                    <Text style={[styles.totalMuted, { fontWeight: "700" }]}>
                      {fulfillment === Fulfillment.Delivery ? "Calculated at next step" : "Free pickup"}
                    </Text>
                  </View>
                  <View style={[styles.totalRow, { marginTop: 6 }]}>
                    <Text style={styles.totalCaption}>Total</Text>
                    <Text style={styles.totalValue}>{peso(total)}</Text>
                  </View>
                </View>

                {error && <ErrorBox message={error} />}

                <Button
                  label={paymentMethod === PaymentMethod.Online ? "Pay with PayMongo" : "Place order"}
                  variant="dark"
                  loading={submitting}
                  disabled={lines.length === 0}
                  onPress={onCheckout}
                  style={{ marginTop: 8 }}
                />
                <Text style={styles.finePrint}>
                  {paymentMethod === PaymentMethod.Online
                    ? "You'll be taken to a secure PayMongo checkout."
                    : fulfillment === Fulfillment.Delivery
                      ? "Your order will be prepared and our team will collect payment on delivery."
                      : "Your order will be prepared. Show your order ID at the hub to pay and pick up."}
                </Text>
              </Card>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lineCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 12,
    marginBottom: 10,
  },
  lineImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E9EAD8",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  lineKind: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.stone500,
    fontWeight: "700",
  },
  lineName: { fontWeight: "800", color: colors.forest, fontSize: 14 },
  lineEach: { fontSize: 11, color: colors.stone500, marginTop: 1 },
  lineTotal: { fontWeight: "900", color: colors.forest },
  removeText: { color: colors.stone400, fontSize: 14, padding: 4 },
  clearText: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.stone500,
  },
  summaryTitle: { fontSize: 20, fontWeight: "900", color: colors.forest, marginBottom: 12 },
  choice: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    paddingVertical: 10,
    alignItems: "center",
  },
  choiceText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.forest,
  },
  payChoice: { borderRadius: 12, borderWidth: 1, padding: 12 },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.peach },
  changeRow: {
    marginTop: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  changeLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  totalsBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.peachSoft,
    paddingTop: 10,
    gap: 4,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  totalMuted: { fontSize: 13, color: colors.stone600 },
  totalCaption: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.stone500,
    fontWeight: "700",
  },
  totalValue: { fontSize: 24, fontWeight: "900", color: colors.forest },
  finePrint: { fontSize: 10, color: colors.stone500, textAlign: "center", marginTop: 8 },
});
