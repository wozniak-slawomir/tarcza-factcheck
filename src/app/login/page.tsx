"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconArrowRight, IconLock } from "@tabler/icons-react";
import { isDemoAuthenticated, persistDemoAuth } from "@/lib/demo-auth";

const MOCK_USERNAME = "admin";
const MOCK_PASSWORD = "admin123";

export default function LoginPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isDemoAuthenticated()) {
      setSuccess(true);
      router.replace("/dashboard");
    }
  }, [router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setPending(true);
    setError(null);

    window.setTimeout(() => {
      const isValid = username === MOCK_USERNAME && password === MOCK_PASSWORD;
      if (!isValid) {
        setError("Niepoprawne dane logowania. Użyj danych testowych widocznych powyżej.");
        setPending(false);
        return;
      }

      persistDemoAuth();
      setSuccess(true);
      setPending(false);
      window.setTimeout(() => router.push("/dashboard"), 900);
    }, 550);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f6ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(0,72,173,0.25),transparent_55%)]" />
      <div className="pointer-events-none landing-grid absolute inset-0 -z-20 opacity-30" />
      <div className="pointer-events-none absolute -top-32 left-[10%] h-[420px] w-[420px] rounded-full bg-[#d6e4ff] blur-3xl animate-blob" />
      <div className="pointer-events-none absolute bottom-[-10%] right-[5%] h-[480px] w-[480px] rounded-full bg-[#ffeded] blur-3xl animate-blob" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 sm:px-10">
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <Badge variant="outline" className="border-[#003a8c]/30 bg-white/70 text-[#003a8c] backdrop-blur">
            Dostęp służbowy · tylko testy
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Zaloguj się do Tarczy</h1>
            <p className="text-sm text-slate-600 sm:text-base max-w-md">
              Użyj przykładowych danych: <span className="font-semibold text-[#003a8c]">{MOCK_USERNAME}</span> /
              <span className="font-semibold text-[#003a8c]"> {MOCK_PASSWORD}</span>. Po weryfikacji przekierujemy Cię
              na podgląd panelu.
            </p>
          </div>
        </div>

        <Card className="w-full max-w-xl rounded-[2.25rem] border-[#003a8c]/15 bg-white/90 shadow-[0_30px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          <CardHeader className="gap-3">
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold">
              <span className="flex size-10 items-center justify-center rounded-2xl border border-[#003a8c]/20 bg-[#003a8c]/10 text-[#003a8c]">
                <IconLock className="size-5" />
              </span>
              Panel logowania
            </CardTitle>
            <CardDescription>Logowanie wyłącznie dla celów demonstracyjnych.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs uppercase tracking-wide text-slate-500">
                  Identyfikator użytkownika
                </Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="np. admin"
                  autoComplete="username"
                  className="h-12 rounded-xl border-[#003a8c]/20 bg-white/80"
                  disabled={pending || success}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs uppercase tracking-wide text-slate-500">
                  Hasło
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-[#003a8c]/20 bg-white/80"
                  disabled={pending || success}
                />
              </div>
              {error ? (
                <p className="rounded-xl border border-[#d4213d]/20 bg-[#fff5f6] px-4 py-3 text-sm text-[#d4213d]">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="rounded-xl border border-emerald-400/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                  Dane poprawne! Przekierowujemy do panelu demonstracyjnego…
                </p>
              ) : null}
              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 rounded-xl bg-[#003a8c] text-white shadow-[0_18px_45px_rgba(0,58,140,0.35)] hover:bg-[#002e70]"
                disabled={pending || success}
              >
                {pending ? "Sprawdzanie danych…" : "Zaloguj się"}
                {!pending && <IconArrowRight className="size-4" />}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-xs text-slate-500">
            <span>Dane logowania nie zapisują żadnych informacji. To wyłącznie scenariusz testowy na hackathon.</span>
            <span>
              Masz pytania? Skontaktuj się z zespołem:{" "}
              <a href="mailto:ops@prompcik.dev" className="underline">
                ops@prompcik.dev
              </a>
            </span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
