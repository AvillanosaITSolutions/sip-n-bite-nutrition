import { Body, Controller, Get, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { Role } from "@snb/shared";
import { UsersService } from "./users.service";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  async me(@Req() req: any) {
    const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "") || undefined;
    return this.users.upsertFromAuth0(req.user, token);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.Admin, Role.SuperAdmin)
  list() {
    return this.users.list();
  }

  @Patch(":id/role")
  @UseGuards(RolesGuard)
  @Roles(Role.SuperAdmin)
  setRole(@Param("id") id: string, @Body("role") role: Role) {
    return this.users.setRole(id, role);
  }
}
