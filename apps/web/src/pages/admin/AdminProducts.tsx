import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Label, Select, Table, TextInput, Textarea, ToggleSwitch } from "flowbite-react";
import { Fulfillment, type ProductInput } from "@snb/shared";
import { useApi } from "../../hooks/useApi";

type Row = ProductInput & { id: string; price: string };

const API_URL = import.meta.env.VITE_API_URL as string;

function absUrl(u: string | null | undefined) {
  if (!u) return null;
  if (/^https?:/i.test(u)) return u;
  return `${API_URL}${u}`;
}

export function AdminProducts() {
  const api = useApi();
  const [rows, setRows] = useState<Row[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState } = useForm<ProductInput>({
    defaultValues: {
      name: "",
      description: "",
      sku: "",
      price: 0,
      stock: 0,
      isPreorder: false,
      fulfillment: Fulfillment.Both,
      imageUrl: null,
    },
  });
  const imageUrl = watch("imageUrl");

  async function refresh() {
    setRows(await api.get<Row[]>("/products/all"));
  }
  useEffect(() => {
    refresh().catch(() => setRows([]));
  }, []);

  function startEdit(r: Row) {
    setEditingId(r.id);
    setError(null);
    reset({
      name: r.name,
      description: r.description ?? "",
      sku: r.sku,
      price: Number(r.price),
      stock: r.stock,
      isPreorder: r.isPreorder,
      fulfillment: r.fulfillment,
      imageUrl: r.imageUrl ?? null,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
    reset({
      name: "",
      description: "",
      sku: "",
      price: 0,
      stock: 0,
      isPreorder: false,
      fulfillment: Fulfillment.Both,
      imageUrl: null,
    });
  }

  async function onSubmit(values: ProductInput) {
    setError(null);
    try {
      if (editingId) {
        await api.patch(`/products/${editingId}`, values);
      } else {
        await api.post("/products", values);
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
      const r = await api.upload<{ url: string }>("/uploads/products", file);
      setValue("imageUrl", r.url, { shouldDirty: true });
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function adjust(id: string, delta: number) {
    await api.patch(`/products/${id}/stock`, { delta });
    refresh();
  }
  async function togglePreorder(r: Row) {
    await api.patch(`/products/${r.id}`, { isPreorder: !r.isPreorder });
    refresh();
  }
  async function remove(r: Row) {
    if (!confirm(`Delete "${r.name}"?`)) return;
    try {
      await api.del(`/products/${r.id}`);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "Delete failed (SuperAdmin required).");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 bg-white p-4 rounded border h-fit sticky top-20">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{editingId ? "Edit product" : "New product"}</h2>
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
                <img src={absUrl(imageUrl) ?? ""} alt="" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-2xl opacity-40">🌿</span>
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
          <Label>SKU</Label>
          <TextInput {...register("sku")} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={2} {...register("description")} />
        </div>
        <div>
          <Label>Price (PHP)</Label>
          <TextInput type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
        </div>
        <div>
          <Label>Stock</Label>
          <TextInput type="number" {...register("stock", { valueAsNumber: true })} />
        </div>
        <div>
          <Label>Fulfillment</Label>
          <Select {...register("fulfillment")}>
            <option value={Fulfillment.Pickup}>Pickup</option>
            <option value={Fulfillment.Delivery}>Delivery</option>
            <option value={Fulfillment.Both}>Both</option>
          </Select>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <ToggleSwitch
            checked={watch("isPreorder") ?? false}
            label="Preorder"
            onChange={(v) => setValue("isPreorder", v, { shouldDirty: true })}
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
            <Table.HeadCell>SKU</Table.HeadCell>
            <Table.HeadCell>Price</Table.HeadCell>
            <Table.HeadCell>Stock</Table.HeadCell>
            <Table.HeadCell>Preorder</Table.HeadCell>
            <Table.HeadCell>Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {rows.map((r) => (
              <Table.Row key={r.id} className={editingId === r.id ? "bg-amber-50" : undefined}>
                <Table.Cell>
                  <div className="w-12 h-12 rounded overflow-hidden bg-stone-100 flex items-center justify-center">
                    {r.imageUrl ? (
                      <img src={absUrl(r.imageUrl) ?? ""} alt="" className="w-full h-full object-contain p-1" />
                    ) : (
                      <span className="text-lg opacity-40">🌿</span>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell className="font-medium">{r.name}</Table.Cell>
                <Table.Cell className="text-xs">{r.sku}</Table.Cell>
                <Table.Cell>₱{r.price}</Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Button size="xs" color="gray" onClick={() => adjust(r.id, -1)}>-</Button>
                    <span className="font-mono">{r.stock}</span>
                    <Button size="xs" color="gray" onClick={() => adjust(r.id, 1)}>+</Button>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <ToggleSwitch checked={r.isPreorder} label="" onChange={() => togglePreorder(r)} />
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
