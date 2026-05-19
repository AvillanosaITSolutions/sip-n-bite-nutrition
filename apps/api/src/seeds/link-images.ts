/**
 * Walks apps/api/uploads/{products,menu} and writes matching public URLs into
 * `products.imageUrl` (by SKU) and `menu_items.imageUrl` (by slugified name).
 *
 * Files are matched by their basename, so `uploads/products/f1-wildberry-550g.jpg`
 * binds to the product with sku `f1-wildberry-550g`.
 *
 * Run: pnpm --filter @snb/api seed:product-images
 */
import "reflect-metadata";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

import * as fs from "fs";
import dataSource from "../data-source";
import { Product } from "../products/product.entity";
import { MenuItem } from "../menu/menu-item.entity";

const PUBLIC_BASE = process.env.PUBLIC_API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
const VALID_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[®™]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function scan(dir: string): Map<string, string> {
  const map = new Map<string, string>();
  if (!fs.existsSync(dir)) return map;
  for (const f of fs.readdirSync(dir)) {
    const ext = path.extname(f).toLowerCase();
    if (!VALID_EXT.has(ext)) continue;
    const key = path.basename(f, ext).toLowerCase();
    map.set(key, f);
  }
  return map;
}

async function run() {
  const productsDir = path.resolve(__dirname, "../../uploads/products");
  const menuDir = path.resolve(__dirname, "../../uploads/menu");

  const productFiles = scan(productsDir);
  const menuFiles = scan(menuDir);

  console.log(`Found ${productFiles.size} product files, ${menuFiles.size} menu files.`);

  await dataSource.initialize();
  const productsRepo = dataSource.getRepository(Product);
  const menuRepo = dataSource.getRepository(MenuItem);

  let pMatched = 0;
  for (const p of await productsRepo.find()) {
    const file = productFiles.get(p.sku.toLowerCase());
    if (file) {
      p.imageUrl = `${PUBLIC_BASE}/uploads/products/${file}`;
      await productsRepo.save(p);
      pMatched++;
      console.log(`✔ ${p.sku} → ${file}`);
    }
  }

  let mMatched = 0;
  for (const m of await menuRepo.find()) {
    const slug = slugify(m.name);
    const file = menuFiles.get(slug);
    if (file) {
      m.imageUrl = `${PUBLIC_BASE}/uploads/menu/${file}`;
      await menuRepo.save(m);
      mMatched++;
      console.log(`✔ ${slug} → ${file}`);
    }
  }

  console.log(`\nDone — products ${pMatched}, menu ${mMatched}.`);
  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
