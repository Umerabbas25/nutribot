import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly baseUrl = 'https://graph.facebook.com/v19.0';

  /**
   * Send a text message to a WhatsApp phone number.
   */
  async sendMessage(to: string, text: string): Promise<void> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      this.logger.warn('WhatsApp credentials not configured. Message not sent.');
      this.logger.debug(`[DRY RUN] To: ${to}\nMessage: ${text}`);
      return;
    }

    try {
      await axios.post(
        `${this.baseUrl}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { body: text, preview_url: false },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.debug(`Message sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send WhatsApp message to ${to}`,
        error?.response?.data || error.message,
      );
    }
  }

  /**
   * Verify the X-Hub-Signature-256 header from Meta to ensure
   * the webhook payload is genuinely from Meta.
   */
  verifySignature(payload: string, signature: string): boolean {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) return true; // Skip verification if not configured (dev mode)

    const expectedSignature =
      'sha256=' +
      crypto.createHmac('sha256', appSecret).update(payload).digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      );
    } catch {
      return false;
    }
  }

  /**
   * Extract the phone number and text message from a Meta webhook payload.
   */
  extractMessage(body: any): { from: string; text: string; messageId: string } | null {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (!message || message.type !== 'text') return null;

      return {
        from: message.from,
        text: message.text?.body?.trim() || '',
        messageId: message.id,
      };
    } catch {
      return null;
    }
  }
}
