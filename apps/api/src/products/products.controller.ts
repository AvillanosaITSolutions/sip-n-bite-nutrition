import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Role, productSchema, type ProductInput } from "@snb/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { ProductsService } from "./products.service";

@Controller("products")
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  listPublic() {
    return this.products.listPublic();
  }

  @Get("all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  listAll() {
    return this.products.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  create(@Body(new ZodPipe(productSchema)) input: ProductInput) {
    return this.products.create(input);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  update(@Param("id") id: string, @Body(new ZodPipe(productSchema.partial())) input: Partial<ProductInput>) {
    return this.products.update(id, input);
  }

  @Patch(":id/stock")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  adjust(@Param("id") id: string, @Body("delta") delta: number) {
    return this.products.adjustStock(id, Number(delta));
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin)
  remove(@Param("id") id: string) {
    return this.products.remove(id);
  }
}
