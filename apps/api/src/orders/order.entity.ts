import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Fulfillment, OrderStatus, PaymentMethod } from "@snb/shared";
import { User } from "../users/user.entity";
import { OrderItem } from "./order-item.entity";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @ManyToOne(() => User, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "varchar", length: 32, default: "pending" })
  status: OrderStatus;

  @Column({ type: "varchar", length: 16 })
  fulfillment: Fulfillment;

  @Column({ type: "varchar", length: 16, default: "online" })
  paymentMethod: PaymentMethod;

  @Column({ type: "varchar", length: 500, nullable: true })
  deliveryAddress: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  notes: string | null;

  @Column({ type: "numeric", precision: 12, scale: 2, default: 0 })
  total: string;

  @Column({ type: "varchar", length: 128, nullable: true })
  paymongoCheckoutId: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  paymongoCheckoutUrl: string | null;

  @Column({ type: "timestamptz", nullable: true })
  paidAt: Date | null;

  @OneToMany(() => OrderItem, (i) => i.order, { cascade: true, eager: true })
  items: OrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
