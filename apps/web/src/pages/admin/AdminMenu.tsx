import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Label, Select, Table, TextInput, Textarea, ToggleSwitch } from "flowbite-react";
import { MenuCategory, type MenuItemInput } from "@snb/shared";
import { useApi } from "../../hooks/useApi";

type Row = MenuItemInput & { id: string; price: string };

type FormShape = Omit<MenuItemInput, "benefits"> & { benefits: string };

const API_URL = import.meta.env.VITE_API_URL as string;

function absUrl(u: string | null | undefined) {
  if (!u) return null;
  if (/^https?:/i.test(u)) return u;
  return `${API_URL}${u}`;
}

export function AdminMenu() {
  const api = useApi();
  const [rows, setRows] = useState<Row[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState } = useForm<FormShape>({
    defaultValues: {
      name: "",
      description: "",
      category: MenuCategory.Shake,
      calories: 0,
      benefits: "",
      price: 0,
      isAvailable: true,
      imageUrl: null,
    } as FormShape,
  });
  const imageUrl = watch("imageUrl");

  async function refresh() {
    setRows(await api.get<Row[]>("/menu/all"));
  }
  useEffect(() => {
    refresh().catch(() => setRows([]));
  }, []);

  function startEdit(r: Row) {
    setEditingId(r.id);
    setError(null);
    reset({
      name: r.name,
      description: r.description,
      category: r.category,
      calories: r.calories,
      benefits: (r.benefits ?? []).join(", "),
      price: Number(r.price),
      isAvailable: r.isAvailable,
      imageUrl: r.imageUrl ?? null,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
    reset({
      name: "",
      description: "",
      category: MenuCategory.Shake,
      calories: 0,
      benefits: "",
      price: 0,
      isAvailable: true,
      imageUrl: null,
    });
  }

  async function onSubmit(values: FormShape) {
    setError(null);
    const payload: MenuItemInput = {
      ...values,
      benefits: String(values.benefits || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      if (editingId) {
        await api.patch(`/menu/${editingId}`, payload);
      } else {
        await api.post("/menu", payload);
      }
      cancelEdit();
      await refresh();
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
    }
  }

  async function onFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const r = await api.upload<{ url: string }>("/uploads/menu", file);
      setValue("imageUrl", r.url, { shouldDirty: true });
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function toggleAvail(r: Row) {
    await api.patch(`/menu/${r.id}`, { isAvailable: !r.isAvailable });
    refresh();
  }

  async function remove(r: Row) {
    if (!confirm(`Delete "${r.name}"?`)) return;
    try {
      await api.del(`/menu/${r.id}`);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "Delete failed (SuperAdmin required).");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-white p-4 rounded border h-fit sticky top-20">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{editingId ? "Edit menu item" : "New menu item"}</h2>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="text-xs text-stone-500 hover:underline">
              Cancel
            </button>
          )}
        </div>

        {/* Image */}
        <div>
          <Label>Thumbnail</Label>
          <div className="flex items-center gap-3 mt-1">
            <div className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center bg-stone-100 border">
              {imageUrl ? (
                <img src={absUrl(imageUrl) ?? ""} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl opacity-40">🥤</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => onFile(e.target.files?.[0] ?? null)}
                className="text-xs"
                disabled={uploading}
              />
              {imageUrl && (
                <button
                  type="button"
                  className="text-xs text-stone-500 hover:text-red-600 block"
                  onClick={() => setValue("imageUrl", null, { shouldDirty: true })}
                >
                  Remove image
                </button>
              )}
              {uploading && <p className="text-xs text-stone-500">Uploading…</p>}
            </div>
          </div>
        </div>

        <div>
          <Label>Name</Label>
          <TextInput {...register("name")} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={2} {...register("description")} />
        </div>
        <div>
          <Label>Category</Label>
          <Select {...register("category")}>
            <option value={MenuCategory.Shake}>Shake</option>
            <option value={MenuCategory.Snack}>Snack</option>
          </Select>
        </div>
        <div>
          <Label>Calories</Label>
          <TextInput type="number" {...register("calories", { valueAsNumber: true })} />
        </div>
        <div>
          <Label>Benefits (comma separated)</Label>
          <TextInput {...register("benefits")} placeholder="High Protein, Filling, ..." />
        </div>
        <div>
          <Label>Price (PHP)</Label>
          <TextInput type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <ToggleSwitch
            checked={watch("isAvailable") ?? true}
            label="Available"
            onChange={(v) => setValue("isAvailable", v, { shouldDirty: true })}
          />
        </div>

        {error && (
          <div className="text-xs rounded p-2 bg-red-50 text-red-700 border border-red-200">{error}</div>
        )}

        <Button type="submit" disabled={formState.isSubmitting || uploading} className="w-full">
          {editingId ? "Save changes" : "Create"}
        </Button>
      </form>

      <div className="lg:col-span-2 bg-white rounded border overflow-x-auto">
        <Table>
          <Table.Head>
            <Table.HeadCell>Thumb</Table.HeadCell>
            <Table.HeadCell>Name</Table.HeadCell>
            <Table.HeadCell>Category</Table.HeadCell>
            <Table.HeadCell>Price</Table.HeadCell>
            <Table.HeadCell>Available</Table.HeadCell>
            <Table.HeadCell>Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {rows.map((r) => (
              <Table.Row key={r.id} className={editingId === r.id ? "bg-amber-50" : undefined}>
                <Table.Cell>
                  <div className="w-12 h-12 rounded overflow-hidden bg-stone-100 flex items-center justify-center">
                    {r.imageUrl ? (
                      <img src={absUrl(r.imageUrl) ?? ""} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg opacity-40">🥤</span>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell className="font-medium">{r.name}</Table.Cell>
                <Table.Cell className="capitalize">{r.category}</Table.Cell>
                <Table.Cell>₱{r.price}</Table.Cell>
                <Table.Cell>
                  <ToggleSwitch checked={r.isAvailable} label="" onChange={() => toggleAvail(r)} />
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <button onClick={() => startEdit(r)} className="text-xs font-bold text-blue-700 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => remove(r)} className="text-xs text-stone-500 hover:text-red-600">
                      Delete
                    </button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
}
