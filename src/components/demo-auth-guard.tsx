"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { clearDemoAuth, isDemoAuthenticated } from "@/lib/demo-auth";

type DemoAuthGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

type GuardState = "checking" | "allowed" | "denied";

export function DemoAuthGuard({ children, fallback }: DemoAuthGuardProps) {
  const router = useRouter();
  const [state, setState] = useState<GuardState>("checking");

  useEffect(() => {
    const authenticated = isDemoAuthenticated();
    if (!authenticated) {
      setState("denied");
      router.replace("/login");
      return;
    }

    setState("allowed");
  }, [router]);

  const renderedFallback = useMemo(() => {
    if (fallback) return fallback;

    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
      </div>
    );
  }, [fallback]);

  if (state === "checking") {
    return <>{renderedFallback}</>;
  }

  if (state === "denied") {
    return null;
  }

  return <>{children}</>;
}

export function DemoLogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  const handleClick = () => {
    clearDemoAuth();
    router.replace("/login");
  };

  return (
    <Button variant="ghost" size="sm" className={className} onClick={handleClick}>
      Wyloguj
    </Button>
  );
}
