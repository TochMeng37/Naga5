import { NextRequest, NextResponse } from "next/server";
import { DuplicateSignupError, logSignupToGoogleSheet } from "@/lib/signup-logger";

const parsedMinPasswordLength = Number.parseInt(
  process.env.MIN_PASSWORD_LENGTH ?? "8",
  10,
);
const minPasswordLength =
  Number.isFinite(parsedMinPasswordLength) && parsedMinPasswordLength > 0
    ? parsedMinPasswordLength
    : 8;

const rateLimitWindowMs = 10 * 60 * 1000;
const maxRequestsPerWindow = 15;

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const globalWithRateLimitStore = globalThis as typeof globalThis & {
  __signupRateLimitStore?: Map<string, RateLimitBucket>;
};
const signupRateLimitStore =
  globalWithRateLimitStore.__signupRateLimitStore ?? new Map<string, RateLimitBucket>();
globalWithRateLimitStore.__signupRateLimitStore = signupRateLimitStore;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip =
    forwardedFor?.split(",")[0]?.trim() ?? request.headers.get("x-real-ip") ?? "";
  return ip || "unknown";
}

function isRateLimited(ip: string, now: number): boolean {
  if (signupRateLimitStore.size > 5000) {
    for (const [key, bucket] of signupRateLimitStore.entries()) {
      if (now >= bucket.resetAt) {
        signupRateLimitStore.delete(key);
      }
    }
  }

  const existing = signupRateLimitStore.get(ip);

  if (!existing || now >= existing.resetAt) {
    signupRateLimitStore.set(ip, {
      count: 1,
      resetAt: now + rateLimitWindowMs,
    });
    return false;
  }

  existing.count += 1;
  signupRateLimitStore.set(ip, existing);

  return existing.count > maxRequestsPerWindow;
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const now = Date.now();

    if (isRateLimited(ip, now)) {
      return NextResponse.json(
        { ok: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const name = typeof body?.fullName === "string" ? body.fullName.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const phoneNumber =
      typeof body?.phoneNumber === "string"
        ? body.phoneNumber.replace(/\D/g, "")
        : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const acceptedTerms = body?.acceptedTerms === true;
    const timezone = typeof body?.timezone === "string" ? body.timezone.trim() : "";
    const localDateTime =
      typeof body?.localDateTime === "string" ? body.localDateTime.trim() : "";
    const hasValidEmail = /^\S+@\S+\.\S+$/.test(email);

    if (name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Full name is required." },
        { status: 400 },
      );
    }

    if (!hasValidEmail) {
      return NextResponse.json(
        { ok: false, error: "A valid email is required." },
        { status: 400 },
      );
    }

    if (phoneNumber.length < 8 || phoneNumber.length > 15) {
      return NextResponse.json(
        { ok: false, error: "A valid phone number is required." },
        { status: 400 },
      );
    }

    if (password.length < minPasswordLength) {
      return NextResponse.json(
        {
          ok: false,
          error: `Password must be at least ${minPasswordLength} characters.`,
        },
        { status: 400 },
      );
    }

    if (!acceptedTerms) {
      return NextResponse.json(
        { ok: false, error: "You must agree to the Terms & Conditions." },
        { status: 400 },
      );
    }

    const parsedLocalDateTime = localDateTime ? new Date(localDateTime) : new Date();
    if (Number.isNaN(parsedLocalDateTime.getTime())) {
      return NextResponse.json(
        { ok: false, error: "Invalid date format." },
        { status: 400 },
      );
    }

    const userAgent = request.headers.get("user-agent") ?? "";

    await logSignupToGoogleSheet({
      name,
      email,
      phoneNumber,
      ip,
      userAgent,
      localDateTime: parsedLocalDateTime.toISOString(),
      timezone,
      source: "site",
    }, {
      enforceUniqueEmail: true,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof DuplicateSignupError) {
      return NextResponse.json(
        { ok: false, error: "Email already registered." },
        { status: 409 },
      );
    }
    console.error("Signup log API failed:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to log signup." },
      { status: 500 },
    );
  }
}
