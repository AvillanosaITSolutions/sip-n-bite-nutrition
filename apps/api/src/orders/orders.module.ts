import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "./order.entity";
import { OrderItem } from "./order-item.entity";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { PaymongoWebhookController } from "./paymongo-webhook.controller";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { PaymentsModule } from "../payments/payments.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    AuthModule,
    UsersModule,
    PaymentsModule,
    NotificationsModule,
  ],
  providers: [OrdersService],
  controllers: [OrdersController, PaymongoWebhookController],
  exports: [OrdersService],
})
export class OrdersModule {}
