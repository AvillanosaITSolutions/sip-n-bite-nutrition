import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
import { DataSource, DataSourceOptions } from "typeorm";
import { User } from "./users/user.entity";
import { MenuItem } from "./menu/menu-item.entity";
import { Product } from "./products/product.entity";
import { Order } from "./orders/order.entity";
import { OrderItem } from "./orders/order-item.entity";

export const dataSourceOptions: DataSourceOptions = {
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [User, MenuItem, Product, Order, OrderItem],
  migrations: ["dist/migrations/*.js"],
  synchronize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV === "development",
};

export default new DataSource(dataSourceOptions);
