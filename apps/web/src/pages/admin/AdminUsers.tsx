import { useEffect, useState } from "react";
import { Select, Table } from "flowbite-react";
import { Role } from "@snb/shared";
import { useApi } from "../../hooks/useApi";

type Row = {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: Role;
};

const FOREST = "#1E3D2F";
const CREAM = "#FBF6EA";

const ROLE_LABELS: Record<string, string> = {
  customer: "Customer",
  "pos-operator": "POS Operator",
  admin: "Admin",
  "super-admin": "Super Admin",
};

function shortEmail(email: string) {
  if (email.endsWith("@unknown.local")) {
    const sub = email.replace("@unknown.local", "");
    const [provider, id] = sub.split("|");
    return `${provider}:${id?.slice(0, 6)}…`;
  }
  return email;
}

export function AdminUsers() {
  const api = useApi();
  const [rows, setRows] = useState<Row[]>([]);

  async function refresh() {
    setRows(await api.get<Row[]>("/users"));
  }
  useEffect(() => {
    refresh().catch(() => setRows([]));
  }, []);

  async function setRole(id: string, role: Role) {
    await api.patch(`/users/${id}/role`, { role });
    refresh();
  }

  return (
    <div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.map((u) => (
          <div key={u.id} className="bg-white rounded-lg border border-stone-200 p-3 flex items-center gap-3">
            {u.picture ? (
              <img src={u.picture} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                style={{ backgroundColor: FOREST, color: CREAM }}
              >
                {(u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm leading-tight truncate">
                {u.name ?? <span className="text-stone-400 italic">No name yet</span>}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5 truncate">{shortEmail(u.email)}</p>
              <div className="mt-2">
                <Select
                  value={u.role}
                  onChange={(e) => setRole(u.id, e.target.value as Role)}
                  sizing="sm"
                >
                  <option value={Role.Customer}>customer</option>
                  <option value={Role.PosOperator}>pos-operator</option>
                  <option value={Role.Admin}>admin</option>
                  <option value={Role.SuperAdmin}>super-admin</option>
                </Select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded border overflow-x-auto">
      <Table>
        <Table.Head>
          <Table.HeadCell>User</Table.HeadCell>
          <Table.HeadCell>Email</Table.HeadCell>
          <Table.HeadCell>Role</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {rows.map((u) => (
            <Table.Row key={u.id}>
              <Table.Cell>
                <div className="flex items-center gap-3">
                  {u.picture ? (
                    <img
                      src={u.picture}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm"
                      style={{ backgroundColor: FOREST, color: CREAM }}
                    >
                      {(u.name ?? u.email ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-extrabold text-sm leading-tight">
                      {u.name ?? <span className="text-stone-400 italic">No name yet</span>}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </p>
                  </div>
                </div>
              </Table.Cell>
              <Table.Cell className="text-xs">{shortEmail(u.email)}</Table.Cell>
              <Table.Cell>
                <Select value={u.role} onChange={(e) => setRole(u.id, e.target.value as Role)}>
                  <option value={Role.Customer}>customer</option>
                  <option value={Role.PosOperator}>pos-operator</option>
                  <option value={Role.Admin}>admin</option>
                  <option value={Role.SuperAdmin}>super-admin</option>
                </Select>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      </div>

      {rows.length > 0 && rows.every((r) => !r.name) && (
        <p className="p-4 text-xs text-stone-500">
          No names yet — they'll populate after each user next signs in (the API fetches
          their profile from Auth0 on login).
        </p>
      )}
    </div>
  );
}
