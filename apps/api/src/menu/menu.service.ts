import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { MenuItemInput } from "@snb/shared";
import { MenuItem } from "./menu-item.entity";

@Injectable()
export class MenuService {
  constructor(@InjectRepository(MenuItem) private repo: Repository<MenuItem>) {}

  listPublic() {
    return this.repo.find({ where: { isAvailable: true }, order: { name: "ASC" } });
  }

  listAll() {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async get(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException("Menu item not found");
    return item;
  }

  create(input: MenuItemInput) {
    return this.repo.save(this.repo.create({ ...input, price: input.price.toFixed(2) }));
  }

  async update(id: string, input: Partial<MenuItemInput>) {
    const item = await this.get(id);
    Object.assign(item, input, input.price != null ? { price: input.price.toFixed(2) } : {});
    return this.repo.save(item);
  }

  async remove(id: string) {
    await this.repo.delete(id);
    return { ok: true };
  }
}
