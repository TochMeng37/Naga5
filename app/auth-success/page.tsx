"use client";

import { useEffect } from "react";

const successRedirectUrl =
  process.env.NEXT_PUBLIC_SUCCESS_REDIRECT_URL?.trim() || "/";

type DataLayerWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>;
};

function pushDataLayerEvent(eventName: string) {
  const windowWithDataLayer = window as DataLayerWindow;
  windowWithDataLayer.dataLayer = windowWithDataLayer.dataLayer ?? [];
  windowWithDataLayer.dataLayer.push({ event: eventName });
}

export default function AuthSuccessPage() {
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const provider = searchParams.get("provider");
    const userCreated = searchParams.get("userCreated") === "true";

    if (provider === "google" && userCreated) {
      pushDataLayerEvent("google_registration_success");
    }

    const redirectTimer = window.setTimeout(() => {
      window.location.href = successRedirectUrl;
    }, 300);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#060b16] px-4 text-white">
      <p className="text-sm text-white/75">Completing sign-in...</p>
    </main>
  );
}
