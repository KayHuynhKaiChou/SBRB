import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailer: MailerService) {}

  /** SRS 4.1.3 — Verify email after registration (6-digit OTP code) */
  async sendVerifyEmail(to: string, name: string, code: string) {
    await this.mailer.sendMail({
      to,
      subject: 'Mã xác nhận email — SBRB',
      template: 'verify-email',
      context: { name, code },
    });
    this.logger.log(`Verify OTP sent to ${to}`);
  }

  /** SRS 4.1.3 — Password reset link */
  async sendPasswordReset(to: string, name: string, resetUrl: string) {
    await this.mailer.sendMail({
      to,
      subject: 'Đặt lại mật khẩu — SBRB',
      template: 'password-reset',
      context: { name, resetUrl },
    });
  }

  /** SRS 4.2.2 — Business invitation */
  async sendBusinessInvite(
    to: string,
    inviterName: string,
    businessName: string,
    role: string,
    inviteUrl: string,
  ) {
    await this.mailer.sendMail({
      to,
      subject: `${inviterName} đã mời bạn tham gia ${businessName} — SBRB`,
      template: 'business-invite',
      context: { inviterName, businessName, role, inviteUrl },
    });
  }

  /** SRS 4.10 — Alert threshold triggered */
  async sendAlertNotification(
    to: string,
    widgetName: string,
    condition: string,
    value: number,
  ) {
    await this.mailer.sendMail({
      to,
      subject: `Cảnh báo ngưỡng: ${widgetName} — SBRB`,
      template: 'alert-notification',
      context: { widgetName, condition, value },
    });
  }
}
