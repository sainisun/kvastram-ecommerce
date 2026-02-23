import nodemailer from 'nodemailer';

// PHASE-2 FIX: HTML escape utility to prevent XSS in email templates
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Type definitions for email data
interface OrderEmailData {
  order_number: string | number;
  total: number;
  currency_code: string;
  status?: string;
}

interface InquiryEmailData {
  contact_name: string;
  company_name?: string;
  email: string;
}

class EmailService {
  private transporter!: nodemailer.Transporter;
  private ready: Promise<void>;

  constructor() {
    // OPT-001 FIX: Use async-ready pattern to prevent race condition
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      this.ready = Promise.resolve();
    } else {
      // Development: Create Ethereal account asynchronously
      // Emails will wait for this to complete before sending
      this.ready = new Promise<void>((resolve) => {
        nodemailer.createTestAccount((err, account) => {
          if (err) {
            console.error('Failed to create Ethereal account:', err);
            // Fallback: log-only transporter
            this.transporter = nodemailer.createTransport({
              jsonTransport: true,
            });
            resolve();
            return;
          }
          this.transporter = nodemailer.createTransport({
            host: account.smtp.host,
            port: account.smtp.port,
            secure: account.smtp.secure,
            auth: {
              user: account.user,
              pass: account.pass,
            },
          });
          console.log('📧 Email Service ready (Ethereal Dev Mode)');
          console.log(`📧 Preview URL: https://ethereal.email/messages`);
          resolve();
        });
      });
    }
  }

  /** Ensure transporter is ready before any operation */
  private async ensureReady(): Promise<void> {
    await this.ready;
  }

  async sendEmail(options: EmailOptions) {
    try {
      await this.ensureReady(); // OPT-001: Wait for transporter initialization
      const info = await this.transporter.sendMail({
        from: '"Kvastram Support" <support@kvastram.com>', // sender address
        to: options.to, // list of receivers
        subject: options.subject, // Subject line
        text: options.text, // plain text body
        html: options.html, // html body
      });

      console.log(`Message sent: ${info.messageId}`);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }

      return info;
    } catch (error: unknown) {
      console.error('Error sending email:', error);
      // In production, you might want to throw or log to a monitoring service
      // For now, we log and return false to indicate failure without crashing
      return false;
    }
  }

  async sendOrderConfirmation(order: OrderEmailData, customerEmail: string) {
    const subject = `Order Confirmation #${order.order_number}`;
    const text = `Thank you for your order! Your order #${order.order_number} has been placed successfully. Total: ${order.total / 100} ${order.currency_code}.`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Thank you for your order!</h1>
                <p>Hi there,</p>
                <p>Your order <strong>#${order.order_number}</strong> has been placed successfully.</p>

                <h2>Order Details</h2>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">Order Number</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${order.order_number}</strong></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">Total</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>${(order.total / 100).toFixed(2)} ${order.currency_code.toUpperCase()}</strong></td>
                    </tr>
                     <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">Status</td>
                        <td style="padding: 8px; border-bottom: 1px solid #ddd;">${order.status}</td>
                    </tr>
                </table>

                <p style="margin-top: 20px;">
                    We will notify you once your items have been shipped.
                </p>

                <p>Best regards,<br>Kvastram Team</p>
            </div>
        `;

    return this.sendEmail({ to: customerEmail, subject, text, html });
  }

  async sendOrderStatusUpdate(order: OrderEmailData, customerEmail: string) {
    const subject = `Order Update #${order.order_number}`;
    const text = `Your order #${order.order_number} status has been updated to: ${order.status}.`;
    const html = `
             <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Order Update</h1>
                <p>Your order <strong>#${order.order_number}</strong> has been updated.</p>
                <p>New Status: <strong>${order.status.toUpperCase()}</strong></p>
                <p>Best regards,<br>Kvastram Team</p>
            </div>
        `;

    return this.sendEmail({ to: customerEmail, subject, text, html });
  }

  async sendInquiryReceived(data: { email: string; contact_name: string }) {
    const subject = 'Wholesale Inquiry Received';
    const text = `Hi ${data.contact_name},\n\nThank you for your wholesale inquiry. We have received your request and will review it shortly.\n\nBest regards,\nKvastram Team`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Thank you for your inquiry!</h1>
                <p>Hi ${escapeHtml(data.contact_name)},</p>
                <p>We have received your wholesale inquiry and will review it shortly.</p>
                <p>Best regards,<br>Kvastram Team</p>
            </div>
        `;
    return this.sendEmail({ to: data.email, subject, text, html });
  }

  async sendNewInquiryAlert(inquiry: InquiryEmailData) {
    const subject = 'New Wholesale Inquiry Received';
    const text = `A new wholesale inquiry has been submitted by ${inquiry.contact_name} from ${inquiry.company_name}.\n\nPlease review it in the admin dashboard.`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>New Wholesale Inquiry</h1>
                <p>A new inquiry has been submitted:</p>
                <ul>
                    <li><strong>Company:</strong> ${escapeHtml(inquiry.company_name)}</li>
                    <li><strong>Contact:</strong> ${escapeHtml(inquiry.contact_name)}</li>
                    <li><strong>Email:</strong> ${escapeHtml(inquiry.email)}</li>
                </ul>
                <p>Please review it in the admin dashboard.</p>
            </div>
        `;
    // Send to admin email
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kvastram.com';
    return this.sendEmail({ to: adminEmail, subject, text, html });
  }

  async sendInquiryApproved(data: {
    email: string;
    contact_name: string;
    company_name: string;
    discount_tier: string;
  }) {
    const subject = 'Wholesale Inquiry Approved!';
    const text = `Hi ${data.contact_name},\n\nGreat news! Your wholesale inquiry for ${data.company_name} has been approved.\n\nYou have been assigned discount tier: ${data.discount_tier}\n\nBest regards,\nKvastram Team`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Congratulations!</h1>
                <p>Hi ${escapeHtml(data.contact_name)},</p>
                <p>Your wholesale inquiry for <strong>${escapeHtml(data.company_name)}</strong> has been approved!</p>
                <p>Your discount tier: <strong>${escapeHtml(data.discount_tier)}</strong></p>
                <p>Best regards,<br>Kvastram Team</p>
            </div>
        `;
    return this.sendEmail({ to: data.email, subject, text, html });
  }

  async sendWholesaleWelcome(data: {
    email: string;
    contact_name: string;
    company_name: string;
    discount_tier: string;
    token: string;
  }) {
    const setupUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/wholesale/set-password?token=${encodeURIComponent(data.token)}`;
    const tierDisplay =
      data.discount_tier.charAt(0).toUpperCase() + data.discount_tier.slice(1);
    const subject = 'Welcome to Kvastram Wholesale - Set Up Your Account';
    const text = `Hi ${data.contact_name},\n\nWelcome to Kvastram Wholesale! Your application for ${data.company_name} has been approved.\n\nYour discount tier: ${tierDisplay}\n\nPlease set up your password by clicking the link below:\n\n${setupUrl}\n\nThis link will expire in 7 days.\n\nBest regards,\nKvastram Team`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                <h1>Welcome to Kvastram Wholesale!</h1>
                <p>Hi ${escapeHtml(data.contact_name)},</p>
                <p>Congratulations! Your wholesale application for <strong>${escapeHtml(data.company_name)}</strong> has been approved.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0;"><strong>Your Discount Tier:</strong> ${tierDisplay}</p>
                </div>
                <p>Please set up your password to access your wholesale account:</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${setupUrl}" style="background-color: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                        Set Up Password
                    </a>
                </p>
                <p>Or copy this link to your browser:<br>
                <small>${setupUrl}</small></p>
                <p style="color: #666; font-size: 12px; margin-top: 30px;">This link will expire in 7 days. If you didn't expect this email, please ignore it.</p>
                <p>Best regards,<br>Kvastram Team</p>
            </div>
        `;

    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 WHOLESALE WELCOME EMAIL (DEV MODE)');
      console.log('   To:', data.email);
      console.log('   Setup URL:', setupUrl);
      console.log('');
    }

    return this.sendEmail({ to: data.email, subject, text, html });
  }

  async sendInquiryRejected(data: {
    email: string;
    contact_name: string;
    company_name: string;
    admin_notes?: string;
  }) {
    const subject = 'Wholesale Inquiry Update';
    const text = `Hi ${data.contact_name},\n\nThank you for your interest in Kvastram wholesale program. After careful review, we are unable to approve your inquiry for ${data.company_name} at this time.\n\n${data.admin_notes ? `Notes: ${data.admin_notes}\n\n` : ''}Best regards,\nKvastram Team`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Inquiry Update</h1>
                <p>Hi ${escapeHtml(data.contact_name)},</p>
                <p>Thank you for your interest in our wholesale program. After careful review, we are unable to approve your inquiry for <strong>${escapeHtml(data.company_name)}</strong> at this time.</p>
                ${data.admin_notes ? `<p><strong>Notes:</strong> ${escapeHtml(data.admin_notes)}</p>` : ''}
                <p>Best regards,<br>Kvastram Team</p>
            </div>
        `;
    return this.sendEmail({ to: data.email, subject, text, html });
  }

  // 🔒 FIX-011: Email verification email
  async sendVerificationEmail(data: {
    email: string;
    first_name: string;
    token: string;
  }) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${encodeURIComponent(data.token)}`;
    const subject = 'Verify Your Email Address';
    const text = `Hi ${data.first_name},\n\nWelcome to Kvastram! Please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nBest regards,\nKvastram Team`;
    const html = `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h1>Welcome to Kvastram!</h1>
                <p>Hi ${escapeHtml(data.first_name)},</p>
                <p>Thank you for creating an account with us. Please verify your email address to get started.</p>
                <p style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Verify Email Address
                    </a>
                </p>
                <p>Or copy this link to your browser:<br>
                <small>${verificationUrl}</small></p>
                <p style="color: #666; font-size: 12px;">This link will expire in 24 hours. If you didn't create an account with Kvastram, please ignore this email.</p>
                <p>Best regards,<br>Kvastram Team</p>
            </div>
        `;

    // DEV MODE: Log verification URL directly for testing
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 EMAIL VERIFICATION (DEV MODE)');
      console.log('   To:', data.email);
      console.log('   Verification URL:', verificationUrl);
      console.log('');
    }

    return this.sendEmail({ to: data.email, subject, text, html });
  }
}

export const emailService = new EmailService();
