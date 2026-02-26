import NextAuth from "next-auth";
import { headers } from "next/headers";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import { DuplicateSignupError, logSignupToGoogleSheet } from "@/lib/signup-logger";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;
const successRedirectUrl = process.env.SUCCESS_REDIRECT_URL?.trim();

const handler = NextAuth({
  providers: [
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
    ...(facebookClientId &&
    facebookClientSecret &&
    !facebookClientId.startsWith("replace-") &&
    !facebookClientSecret.startsWith("replace-")
      ? [
          FacebookProvider({
            clientId: facebookClientId,
            clientSecret: facebookClientSecret,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      const source = account?.provider;
      if (source !== "google" && source !== "facebook") {
        return true;
      }

      try {
        const requestHeaders = await headers();
        const forwardedFor = requestHeaders.get("x-forwarded-for");
        const ip =
          forwardedFor?.split(",")[0]?.trim() ??
          requestHeaders.get("x-real-ip") ??
          "";
        const userAgent = requestHeaders.get("user-agent") ?? "";

        await logSignupToGoogleSheet({
          name: user.name?.trim() ?? "",
          email: user.email?.trim().toLowerCase() ?? "",
          phoneNumber: "",
          ip,
          userAgent,
          localDateTime: new Date().toISOString(),
          timezone: "",
          source,
        }, {
          enforceUniqueEmail: true,
        });
      } catch (error) {
        if (error instanceof DuplicateSignupError) {
          if (source === "google") {
            return "/?error=google_already_registered";
          }
          return true;
        }
        console.error(`${source} signup logging failed:`, error);
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      if (!successRedirectUrl) {
        return baseUrl;
      }
      if (
        url === successRedirectUrl ||
        url.startsWith(`${successRedirectUrl}/`) ||
        url.startsWith(`${successRedirectUrl}?`)
      ) {
        return url;
      }
      return baseUrl;
    },
  },
});

export { handler as GET, handler as POST };
