import Constants from "expo-constants";

type Extra = {
  apiUrl: string;
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

function required(name: keyof Extra): string {
  const v = extra[name];
  if (!v) {
    throw new Error(
      `Missing "${name}" in app.json → expo.extra. Set it (use your machine's LAN IP for apiUrl when testing on a device) and restart Expo.`,
    );
  }
  return v;
}

export const config = {
  /** API origin, e.g. http://192.168.1.10:3000 — localhost only works on emulators/simulators on the same machine. */
  apiUrl: required("apiUrl"),
  auth0Domain: required("auth0Domain"),
  auth0ClientId: required("auth0ClientId"),
  auth0Audience: extra.auth0Audience || undefined,
};
