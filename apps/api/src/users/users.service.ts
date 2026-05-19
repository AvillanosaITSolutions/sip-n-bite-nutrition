import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "@snb/shared";
import { User } from "./user.entity";
import { Auth0JwtPayload } from "../auth/jwt.strategy";

type UserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

const userinfoCache = new Map<string, { info: UserInfo; expires: number }>();
const USERINFO_TTL_MS = 10 * 60 * 1000; // 10 min

@Injectable()
export class UsersService {
  private static readonly log = new Logger("UsersService");
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async upsertFromAuth0(payload: Auth0JwtPayload, accessToken?: string): Promise<User> {
    const existing = await this.repo.findOne({ where: { auth0Sub: payload.sub } });

    // Auth0 access tokens often lack email/name/picture. If anything is missing,
    // hit /userinfo (which is authorized by the same access token) to enrich.
    const needsEnrich =
      !payload.email ||
      !payload.name ||
      !payload.picture ||
      (existing && (!existing.name || existing.email.endsWith("@unknown.local")));

    let info: UserInfo | undefined;
    if (needsEnrich && accessToken) {
      info = await this.fetchUserInfo(accessToken).catch((err) => {
        UsersService.log.warn(`/userinfo fetch failed: ${err?.message ?? err}`);
        return undefined;
      });
    }

    const email = payload.email ?? info?.email;
    const name = payload.name ?? info?.name;
    const picture = payload.picture ?? info?.picture;
    const requestedRole = this.getRoleForEmail(email);

    if (existing) {
      if (email) existing.email = email;
      if (name) existing.name = name;
      if (picture) existing.picture = picture;
      if (requestedRole && existing.role !== requestedRole) {
        existing.role = requestedRole;
      }
      return this.repo.save(existing);
    }

    const isFirstUser = (await this.repo.count()) === 0;
    return this.repo.save(
      this.repo.create({
        auth0Sub: payload.sub,
        email: email ?? `${payload.sub}@unknown.local`,
        name: name ?? null,
        picture: picture ?? null,
        role: requestedRole ?? (isFirstUser ? Role.SuperAdmin : Role.Customer),
      }),
    );
  }

  private async fetchUserInfo(accessToken: string): Promise<UserInfo> {
    const cached = userinfoCache.get(accessToken);
    if (cached && cached.expires > Date.now()) return cached.info;

    const domain = process.env.AUTH0_DOMAIN!;
    const res = await fetch(`https://${domain}/userinfo`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`userinfo ${res.status}: ${await res.text()}`);
    const info = (await res.json()) as UserInfo;
    userinfoCache.set(accessToken, { info, expires: Date.now() + USERINFO_TTL_MS });
    return info;
  }

  private getRoleForEmail(email?: string): Role | undefined {
    if (!email) return undefined;
    const normalized = email.trim().toLowerCase();
    if (normalized === "hello@itsavillanosa.com") return Role.SuperAdmin;
    if (normalized === "careers.kmavillanosa@gmail.com") return Role.Admin;
    return undefined;
  }

  list() {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async setRole(id: string, role: Role): Promise<User> {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException("User not found");
    u.role = role;
    return this.repo.save(u);
  }

  /**
   * Shared "walk-in" customer record used to attach walk-in orders created via
   * the POS. Created once on demand and reused for every walk-in.
   */
  async getOrCreateWalkin(): Promise<User> {
    const auth0Sub = "walkin|shared";
    const existing = await this.repo.findOne({ where: { auth0Sub } });
    if (existing) return existing;
    return this.repo.save(
      this.repo.create({
        auth0Sub,
        email: "walkin@sipnbite.local",
        name: "Walk-in customer",
        picture: null,
        role: Role.Customer,
      }),
    );
  }
}
