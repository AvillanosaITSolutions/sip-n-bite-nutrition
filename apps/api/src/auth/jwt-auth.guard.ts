import { ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private static readonly log = new Logger("JwtAuthGuard");

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      const req = context.switchToHttp().getRequest();
      const reason = info?.message ?? info?.name ?? String(info);
      JwtAuthGuard.log.warn(
        `Reject ${req.method} ${req.url} — reason="${reason}" err="${err?.message ?? ""}"`,
      );
      throw err || new UnauthorizedException(reason);
    }
    return user;
  }
}
