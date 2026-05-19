export const Role = {
  Customer: "customer",
  PosOperator: "pos-operator",
  Admin: "admin",
  SuperAdmin: "super-admin",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const MenuCategory = {
  Shake: "shake",
  Snack: "snack",
} as const;
export type MenuCategory = (typeof MenuCategory)[keyof typeof MenuCategory];

export const Fulfillment = {
  Pickup: "pickup",
  Delivery: "delivery",
  Both: "both",
} as const;
export type Fulfillment = (typeof Fulfillment)[keyof typeof Fulfillment];

export const OrderStatus = {
  Pending: "pending",
  AwaitingPayment: "awaiting_payment",
  Paid: "paid",
  Preparing: "preparing",
  ReadyForPickup: "ready_for_pickup",
  OutForDelivery: "out_for_delivery",
  Completed: "completed",
  Cancelled: "cancelled",
  Refunded: "refunded",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderItemType = {
  Menu: "menu",
  Product: "product",
} as const;
export type OrderItemType = (typeof OrderItemType)[keyof typeof OrderItemType];

export const PaymentMethod = {
  Online: "online",
  AtHub: "at_hub",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
