import { useCallback, useMemo, useState } from "react";
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { MenuCategory, OrderItemType } from "@snb/shared";
import { useApi } from "../auth/AuthContext";
import { absUrl } from "../lib/absUrl";
import { colors, peso } from "../theme";
import { CartActionButton } from "../components/CartActionButton";
import { EmptyState, Pill, PillRow, ScreenTitle, SearchBar } from "../components/ui";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  calories: number;
  benefits: string[];
  price: string;
  isAvailable: boolean;
  imageUrl: string | null;
};

type Filter = "all" | MenuCategory;

const FILTERS: { v: Filter; label: string }[] = [
  { v: "all", label: "All" },
  { v: MenuCategory.Shake, label: "Shakes" },
  { v: MenuCategory.Snack, label: "Snacks" },
];

export function MenuScreen() {
  const api = useApi();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    return api
      .get<MenuItem[]>("/menu")
      .then(setItems)
      .catch(() => setItems([]));
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visible = useMemo(() => {
    const byCategory = filter === "all" ? items : items.filter((i) => i.category === filter);
    const q = query.trim().toLowerCase();
    if (!q) return byCategory;
    return byCategory.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.benefits.some((b) => b.toLowerCase().includes(q)),
    );
  }, [items, filter, query]);

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
            <ScreenTitle script="crafted fresh, daily —" title="THE MENU" />
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search shakes, snacks, flavors…" />
            <PillRow>
              {FILTERS.map((f) => (
                <Pill key={f.v} label={f.label} active={filter === f.v} onPress={() => setFilter(f.v)} />
              ))}
            </PillRow>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="🥤"
            title={items.length === 0 ? "No menu items yet" : "No matches"}
            body={
              items.length === 0
                ? "Check back soon — the menu is being stocked."
                : query
                  ? `Nothing matches "${query}".`
                  : "Nothing in this category right now."
            }
          />
        }
        renderItem={({ item }) => <MenuCard item={item} />}
      />
    </SafeAreaView>
  );
}

function MenuCard({ item }: { item: MenuItem }) {
  const isShake = item.category === MenuCategory.Shake;
  const img = absUrl(item.imageUrl);
  return (
    <View style={styles.card}>
      <View style={[styles.imageWrap, { backgroundColor: isShake ? "#E9EAD8" : colors.sand }]}>
        {img ? (
          <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={{ fontSize: 56, opacity: 0.7 }}>{isShake ? "🥤" : "🍪"}</Text>
        )}
        <View style={[styles.categoryPill, { backgroundColor: isShake ? colors.peachSoft : colors.mustard }]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
        {!item.isAvailable && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>SOLD OUT</Text>
          </View>
        )}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{peso(item.price, 0)}</Text>
        </View>
      </View>
      <View style={{ padding: 14 }}>
        <Text style={styles.name}>{item.name}</Text>
        {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
        <View style={styles.benefitRow}>
          {item.benefits.slice(0, 3).map((b) => (
            <View key={b} style={styles.benefit}>
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.calories}>
          {item.calories > 0 ? `${item.calories} kcal` : "Mix-to-order"}
        </Text>
        <View style={{ marginTop: 10 }}>
          <CartActionButton
            itemId={item.id}
            itemType={OrderItemType.Menu}
            name={item.name}
            unitPrice={Number(item.price)}
            imageUrl={item.imageUrl}
            disabled={!item.isAvailable}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
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
  },
  image: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  categoryPill: {
    position: "absolute",
    top: 10,
    left: 10,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.forest,
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(30,61,47,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  soldOutText: { color: colors.white, fontSize: 20, fontWeight: "900", letterSpacing: 3 },
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
  name: { fontWeight: "800", fontSize: 16, color: colors.forest },
  desc: { fontSize: 12, color: colors.stone500, marginTop: 2 },
  benefitRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 8 },
  benefit: {
    backgroundColor: colors.sand,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  benefitText: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.forest,
  },
  calories: { fontSize: 11, color: colors.stone500, marginTop: 6 },
});
