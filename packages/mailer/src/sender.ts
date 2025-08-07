import nodemailer, { Transporter } from "nodemailer";
import { TemplateEngine } from "./template-engine";
import type {
  EmailConfig,
  EmailData,
  EmailResult,
  BulkEmailResult,
} from "./types";

export class EmailSender {
  private transporter: Transporter;
  private templateEngine: TemplateEngine;
  private defaultFrom?: string;
  private rateLimitDelay: number;

  constructor(config: EmailConfig, templateDir?: string, rateLimitMs = 100) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
    });

    this.defaultFrom = config.from;
    this.templateEngine = new TemplateEngine(templateDir);
    this.rateLimitDelay = rateLimitMs;
  }

  /**
   * Load a template from string
   */
  loadTemplate(name: string, html: string): void {
    this.templateEngine.loadTemplate(name, html);
  }

  /**
   * Load a template from file
   */
  loadTemplateFromFile(name: string): void {
    this.templateEngine.loadTemplate(name);
  }

  /**
   * Send a single email
   */
  async send(emailData: EmailData): Promise<EmailResult> {
    try {
      const { to, subject, template, html, data = {}, attachments } = emailData;

      // Validate email recipients
      if (!to || (Array.isArray(to) && to.length === 0)) {
        throw new Error("Email recipient(s) required");
      }

      let emailHtml = html;

      // If template is specified, render it
      if (template) {
        emailHtml = this.templateEngine.render(template, data);
      }

      if (!emailHtml) {
        throw new Error("Either html content or template must be provided");
      }

      const mailOptions = {
        from: this.defaultFrom,
        to: Array.isArray(to) ? to.join(", ") : to,
        subject,
        html: emailHtml,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      const emailAddress = Array.isArray(to) ? to[0] || "" : to;

      return {
        success: true,
        email: emailAddress,
        messageId: info.messageId,
      };
    } catch (error) {
      const emailAddress = Array.isArray(emailData.to)
        ? emailData.to[0] || ""
        : emailData.to;

      return {
        success: false,
        email: emailAddress,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Send multiple emails with rate limiting
   */
  async sendBulk(emails: EmailData[]): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const result = await this.send(email!);

      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
      }

      // Add delay between emails to respect rate limits (except for last email)
      if (i < emails.length - 1) {
        await this.delay(this.rateLimitDelay);
      }
    }

    return {
      total: emails.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Send bulk emails in parallel batches (use with caution)
   */
  async sendBulkParallel(
    emails: EmailData[],
    batchSize = 10,
  ): Promise<BulkEmailResult> {
    const results: EmailResult[] = [];

    // Process emails in batches
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      const batchPromises = batch.map((email) => this.send(email));
      const batchResults = await Promise.all(batchPromises);

      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < emails.length) {
        await this.delay(this.rateLimitDelay * batchSize);
      }
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      total: emails.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Verify the email configuration
   */
  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error("Email configuration verification failed:", error);
      return false;
    }
  }

  /**
   * Get list of loaded templates
   */
  getLoadedTemplates(): string[] {
    return this.templateEngine.getLoadedTemplates();
  }

  /**
   * Check if a template is loaded
   */
  hasTemplate(name: string): boolean {
    return this.templateEngine.hasTemplate(name);
  }

  /**
   * Set rate limit delay
   */
  setRateLimit(delayMs: number): void {
    this.rateLimitDelay = delayMs;
  }

  /**
   * Close the transporter connection
   */
  close(): void {
    this.transporter.close();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
