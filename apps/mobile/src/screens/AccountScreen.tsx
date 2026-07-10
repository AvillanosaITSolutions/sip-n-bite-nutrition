import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Role } from "@snb/shared";
import { useAuth } from "../auth/AuthContext";
import { colors } from "../theme";
import type { RootStackParamList } from "../navigation/types";
import { Button, Card, EmptyState, ScreenTitle } from "../components/ui";

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  "pos-operator": "POS Operator",
  admin: "Admin",
  "super-admin": "Super Admin",
};

const STAFF_ROLES: Role[] = [Role.PosOperator, Role.Admin, Role.SuperAdmin];
const ADMIN_ROLES: Role[] = [Role.Admin, Role.SuperAdmin];

export function AccountScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isLoading, isAuthenticated, me, login, logout } = useAuth();

  const isStaff = !!me && STAFF_ROLES.includes(me.role);
  const isAdmin = !!me && ADMIN_ROLES.includes(me.role);
  const isSuperAdmin = me?.role === Role.SuperAdmin;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <ScreenTitle script="your hub pass" title="ACCOUNT" />

        {!isAuthenticated ? (
          <View>
            <EmptyState
              emoji="👋"
              title="Welcome to Sip 'N Bite"
              body="Sign in to place orders, track them, and (for staff) manage the hub."
            />
            <Button
              label={isLoading ? "Loading…" : "Sign in with Auth0"}
              onPress={login}
              disabled={isLoading}
              style={{ marginTop: 12 }}
            />
          </View>
        ) : (
          <>
            <Card style={{ backgroundColor: colors.cream }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={styles.avatar}>
                  <Text style={{ color: colors.cream, fontWeight: "900", fontSize: 18 }}>
                    {(me?.name ?? me?.email ?? "?").slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  {me?.name ? <Text style={styles.name}>{me.name}</Text> : null}
                  <Text style={styles.email} numberOfLines={1}>
                    {me?.email ?? "Signed in"}
                  </Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>
                      {me ? (ROLE_LABELS[me.role] ?? me.role) : "…"}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>

            {isStaff && (
              <View style={{ marginTop: 20 }}>
                <Text style={styles.sectionTitle}>HUB TOOLS</Text>
                <NavRow emoji="🧮" label="POS · Walk-in order" onPress={() => navigation.navigate("Pos")} />
                <NavRow emoji="📊" label="Dashboard" onPress={() => navigation.navigate("AdminDashboard")} />
                <NavRow emoji="📦" label="Manage orders" onPress={() => navigation.navigate("AdminOrders")} />
                {isAdmin && (
                  <>
                    <NavRow emoji="🥤" label="Manage menu" onPress={() => navigation.navigate("AdminMenu")} />
                    <NavRow emoji="🌿" label="Manage products" onPress={() => navigation.navigate("AdminProducts")} />
                  </>
                )}
                {isSuperAdmin && (
                  <NavRow emoji="👥" label="Users & roles" onPress={() => navigation.navigate("AdminUsers")} />
                )}
              </View>
            )}

            <Button label="Sign out" variant="outline" onPress={logout} style={{ marginTop: 24 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NavRow({ emoji, label, onPress }: { emoji: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.navRow}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text style={styles.navLabel}>{label}</Text>
      <Text style={{ color: colors.stone400 }}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontWeight: "900", fontSize: 16, color: colors.forest },
  email: { fontSize: 12, color: colors.stone500 },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.mustard,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  roleText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.forest,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    color: colors.stone500,
    marginBottom: 8,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 8,
  },
  navLabel: { flex: 1, fontWeight: "700", color: colors.forest, fontSize: 14 },
});
