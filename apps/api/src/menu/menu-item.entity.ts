import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { MenuCategory } from "@snb/shared";

@Entity("menu_items")
export class MenuItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 160 })
  name: string;

  @Column({ type: "text", default: "" })
  description: string;

  @Column({ type: "varchar", length: 16 })
  category: MenuCategory;

  @Column({ type: "int", default: 0 })
  calories: number;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  benefits: string[];

  @Column({ type: "numeric", precision: 12, scale: 2 })
  price: string;

  @Column({ type: "boolean", default: true })
  isAvailable: boolean;

  @Column({ type: "varchar", length: 500, nullable: true })
  imageUrl: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
