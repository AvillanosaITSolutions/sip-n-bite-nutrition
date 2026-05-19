import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { OrderItemType } from "@snb/shared";
import { Order } from "./order.entity";

@Entity("order_items")
export class OrderItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: "CASCADE" })
  @JoinColumn({ name: "orderId" })
  order: Order;

  @Column({ type: "uuid" })
  orderId: string;

  @Column({ type: "varchar", length: 16 })
  itemType: OrderItemType;

  @Column({ type: "uuid" })
  itemId: string;

  @Column({ type: "varchar", length: 200 })
  nameSnapshot: string;

  @Column({ type: "int" })
  quantity: number;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  unitPrice: string;
}
