export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailProvider = {
  name: string;
  send: (input: SendEmailInput) => Promise<{ id?: string }>;
};
