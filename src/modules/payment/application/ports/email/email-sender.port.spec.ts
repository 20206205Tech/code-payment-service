import { EMAIL_SENDER_PORT } from './email-sender.port';

describe('EmailSenderPort', () => {
  it('EMAIL_SENDER_PORT token should be a Symbol', () => {
    expect(typeof EMAIL_SENDER_PORT).toBe('symbol');
    expect(EMAIL_SENDER_PORT.toString()).toContain('EMAIL_SENDER_PORT');
  });

  it('EmailSenderPort is a TypeScript interface (not a runtime value)', () => {
    // Interfaces don't exist at runtime — we verify via the Symbol token
    expect(EMAIL_SENDER_PORT).toBeDefined();
  });
});
