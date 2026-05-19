import { useEffect, useState } from "react";
import { Badge, Select, Table } from "flowbite-react";
import { OrderStatus } from "@snb/shared";
import { useApi } from "../../hooks/useApi";

type Row = {
  id: string;
  status: OrderStatus;
  fulfillment: string;
  total: string;
  createdAt: string;
};

const statuses = Object.values(OrderStatus);

export function AdminOrders() {
  const api = useApi();
  const [rows, setRows] = useState<Row[]>([]);

  async function refresh() {
    setRows(await api.get<Row[]>("/orders"));
  }
  useEffect(() => {
    refresh().catch(() => setRows([]));
  }, []);

  async function setStatus(id: string, status: OrderStatus) {
    await api.patch(`/orders/${id}/status`, { status });
    refresh();
  }

  return (
    <div className="bg-white rounded border overflow-x-auto">
      <Table>
        <Table.Head>
          <Table.HeadCell>Order</Table.HeadCell>
          <Table.HeadCell>Fulfillment</Table.HeadCell>
          <Table.HeadCell>Total</Table.HeadCell>
          <Table.HeadCell>Status</Table.HeadCell>
          <Table.HeadCell>Placed</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {rows.map((o) => (
            <Table.Row key={o.id}>
              <Table.Cell className="font-mono text-xs">{o.id.slice(0, 8)}…</Table.Cell>
              <Table.Cell>{o.fulfillment}</Table.Cell>
              <Table.Cell>₱{o.total}</Table.Cell>
              <Table.Cell>
                <Select value={o.status} onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </Select>
              </Table.Cell>
              <Table.Cell className="text-xs text-gray-500">
                {new Date(o.createdAt).toLocaleString()}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      {rows.length === 0 && <p className="p-4 text-gray-600">No orders yet.</p>}
    </div>
  );
}
