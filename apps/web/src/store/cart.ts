import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OrderItemType } from "@snb/shared";

export type CartLine = {
  itemType: OrderItemType;
  itemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string | null;
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
            return {
              lines: s.lines.map((l) =>
                l.itemId === line.itemId ? { ...l, quantity: l.quantity + line.quantity } : l,
              ),
            };
          }
          return { lines: [...s.lines, line] };
        }),
      remove: (itemId) => set((s) => ({ lines: s.lines.filter((l) => l.itemId !== itemId) })),
      setQty: (itemId, quantity) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.itemId === itemId ? { ...l, quantity } : l)),
        })),
      clear: () => set({ lines: [] }),
      total: () => get().lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    }),
    { name: "snb-cart" },
  ),
);
