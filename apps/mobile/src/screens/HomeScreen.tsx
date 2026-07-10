import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";
import type { RootStackParamList } from "../navigation/types";
import { colors } from "../theme";
import { Button, Card } from "../components/ui";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const goTab = (tab: "Menu" | "Shop" | "Orders") =>
    navigation.navigate("Tabs", { screen: tab });

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={styles.hero}>
          <Text style={styles.script}>fuel your day —</Text>
          <Text style={styles.display}>SIP 'N BITE{"\n"}NUTRITION</Text>
          <Text style={styles.sub}>
            Premium and classic Herbalife shakes, snacks, and high-protein meals.
            Pickup or delivery — your call.
          </Text>
          <View style={styles.tagRow}>
            {["22 oz Premium", "19 Vitamins & Minerals", "Low Glycemic"].map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>
          <Button label="Browse the menu ↗" onPress={() => goTab("Menu")} style={{ marginTop: 16 }} />
          <Button
            label="Shop Herbalife ↗"
            variant="outline"
            onPress={() => goTab("Shop")}
            style={{ marginTop: 8 }}
          />
        </View>

        <Card style={{ marginTop: 16, backgroundColor: colors.white }}>
          <Text style={styles.cardEmoji}>🥤</Text>
          <Text style={styles.cardTitle}>Shakes & snacks, made fresh</Text>
          <Text style={styles.cardBody}>
            Browse the daily menu of shakes and high-protein snacks, add them to your cart, and
            pick them up at the hub or have them delivered.
          </Text>
        </Card>

        <Card style={{ marginTop: 12, backgroundColor: colors.white }}>
          <Text style={styles.cardEmoji}>🌿</Text>
          <Text style={styles.cardTitle}>Herbalife products in stock</Text>
          <Text style={styles.cardBody}>
            Shop Herbalife essentials straight from the hub — live stock counts, preorders, and
            secure online payment via PayMongo (card, GCash, GrabPay, Maya).
          </Text>
        </Card>

        <Card style={{ marginTop: 12, backgroundColor: colors.white }}>
          <Text style={styles.cardEmoji}>🧾</Text>
          <Text style={styles.cardTitle}>Track every order</Text>
          <Text style={styles.cardBody}>
            Watch your order move from pending to prepared to picked up — status updates live in
            the Orders tab.
          </Text>
          <Button
            label="My orders"
            variant="dark"
            onPress={() => goTab("Orders")}
            style={{ marginTop: 12, alignSelf: "flex-start" }}
          />
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.cream,
    borderColor: colors.peachSoft,
    borderWidth: 1,
    borderRadius: 24,
    padding: 24,
  },
  script: { fontSize: 24, fontStyle: "italic", color: colors.peach },
  display: {
    fontSize: 38,
    lineHeight: 40,
    fontWeight: "900",
    color: colors.forest,
    letterSpacing: 0.5,
  },
  sub: { color: colors.stone600, marginTop: 10, lineHeight: 20 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  tag: {
    backgroundColor: colors.mustard,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.forest,
  },
  cardEmoji: { fontSize: 28, marginBottom: 6 },
  cardTitle: { fontWeight: "900", fontSize: 16, color: colors.forest },
  cardBody: { color: colors.stone500, marginTop: 4, lineHeight: 20, fontSize: 13 },
});
