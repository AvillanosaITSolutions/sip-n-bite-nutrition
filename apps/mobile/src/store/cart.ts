import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OrderItemType } from "@snb/shared";

export type CartLine = {
  itemType: OrderItemType;
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string | null;
  /** Maximum allowed quantity (e.g. available stock). Undefined = unlimited. */
  maxQuantity?: number;
};

type CartState = {
  lines: CartLine[];
  add: (line: CartLine) => void;
  remove: (itemId: string) => void;
  setQty: (itemId: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.itemId === line.itemId);
          if (existing) {
            const merged = { ...existing, quantity: existing.quantity + line.quantity };
            // Carry through the latest maxQuantity (in case stock changed since first add)
            if (line.maxQuantity !== undefined) merged.maxQuantity = line.maxQuantity;
            if (merged.maxQuantity !== undefined && merged.quantity > merged.maxQuantity) {
              merged.quantity = merged.maxQuantity;
            }
            return {
              lines: s.lines.map((l) => (l.itemId === line.itemId ? merged : l)),
            };
          }
          const capped =
            line.maxQuantity !== undefined && line.quantity > line.maxQuantity
              ? { ...line, quantity: line.maxQuantity }
              : line;
          return { lines: [...s.lines, capped] };
        }),
      remove: (itemId) => set((s) => ({ lines: s.lines.filter((l) => l.itemId !== itemId) })),
      setQty: (itemId, quantity) =>
        set((s) => ({
          lines: s.lines.map((l) => {
            if (l.itemId !== itemId) return l;
            const capped =
              l.maxQuantity !== undefined && quantity > l.maxQuantity ? l.maxQuantity : quantity;
            return { ...l, quantity: Math.max(0, capped) };
          }),
        })),
      clear: () => set({ lines: [] }),
      total: () => get().lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    }),
    { name: "snb-cart", storage: createJSONStorage(() => AsyncStorage) },
  ),
);
