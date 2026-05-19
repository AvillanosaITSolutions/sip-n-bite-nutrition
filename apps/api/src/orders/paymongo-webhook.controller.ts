import { Body, Controller, Headers, HttpCode, Post } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { NotificationsService } from "../notifications/notifications.service";

@Controller("payments/paymongo")
export class PaymongoWebhookController {
  constructor(
    private readonly orders: OrdersService,
    private readonly notif: NotificationsService,
  ) {}

  // TODO: verify Paymongo-Signature header against PAYMONGO_WEBHOOK_SECRET (HMAC-SHA256 of raw body).
  @Post("webhook")
  @HttpCode(200)
  async webhook(@Headers("paymongo-signature") _sig: string, @Body() body: any) {
    const event = body?.data?.attributes;
    const type: string | undefined = event?.type;
    if (type === "checkout_session.payment.paid" || type === "payment.paid") {
      const checkoutId: string | undefined =
        event?.data?.id ?? event?.data?.attributes?.checkout_session_id;
      if (checkoutId) {
        const order = await this.orders.markPaidByCheckoutId(checkoutId);
        if (order) await this.notif.notifyOrderPaid(order.id);
      }
    }
    return { received: true };
  }
}
