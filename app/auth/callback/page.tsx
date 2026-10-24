
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState(
    "Completing Google sign-in..."
  );

  useEffect(() => {
    let active = true;

    async function finishLogin() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          window.location.replace("/dashboard");
          return;
        }

        // Allow Supabase to finish processing the OAuth callback.
        const { data: authData } = await supabase.auth.refreshSession();

        if (authData.session) {
          window.location.replace("/dashboard");
          return;
        }

        if (active) {
          setMessage(
            "Could not establish your session. Please sign in again."
          );
        }
      } catch (error) {
        console.error("Google callback error:", error);

        if (active) {
          setMessage(
            "Authentication failed. Please try again."
          );
        }
      }
    }

    void finishLogin();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#070d19] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      <h1 className="text-2xl font-bold">
        FinSight Authentication
      </h1>
      <p className="text-center text-slate-400">
        {message}
      </p>
      <a href="/login" className="text-emerald-400 underline">
        Back to Login
      </a>
    </main>
  );
}
