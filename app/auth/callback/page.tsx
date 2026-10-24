
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState(
    "Completing Google authentication..."
  );

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);

        const error =
          params.get("error_description") ||
          params.get("error");

        if (error) {
          throw new Error(error);
        }

        // The Supabase browser client handles the OAuth
        // response and restores the session automatically.
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          throw new Error(
            "No session received. Check Google OAuth credentials and redirect settings."
          );
        }

        window.location.replace("/dashboard");
      } catch (error) {
        console.error("OAuth callback:", error);

        if (mounted) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Google login failed."
          );
        }
      }
    }

    void handleCallback();

    return () => {
      mounted = false;
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
