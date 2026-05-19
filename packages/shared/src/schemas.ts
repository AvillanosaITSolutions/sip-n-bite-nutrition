import { z } from "zod";
import { Fulfillment, MenuCategory, OrderItemType, PaymentMethod } from "./enums";

export const menuItemSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().default(""),
  category: z.enum([MenuCategory.Shake, MenuCategory.Snack]),
  calories: z.number().int().nonnegative(),
  benefits: z.array(z.string().min(1)).default([]),
  price: z.number().positive(),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().optional().nullable(),
});
export type MenuItemInput = z.infer<typeof menuItemSchema>;

export const productSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(4000).optional().default(""),
  sku: z.string().min(1).max(64),
  price: z.number().positive(),
  stock: z.number().int().nonnegative().default(0),
  isPreorder: z.boolean().default(false),
  fulfillment: z.enum([Fulfillment.Pickup, Fulfillment.Delivery, Fulfillment.Both]),
  imageUrl: z.string().url().optional().nullable(),
});
export type ProductInput = z.infer<typeof productSchema>;

export const orderLineSchema = z.object({
  itemType: z.enum([OrderItemType.Menu, OrderItemType.Product]),
  itemId: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
  lines: z.array(orderLineSchema).min(1),
  fulfillment: z.enum([Fulfillment.Pickup, Fulfillment.Delivery]),
  paymentMethod: z.enum([PaymentMethod.Online, PaymentMethod.AtHub]).default(PaymentMethod.Online),
  deliveryAddress: z.string().max(500).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const walkinOrderSchema = z.object({
  lines: z.array(orderLineSchema).min(1),
  customerName: z.string().max(120).optional().nullable(),
  customerPhone: z.string().max(64).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  cashReceived: z.number().nonnegative().optional().nullable(),
});
export type WalkinOrderInput = z.infer<typeof walkinOrderSchema>;
