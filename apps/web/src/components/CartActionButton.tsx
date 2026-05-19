import { useEffect, useRef, useState } from "react";
import type { OrderItemType } from "@snb/shared";
import { useCart } from "../store/cart";
import { useToast } from "../store/toast";
import { playAddToCart } from "../lib/sounds";

type Variant = "default" | "compact";
type AnimState = "idle" | "loading" | "done";

const FOREST = "#1E3D2F";
const PEACH = "#F4A77E";

type Props = {
  itemId: string;
  itemType: OrderItemType;
  name: string;
  unitPrice: number;
  imageUrl?: string | null;
  label: string;
  doneLabel?: string;
  disabled?: boolean;
  variant?: Variant;
  fullWidth?: boolean;
  /** Cap quantity at this number (e.g. remaining stock). Undefined = unlimited. */
  maxQuantity?: number;
};

export function CartActionButton({
  itemId,
  itemType,
  name,
  unitPrice,
  imageUrl,
  label,
  doneLabel = "Added",
  disabled,
  variant = "default",
  fullWidth,
  maxQuantity,
}: Props) {
  const quantity = useCart(
    (s) => s.lines.find((l) => l.itemId === itemId)?.quantity ?? 0,
  );
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const pushToast = useToast((s) => s.push);

  function handleAdd() {
    add({ itemType, itemId, name, unitPrice, quantity: 1, imageUrl });
    playAddToCart();
    const isPreorder = /preorder/i.test(label);
    pushToast({
      message: isPreorder ? `${name} reserved` : `${name} added to cart`,
      description: `₱${unitPrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      imageUrl,
      variant: "success",
    });
  }

  if (quantity > 0) {
    const atMax = maxQuantity !== undefined && quantity >= maxQuantity;
    return (
      <QuantityControls
        quantity={quantity}
        onDec={() => (quantity > 1 ? setQty(itemId, quantity - 1) : remove(itemId))}
        onInc={() => {
          if (atMax) return;
          setQty(itemId, quantity + 1);
        }}
        variant={variant}
        fullWidth={fullWidth}
        atMax={atMax}
      />
    );
  }

  return (
    <AnimatedAddButton
      label={label}
      doneLabel={doneLabel}
      disabled={disabled}
      variant={variant}
      fullWidth={fullWidth}
      onAdd={handleAdd}
    />
  );
}

/* ─────────── quantity controls (shown once item is in cart) ─────────── */

function QuantityControls({
  quantity,
  onDec,
  onInc,
  variant,
  fullWidth,
  atMax,
}: {
  quantity: number;
  onDec: () => void;
  onInc: () => void;
  variant: Variant;
  fullWidth?: boolean;
  atMax?: boolean;
}) {
  const isCompact = variant === "compact";
  const btnSize = isCompact ? "w-6 h-6 text-sm" : "w-8 h-8 text-base";
  return (
    <div
      className={
        "inline-flex items-center justify-between rounded-full shadow-sm select-none " +
        (isCompact ? "px-1 py-1 text-[11px] " : "px-1.5 py-1 text-xs ") +
        (fullWidth ? "w-full " : "")
      }
      style={{
        backgroundColor: PEACH,
        color: FOREST,
        minWidth: fullWidth ? undefined : isCompact ? 108 : 130,
      }}
    >
      <button
        type="button"
        onClick={onDec}
        aria-label="Decrease quantity"
        className={`${btnSize} rounded-full flex items-center justify-center font-bold transition hover:opacity-90`}
        style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
      >
        −
      </button>
      <span className={"font-extrabold tabular-nums " + (isCompact ? "text-xs" : "text-sm")}>
        {quantity} <span className="uppercase tracking-widest opacity-70 text-[9px] ml-0.5">in cart</span>
      </span>
      <button
        type="button"
        onClick={onInc}
        aria-label={atMax ? "Stock limit reached" : "Increase quantity"}
        disabled={atMax}
        title={atMax ? "No more stock" : undefined}
        className={`${btnSize} rounded-full flex items-center justify-center font-bold transition hover:opacity-90 disabled:cursor-not-allowed`}
        style={{
          backgroundColor: FOREST,
          color: PEACH,
          opacity: atMax ? 0.35 : 1,
        }}
      >
        +
      </button>
    </div>
  );
}

/* ─────────── animated add (idle → progress → check → idle) ─────────── */

function AnimatedAddButton({
  label,
  doneLabel,
  disabled,
  variant,
  fullWidth,
  onAdd,
}: {
  label: string;
  doneLabel: string;
  disabled?: boolean;
  variant: Variant;
  fullWidth?: boolean;
  onAdd: () => void;
}) {
  const [state, setState] = useState<AnimState>("idle");
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function click() {
    if (disabled || state !== "idle") return;
    onAdd();
    setState("loading");
    timers.current.push(window.setTimeout(() => setState("done"), 720));
    // No reset back to idle — once added, the parent will re-render with QuantityControls.
  }

  const isCompact = variant === "compact";
  const chipSize = isCompact ? 20 : 24;
  const stroke = 3;
  const r = chipSize / 2 - stroke / 2;
  const c = 2 * Math.PI * r;

  return (
    <button
      type="button"
      onClick={click}
      disabled={disabled || state !== "idle"}
      className={
        "inline-flex items-center justify-between gap-2 rounded-full font-bold uppercase tracking-widest shadow-sm transition disabled:cursor-not-allowed " +
        (isCompact ? "px-3 py-1 text-[11px] " : "px-4 py-2 text-xs ") +
        (fullWidth ? "w-full " : "")
      }
      style={{
        backgroundColor: PEACH,
        color: FOREST,
        opacity: disabled ? 0.4 : 1,
        minWidth: fullWidth ? undefined : isCompact ? 108 : 130,
      }}
    >
      <span className="truncate">{state === "done" ? doneLabel : label}</span>
      <span
        className="relative inline-flex items-center justify-center rounded-full overflow-hidden transition-colors"
        style={{
          width: chipSize,
          height: chipSize,
          backgroundColor: state === "done" ? FOREST : "rgba(0,0,0,0.12)",
          color: state === "done" ? PEACH : FOREST,
        }}
      >
        {state === "idle" && (
          <span className={isCompact ? "text-[10px]" : "text-[11px]"}>↗</span>
        )}
        {state === "loading" && (
          <svg width={chipSize} height={chipSize} className="-rotate-90">
            <circle cx={chipSize / 2} cy={chipSize / 2} r={r} fill="none" stroke="rgba(30,61,47,0.2)" strokeWidth={stroke} />
            <circle
              cx={chipSize / 2}
              cy={chipSize / 2}
              r={r}
              fill="none"
              stroke={FOREST}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c}
              style={{ animation: "cartProgress 700ms cubic-bezier(0.4,0,0.2,1) forwards" }}
            />
          </svg>
        )}
        {state === "done" && (
          <svg
            width={chipSize}
            height={chipSize}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: "cartCheckIn 280ms cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            <polyline points="5 12 10 17 19 7" />
          </svg>
        )}
      </span>

      <style>{`
        @keyframes cartProgress { from { stroke-dashoffset: ${c}; } to { stroke-dashoffset: 0; } }
        @keyframes cartCheckIn { 0% { transform: scale(0.4); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </button>
  );
}
