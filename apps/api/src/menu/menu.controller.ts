import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Role, menuItemSchema, type MenuItemInput } from "@snb/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { MenuService } from "./menu.service";

@Controller("menu")
export class MenuController {
  constructor(private readonly menu: MenuService) {}

  @Get()
  listPublic() {
    return this.menu.listPublic();
  }

  @Get("all")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  listAll() {
    return this.menu.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  create(@Body(new ZodPipe(menuItemSchema)) input: MenuItemInput) {
    return this.menu.create(input);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  update(@Param("id") id: string, @Body(new ZodPipe(menuItemSchema.partial())) input: Partial<MenuItemInput>) {
    return this.menu.update(id, input);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SuperAdmin)
  remove(@Param("id") id: string) {
    return this.menu.remove(id);
  }
}
