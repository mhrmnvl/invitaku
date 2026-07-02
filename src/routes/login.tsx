import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/components/login-form";
import { supabase } from "@/lib/supabase";
import * as React from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [isMounted, setIsMounted] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    setIsMounted(true);
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (session) {
          supabase.auth
            .getUser()
            .then(({ data: { user }, error }) => {
              if (error || !user) {
                console.warn("Sesi lokal kadaluarsa/tidak valid. Logout...");
                supabase.auth.signOut().then(() => {
                  document.cookie =
                    "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax";
                  setChecking(false);
                });
              } else {
                document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax`;
                window.location.href = "/dashboard";
              }
            })
            .catch(() => {
              setChecking(false);
            });
        } else {
          setChecking(false);
        }
      })
      .catch((err) => {
        console.error("Gagal mengecek sesi:", err);
        setChecking(false);
      });
  }, []);

  if (!isMounted || checking) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-xs font-mono text-ink-soft animate-pulse">Memuat sesi...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
