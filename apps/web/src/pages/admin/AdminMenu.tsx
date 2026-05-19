import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Label, Select, Table, TextInput, Textarea, ToggleSwitch } from "flowbite-react";
import { MenuCategory, type MenuItemInput } from "@snb/shared";
import { useApi } from "../../hooks/useApi";
import { Highlight } from "../../components/Highlight";

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
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
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

  async function refresh(silent = false) {
    if (!silent) setLoading(true);
    try {
      setRows(await api.get<Row[]>("/menu/all"));
    } finally {
      if (!silent) setLoading(false);
    }
  }
  useEffect(() => {
    refresh().catch(() => {
      setRows([]);
      setLoading(false);
    });
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q) ||
        (r.benefits ?? []).some((b) => b.toLowerCase().includes(q)) ||
        r.category.toLowerCase().includes(q),
    );
  }, [rows, query]);

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
      await refresh(true);
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
    refresh(true);
  }

  async function remove(r: Row) {
    if (!confirm(`Delete "${r.name}"?`)) return;
    try {
      await api.del(`/menu/${r.id}`);
      await refresh(true);
    } catch (e: any) {
      alert(e?.message ?? "Delete failed (SuperAdmin required).");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <form onSubmit={handleSubmit(onSubmit)} className="order-2 lg:order-1 space-y-3 bg-white p-4 rounded border h-fit lg:sticky lg:top-20">
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
          <div className="mt-1 space-y-2">
            <div className="w-full aspect-square rounded-lg overflow-hidden flex items-center justify-center bg-stone-100 border">
              {imageUrl ? (
                <img src={absUrl(imageUrl) ?? ""} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl opacity-30">🥤</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
              className="text-xs w-full"
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

      <div className="order-1 lg:order-2 min-w-0 space-y-3">
        {/* Search bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-full px-4 py-2 bg-white border border-stone-200 flex-1 max-w-md">
            <span className="text-stone-400">🔍</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu items…"
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-stone-400 hover:text-stone-600 text-sm"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-xs uppercase tracking-widest font-bold text-stone-500">
            {loading ? "Loading…" : `${visible.length} of ${rows.length}`}
          </p>
        </div>

        {loading && (
          <div className="bg-white rounded border p-10 text-center text-stone-500 text-sm">
            <span className="inline-block w-5 h-5 border-2 border-stone-300 border-t-stone-700 rounded-full animate-spin align-middle mr-2" />
            Loading menu…
          </div>
        )}
        {!loading && visible.length === 0 && (
          <div className="bg-white rounded border p-10 text-center text-stone-500 text-sm">
            {rows.length === 0 ? "No menu items yet." : `No matches for "${query}".`}
          </div>
        )}

        {/* Mobile cards */}
        {!loading && visible.length > 0 && (
          <div className="md:hidden space-y-3">
            {visible.map((r) => (
              <div
                key={r.id}
                className={`rounded-lg p-3 flex gap-3 bg-white border ${editingId === r.id ? "border-amber-300 bg-amber-50" : "border-stone-200"}`}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-stone-100 flex items-center justify-center border border-stone-200 shrink-0">
                  {r.imageUrl ? (
                    <img src={absUrl(r.imageUrl) ?? ""} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl opacity-40">🥤</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold leading-tight">
                    <Highlight text={r.name} query={query} />
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-stone-500 mt-0.5">
                    <Highlight text={r.category} query={query} />
                  </p>
                  <p className="text-sm font-black mt-1">₱{r.price}</p>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <ToggleSwitch checked={r.isAvailable} label="Available" onChange={() => toggleAvail(r)} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-stone-100">
                    <button onClick={() => startEdit(r)} className="text-xs font-bold text-blue-700 hover:underline">
                      Edit
                    </button>
                    <button onClick={() => remove(r)} className="text-xs text-stone-500 hover:text-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && visible.length > 0 && (
          <div className="hidden md:block bg-white rounded border overflow-x-auto">
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
            {visible.map((r) => (
              <Table.Row key={r.id} className={editingId === r.id ? "bg-amber-50" : undefined}>
                <Table.Cell>
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-100 flex items-center justify-center border border-stone-200">
                    {r.imageUrl ? (
                      <img src={absUrl(r.imageUrl) ?? ""} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl opacity-40">🥤</span>
                    )}
                  </div>
                </Table.Cell>
                <Table.Cell className="font-medium">
                  <Highlight text={r.name} query={query} />
                </Table.Cell>
                <Table.Cell className="capitalize">
                  <Highlight text={r.category} query={query} />
                </Table.Cell>
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
        )}
      </div>
    </div>
  );
}
