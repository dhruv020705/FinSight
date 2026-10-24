
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState(
    "Completing Google authentication..."
  );

  useEffect(() => {
    let active = true;

    async function completeLogin() {
      try {
        const url = new URL(window.location.href);

        // Display errors returned by the OAuth provider.
        const oauthError =
          url.searchParams.get("error_description") ||
          url.searchParams.get("error");

        if (oauthError) {
          throw new Error(oauthError);
        }

        const code = url.searchParams.get("code");

        // Handle PKCE authorization code if present.
        if (code) {
          const { error } =
            await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        }

        // The default Supabase browser client can also
        // process OAuth sessions automatically.
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error(
            "No Supabase session found after Google sign-in."
          );
        }

        window.location.replace("/dashboard");
      } catch (error) {
        console.error("Google OAuth callback error:", error);

        if (active) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to complete Google authentication."
          );
        }
      }
    }

    void completeLogin();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#070d19] px-4 text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />

      <h1 className="text-2xl font-bold">
        FinSight Authentication
      </h1>

      <p className="max-w-lg text-center text-slate-400">
        {message}
      </p>

      <a href="/login" className="text-emerald-400 underline">
        Back to Login
      </a>
    </main>
  );
}
