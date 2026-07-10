import { useCallback, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Role } from "@snb/shared";
import { useApi, useAuth } from "../../auth/AuthContext";
import { colors } from "../../theme";
import { EmptyState } from "../../components/ui";

type Row = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: Role;
};

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  "pos-operator": "POS Operator",
  admin: "Admin",
  "super-admin": "Super Admin",
};

const ROLES = Object.values(Role);

function shortEmail(email: string) {
  if (email.endsWith("@unknown.local")) {
    const sub = email.replace("@unknown.local", "");
    const [provider, id] = sub.split("|");
    return `${provider}:${id?.slice(0, 6)}…`;
  }
  return email;
}

export function AdminUsersScreen() {
  const api = useApi();
  const { me, refreshMe } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.get<Row[]>("/users"));
    } catch {
      setRows([]);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function setRole(id: string, role: Role) {
    await api.patch(`/users/${id}/role`, { role });
    setExpandedId(null);
    await load();
    if (me?.id === id) await refreshMe();
  }

  return (
    <FlatList
      data={rows}
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
      ListEmptyComponent={<EmptyState emoji="👥" title="No users yet" />}
      renderItem={({ item: u }) => {
        const expanded = expandedId === u.id;
        return (
          <View style={styles.card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {u.picture ? (
                <Image source={{ uri: u.picture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={{ color: colors.cream, fontWeight: "900" }}>
                    {(u.name ?? u.email).slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                {u.name ? <Text style={styles.name} numberOfLines={1}>{u.name}</Text> : null}
                <Text style={styles.email} numberOfLines={1}>{shortEmail(u.email)}</Text>
              </View>
              <Pressable
                onPress={() => setExpandedId(expanded ? null : u.id)}
                style={styles.roleBtn}
              >
                <Text style={styles.roleBtnText}>
                  {ROLE_LABELS[u.role] ?? u.role} {expanded ? "▲" : "▼"}
                </Text>
              </Pressable>
            </View>
            {expanded && (
              <View style={styles.roleGrid}>
                {ROLES.map((r) => (
                  <Pressable
                    key={r}
                    disabled={r === u.role}
                    onPress={() => setRole(u.id, r)}
                    style={[
                      styles.roleOption,
                      {
                        backgroundColor: r === u.role ? colors.forest : colors.peachSoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        { color: r === u.role ? colors.cream : colors.forest },
                      ]}
                    >
                      {ROLE_LABELS[r]}
                    </Text>
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: {
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontWeight: "800", color: colors.forest, fontSize: 14 },
  email: { fontSize: 12, color: colors.stone500 },
  roleBtn: {
    backgroundColor: colors.mustard,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  roleBtnText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.forest,
  },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  roleOption: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  roleOptionText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
