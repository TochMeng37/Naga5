"use client";

import { Sora } from "next/font/google";
import { useEffect, useState } from "react";
import { getProviders, signIn, signOut, useSession } from "next-auth/react";
import type { IconType } from "react-icons";
import { FaGoogle } from "react-icons/fa";
import { LuFacebook } from "react-icons/lu";
import { toast } from "sonner";

type SocialProvider = "google" | "facebook";

const socialProviderMeta: Record<SocialProvider, { label: string; Icon: IconType }> =
  {
    google: { label: "Google", Icon: FaGoogle },
    facebook: { label: "Facebook", Icon: LuFacebook },
  };

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
const successRedirectUrl =
  process.env.NEXT_PUBLIC_SUCCESS_REDIRECT_URL?.trim() || "/";
const parsedMinPasswordLength = Number.parseInt(
  process.env.NEXT_PUBLIC_MIN_PASSWORD_LENGTH ?? "8",
  10,
);
const minPasswordLength =
  Number.isFinite(parsedMinPasswordLength) && parsedMinPasswordLength > 0
    ? parsedMinPasswordLength
    : 8;

export default function Home() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSocialProviders, setAvailableSocialProviders] = useState<
    SocialProvider[]
  >([]);
  const { data: session, status } = useSession();

  useEffect(() => {
    let isMounted = true;

    const loadProviders = async () => {
      try {
        const providers = await getProviders();
        if (!isMounted) return;

        const providerIds = Object.values(providers ?? {})
          .map((provider) => provider.id)
          .filter((id): id is SocialProvider => id in socialProviderMeta);

        setAvailableSocialProviders(providerIds);
      } catch {
        if (isMounted) {
          setAvailableSocialProviders([]);
        }
      }
    };

    void loadProviders();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSocialAuth = (provider: SocialProvider) => {
    void signIn(provider, { callbackUrl: successRedirectUrl });
  };

  const handleCredentialSignup = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");
    const cleanPassword = password.trim();
    if (cleanFullName.length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!cleanEmail) {
      toast.error("Please enter your email first.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      toast.error("Please enter a valid email.");
      return;
    }
    if (cleanPhoneNumber.length < 8) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (cleanPassword.length < minPasswordLength) {
      toast.error(`Password must be at least ${minPasswordLength} characters.`);
      return;
    }
    if (!acceptedTerms) {
      toast.error("You must agree to the Terms & Conditions.");
      return;
    }

    setIsSubmitting(true);

    const signupPromise = (async () => {
      const response = await fetch("/api/signup-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: cleanFullName,
          email: cleanEmail,
          phoneNumber: cleanPhoneNumber,
          password: cleanPassword,
          acceptedTerms,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          localDateTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        const errorMessage = errorBody?.error ?? "Failed to save signup.";

        throw new Error(errorMessage);
      }
    })();

    toast.promise(signupPromise, {
      loading: "Creating account...",
      success: "Account created. Redirecting...",
      error: (error) =>
        error instanceof Error
          ? error.message
          : "Signup failed. Please try again.",
    });

    try {
      await signupPromise;
      window.location.href = successRedirectUrl;
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className={`${sora.className} relative flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_15%_20%,#1d1026_0%,#060b16_40%)] px-4 text-white`}
    >
      <div className="pointer-events-none absolute -left-32 top-32 h-96 w-96 rounded-full bg-[#ff4d5a]/25 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-[#22d3ee]/10 blur-3xl" />

      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[rgba(14,21,39,0.75)] backdrop-blur-xl md:grid-cols-2">
        <div className="relative min-h-[380px] overflow-hidden md:min-h-[640px]">
          {/* <img
            src="https://pub-47ed098e6aaf42a289f945028802fcea.r2.dev/king.jpg"
            alt="NAGA 5"
            className="absolute inset-0 h-full w-full object-cover"
          /> */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            src="https://pub-47ed098e6aaf42a289f945028802fcea.r2.dev/grok-video-15b4e468-c350-40f3-9d6d-a5a42e223d98%20(1).mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/35 to-black/65" />

          <div className="absolute inset-0 z-10 flex flex-col justify-between p-10">
            <div>
              <h2 className="text-3xl font-bold leading-tight">NAGA 5</h2>
              <p className="mt-3 max-w-sm text-sm text-white/80">
                Create your account and start instantly with NAGA 5 across
                Southeast Asia.
              </p>
            </div>

            <div className="text-xs text-white/70">
              &copy; {new Date().getFullYear()} NAGA
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="mt-2 text-sm text-white/60">Fill in the details below</p>
          {status === "loading" && (
            <p className="mt-3 text-xs text-white/50">Checking login session...</p>
          )}
          <form className="mt-6 space-y-4" onSubmit={handleCredentialSignup}>
            <div>
              <label className="mb-2 block text-xs text-white/60" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="John Doe"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 focus:bg-white/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs text-white/60" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 focus:bg-white/10"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs text-white/60" htmlFor="phoneNumber">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={phoneNumber}
                onChange={(event) =>
                  setPhoneNumber(event.target.value.replace(/\D/g, ""))
                }
                placeholder="081234567890"
                className="w-full rounded-xl border border-white/15 bg-[#2a2f45]/70 px-4 py-3 text-sm font-medium text-white placeholder:text-white/35 outline-none transition focus:border-white/35 focus:bg-[#303650]/80 [color-scheme:dark]"
              />
            </div>

            <div>
              <label
                className="mb-2 block text-xs text-white/60"
                htmlFor="confirmPassword"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={minPasswordLength}
                  placeholder={`Minimum ${minPasswordLength} characters`}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 focus:bg-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/60 hover:text-white"
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-white/50">
                Password must be at least {minPasswordLength} characters.
              </p>
            </div>

            <div className="flex  items-center gap-2 text-xs text-white/60">
              <input
                id="terms"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5"
              />
              <span>
                I agree to the{" "}
                <a href="/privacy-policy" className="text-white hover:underline">
                  Terms &amp; Conditions
                </a>
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !acceptedTerms}
              className="w-full rounded-xl bg-[#ff4d5a] py-3 text-sm font-semibold shadow-lg shadow-[#ff4d5a]/30 transition hover:brightness-110"
            >
              {isSubmitting ? "Creating..." : "Create Account"}
            </button>

            {availableSocialProviders.length > 0 && (
              <>
                <div className="relative my-4 text-center text-xs text-white/40">
                  <span className="relative z-10 bg-[rgba(14,21,39,0.75)] px-3">
                    or sign up with
                  </span>
                  <div className="absolute inset-0 top-1/2 h-px bg-white/10" />
                </div>

                <div className="flex w-full gap-2">
                  {availableSocialProviders.map((provider) => {
                    const { label, Icon } = socialProviderMeta[provider];

                    return (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => handleSocialAuth(provider)}
                        className="flex w-full flex-1 basis-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-3 text-xs hover:bg-white/10"
                      >
                        <Icon size={14} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
