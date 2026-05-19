import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Role } from "@snb/shared";
import { useApi } from "../../hooks/useApi";

const FOREST = "#1E3D2F";
const CREAM = "#FBF6EA";
const PEACH = "#F4A77E";
const PEACH_SOFT = "#FBD9B8";
const MUSTARD = "#F5C97F";

type Tab = {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  allow: Role[];
};

const TABS: Tab[] = [
  { to: "/admin", label: "Dashboard", icon: "📊", end: true, allow: [Role.Admin, Role.SuperAdmin] },
  { to: "/admin/orders", label: "Orders", icon: "🧾", allow: [Role.Admin, Role.SuperAdmin] },
  { to: "/admin/menu", label: "Menu", icon: "🥤", allow: [Role.Admin, Role.SuperAdmin] },
  { to: "/admin/products", label: "Products", icon: "🌿", allow: [Role.Admin, Role.SuperAdmin] },
  { to: "/admin/users", label: "Users", icon: "👥", allow: [Role.SuperAdmin] },
];

const ROLE_LABEL: Record<string, string> = {
  customer: "Customer",
  "pos-operator": "POS Operator",
  admin: "Admin",
  "super-admin": "Super Admin",
};

export function AdminLayout() {
  const { user } = useAuth0();
  const api = useApi();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    api.get<{ role: Role }>("/users/me").then((m) => setRole(m.role)).catch(() => setRole(null));
  }, [api]);

  const tabs = TABS.filter((t) => !role || t.allow.includes(role));

  return (
    <section className="py-6" style={{ color: FOREST }}>
      {/* Header */}
      <div
        className="rounded-3xl px-6 md:px-8 py-6 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${CREAM} 0%, ${PEACH_SOFT} 100%)`,
          border: `1px solid ${PEACH_SOFT}`,
        }}
      >
        <div>
          <p className="font-script text-2xl md:text-3xl" style={{ color: PEACH }}>
            command center
          </p>
          <h1 className="font-display text-3xl md:text-5xl leading-none">ADMIN</h1>
          <p className="text-xs uppercase tracking-widest text-stone-500 font-bold mt-2">
            Manage orders, menu, products and team
          </p>
        </div>

        {/* User badge */}
        <div
          className="flex items-center gap-3 rounded-full pl-2 pr-4 py-2"
          style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
        >
          {user?.picture ? (
            <img
              src={user.picture}
              alt=""
              className="w-9 h-9 rounded-full object-cover"
              style={{ border: `2px solid ${PEACH}` }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-black"
              style={{ backgroundColor: FOREST, color: CREAM }}
            >
              {(user?.email ?? "A").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="text-xs">
            <p className="font-extrabold leading-tight">{user?.name ?? "Admin"}</p>
            <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: PEACH }}>
              {role ? ROLE_LABEL[role] ?? role : "Signed in"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <nav
        className="rounded-2xl p-1.5 mb-6 inline-flex flex-wrap gap-1 shadow-sm"
        style={{ backgroundColor: "white", border: `1px solid ${PEACH_SOFT}` }}
      >
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition " +
              (isActive ? "shadow-sm" : "hover:opacity-80")
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? FOREST : "transparent",
              color: isActive ? MUSTARD : FOREST,
            })}
          >
            <span className="text-base">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Page content */}
      <Outlet />
    </section>
  );
}
