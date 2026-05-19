import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { ProductInput } from "@snb/shared";
import { Product } from "./product.entity";

@Injectable()
export class ProductsService {
  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  listPublic() {
    return this.repo.find({ order: { name: "ASC" } });
  }

  listAll() {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async get(id: string) {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException("Product not found");
    return p;
  }

  create(input: ProductInput) {
    return this.repo.save(this.repo.create({ ...input, price: input.price.toFixed(2) }));
  }

  async update(id: string, input: Partial<ProductInput>) {
    const p = await this.get(id);
    Object.assign(p, input, input.price != null ? { price: input.price.toFixed(2) } : {});
    return this.repo.save(p);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }

  async adjustStock(id: string, delta: number) {
    const p = await this.get(id);
    p.stock = Math.max(0, p.stock + delta);
    return this.repo.save(p);
  }
}
