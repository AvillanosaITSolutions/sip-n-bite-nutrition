import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Fulfillment } from "@snb/shared";

@Entity("products")
export class Product {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 200 })
  name: string;

  @Column({ type: "text", default: "" })
  description: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 64 })
  sku: string;

  @Column({ type: "numeric", precision: 12, scale: 2 })
  price: string;

  @Column({ type: "int", default: 0 })
  stock: number;

  @Column({ type: "boolean", default: false })
  isPreorder: boolean;

  @Column({ type: "varchar", length: 16 })
  fulfillment: Fulfillment;

  @Column({ type: "varchar", length: 500, nullable: true })
  imageUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
