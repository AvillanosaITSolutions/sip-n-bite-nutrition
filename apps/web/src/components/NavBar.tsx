import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Role } from "@snb/shared";
import { useApi } from "../hooks/useApi";
import { useCart } from "../store/cart";

const CREAM = "#FBF6EA";
const FOREST = "#1E3D2F";
const PEACH = "#F4A77E";

type NavItem = { to: string; label: string };
const PUBLIC_NAV: NavItem[] = [
  { to: "/menu", label: "Menu" },
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "About" },
];

export function NavBar() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0();
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const api = useApi();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      setRole(null);
      return;
    }
    let cancelled = false;
    api
      .get<{ role: Role }>("/users/me")
      .then((me) => !cancelled && setRole(me.role))
      .catch(() => !cancelled && setRole(null));
    return () => {
      cancelled = true;
    };
  }, [api, isAuthenticated, isLoading]);

  const nav = useMemo<NavItem[]>(() => {
    // POS operators get a focused nav — just their POS workspace, nothing else.
    if (role === Role.PosOperator) return [{ to: "/pos", label: "POS" }];
    const items: NavItem[] = [...PUBLIC_NAV];
    if (isAuthenticated) items.push({ to: "/orders", label: "Orders" });
    if (role === Role.Admin || role === Role.SuperAdmin) {
      items.push({ to: "/pos", label: "POS" });
      items.push({ to: "/admin", label: "Admin" });
    }
    return items;
  }, [isAuthenticated, role]);

  const onLanding = pathname === "/";
  const bg = onLanding ? CREAM : "white";

  return (
    <header
      className="w-full sticky top-0 z-40 border-b"
      style={{ backgroundColor: bg, borderColor: "rgba(30,61,47,0.08)" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link to="/" aria-label="Sip 'N Bite Nutrition — home" className="flex items-center gap-2 group">
          <span className="flex items-baseline gap-1">
            <span
              className="text-lg tracking-tight"
              style={{
                color: FOREST,
                fontFamily: '"Archivo Black", "DM Sans", sans-serif',
                fontWeight: 900,
              }}
            >
              SIP 'N BITE.
            </span>
            <span className="font-script text-base hidden sm:inline" style={{ color: PEACH }}>
              nutrition
            </span>
          </span>
        </Link>

        {/* Center nav (desktop) */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Primary">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                "text-sm font-bold uppercase tracking-[0.18em] transition-opacity " +
                (isActive ? "opacity-100" : "opacity-60 hover:opacity-100")
              }
              style={{ color: FOREST }}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right: cart + auth */}
        <div className="flex items-center gap-3">
          <Link
            to="/cart"
            aria-label={count === 0 ? "Cart, empty" : `Cart, ${count} item${count === 1 ? "" : "s"}`}
            className="inline-flex items-center gap-2 rounded-full pl-4 pr-1.5 py-1.5 text-xs font-bold uppercase tracking-widest shadow-sm hover:opacity-90 transition"
            style={{ backgroundColor: "white", color: FOREST, border: `1px solid ${FOREST}20` }}
          >
            <span>Cart ({count})</span>
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs"
              style={{ backgroundColor: PEACH, color: FOREST }}
            >
              ↗
            </span>
          </Link>

          {isAuthenticated ? (
            <div className="hidden md:flex items-center gap-2">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="w-8 h-8 rounded-full ring-2"
                  style={{ borderColor: PEACH }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: FOREST, color: "white" }}
                >
                  {(user?.email ?? "?").slice(0, 1).toUpperCase()}
                </div>
              )}
              <button
                onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                className="text-xs font-bold uppercase tracking-widest hover:opacity-70"
                style={{ color: FOREST }}
              >
                Log out
              </button>
            </div>
          ) : (
            <button
              onClick={() => loginWithRedirect()}
              className="hidden md:inline-flex text-xs font-bold uppercase tracking-widest rounded-full px-4 py-2 shadow-sm hover:opacity-90"
              style={{ backgroundColor: FOREST, color: CREAM }}
            >
              Sign in
            </button>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-drawer"
            data-on-forest
            style={{ backgroundColor: FOREST, color: CREAM }}
          >
            <span aria-hidden="true">{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav
          id="mobile-nav-drawer"
          aria-label="Primary mobile"
          className="md:hidden border-t"
          style={{ borderColor: "rgba(30,61,47,0.08)", backgroundColor: bg }}
        >
          <div className="px-6 py-4 flex flex-col gap-3">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setOpen(false)}
                className="text-sm font-bold uppercase tracking-[0.18em]"
                style={{ color: FOREST }}
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t" style={{ borderColor: "rgba(30,61,47,0.08)" }}>
              {isAuthenticated ? (
                <button
                  onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
                  className="text-sm font-bold uppercase tracking-widest"
                  style={{ color: FOREST }}
                >
                  Log out ({user?.email})
                </button>
              ) : (
                <button
                  onClick={() => loginWithRedirect()}
                  className="text-sm font-bold uppercase tracking-widest rounded-full px-4 py-2"
                  style={{ backgroundColor: FOREST, color: CREAM }}
                >
                  Sign in
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
