import { createHmac } from "node:crypto";

export type SignupSource = "site" | "google" | "facebook";

export type SignupLogPayload = {
  name: string;
  email: string;
  phoneNumber: string;
  ip: string;
  userAgent: string;
  localDateTime: string;
  timezone: string;
  source: SignupSource;
};

export class DuplicateSignupError extends Error {
  constructor(message = "Email already exists.") {
    super(message);
    this.name = "DuplicateSignupError";
  }
}

const sheetsWebhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
const sheetsWebhookSecret = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET;

export async function logSignupToGoogleSheet(
  payload: SignupLogPayload,
  options?: {
    enforceUniqueEmail?: boolean;
  },
): Promise<void> {
  if (!sheetsWebhookUrl) {
    return;
  }

  const timestamp = Date.now().toString();
  const rawBody = JSON.stringify({
    ...payload,
    enforceUniqueEmail: Boolean(options?.enforceUniqueEmail),
  });
  const signature = sheetsWebhookSecret
    ? createHmac("sha256", sheetsWebhookSecret)
        .update(`${timestamp}.${rawBody}`)
        .digest("hex")
    : "";

  const response = await fetch(sheetsWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(signature
        ? {
            "X-Signature": signature,
            "X-Timestamp": timestamp,
          }
        : {}),
    },
    body: rawBody,
    cache: "no-store",
  });

  if (response.status === 409) {
    throw new DuplicateSignupError();
  }

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(
      `Google Sheets webhook failed (${response.status}): ${details}`,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return;
  }

  const data = (await response.json()) as {
    ok?: boolean;
    duplicate?: boolean;
    error?: string;
  };

  if (data?.duplicate || data?.error === "DUPLICATE_EMAIL") {
    throw new DuplicateSignupError();
  }
}
