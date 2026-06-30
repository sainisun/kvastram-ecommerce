export class SMSService {
  private get msg91AuthKey() {
    return process.env.MSG91_AUTH_KEY;
  }

  private get msg91TemplateId() {
    return process.env.MSG91_OTP_TEMPLATE_ID; // Can be configured later
  }

  private get msg91SenderId() {
    return process.env.MSG91_SENDER_ID || 'ODHVCA';
  }

  /**
   * Send an OTP via MSG91.
   * If MSG91_AUTH_KEY is not set, it silently logs in dev mode and skips in production.
   */
  async sendOtp(phone: string, otp: string) {
    if (!this.msg91AuthKey) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n📱 SMS OTP (DEV MODE)');
        console.log('   To Phone:', phone);
        console.log('   OTP:', otp);
        console.log('   Note: MSG91_AUTH_KEY not set. SMS not actually sent.\n');
      }
      return;
    }

    try {
      // Normalize phone number - MSG91 expects country code, default to 91 for India if missing and 10 digits
      let formattedPhone = phone.replace(/\D/g, '');
      if (formattedPhone.length === 10) {
        formattedPhone = `91${formattedPhone}`;
      }

      // If we have a specific template ID for MSG91 DLT:
      const payload = this.msg91TemplateId
        ? {
            template_id: this.msg91TemplateId,
            mobile: formattedPhone,
            authkey: this.msg91AuthKey,
            otp: otp,
          }
        : {
            mobile: formattedPhone,
            authkey: this.msg91AuthKey,
            otp: otp,
            message: `Your Odhvica verification code is ${otp}. It will expire in 10 minutes.`,
            sender: this.msg91SenderId,
          };

      const searchParams = new URLSearchParams(payload as any).toString();
      
      const response = await fetch(`https://control.msg91.com/api/v5/otp?${searchParams}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (data.type === 'error') {
        console.error('MSG91 Error:', data.message);
      }
    } catch (error) {
      console.error('Failed to send SMS via MSG91:', error);
    }
  }
}

export const smsService = new SMSService();
