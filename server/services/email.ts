export interface EmailProvider {
  sendVerificationCode(input: {
    email: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<void>;
  sendPasswordReset(input: {
    email: string;
    code: string;
    expiresInMinutes: number;
  }): Promise<void>;
}

class ConsoleDevelopmentEmailProvider implements EmailProvider {
  async sendVerificationCode(_input: { email: string; code: string; expiresInMinutes: number }) {
    // Intentionally does not log the address or code. The configured demo code is documented locally.
  }
  async sendPasswordReset(_input: { email: string; code: string; expiresInMinutes: number }) {
    // Production providers implement delivery without changing the auth routes.
  }
}

export function emailProvider(): EmailProvider {
  return new ConsoleDevelopmentEmailProvider();
}
