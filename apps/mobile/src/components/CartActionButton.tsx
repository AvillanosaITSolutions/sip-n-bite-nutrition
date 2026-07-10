import { useEffect, useRef, useState } from "react";
import type { OrderItemType } from "@snb/shared";
import { useCart } from "../store/cart";
import { Button } from "./ui";

export function CartActionButton({
  itemId,
  itemType,
  name,
  unitPrice,
  imageUrl,
  label = "Add to Cart",
  doneLabel = "Added",
  disabled,
  maxQuantity,
}: {
  itemId: string;
  itemType: OrderItemType;
  name: string;
  unitPrice: number;
  imageUrl?: string | null;
  label?: string;
  doneLabel?: string;
  disabled?: boolean;
  maxQuantity?: number;
}) {
  const add = useCart((s) => s.add);
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (
    <Button
      label={justAdded ? `✓ ${doneLabel}` : label}
      variant={justAdded ? "dark" : "primary"}
      disabled={disabled}
      onPress={() => {
        add({ itemId, itemType, name, unitPrice, quantity: 1, imageUrl, maxQuantity });
        setJustAdded(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setJustAdded(false), 1200);
      }}
    />
  );
}
