import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "@snb/shared";
import { ROLES_KEY } from "./roles.decorator";
import { User } from "../users/user.entity";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const req = ctx.switchToHttp().getRequest();
    const sub: string | undefined = req.user?.sub;
    if (!sub) throw new ForbiddenException("Missing subject");

    const user = await this.users.findOne({ where: { auth0Sub: sub } });
    if (!user) throw new ForbiddenException("User not provisioned");
    req.localUser = user;

    if (!required.includes(user.role)) {
      throw new ForbiddenException(`Requires role: ${required.join(", ")}`);
    }
    return true;
  }
}
