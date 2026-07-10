import { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { OrderItemType, walkinOrderSchema } from "@snb/shared";
import { useApi } from "../../auth/AuthContext";
import { colors, peso } from "../../theme";
import type { RootStackParamList } from "../../navigation/types";
import {
  Button,
  Card,
  ErrorBox,
  Input,
  Label,
  Pill,
  PillRow,
  QtyStepper,
  SearchBar,
} from "../../components/ui";

type PickerItem = {
  id: string;
  name: string;
  price: string;
  itemType: OrderItemType;
  isAvailable: boolean;
  stock?: number;
};

type Line = {
  itemId: string;
  itemType: OrderItemType;
  name: string;
  unitPrice: number;
  quantity: number;
  maxQuantity?: number;
};

type Source = "menu" | "products";

export function PosScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const api = useApi();
  const [menu, setMenu] = useState<PickerItem[]>([]);
  const [products, setProducts] = useState<PickerItem[]>([]);
  const [source, setSource] = useState<Source>("menu");
  const [query, setQuery] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ id: string; name: string; price: string; isAvailable: boolean }[]>("/menu")
      .then((items) =>
        setMenu(
          items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            isAvailable: i.isAvailable,
            itemType: OrderItemType.Menu,
          })),
        ),
      )
      .catch(() => setMenu([]));
    api
      .get<{ id: string; name: string; price: string; stock: number; isPreorder: boolean }[]>(
        "/products",
      )
      .then((items) =>
        setProducts(
          items.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            isAvailable: p.isPreorder || p.stock > 0,
            stock: p.isPreorder ? undefined : p.stock,
            itemType: OrderItemType.Product,
          })),
        ),
      )
      .catch(() => setProducts([]));
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pool = source === "menu" ? menu : products;
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? pool.filter((i) => i.name.toLowerCase().includes(q)) : pool;
  }, [pool, query]);

  const total = lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
  const cash = parseFloat(cashReceived);
  const validCash = !Number.isNaN(cash) && cash > 0;
  const change = validCash ? cash - total : 0;

  function addItem(i: PickerItem) {
    setLines((prev) => {
      const existing = prev.find((l) => l.itemId === i.id);
      if (existing) {
        const next = existing.quantity + 1;
        const capped =
          existing.maxQuantity !== undefined ? Math.min(next, existing.maxQuantity) : next;
        return prev.map((l) => (l.itemId === i.id ? { ...l, quantity: capped } : l));
      }
      return [
        ...prev,
        {
          itemId: i.id,
          itemType: i.itemType,
          name: i.name,
          unitPrice: Number(i.price),
          quantity: 1,
          maxQuantity: i.stock,
        },
      ];
    });
  }

  function setQty(itemId: string, quantity: number) {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.itemId !== itemId)
        : prev.map((l) =>
            l.itemId === itemId
              ? {
                  ...l,
                  quantity:
                    l.maxQuantity !== undefined ? Math.min(quantity, l.maxQuantity) : quantity,
                }
              : l,
          ),
    );
  }

  async function submit() {
    setError(null);
    const payload = {
      lines: lines.map((l) => ({ itemType: l.itemType, itemId: l.itemId, quantity: l.quantity })),
      customerName: customerName.trim() || null,
      customerPhone: customerPhone.trim() || null,
      notes: notes.trim() || null,
      cashReceived: validCash ? cash : null,
    };
    const parsed = walkinOrderSchema.safeParse(payload);
    if (!parsed.success) {
      setError("Add at least one item to the order.");
      return;
    }
    setSubmitting(true);
    try {
      const order = await api.post<{ id: string }>("/orders/walkin", parsed.data);
      setLines([]);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      setCashReceived("");
      navigation.replace("OrderDetail", { id: order.id, placed: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create walk-in order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <PillRow>
          <Pill label="Menu" active={source === "menu"} onPress={() => setSource("menu")} />
          <Pill
            label="Products"
            active={source === "products"}
            onPress={() => setSource("products")}
          />
        </PillRow>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search items…" />

        <View style={styles.itemGrid}>
          {visible.map((i) => (
            <Pressable
              key={i.id}
              onPress={() => addItem(i)}
              disabled={!i.isAvailable}
              style={[styles.itemCard, { opacity: i.isAvailable ? 1 : 0.4 }]}
            >
              <Text style={styles.itemName} numberOfLines={2}>
                {i.name}
              </Text>
              <Text style={styles.itemPrice}>{peso(i.price, 0)}</Text>
              {i.stock !== undefined && (
                <Text style={styles.itemStock}>
                  {i.stock > 0 ? `${i.stock} left` : "out of stock"}
                </Text>
              )}
            </Pressable>
          ))}
          {visible.length === 0 && (
            <Text style={{ color: colors.stone500, padding: 8 }}>No items.</Text>
          )}
        </View>

        <Card style={{ backgroundColor: colors.cream, marginTop: 16 }}>
          <Text style={styles.summaryTitle}>WALK-IN ORDER</Text>

          {lines.length === 0 ? (
            <Text style={{ color: colors.stone500, fontSize: 13, marginBottom: 12 }}>
              Tap items above to add them.
            </Text>
          ) : (
            lines.map((l) => (
              <View key={l.itemId} style={styles.lineRow}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.lineName} numberOfLines={1}>
                    {l.name}
                  </Text>
                  <Text style={styles.lineMeta}>{peso(l.unitPrice)} each</Text>
                </View>
                <QtyStepper
                  quantity={l.quantity}
                  max={l.maxQuantity}
                  onChange={(n) => setQty(l.itemId, n)}
                />
                <Text style={styles.lineTotal}>{peso(l.unitPrice * l.quantity)}</Text>
              </View>
            ))
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Label>Customer name (optional)</Label>
              <Input value={customerName} onChangeText={setCustomerName} style={{ marginBottom: 12 }} />
            </View>
            <View style={{ flex: 1 }}>
              <Label>Phone (optional)</Label>
              <Input
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
                style={{ marginBottom: 12 }}
              />
            </View>
          </View>

          <Label>Notes (optional)</Label>
          <Input
            value={notes}
            onChangeText={setNotes}
            multiline
            style={{ minHeight: 54, textAlignVertical: "top", marginBottom: 12 }}
          />

          <Label>Cash received (optional)</Label>
          <Input
            value={cashReceived}
            onChangeText={setCashReceived}
            keyboardType="decimal-pad"
            placeholder="e.g. 1000"
            style={{ marginBottom: 8 }}
          />
          {validCash && (
            <View
              style={[
                styles.changeRow,
                { backgroundColor: change < 0 ? colors.redBg : colors.sage },
              ]}
            >
              <Text
                style={[
                  styles.changeLabel,
                  { color: change < 0 ? colors.redText : colors.forest },
                ]}
              >
                {change < 0 ? "Short by" : "Change"}
              </Text>
              <Text
                style={{ fontWeight: "900", color: change < 0 ? colors.redText : colors.forest }}
              >
                {peso(Math.abs(change))}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalCaption}>Total</Text>
            <Text style={styles.totalValue}>{peso(total)}</Text>
          </View>

          {error && <ErrorBox message={error} />}

          <Button
            label="Create walk-in order"
            variant="dark"
            loading={submitting}
            disabled={lines.length === 0}
            onPress={submit}
            style={{ marginTop: 8 }}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  itemGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  itemCard: {
    flexBasis: "31%",
    flexGrow: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    borderRadius: 14,
    padding: 10,
    minHeight: 78,
  },
  itemName: { fontWeight: "700", fontSize: 12, color: colors.forest },
  itemPrice: { fontWeight: "900", fontSize: 13, color: colors.forest, marginTop: 4 },
  itemStock: { fontSize: 9, color: colors.stone500, marginTop: 2 },
  summaryTitle: { fontSize: 18, fontWeight: "900", color: colors.forest, marginBottom: 12 },
  lineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  lineName: { fontWeight: "700", fontSize: 13, color: colors.forest },
  lineMeta: { fontSize: 10, color: colors.stone500 },
  lineTotal: { fontWeight: "900", color: colors.forest, minWidth: 70, textAlign: "right" },
  changeRow: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  changeLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "700",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    borderTopWidth: 1,
    borderTopColor: colors.peachSoft,
    paddingTop: 10,
    marginTop: 4,
  },
  totalCaption: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.stone500,
    fontWeight: "700",
  },
  totalValue: { fontSize: 24, fontWeight: "900", color: colors.forest },
});
