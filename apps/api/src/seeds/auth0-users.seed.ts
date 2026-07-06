import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

// Creates the test login accounts in Auth0 via the Management API.
//
// Requires an Auth0 Machine-to-Machine app authorized for the Auth0 Management
// API with the `create:users` scope. Put its credentials in .env:
//   AUTH0_DOMAIN=dev-xxxx.us.auth0.com          (already set)
//   AUTH0_MGMT_CLIENT_ID=...
//   AUTH0_MGMT_CLIENT_SECRET=...
//
// Then: pnpm --filter @snb/api seed:auth0-users

type Auth0User = {
  email: string;
  password: string;
  connection: string;
  email_verified?: boolean;
  name?: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

async function getMgmtToken(domain: string, clientId: string, clientSecret: string): Promise<string> {
  const res = await fetch(`https://${domain}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  if (!res.ok) throw new Error(`Failed to get Management token (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

async function createUser(domain: string, token: string, user: Auth0User): Promise<"created" | "exists" | "failed"> {
  const res = await fetch(`https://${domain}/api/v2/users`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(user),
  });

  if (res.ok) return "created";

  const body = await res.text();
  // 409 = user already exists for this connection — treat as idempotent success.
  if (res.status === 409) return "exists";
  console.error(`  ! ${user.email} failed (${res.status}): ${body}`);
  return "failed";
}

async function run() {
  const domain = process.env.AUTH0_DOMAIN;
  const clientId = process.env.AUTH0_MGMT_CLIENT_ID;
  const clientSecret = process.env.AUTH0_MGMT_CLIENT_SECRET;

  if (!domain || !clientId || !clientSecret) {
    console.error(
      "Missing env. Set AUTH0_DOMAIN, AUTH0_MGMT_CLIENT_ID, and AUTH0_MGMT_CLIENT_SECRET in .env.\n" +
        "Create a Machine-to-Machine app in Auth0 → Applications, authorize it for the\n" +
        "Auth0 Management API, and grant the `create:users` scope.",
    );
    process.exit(1);
  }

  const users: Auth0User[] = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "auth0-users.json"), "utf8"),
  );

  console.log(`Requesting Management API token from ${domain}...`);
  const token = await getMgmtToken(domain, clientId, clientSecret);

  let created = 0;
  let exists = 0;
  let failed = 0;
  for (const u of users) {
    const result = await createUser(domain, token, u);
    if (result === "created") {
      created++;
      console.log(`  + created ${u.email}`);
    } else if (result === "exists") {
      exists++;
      console.log(`  = already exists ${u.email}`);
    } else {
      failed++;
    }
  }

  console.log(`\nAuth0 users done — created: ${created}, already existed: ${exists}, failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
