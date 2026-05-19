import { Injectable, Logger } from "@nestjs/common";
import axios from "axios";
import { Order } from "../orders/order.entity";

type CheckoutResult = { id: string; url: string };

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly baseUrl = "https://api.paymongo.com/v1";

  private auth() {
    const key = process.env.PAYMONGO_SECRET_KEY ?? "";
    return "Basic " + Buffer.from(`${key}:`).toString("base64");
  }

  async createCheckout(order: Order): Promise<CheckoutResult> {
    const totalCentavos = Math.round(Number(order.total) * 100);
    const lineItems = order.items.map((i) => ({
      name: i.nameSnapshot,
      quantity: i.quantity,
      amount: Math.round(Number(i.unitPrice) * 100),
      currency: "PHP",
    }));

    try {
      const res = await axios.post(
        `${this.baseUrl}/checkout_sessions`,
        {
          data: {
            attributes: {
              line_items: lineItems,
              payment_method_types: ["card", "gcash", "paymaya", "grab_pay"],
              description: `Sip n Bite order ${order.id}`,
              reference_number: order.id,
              success_url: `${process.env.WEB_ORIGIN}/orders/${order.id}?paid=1`,
              cancel_url: `${process.env.WEB_ORIGIN}/orders/${order.id}?paid=0`,
              send_email_receipt: true,
              metadata: { orderId: order.id, total: totalCentavos.toString() },
            },
          },
        },
        { headers: { Authorization: this.auth(), "Content-Type": "application/json" } },
      );
      const data = res.data?.data;
      return { id: data.id, url: data.attributes.checkout_url };
    } catch (err: any) {
      this.logger.error("PayMongo createCheckout failed", err?.response?.data ?? err.message);
      throw err;
    }
  }
}
