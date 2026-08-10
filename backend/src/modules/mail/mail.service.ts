import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('GMAIL_EMAIL'),
        pass: this.configService.get<string>('GMAIL_APP_PASSWORD'),
      },
    });
  }

  async sendOtpEmail(to: string, code: string): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') ?? 'EduTool';

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('GMAIL_EMAIL')}>`,
        to,
        subject: `Your ${appName} Verification Code`,
        html: this.otpTemplate(code, appName),
      });
      this.logger.log(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}`, error);
      throw error;
    }
  }

  async sendCredentialsEmail(to: string, password: string): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') ?? 'EduTool';

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('GMAIL_EMAIL')}>`,
        to,
        subject: `Your ${appName} Admin Account Credentials`,
        html: this.credentialsTemplate(to, password, appName),
      });
      this.logger.log(`Credentials email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send credentials email to ${to}`, error);
      throw error;
    }
  }

  /**
   * Credentials email for a newly-created student login. Reuses the same
   * template as the other credential emails but lets the recipient (the
   * applicant's personal email) differ from the student's generated login
   * email that is displayed. The personal email is the only pre-approval
   * contact channel we have, so this is the sole way the applicant learns
   * their new credentials.
   */
  async sendStudentCredentialsEmail(
    recipient: string,
    loginEmail: string,
    password: string,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') ?? 'EduTool';

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('GMAIL_EMAIL')}>`,
        to: recipient,
        subject: `Your ${appName} Student Account Credentials`,
        html: this.credentialsTemplate(loginEmail, password, appName),
      });
      this.logger.log(`Student credentials email sent to ${recipient}`);
    } catch (error) {
      this.logger.error(`Failed to send student credentials email to ${recipient}`, error);
      throw error;
    }
  }

  async sendApplicationConfirmationEmail(
    to: string,
    firstName: string,
    code: string,
    orgName: string,
  ): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') ?? 'EduTool';

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('GMAIL_EMAIL')}>`,
        to,
        subject: `${orgName} — Application Submitted`,
        html: this.applicationConfirmationTemplate(firstName, code, orgName, appName),
      });
      this.logger.log(`Application confirmation email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send application confirmation email to ${to}`, error);
      throw error;
    }
  }

  private credentialsTemplate(email: string, password: string, appName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding:0;background:linear-gradient(135deg,#1a1a2e,#16213e);">
                    <div style="padding:32px 32px 24px;">
                      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">${appName}</h1>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      Your admin account has been created. Use the credentials below to sign in:
                    </p>
                    <div style="background:#f0f4ff;border:1px solid #e0e7ff;border-radius:12px;padding:20px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:0 0 12px;">
                            <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Email</span>
                            <div style="color:#1a1a2e;font-size:15px;font-weight:600;font-family:monospace;margin-top:2px;">${email}</div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0;">
                            <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Password</span>
                            <div style="color:#1a1a2e;font-size:15px;font-weight:600;font-family:monospace;margin-top:2px;">${password}</div>
                          </td>
                        </tr>
                      </table>
                    </div>
                    <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:20px 0 0;">
                      For security, please change your password after your first login.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
                      &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private otpTemplate(code: string, appName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding:0;background:linear-gradient(135deg,#1a1a2e,#16213e);">
                    <div style="padding:32px 32px 24px;">
                      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">${appName}</h1>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      Use the verification code below to complete your registration.
                    </p>
                    <div style="background:#f0f4ff;border:1px solid #e0e7ff;border-radius:12px;padding:24px;text-align:center;">
                      <span style="font-size:40px;font-weight:800;letter-spacing:10px;color:#1a1a2e;font-family:monospace;">
                        ${code}
                      </span>
                    </div>
                    <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:24px 0 0;">
                      This code expires in 10 minutes. If you did not request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
                      &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async sendConcernDigestEmail(to: string, count: number): Promise<void> {
    const appName = this.configService.get<string>('APP_NAME') ?? 'EduTool';
    const s = count === 1 ? '' : 's';

    try {
      await this.transporter.sendMail({
        from: `"${appName}" <${this.configService.get<string>('GMAIL_EMAIL')}>`,
        to,
        subject: `You have ${count} new concern${s} in ${appName}`,
        html: this.concernDigestTemplate(count, s, appName),
      });
      this.logger.log(`Concern digest email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send concern digest email to ${to}`, error);
      throw error;
    }
  }

  private concernDigestTemplate(count: number, s: string, appName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding:0;background:linear-gradient(135deg,#1a1a2e,#16213e);">
                    <div style="padding:32px 32px 24px;">
                      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">${appName}</h1>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      You have <strong>${count}</strong> new concern${s} waiting in EduTool. Log in to view and respond.
                    </p>
                    <div style="background:#f0f4ff;border:1px solid #e0e7ff;border-radius:12px;padding:20px;text-align:center;">
                      <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:8px;">New Concerns</span>
                      <span style="font-size:36px;font-weight:800;color:#1a1a2e;">${count}</span>
                    </div>
                    <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:20px 0 0;">
                      Log in to EduTool to view and respond to them.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
                      &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  private applicationConfirmationTemplate(
    firstName: string,
    code: string,
    orgName: string,
    appName: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                <tr>
                  <td style="padding:0;background:linear-gradient(135deg,#1a1a2e,#16213e);">
                    <div style="padding:32px 32px 24px;">
                      <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">${orgName}</h1>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
                      Hi ${firstName}, thank you for applying to ${orgName}.
                    </p>
                    <div style="background:#f0f4ff;border:1px solid #e0e7ff;border-radius:12px;padding:24px;text-align:center;">
                      <span style="color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:8px;">Your Application Code</span>
                      <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#1a1a2e;font-family:monospace;">
                        ${code}
                      </span>
                    </div>
                    <p style="color:#6b7280;font-size:13px;line-height:1.5;margin:24px 0 0;">
                      Keep this code handy — you can use it to check your application status without signing in. You may also sign in with the email you used to apply to review or edit your application until the enrollment period closes.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
                      &copy; ${new Date().getFullYear()} ${appName}. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
