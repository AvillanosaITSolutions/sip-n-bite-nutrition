import { useCallback, useMemo, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Fulfillment, OrderItemType } from "@snb/shared";
import { useApi } from "../auth/AuthContext";
import { absUrl } from "../lib/absUrl";
import { colors, peso } from "../theme";
import { CartActionButton } from "../components/CartActionButton";
import { EmptyState, Pill, PillRow, ScreenTitle, SearchBar } from "../components/ui";

export type Product = {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: string;
  stock: number;
  isPreorder: boolean;
  fulfillment: Fulfillment;
  imageUrl: string | null;
};

type Availability = "all" | "available" | "preorder" | "unavailable";

const FILTERS: { v: Availability; label: string }[] = [
  { v: "all", label: "All" },
  { v: "available", label: "Available" },
  { v: "preorder", label: "Preorder" },
  { v: "unavailable", label: "Sold out" },
];

export function ShopScreen() {
  const api = useApi();
  const [items, setItems] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Availability>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .get<Product[]>("/products")
      .then(setItems)
      .catch(() => setItems([]));
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => {
    const byAvailability = items.filter((p) => {
      if (filter === "all") return true;
      if (filter === "preorder") return p.isPreorder;
      if (filter === "available") return !p.isPreorder && p.stock > 0;
      if (filter === "unavailable") return !p.isPreorder && p.stock <= 0;
      return true;
    });
    const q = query.trim().toLowerCase();
    if (!q) return byAvailability;
    return byAvailability.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }, [items, query, filter]);

  const counts = useMemo(
    () => ({
      all: items.length,
      available: items.filter((p) => !p.isPreorder && p.stock > 0).length,
      preorder: items.filter((p) => p.isPreorder).length,
      unavailable: items.filter((p) => !p.isPreorder && p.stock <= 0).length,
    }),
    [items],
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <FlatList
        data={visible}
        keyExtractor={(i) => i.id}
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
        ListHeaderComponent={
          <View>
            <ScreenTitle script="straight from the hub" title="HERBALIFE SHOP" />
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search products, SKUs…" />
            <PillRow>
              {FILTERS.map((f) => (
                <Pill
                  key={f.v}
                  label={f.label}
                  count={counts[f.v]}
                  active={filter === f.v}
                  onPress={() => setFilter(f.v)}
                />
              ))}
            </PillRow>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🌿"
            title={items.length === 0 ? "No products yet" : "No matches"}
            body={query ? `Nothing matches "${query}".` : "No products in this category yet."}
          />
        }
        renderItem={({ item }) => <ProductCard p={item} />}
      />
    </SafeAreaView>
  );
}

function ProductCard({ p }: { p: Product }) {
  const inStock = p.stock > 0;
  const isLowStock = !p.isPreorder && inStock && p.stock <= 5;
  const statusLabel = p.isPreorder
    ? "Preorder"
    : !inStock
      ? "Sold out"
      : isLowStock
        ? `Only ${p.stock} left`
        : `${p.stock} in stock`;
  const statusBg = p.isPreorder
    ? colors.peachSoft
    : !inStock
      ? colors.clay
      : isLowStock
        ? colors.peachSoft
        : colors.sage;
  const statusColor = !p.isPreorder && !inStock ? colors.clayText : colors.forest;
  const img = absUrl(p.imageUrl);

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {img ? (
          <Image source={{ uri: img }} style={styles.image} resizeMode="contain" />
        ) : (
          <Text style={{ fontSize: 48, opacity: 0.4 }}>🌿</Text>
        )}
        <View style={[styles.statusPill, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{peso(p.price)}</Text>
        </View>
      </View>
      <View style={{ padding: 14 }}>
        <Text style={styles.brand}>Herbalife</Text>
        <Text style={styles.name}>{p.name}</Text>
        {p.description ? <Text style={styles.desc}>{p.description}</Text> : null}
        <View style={{ marginTop: 10 }}>
          <CartActionButton
            itemId={p.id}
            itemType={OrderItemType.Product}
            name={p.name}
            unitPrice={Number(p.price)}
            imageUrl={p.imageUrl}
            label={p.isPreorder ? "Preorder" : "Add to Cart"}
            doneLabel={p.isPreorder ? "Reserved" : "Added"}
            disabled={!p.isPreorder && !inStock}
            maxQuantity={p.isPreorder ? undefined : p.stock}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream,
    borderColor: colors.peachSoft,
    borderWidth: 1,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
  },
  imageWrap: {
    aspectRatio: 1.6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.sand,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    margin: 16,
  },
  statusPill: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  priceTag: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: colors.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceText: { fontWeight: "900", color: colors.forest },
  brand: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    color: colors.stone500,
    fontWeight: "700",
  },
  name: { fontWeight: "800", fontSize: 16, color: colors.forest, marginTop: 2 },
  desc: { fontSize: 12, color: colors.stone500, marginTop: 2 },
});
