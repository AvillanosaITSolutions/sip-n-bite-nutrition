import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { MenuCategory, menuItemSchema } from "@snb/shared";
import { useApi } from "../../auth/AuthContext";
import { absUrl } from "../../lib/absUrl";
import { pickImage } from "../../lib/pickImage";
import { colors, peso } from "../../theme";
import { Button, EmptyState, ErrorBox, Input, Label } from "../../components/ui";

type Row = {
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

type FormState = {
  name: string;
  description: string;
  category: MenuCategory;
  calories: string;
  benefits: string;
  price: string;
  isAvailable: boolean;
  imageUrl: string | null;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  category: MenuCategory.Shake,
  calories: "0",
  benefits: "",
  price: "",
  isAvailable: true,
  imageUrl: null,
};

export function AdminMenuScreen() {
  const api = useApi();
  const [rows, setRows] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await api.get<Row[]>("/menu/all"));
    } catch {
      setRows([]);
    }
  }, [api]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  function openCreate() {
    setError(null);
    setEditing({ id: null, form: EMPTY_FORM });
  }

  function openEdit(r: Row) {
    setError(null);
    setEditing({
      id: r.id,
      form: {
        name: r.name,
        description: r.description ?? "",
        category: r.category,
        calories: String(r.calories),
        benefits: r.benefits.join(", "),
        price: String(Number(r.price)),
        isAvailable: r.isAvailable,
        imageUrl: r.imageUrl,
      },
    });
  }

  async function save() {
    if (!editing) return;
    setError(null);
    const f = editing.form;
    const payload = {
      name: f.name.trim(),
      description: f.description.trim(),
      category: f.category,
      calories: parseInt(f.calories, 10) || 0,
      benefits: f.benefits
        .split(",")
        .map((b) => b.trim())
        .filter(Boolean),
      price: parseFloat(f.price),
      isAvailable: f.isAvailable,
      imageUrl: f.imageUrl || null,
    };
    const parsed = menuItemSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
      return;
    }
    setSaving(true);
    try {
      if (editing.id) await api.patch(`/menu/${editing.id}`, parsed.data);
      else await api.post("/menu", parsed.data);
      setEditing(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage() {
    const file = await pickImage();
    if (!file || !editing) return;
    setUploading(true);
    try {
      const r = await api.upload<{ url: string }>("/uploads/menu", file);
      setEditing((e) => (e ? { ...e, form: { ...e.form, imageUrl: r.url } } : e));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function toggleAvailable(r: Row) {
    await api.patch(`/menu/${r.id}`, { isAvailable: !r.isAvailable });
    load();
  }

  function confirmDelete(r: Row) {
    Alert.alert("Delete menu item", `Delete "${r.name}"? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.del(`/menu/${r.id}`);
          load();
        },
      },
    ]);
  }

  const f = editing?.form;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
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
        ListEmptyComponent={
          <EmptyState emoji="🥤" title="No menu items yet" body="Tap “New item” to add one." />
        }
        renderItem={({ item: r }) => {
          const img = absUrl(r.imageUrl);
          return (
            <View style={styles.row}>
              <View style={styles.thumb}>
                {img ? (
                  <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <Text style={{ fontSize: 22 }}>{r.category === "shake" ? "🥤" : "🍪"}</Text>
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.rowName} numberOfLines={1}>{r.name}</Text>
                <Text style={styles.rowMeta}>
                  {r.category} · {peso(r.price, 0)} · {r.calories > 0 ? `${r.calories} kcal` : "mix-to-order"}
                </Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 6, alignItems: "center" }}>
                  <Pressable onPress={() => openEdit(r)}>
                    <Text style={styles.link}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(r)}>
                    <Text style={[styles.link, { color: colors.redText }]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
              <View style={{ alignItems: "center" }}>
                <Switch
                  value={r.isAvailable}
                  onValueChange={() => toggleAvailable(r)}
                  trackColor={{ true: colors.peach, false: colors.sand }}
                  thumbColor={colors.forest}
                />
                <Text style={styles.switchLabel}>{r.isAvailable ? "Live" : "Hidden"}</Text>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.fabWrap}>
        <Button label="＋ New item" variant="dark" onPress={openCreate} />
      </View>

      <Modal visible={!!editing} animationType="slide" onRequestClose={() => setEditing(null)}>
        {f && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 64 }}>
            <Text style={styles.modalTitle}>{editing?.id ? "Edit menu item" : "New menu item"}</Text>

            <Label>Name</Label>
            <Input value={f.name} onChangeText={(v) => setEditing((e) => e && { ...e, form: { ...e.form, name: v } })} style={{ marginBottom: 12 }} />

            <Label>Description</Label>
            <Input
              value={f.description}
              onChangeText={(v) => setEditing((e) => e && { ...e, form: { ...e.form, description: v } })}
              multiline
              style={{ minHeight: 64, textAlignVertical: "top", marginBottom: 12 }}
            />

            <Label>Category</Label>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {[MenuCategory.Shake, MenuCategory.Snack].map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setEditing((e) => e && { ...e, form: { ...e.form, category: c } })}
                  style={[styles.catChoice, { backgroundColor: f.category === c ? colors.peach : colors.white }]}
                >
                  <Text style={styles.catText}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Label>Price (₱)</Label>
                <Input
                  value={f.price}
                  keyboardType="decimal-pad"
                  onChangeText={(v) => setEditing((e) => e && { ...e, form: { ...e.form, price: v } })}
                  style={{ marginBottom: 12 }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Label>Calories</Label>
                <Input
                  value={f.calories}
                  keyboardType="number-pad"
                  onChangeText={(v) => setEditing((e) => e && { ...e, form: { ...e.form, calories: v } })}
                  style={{ marginBottom: 12 }}
                />
              </View>
            </View>

            <Label>Benefits (comma-separated)</Label>
            <Input
              value={f.benefits}
              onChangeText={(v) => setEditing((e) => e && { ...e, form: { ...e.form, benefits: v } })}
              placeholder="protein, low sugar, energy"
              style={{ marginBottom: 12 }}
            />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Label>Available</Label>
              <Switch
                value={f.isAvailable}
                onValueChange={(v) => setEditing((e) => e && { ...e, form: { ...e.form, isAvailable: v } })}
                trackColor={{ true: colors.peach, false: colors.sand }}
                thumbColor={colors.forest}
              />
            </View>

            <Label>Image</Label>
            {f.imageUrl ? (
              <Image
                source={{ uri: absUrl(f.imageUrl) ?? undefined }}
                style={styles.preview}
                resizeMode="cover"
              />
            ) : null}
            <Button
              label={uploading ? "Uploading…" : f.imageUrl ? "Replace photo" : "Upload photo"}
              variant="outline"
              loading={uploading}
              onPress={uploadImage}
              style={{ marginBottom: 16 }}
            />

            {error && <ErrorBox message={error} />}

            <Button label={editing?.id ? "Save changes" : "Create item"} variant="dark" loading={saving} onPress={save} />
            <Button label="Cancel" variant="outline" onPress={() => setEditing(null)} style={{ marginTop: 8 }} />
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.sand,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  rowName: { fontWeight: "800", color: colors.forest, fontSize: 14 },
  rowMeta: { fontSize: 11, color: colors.stone500, marginTop: 2, textTransform: "capitalize" },
  link: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.forest,
  },
  switchLabel: { fontSize: 9, color: colors.stone500, marginTop: 2 },
  fabWrap: { position: "absolute", bottom: 20, right: 16, left: 16 },
  modalTitle: { fontSize: 24, fontWeight: "900", color: colors.forest, marginBottom: 16 },
  catChoice: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.peachSoft,
    paddingVertical: 10,
    alignItems: "center",
  },
  catText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.forest,
  },
  preview: {
    width: "100%",
    height: 160,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: colors.sand,
  },
});
