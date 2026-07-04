import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleFillDemo = () => {
    setEmail("admin@admin.com");
    setPassword("admin");
    toast.success("Kredensial demo diisi otomatis!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email dan Password wajib diisi");
      return;
    }

    if (mode === "register" && password !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "login") {
        const { data: signInData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          if (error.message.toLowerCase().includes("email not confirmed")) {
            toast.error(
              "Email belum dikonfirmasi! Silakan cek inbox/spam email Anda untuk aktivasi, atau nonaktifkan opsi 'Confirm Email' di setelan Auth Supabase Anda.",
              { duration: 7000 },
            );
          } else {
            toast.error(error.message);
          }
        } else {
          if (signInData?.session) {
            document.cookie = `sb-access-token=${signInData.session.access_token}; path=/; max-age=${signInData.session.expires_in}; SameSite=Lax`;
          }
          toast.success("Login sukses! Mengalihkan...");
          window.location.href = "/dashboard";
        }
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) {
          toast.error(signUpError.message);
        } else {
          // Lakukan auto login di client-side
          const { data: autoSignInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });
          if (signInError) {
            if (signInError.message.toLowerCase().includes("email not confirmed")) {
              toast.success("Registrasi sukses! Silakan cek inbox email Anda untuk verifikasi.");
              setMode("login");
            } else {
              toast.error(signInError.message);
            }
          } else {
            if (autoSignInData?.session) {
              document.cookie = `sb-access-token=${autoSignInData.session.access_token}; path=/; max-age=${autoSignInData.session.expires_in}; SameSite=Lax`;
            }
            toast.success("Registrasi sukses! Mengalihkan ke dasbor...");
            window.location.href = "/dashboard";
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        toast.error(error.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghubungkan ke Google Login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2">
        <img src="/logo.png" alt="Invitaku" className="h-18 object-contain" />
      </div>
      <Card className="rounded-2xl border border-rule/50 shadow-md p-2 bg-white">
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-bold font-sans text-ink">
            {mode === "login" ? "Masuk ke Invitaku" : "Daftar Akun Baru"}
          </CardTitle>
          <CardDescription className="text-xs text-ink-soft mt-1">
            {mode === "login" ? (
              <span className="block space-y-3">
                <span className="block">
                  Gunakan email & password Anda atau login dengan akun Google.
                </span>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="w-full text-left p-3 bg-amber-50 hover:bg-amber-100/50 border border-amber-200 rounded-xl transition-all duration-200 cursor-pointer shadow-sm group relative overflow-hidden block"
                >
                  <div className="absolute right-2 top-2 text-amber-500/10 group-hover:text-amber-500/20 transition-colors">
                    <Sparkles className="h-10 w-10 rotate-12" />
                  </div>
                  <span className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-[10px] font-mono text-amber-800 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                      Akun Demo Admin
                    </span>
                    <span className="text-[9px] text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded-full font-semibold">
                      Isi Otomatis
                    </span>
                  </span>
                  <span className="block text-xs text-amber-950 font-sans space-y-0.5 font-medium">
                    <span className="block">
                      Email:{" "}
                      <span className="font-mono text-amber-900 font-bold select-all bg-amber-200/30 px-1 py-0.2 rounded">
                        admin@admin.com
                      </span>
                    </span>
                    <span className="block">
                      Password:{" "}
                      <span className="font-mono text-amber-900 font-bold select-all bg-amber-200/30 px-1 py-0.2 rounded">
                        admin
                      </span>
                    </span>
                  </span>
                  <span className="block mt-1 text-[9px] text-amber-700 font-sans font-normal italic">
                    * Klik di sini untuk mengisi formulir login otomatis
                  </span>
                </button>
              </span>
            ) : (
              "Lengkapi form berikut untuk memulai perjalanan Anda di Invitaku."
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5 text-left">
              <Label
                htmlFor="email"
                className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-semibold"
              >
                Alamat Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white rounded-xl text-xs"
              />
            </div>

            <div className="flex flex-col gap-1.5 text-left">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-semibold"
                >
                  Password
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white rounded-xl text-xs"
              />
            </div>

            {mode === "register" && (
              <div className="flex flex-col gap-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-200">
                <Label
                  htmlFor="confirmPassword"
                  className="font-mono text-[9px] uppercase tracking-widest text-ink-soft font-semibold"
                >
                  Konfirmasi Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white rounded-xl text-xs"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer h-10 mt-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
              ) : mode === "login" ? (
                "Masuk"
              ) : (
                "Daftar"
              )}
            </Button>

            <div className="relative flex py-2 items-center text-xs">
              <div className="flex-grow border-t border-rule/50"></div>
              <span className="flex-shrink mx-4 text-ink-soft text-[10px] font-mono uppercase tracking-widest">
                Atau
              </span>
              <div className="flex-grow border-t border-rule/50"></div>
            </div>

            <Button
              variant="outline"
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-all border-rule/70"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-ink-soft" />
              ) : (
                <svg
                  className="h-4 w-4 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                  />
                </svg>
              )}
              Masuk dengan Google
            </Button>
          </form>

          <div className="text-center mt-4 text-xs text-ink-soft">
            {mode === "login" ? (
              <span>
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-primary hover:underline font-semibold"
                >
                  Daftar di sini
                </button>
              </span>
            ) : (
              <span>
                Sudah punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-primary hover:underline font-semibold"
                >
                  Masuk di sini
                </button>
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
