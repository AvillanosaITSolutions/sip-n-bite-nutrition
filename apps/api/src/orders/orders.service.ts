import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { CreateOrderInput, Fulfillment, OrderItemType, OrderStatus, PaymentMethod, Role, WalkinOrderInput } from "@snb/shared";
import { Order } from "./order.entity";
import { OrderItem } from "./order-item.entity";
import { MenuItem } from "../menu/menu-item.entity";
import { Product } from "../products/product.entity";
import { User } from "../users/user.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orders: Repository<Order>,
    private dataSource: DataSource,
  ) {}

  async create(user: User, input: CreateOrderInput): Promise<Order> {
    return this.dataSource.transaction(async (m) => {
      const order = m.create(Order, {
        userId: user.id,
        status: OrderStatus.Pending,
        fulfillment: input.fulfillment,
        paymentMethod: input.paymentMethod ?? PaymentMethod.Online,
        deliveryAddress: input.deliveryAddress ?? null,
        notes: input.notes ?? null,
        total: "0.00",
        items: [],
      });

      let total = 0;
      for (const line of input.lines) {
        if (line.itemType === OrderItemType.Menu) {
          const menu = await m.findOne(MenuItem, { where: { id: line.itemId } });
          if (!menu) throw new NotFoundException(`Menu item ${line.itemId} not found`);
          if (!menu.isAvailable) throw new BadRequestException(`${menu.name} is unavailable`);
          const unit = Number(menu.price);
          total += unit * line.quantity;
          order.items.push(
            m.create(OrderItem, {
              itemType: OrderItemType.Menu,
              itemId: menu.id,
              nameSnapshot: menu.name,
              quantity: line.quantity,
              unitPrice: unit.toFixed(2),
            }),
          );
        } else {
          const product = await m.findOne(Product, { where: { id: line.itemId } });
          if (!product) throw new NotFoundException(`Product ${line.itemId} not found`);
          if (!product.isPreorder && product.stock < line.quantity) {
            throw new BadRequestException(`${product.name} out of stock`);
          }
          if (!product.isPreorder) {
            product.stock -= line.quantity;
            await m.save(product);
          }
          const unit = Number(product.price);
          total += unit * line.quantity;
          order.items.push(
            m.create(OrderItem, {
              itemType: OrderItemType.Product,
              itemId: product.id,
              nameSnapshot: product.name,
              quantity: line.quantity,
              unitPrice: unit.toFixed(2),
            }),
          );
        }
      }

      order.total = total.toFixed(2);
      return m.save(order);
    });
  }

  async get(id: string, requester: User) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    const isStaff =
      requester.role === Role.Admin ||
      requester.role === Role.SuperAdmin ||
      requester.role === Role.PosOperator;
    if (!isStaff && order.userId !== requester.id) throw new NotFoundException("Order not found");
    return order;
  }

  listMine(userId: string) {
    return this.orders.find({ where: { userId }, order: { createdAt: "DESC" } });
  }

  listAll() {
    return this.orders.find({ order: { createdAt: "DESC" } });
  }

  async setStatus(id: string, status: OrderStatus) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    order.status = status;
    // Stamp the payment timestamp once, when payment is confirmed for the first time.
    if (status === OrderStatus.Paid && !order.paidAt) {
      order.paidAt = new Date();
    }
    return this.orders.save(order);
  }

  async markPaid(id: string) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    if (!order.paidAt) order.paidAt = new Date();
    return this.orders.save(order);
  }

  async setPaymongo(id: string, checkoutId: string, checkoutUrl: string) {
    const order = await this.orders.findOne({ where: { id } });
    if (!order) throw new NotFoundException("Order not found");
    order.paymongoCheckoutId = checkoutId;
    order.paymongoCheckoutUrl = checkoutUrl;
    order.status = OrderStatus.AwaitingPayment;
    return this.orders.save(order);
  }

  /**
   * Walk-in order placed at the POS. Bypasses Auth0 customer login, attaches the
   * order to a shared "walk-in" user, marks it `preparing` + `paid` immediately
   * so the kanban skips the New column.
   */
  async createWalkin(walkinUser: User, input: WalkinOrderInput): Promise<Order> {
    return this.dataSource.transaction(async (m) => {
      const noteParts: string[] = [];
      if (input.customerName) noteParts.push(`Customer: ${input.customerName}`);
      if (input.customerPhone) noteParts.push(`Phone: ${input.customerPhone}`);
      if (input.notes) noteParts.push(input.notes);

      const order = m.create(Order, {
        userId: walkinUser.id,
        status: OrderStatus.Preparing,
        fulfillment: Fulfillment.Pickup,
        paymentMethod: PaymentMethod.AtHub,
        deliveryAddress: null,
        notes: noteParts.length ? noteParts.join(" · ") : null,
        total: "0.00",
        // Walk-ins pay upfront at the counter, so they're paid the moment they're rung up.
        paidAt: new Date(),
        items: [],
      });

      let total = 0;
      for (const line of input.lines) {
        if (line.itemType === OrderItemType.Menu) {
          const menu = await m.findOne(MenuItem, { where: { id: line.itemId } });
          if (!menu) throw new NotFoundException(`Menu item ${line.itemId} not found`);
          if (!menu.isAvailable) throw new BadRequestException(`${menu.name} is unavailable`);
          const unit = Number(menu.price);
          total += unit * line.quantity;
          order.items.push(
            m.create(OrderItem, {
              itemType: OrderItemType.Menu,
              itemId: menu.id,
              nameSnapshot: menu.name,
              quantity: line.quantity,
              unitPrice: unit.toFixed(2),
            }),
          );
        } else {
          const product = await m.findOne(Product, { where: { id: line.itemId } });
          if (!product) throw new NotFoundException(`Product ${line.itemId} not found`);
          if (!product.isPreorder && product.stock < line.quantity) {
            throw new BadRequestException(`${product.name} out of stock`);
          }
          if (!product.isPreorder) {
            product.stock -= line.quantity;
            await m.save(product);
          }
          const unit = Number(product.price);
          total += unit * line.quantity;
          order.items.push(
            m.create(OrderItem, {
              itemType: OrderItemType.Product,
              itemId: product.id,
              nameSnapshot: product.name,
              quantity: line.quantity,
              unitPrice: unit.toFixed(2),
            }),
          );
        }
      }

      order.total = total.toFixed(2);
      return m.save(order);
    });
  }

  async stats() {
    // Exclude cancelled orders from all revenue / count metrics.
    const allOrders = await this.orders.find({ order: { createdAt: "DESC" } });
    const valid = allOrders.filter((o) => o.status !== "cancelled");

    const totalRevenue = valid.reduce((sum, o) => sum + Number(o.total), 0);
    const totalOrders = valid.length;
    const totalUnits = valid.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0,
    );

    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    for (const o of allOrders) {
      statusBreakdown[o.status] = (statusBreakdown[o.status] ?? 0) + 1;
    }

    // Fulfillment / payment-method breakdown
    const fulfillmentBreakdown: Record<string, number> = {};
    const paymentBreakdown: Record<string, number> = {};
    for (const o of valid) {
      fulfillmentBreakdown[o.fulfillment] = (fulfillmentBreakdown[o.fulfillment] ?? 0) + 1;
      paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] ?? 0) + 1;
    }

    // Top items, split by type
    type Agg = { itemId: string; itemType: string; name: string; quantity: number; revenue: number };
    const byKey = new Map<string, Agg>();
    for (const o of valid) {
      for (const i of o.items) {
        const k = `${i.itemType}:${i.itemId}`;
        const cur = byKey.get(k) ?? {
          itemId: i.itemId,
          itemType: i.itemType,
          name: i.nameSnapshot,
          quantity: 0,
          revenue: 0,
        };
        cur.quantity += i.quantity;
        cur.revenue += i.quantity * Number(i.unitPrice);
        byKey.set(k, cur);
      }
    }
    const aggregated = Array.from(byKey.values());
    const topMenu = aggregated
      .filter((a) => a.itemType === "menu")
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);
    const topProducts = aggregated
      .filter((a) => a.itemType === "product")
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    // Daily revenue — last 14 calendar days (oldest → newest).
    const days: { date: string; orders: number; revenue: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, orders: 0, revenue: 0 });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));
    for (const o of valid) {
      const key = new Date(o.createdAt).toISOString().slice(0, 10);
      const slot = dayMap.get(key);
      if (slot) {
        slot.orders += 1;
        slot.revenue += Number(o.total);
      }
    }

    return {
      totalRevenue,
      totalOrders,
      totalUnits,
      avgOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
      statusBreakdown,
      fulfillmentBreakdown,
      paymentBreakdown,
      topMenu,
      topProducts,
      daily: days,
    };
  }

  async markPaidByCheckoutId(checkoutId: string) {
    const order = await this.orders.findOne({ where: { paymongoCheckoutId: checkoutId } });
    if (!order) return null;
    order.status = OrderStatus.Paid;
    if (!order.paidAt) order.paidAt = new Date();
    return this.orders.save(order);
  }
}
