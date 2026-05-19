import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { OrderStatus, PaymentMethod, Role, createOrderSchema, type CreateOrderInput, walkinOrderSchema, type WalkinOrderInput } from "@snb/shared";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { ZodPipe } from "../common/zod.pipe";
import { OrdersService } from "./orders.service";
import { UsersService } from "../users/users.service";
import { PaymentsService } from "../payments/payments.service";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly users: UsersService,
    private readonly payments: PaymentsService,
  ) {}

  @Post()
  async create(@Req() req: any, @Body(new ZodPipe(createOrderSchema)) input: CreateOrderInput) {
    const user = await this.users.upsertFromAuth0(
      req.user,
      (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "") || undefined,
    );
    const order = await this.orders.create(user, input);
    if (input.paymentMethod === PaymentMethod.AtHub) {
      return order;
    }
    const checkout = await this.payments.createCheckout(order);
    return this.orders.setPaymongo(order.id, checkout.id, checkout.url);
  }

  @Post("walkin")
  @UseGuards(RolesGuard)
  @Roles(Role.PosOperator, Role.Admin, Role.SuperAdmin)
  async createWalkin(@Body(new ZodPipe(walkinOrderSchema)) input: WalkinOrderInput) {
    const walkin = await this.users.getOrCreateWalkin();
    return this.orders.createWalkin(walkin, input);
  }

  @Get("mine")
  async listMine(@Req() req: any) {
    const user = await this.users.upsertFromAuth0(
      req.user,
      (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "") || undefined,
    );
    return this.orders.listMine(user.id);
  }

  @Get("stats/summary")
  @UseGuards(RolesGuard)
  @Roles(Role.PosOperator, Role.Admin, Role.SuperAdmin)
  stats() {
    return this.orders.stats();
  }

  @Get(":id")
  async get(@Req() req: any, @Param("id") id: string) {
    const user = await this.users.upsertFromAuth0(
      req.user,
      (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "") || undefined,
    );
    return this.orders.get(id, user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.PosOperator, Role.Admin, Role.SuperAdmin)
  listAll() {
    return this.orders.listAll();
  }

  @Patch(":id/status")
  @UseGuards(RolesGuard)
  @Roles(Role.PosOperator, Role.Admin, Role.SuperAdmin)
  setStatus(@Param("id") id: string, @Body("status") status: OrderStatus) {
    return this.orders.setStatus(id, status);
  }

  @Patch(":id/paid")
  @UseGuards(RolesGuard)
  @Roles(Role.PosOperator, Role.Admin, Role.SuperAdmin)
  markPaid(@Param("id") id: string) {
    return this.orders.markPaid(id);
  }
}
