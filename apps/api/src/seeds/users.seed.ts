import "reflect-metadata";
import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

import dataSource from "../data-source";
import { User } from "../users/user.entity";
import { Role } from "@snb/shared";

// Test accounts, one per role. These pre-provision local `users` rows so the
// admin console has data to show and roles are assigned up front.
//
// IMPORTANT: authentication is Auth0-only — this app stores no passwords. The
// `password` below is only what you should use when creating the matching user
// in the Auth0 dashboard (Username-Password-Authentication connection). On that
// user's first login, upsertFromAuth0 adopts the seeded row by email and binds
// it to the real Auth0 `sub`, so the role sticks. Keep ROLE_EMAIL_MAP in sync
// (see .env) so the role is also (re)applied straight from the token's email.
type SeedUser = {
  email: string;
  name: string;
  role: Role;
  /** For Auth0 setup only — never stored in our DB. */
  password: string;
};

const users: SeedUser[] = [
  { email: "superadmin@sipnbite.local", name: "Test SuperAdmin", role: Role.SuperAdmin, password: "Superadmin1" },
  { email: "admin@sipnbite.local", name: "Test Admin", role: Role.Admin, password: "Admin1234" },
  { email: "pos@sipnbite.local", name: "Test POS Operator", role: Role.PosOperator, password: "Posuser1" },
  { email: "customer@sipnbite.local", name: "Test Customer", role: Role.Customer, password: "Customer1" },
];

async function run() {
  await dataSource.initialize();
  const repo = dataSource.getRepository(User);

  let created = 0;
  let updated = 0;
  for (const u of users) {
    const existing = await repo.findOne({ where: { email: u.email } });
    if (existing) {
      existing.name = u.name;
      existing.role = u.role;
      await repo.save(existing);
      updated++;
    } else {
      await repo.save(
        repo.create({
          // Placeholder sub; replaced with the real Auth0 sub on first login.
          auth0Sub: `seed|${u.role}`,
          email: u.email,
          name: u.name,
          picture: null,
          role: u.role,
        }),
      );
      created++;
    }
  }

  console.log(`\nUsers seed complete — created: ${created}, updated: ${updated}\n`);
  console.log("Create these in Auth0 (Username-Password-Authentication), then log in:");
  console.log("  role          email                        password");
  console.log("  ----          -----                        --------");
  for (const u of users) {
    console.log(`  ${u.role.padEnd(13)} ${u.email.padEnd(28)} ${u.password}`);
  }
  console.log(
    "\nRoles auto-apply via ROLE_EMAIL_MAP on login. Passwords are for Auth0 only — not stored here.\n",
  );

  await dataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
