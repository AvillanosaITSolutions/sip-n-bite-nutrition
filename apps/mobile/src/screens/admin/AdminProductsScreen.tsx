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
import { Fulfillment, productSchema } from "@snb/shared";
import { useApi } from "../../auth/AuthContext";
import { absUrl } from "../../lib/absUrl";
import { pickImage } from "../../lib/pickImage";
import { colors, peso } from "../../theme";
import { Button, EmptyState, ErrorBox, Input, Label } from "../../components/ui";

type Row = {
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

type FormState = {
  name: string;
  description: string;
  sku: string;
  price: string;
  stock: string;
  isPreorder: boolean;
  fulfillment: Fulfillment;
  imageUrl: string | null;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  sku: "",
  price: "",
  stock: "0",
  isPreorder: false,
  fulfillment: Fulfillment.Both,
  imageUrl: null,
};

const FULFILLMENTS = [Fulfillment.Pickup, Fulfillment.Delivery, Fulfillment.Both];

export function AdminProductsScreen() {
  const api = useApi();
  const [rows, setRows] = useState<Row[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<{ id: string | null; form: FormState } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await api.get<Row[]>("/products/all"));
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
        sku: r.sku,
        price: String(Number(r.price)),
        stock: String(r.stock),
        isPreorder: r.isPreorder,
        fulfillment: r.fulfillment,
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
      sku: f.sku.trim(),
      price: parseFloat(f.price),
      stock: parseInt(f.stock, 10) || 0,
      isPreorder: f.isPreorder,
      fulfillment: f.fulfillment,
      imageUrl: f.imageUrl || null,
    };
    const parsed = productSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n"));
      return;
    }
    setSaving(true);
    try {
      if (editing.id) await api.patch(`/products/${editing.id}`, parsed.data);
      else await api.post("/products", parsed.data);
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
      const r = await api.upload<{ url: string }>("/uploads/products", file);
      setEditing((e) => (e ? { ...e, form: { ...e.form, imageUrl: r.url } } : e));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function adjustStock(id: string, delta: number) {
    await api.patch(`/products/${id}/stock`, { delta });
    load();
  }

  async function togglePreorder(r: Row) {
    await api.patch(`/products/${r.id}`, { isPreorder: !r.isPreorder });
    load();
  }

  function confirmDelete(r: Row) {
    Alert.alert("Delete product", `Delete "${r.name}"? This can't be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.del(`/products/${r.id}`);
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
          <EmptyState emoji="🌿" title="No products yet" body="Tap “New product” to add one." />
        }
        renderItem={({ item: r }) => {
          const img = absUrl(r.imageUrl);
          return (
            <View style={styles.row}>
              <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                <View style={styles.thumb}>
                  {img ? (
                    <Image source={{ uri: img }} style={{ width: "100%", height: "100%" }} resizeMode="contain" />
                  ) : (
                    <Text style={{ fontSize: 22 }}>🌿</Text>
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowName} numberOfLines={1}>{r.name}</Text>
                  <Text style={styles.rowMeta}>
                    {r.sku} · {peso(r.price)} · {r.fulfillment}
                    {r.isPreorder ? " · preorder" : ""}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 6 }}>
                    <Pressable onPress={() => openEdit(r)}>
                      <Text style={styles.link}>Edit</Text>
                    </Pressable>
                    <Pressable onPress={() => togglePreorder(r)}>
                      <Text style={styles.link}>{r.isPreorder ? "Unset preorder" : "Set preorder"}</Text>
                    </Pressable>
                    <Pressable onPress={() => confirmDelete(r)}>
                      <Text style={[styles.link, { color: colors.redText }]}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={styles.stockRow}>
                <Text style={styles.stockLabel}>Stock</Text>
                <Pressable onPress={() => adjustStock(r.id, -1)} style={styles.stockBtn}>
                  <Text style={styles.stockBtnText}>−</Text>
                </Pressable>
                <Text style={styles.stockValue}>{r.stock}</Text>
                <Pressable onPress={() => adjustStock(r.id, 1)} style={styles.stockBtn}>
                  <Text style={styles.stockBtnText}>+</Text>
                </Pressable>
                <Pressable onPress={() => adjustStock(r.id, 10)} style={[styles.stockBtn, { width: 44 }]}>
                  <Text style={styles.stockBtnText}>+10</Text>
                </Pressable>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.fabWrap}>
        <Button label="＋ New product" variant="dark" onPress={openCreate} />
      </View>

      <Modal visible={!!editing} animationType="slide" onRequestClose={() => setEditing(null)}>
        {f && (
          <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 48, paddingBottom: 64 }}>
            <Text style={styles.modalTitle}>{editing?.id ? "Edit product" : "New product"}</Text>

            <Label>Name</Label>
            <Input value={f.name} onChangeText={(v) => setEditing((e) => e && { ...e, form: { ...e.form, name: v } })} style={{ marginBottom: 12 }} />

            <Label>Description</Label>
            <Input
              value={f.description}
              onChangeText={(v) => setEditing((e) => e && { ...e, form: { ...e.form, description: v } })}
              multiline
              style={{ minHeight: 64, textAlignVertical: "top", marginBottom: 12 }}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Label>SKU</Label>
                <Input
                  value={f.sku}
                  autoCapitalize="characters"
                  onChangeText={(v) => setEditing((e) => e && { ...e, form: { ...e.form, sku: v } })}
                  style={{ marginBottom: 12 }}
                />
              </View>
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
                <Label>Stock</Label>
                <Input
                  value={f.stock}
                  keyboardType="number-pad"
                  onChangeText={(v) => setEditing((e) => e && { ...e, form: { ...e.form, stock: v } })}
                  style={{ marginBottom: 12 }}
                />
              </View>
            </View>

            <Label>Fulfillment</Label>
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
              {FULFILLMENTS.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setEditing((e) => e && { ...e, form: { ...e.form, fulfillment: c } })}
                  style={[styles.catChoice, { backgroundColor: f.fulfillment === c ? colors.peach : colors.white }]}
                >
                  <Text style={styles.catText}>{c}</Text>
                </Pressable>
              ))}
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <Label>Preorder</Label>
              <Switch
                value={f.isPreorder}
                onValueChange={(v) => setEditing((e) => e && { ...e, form: { ...e.form, isPreorder: v } })}
                trackColor={{ true: colors.peach, false: colors.sand }}
                thumbColor={colors.forest}
              />
            </View>

            <Label>Image</Label>
            {f.imageUrl ? (
              <Image source={{ uri: absUrl(f.imageUrl) ?? undefined }} style={styles.preview} resizeMode="contain" />
            ) : null}
            <Button
              label={uploading ? "Uploading…" : f.imageUrl ? "Replace photo" : "Upload photo"}
              variant="outline"
              loading={uploading}
              onPress={uploadImage}
              style={{ marginBottom: 16 }}
            />

            {error && <ErrorBox message={error} />}

            <Button label={editing?.id ? "Save changes" : "Create product"} variant="dark" loading={saving} onPress={save} />
            <Button label="Cancel" variant="outline" onPress={() => setEditing(null)} style={{ marginTop: 8 }} />
          </ScrollView>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
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
  rowMeta: { fontSize: 11, color: colors.stone500, marginTop: 2 },
  link: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: colors.forest,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.sand,
  },
  stockLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    fontWeight: "700",
    color: colors.stone500,
    marginRight: "auto",
  },
  stockBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.peachSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stockBtnText: { fontWeight: "900", color: colors.forest, fontSize: 12 },
  stockValue: {
    minWidth: 34,
    textAlign: "center",
    fontWeight: "900",
    color: colors.forest,
    fontSize: 15,
  },
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
