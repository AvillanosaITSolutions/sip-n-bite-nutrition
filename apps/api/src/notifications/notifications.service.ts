import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import axios from "axios";
import nodemailer, { Transporter } from "nodemailer";
import { Order } from "../orders/order.entity";
import { User } from "../users/user.entity";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private mailer: Transporter;

  constructor(
    @InjectRepository(Order) private orders: Repository<Order>,
    @InjectRepository(User) private users: Repository<User>,
  ) {
    this.mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.mailer.sendMail({
        from: process.env.MAIL_FROM ?? "no-reply@sipnbite.local",
        to,
        subject,
        html,
      });
    } catch (err: any) {
      this.logger.error("Email send failed", err.message);
    }
  }

  async sendSms(to: string, message: string) {
    if (!process.env.PHILSMS_API_TOKEN || !to) return;
    try {
      await axios.post(
        "https://app.philsms.com/api/v3/sms/send",
        { recipient: to, sender_id: process.env.PHILSMS_SENDER_ID, type: "plain", message },
        { headers: { Authorization: `Bearer ${process.env.PHILSMS_API_TOKEN}` } },
      );
    } catch (err: any) {
      this.logger.error("SMS send failed", err?.response?.data ?? err.message);
    }
  }

  async notifyOrderPaid(orderId: string) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) return;
    const user = await this.users.findOne({ where: { id: order.userId } });
    if (!user) return;

    const subject = `Payment received for order ${order.id.slice(0, 8)}`;
    const html = `<p>Hi ${user.name ?? "there"},</p><p>We've received your payment for order <b>${order.id}</b>. Total: <b>PHP ${order.total}</b>.</p><p>We'll update you when it's ready.</p>`;
    await this.sendEmail(user.email, subject, html);
    if (user.phone) {
      await this.sendSms(user.phone, `Sip n Bite: payment received for order ${order.id.slice(0, 8)}. Total PHP ${order.total}.`);
    }
  }
}
