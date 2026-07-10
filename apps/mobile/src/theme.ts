/** Sip 'N Bite brand palette — mirrors the web app. */
export const colors = {
  cream: "#FBF6EA",
  forest: "#1E3D2F",
  peach: "#F4A77E",
  peachSoft: "#FBD9B8",
  mustard: "#F5C97F",
  sage: "#DCE7DA",
  sand: "#F1ECDC",
  clay: "#E7D5D0",
  clayText: "#7A4438",
  white: "#FFFFFF",
  stone400: "#A8A29E",
  stone500: "#78716C",
  stone600: "#57534E",
  redBg: "#FEE2E2",
  redText: "#7F1D1D",
};

export const STATUS_META: Record<string, { label: string; bg: string; color?: string }> = {
  pending: { label: "Pending", bg: colors.peachSoft },
  awaiting_payment: { label: "Awaiting payment", bg: colors.mustard },
  paid: { label: "Paid", bg: colors.sage },
  preparing: { label: "Preparing", bg: colors.peach },
  ready_for_pickup: { label: "Ready", bg: colors.mustard },
  out_for_delivery: { label: "Out for delivery", bg: colors.peach },
  completed: { label: "Completed", bg: colors.sage },
  cancelled: { label: "Cancelled", bg: colors.clay, color: colors.clayText },
  refunded: { label: "Refunded", bg: colors.clay, color: colors.clayText },
};

export function peso(n: number | string, minFraction = 2) {
  return `₱${Number(n).toLocaleString("en-PH", {
    minimumFractionDigits: minFraction,
    maximumFractionDigits: 2,
  })}`;
}
