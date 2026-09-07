import { env } from "../../config/env";
import { logEvent } from "../../utils/logger";
import { emailFromAddress } from "./email.config";
import type { EmailProvider, SendEmailInput } from "./email.provider";

const consoleProvider: EmailProvider = {
  name: "console",
  async send(input) {
    logEvent("email_console_send", {
      to: input.to,
      subject: input.subject,
      textLength: input.text.length,
    });
    if (env.NODE_ENV !== "test") {
      console.info(
        `[email:console] to=${input.to} subject=${JSON.stringify(input.subject)}\n${input.text.slice(0, 500)}`,
      );
    }
    return { id: `console_${Date.now()}` };
  },
};

const resendProvider: EmailProvider = {
  name: "resend",
  async send(input) {
    const key = env.EMAIL_API_KEY;
    if (!key) {
      throw new Error("EMAIL_API_KEY is required when EMAIL_PROVIDER=resend");
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFromAddress(),
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend error ${response.status}: ${body.slice(0, 300)}`);
    }
    const data = (await response.json()) as { id?: string };
    return { id: data.id };
  },
};

export function getEmailProvider(): EmailProvider {
  if (env.EMAIL_PROVIDER === "resend" && env.EMAIL_API_KEY) {
    return resendProvider;
  }
  return consoleProvider;
}

export async function deliverEmail(input: SendEmailInput) {
  return getEmailProvider().send(input);
}
