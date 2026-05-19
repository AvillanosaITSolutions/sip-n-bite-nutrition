import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";

export type Auth0JwtPayload = {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  "https://snb/roles"?: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private static readonly log = new Logger("JwtStrategy");

  constructor() {
    const domain = process.env.AUTH0_DOMAIN!;
    const audience = process.env.AUTH0_AUDIENCE!;
    JwtStrategy.log.log(`Init — domain="${domain}" audience="${audience}"`);
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience,
      issuer: `https://${domain}/`,
      algorithms: ["RS256"],
    });
  }

  validate(payload: Auth0JwtPayload) {
    JwtStrategy.log.log(`Validated sub=${payload.sub}`);
    return payload;
  }
}
