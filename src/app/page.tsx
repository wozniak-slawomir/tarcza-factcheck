"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import clsx from "clsx";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isDemoAuthenticated } from "@/lib/demo-auth";
import {
  IconArrowRight,
  IconCertificate,
  IconChecklist,
  IconFileAnalytics,
  IconShieldLock,
  IconShieldCheck,
  IconSparkles,
  IconTimeline,
} from "@tabler/icons-react";

let motionMediaQuery: MediaQueryList | null = null;
const motionListeners = new Set<(prefers: boolean) => void>();
let cachedMotionPreference = false;
let motionInitialised = false;

function ensureMotionMediaQuery() {
  if (motionInitialised || typeof window === "undefined") return;
  motionMediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  cachedMotionPreference = motionMediaQuery.matches;
  const handleChange = (event: MediaQueryListEvent) => {
    cachedMotionPreference = event.matches;
    motionListeners.forEach((listener) => listener(cachedMotionPreference));
  };
  motionMediaQuery.addEventListener("change", handleChange);
  motionInitialised = true;
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    ensureMotionMediaQuery();
    return cachedMotionPreference;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    ensureMotionMediaQuery();
    const listener = (value: boolean) => setPrefersReducedMotion(value);
    setPrefersReducedMotion(cachedMotionPreference);
    motionListeners.add(listener);
    return () => {
      motionListeners.delete(listener);
    };
  }, []);

  return prefersReducedMotion;
}

interface ScrollRevealProps extends HTMLAttributes<HTMLDivElement> {
  delay?: number;
  children: ReactNode;
}

function ScrollReveal({ delay = 0, className, children, style, ...rest }: ScrollRevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [visible, setVisible] = useState(prefersReducedMotion);
  const nodeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (prefersReducedMotion || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    const current = nodeRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  return (
    <div
      ref={nodeRef}
      className={clsx(
        "transition-all duration-700 will-change-transform",
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
        className
      )}
      style={{
        ...style,
        transitionDelay: visible ? `${delay}s` : undefined,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

const features = [
  {
    title: "Weryfikacja tekstu z AI",
    description:
      "System wykorzystuje zaawansowane embeddingi OpenAI i bazę wektorową Qdrant do porównywania tekstów. Automatycznie klasyfikuje treści jako fake news, prawdziwe informacje lub przypadki wymagające dodatkowej weryfikacji.",
    icon: IconFileAnalytics,
  },
  {
    title: "Sprawdzanie podobieństwa URL",
    description:
      "Inteligentny system porównuje nowe URL-e z bazą danych istniejących linków. Wykrywa podobne adresy i klasyfikuje je na podstawie powiązanych z nimi treści jako fake lub prawdziwe.",
    icon: IconShieldLock,
  },
  {
    title: "Panel zarządzania treściami",
    description:
      "Intuicyjny dashboard pozwala przeglądać, filtrować i sortować zgłoszone treści. Analizuj trendy, zarządzaj bazą danych i monitoruj skuteczność systemu weryfikacji.",
    icon: IconCertificate,
  },
  {
    title: "Narzędzia testowe",
    description:
      "Dedykowane strony do testowania funkcjonalności - sprawdź podobieństwo tekstów i URL-i przed dodaniem do głównej bazy danych. Idealne do weryfikacji i debugowania.",
    icon: IconChecklist,
  },
];

const timeline = [
  {
    title: "Dodanie treści",
    description:
      "Użytkownik dodaje tekst lub URL do systemu przez panel administracyjny. System automatycznie generuje embeddingi za pomocą OpenAI i zapisuje dane w bazie wektorowej Qdrant.",
    outcome: "Treść zostaje zindeksowana i jest gotowa do porównań z przyszłymi zgłoszeniami.",
  },
  {
    title: "Weryfikacja podobieństwa",
    description:
      "Gdy pojawia się nowa treść do sprawdzenia, system porównuje ją z istniejącą bazą danych. AI analizuje podobieństwo semantyczne i klasyfikuje status jako fake/true/no_data/unsure.",
    outcome: "W ciągu kilku sekund otrzymujesz szczegółowy raport z poziomem pewności i uzasadnieniem.",
  },
  {
    title: "Zarządzanie wynikami",
    description:
      "Wszystkie wyniki weryfikacji są zapisywane w dashboardzie. Możesz przeglądać historię, analizować trendy i zarządzać bazą danych fake news oraz prawdziwych informacji.",
    outcome: "Kompletny system śledzenia i zarządzania weryfikacją treści.",
  },
];

const stats = [
  { label: "Oflagowanych postów w bazie danych", value: 100000, format: "compact" as const },
  { label: "Dokładność klasyfikacji", value: 97, suffix: "%", format: "percent" as const },
  { label: "Weryfikacji wykonanych", value: 1000000, format: "compact" as const },
];

const partners = [
  "Instytut Weryfikacji Cyfrowej",
  "Fundacja Prawdy Społecznej",
  "Centrum Analizy Dezinformacji",
  "Laboratorium Fact-Checkingu",
  "Agencja Bezpieczeństwa Informacyjnego",
  "Koalicja Przeciw Fake News",
];

export default function LandingPage() {
  const [animatedStats, setAnimatedStats] = useState(() => stats.map(() => 0));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const heroRef = useRef<HTMLDivElement | null>(null);
  const pointerFrame = useRef<number | null>(null);
  const [pointerPos, setPointerPos] = useState({ x: 50, y: 50 });
  const numberFormatter = useMemo(() => new Intl.NumberFormat("pl-PL"), []);
  const compactFormatter = useMemo(
    () => new Intl.NumberFormat("pl-PL", { notation: "compact", maximumFractionDigits: 1 }),
    []
  );
  const partnerTicker = useMemo(() => [...partners, ...partners], []);

  useEffect(() => {
    setIsAuthenticated(isDemoAuthenticated());
  }, []);

  useEffect(() => {
    const increments = stats.map((stat) => Math.max(1, Math.floor(stat.value / 80)));
    const interval = window.setInterval(() => {
      setAnimatedStats((previous) => {
        let completed = true;
        const next = previous.map((value, index) => {
          const target = stats[index].value;
          if (value < target) {
            completed = false;
            return Math.min(value + increments[index], target);
          }
          return value;
        });

        if (completed) {
          window.clearInterval(interval);
        }

        return next;
      });
    }, 24);

    return () => window.clearInterval(interval);
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || !heroRef.current) return;
      const bounds = heroRef.current.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
      const clamp = (value: number) => Math.min(100, Math.max(0, value));

      if (pointerFrame.current !== null) window.cancelAnimationFrame(pointerFrame.current);
      pointerFrame.current = window.requestAnimationFrame(() => {
        setPointerPos({ x: clamp(x), y: clamp(y) });
      });
    },
    [prefersReducedMotion]
  );

  const resetPointer = useCallback(() => {
    if (pointerFrame.current !== null) window.cancelAnimationFrame(pointerFrame.current);
    setPointerPos({ x: 50, y: 50 });
  }, []);

  useEffect(() => {
    return () => {
      if (pointerFrame.current !== null) window.cancelAnimationFrame(pointerFrame.current);
    };
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      setPointerPos({ x: 50, y: 50 });
    }
  }, [prefersReducedMotion]);

  const heroSurfaceStyle = useMemo<CSSProperties>(
    () => ({
      background: `radial-gradient(circle at ${pointerPos.x}% ${pointerPos.y}%, rgba(0,58,140,0.14), transparent 60%)`,
    }),
    [pointerPos]
  );

  const heroTiltStyle = useMemo<CSSProperties>(
    () => ({
      transform: prefersReducedMotion
        ? undefined
        : `perspective(1400px) rotateX(${(50 - pointerPos.y) / 12}deg) rotateY(${(pointerPos.x - 50) / 12}deg)`,
    }),
    [pointerPos, prefersReducedMotion]
  );

  const heroGlowStyle = useMemo<CSSProperties>(
    () => ({
      left: `calc(${pointerPos.x}% - 16rem)`,
      top: `calc(${pointerPos.y}% - 16rem)`,
    }),
    [pointerPos]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f3f6ff] text-slate-900">
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top,rgba(0,72,173,0.18),transparent_60%)]" />
      <div className="pointer-events-none landing-grid absolute inset-0 -z-10 opacity-40" />
      <div className="pointer-events-none absolute -top-40 right-[-12%] h-[520px] w-[520px] rounded-full bg-[#ffeded] blur-3xl animate-blob" />
      <div className="pointer-events-none absolute left-[-10%] top-1/2 h-[480px] w-[480px] -translate-y-1/2 rounded-full bg-[#d6e4ff] blur-3xl animate-blob" />

      <header className="relative z-10 flex items-center justify-end md:justify-between px-6 py-6 sm:px-10">
        <div className="items-center gap-3 hidden md:flex">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <IconShieldLock className="size-5 text-[#003a8c]" />
          </span>
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-500">TARCZA</p>
            <p className="text-xs text-slate-400">Ochrona przed dezinformacją</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <Button
              variant="outline"
              className="hidden text-[#003a8c] border-[#003a8c]/30 bg-white hover:bg-[#edf2ff] sm:inline-flex"
              asChild
            >
              <Link href="/login">Logowanie</Link>
            </Button>
          )}
        </div>
      </header>

      <main className="relative z-10 flex flex-col gap-24 pb-24 pt-10 md:gap-32">
        <section className="px-6 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="border-[#003a8c]/30 bg-white text-[#003a8c] backdrop-blur">
                System weryfikacji treści z AI
              </Badge>
              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs uppercase tracking-widest text-slate-500">
                Demo wersja systemu
              </span>
            </div>

            <div className="relative md:overflow-hidden rounded-[2.75rem] md:p-10 md:border lg:p-20 md:shadow-[0_35px_90px_rgba(15,23,42,0.18)] md:backdrop-blur-xl transition-transform duration-500">
              <div className="grid items-center gap-16 md:grid-cols-[1.05fr,1fr] lg:gap-20">
                <div className="space-y-8">
                  <ScrollReveal className="space-y-6" delay={0.05}>
                    <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                      Zatrzymaj{" "}
                      <span className="bg-gradient-to-r from-[#d4213d] via-[#ff4757] to-[#ff6b81] bg-clip-text text-transparent">
                        dezinformację
                      </span>{" "}
                      zanim się rozprzestrzeni.
                    </h1>
                    <p className="max-w-xl text-lg text-slate-600">
                      Tarcza to zaawansowany system weryfikacji treści wykorzystujący AI i bazę wektorową. 
                      Porównuj teksty i URL-e z istniejącą bazą danych, klasyfikuj fake news i zarządzaj 
                      weryfikacją w czasie rzeczywistym.
                    </p>
                  </ScrollReveal>
                  <ScrollReveal delay={0.12} className="flex flex-wrap items-center gap-4">
                    <Button
                      size="lg"
                      className="bg-[#d4213d] text-white shadow-[0_20px_50px_rgba(212,33,61,0.6)] hover:bg-[#bb1c34] text-lg font-semibold px-8 py-4 rounded-xl border-2 border-[#d4213d]/20 transform hover:scale-105 transition-all duration-200"
                      asChild
                    >
                      <Link href="/dashboard">
                        Rozpocznij weryfikację
                        <IconArrowRight className="size-6 ml-2" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-[#003a8c]/20 bg-white text-[#003a8c] hover:bg-[#edf2ff]"
                      asChild
                    >
                      <Link href="#mission">Zobacz jak to działa</Link>
                    </Button>
                  </ScrollReveal>
                  <ScrollReveal delay={0.18}>
                    <div className="grid gap-6 sm:grid-cols-3">
                      {stats.map((stat, index) => {
                        const formattedValue = (() => {
                          if (stat.format === "compact") {
                            return compactFormatter.format(animatedStats[index]);
                          }
                          return numberFormatter.format(animatedStats[index]);
                        })();

                        return (
                          <div
                            key={stat.label}
                            className="animate-fade-rise rounded-2xl border border-[#003a8c]/10 bg-white p-5 shadow-[0_15px_40px_rgba(15,23,42,0.08)] transition-transform duration-500 hover:-translate-y-1 hover:border-[#003a8c]/30"
                            style={{ animationDelay: `${index * 0.12}s` }}
                          >
                            <p className="text-3xl font-semibold text-slate-900">
                              {formattedValue}
                              {stat.suffix ? <span className="text-lg text-slate-500">{stat.suffix}</span> : null}
                            </p>
                            <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollReveal>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 sm:px-10">
          <div className="mx-auto max-w-6xl">
            <ScrollReveal delay={0.05}>
              <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                Dlaczego Tarcza jest niezbędna każdej instytucji
              </h2>
            </ScrollReveal>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {features.map((feature, index) => (
                <ScrollReveal
                  key={feature.title}
                  delay={0.08 * index}
                  className="group relative overflow-hidden rounded-3xl border border-[#003a8c]/15 bg-white/95 p-8 shadow-[0_18px_45px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[#003a8c]/30"
                >
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-[#d6e4ff]/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-[#d6e4ff] blur-2xl opacity-70 transition-opacity duration-500 group-hover:opacity-100" />
                  <feature.icon className="size-10 text-[#003a8c]" />
                  <h3 className="mt-6 text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                  <Link href="/dashboard" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#003a8c] hover:text-[#002e70] transition-colors">
                    Zobacz w panelu
                    <IconArrowRight className="size-4" />
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 sm:px-10">
          <div className="mx-auto max-w-5xl rounded-3xl border border-[#003a8c]/15 bg-white/90 p-10 shadow-[0_20px_55px_rgba(15,23,42,0.09)] backdrop-blur-lg">
            <ScrollReveal delay={0.05} className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Partnerstwa pilotażowe</p>
              <p className="max-w-2xl text-sm text-slate-600">
                Nasz ekosystem budujemy razem z instytucjami publicznymi i laboratoriami GovTechu. Razem pilnujemy, by
                prawda docierała szybciej niż manipulacja.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.12}>
              <div className="relative mt-6 overflow-hidden rounded-2xl border border-[#003a8c]/12 bg-white/80 text-[#003a8c] shadow-[0_15px_40px_rgba(15,23,42,0.08)]">
                <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent" />
                <div className={clsx("flex gap-6 py-4 pr-6", prefersReducedMotion ? undefined : "marquee-track")}>
                  {partnerTicker.map((partner, index) => (
                    <span
                      key={`${partner}-${index}`}
                      className="flex items-center gap-3 rounded-full border border-[#003a8c]/20 bg-[#f6f8ff] px-5 py-2 text-sm font-medium shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
                    >
                      <IconShieldCheck className="size-4" />
                      {partner}
                    </span>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section id="mission" className="px-6 sm:px-10">
          <div className="mx-auto max-w-6xl rounded-3xl border border-[#003a8c]/15 bg-white p-10 shadow-[0_20px_55px_rgba(15,23,42,0.09)]">
            <ScrollReveal delay={0.05} className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl space-y-6">
                <Badge className="bg-[#003a8c]/15 text-[#003a8c]">Przepływ usług</Badge>
                <h2 className="text-2xl font-semibold text-slate-900 md:text-3xl">
                  Od zgłoszenia do publikacji w czasie jednego newsroomu
                </h2>
                <p className="text-slate-600">
                  Zbudowaliśmy najprostszy możliwy przepływ informacji – od palca obywatela na ekranie smartfona po
                  oficjalne stanowisko państwa widoczne w całym kraju. Bez biurokracji, bez opóźnień.
                </p>
              </div>
              <div className="flex gap-4 text-sm text-slate-600 flex-col md:flex-row">
                <div className="flex items-center gap-2 rounded-full border border-[#003a8c]/15 bg-[#f6f8ff] px-4 py-2">
                  <IconTimeline className="size-4 text-[#003a8c] shrink-0" />
                  Jeden spójny obieg informacji
                </div>
                <div className="flex items-center gap-2 rounded-full border border-[#003a8c]/15 bg-[#f6f8ff] px-4 py-2">
                  <IconShieldCheck className="size-4 text-[#003a8c] shrink-0" />
                  Pełna kontrola audytowa
                </div>
              </div>
            </ScrollReveal>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {timeline.map((step, index) => (
                <ScrollReveal
                  key={step.title}
                  delay={0.1 * index}
                  className="relative overflow-hidden rounded-3xl border border-[#003a8c]/15 bg-[#f6f8ff] p-6 transition-transform duration-500 hover:-translate-y-1 hover:border-[#003a8c]/30"
                >
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#003a8c]/30 to-transparent" />
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-[#003a8c]/15 bg-white text-sm font-semibold text-[#003a8c]">
                    0{index + 1}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.description}</p>
                  <p className="mt-4 text-sm font-medium text-[#003a8c]">{step.outcome}</p>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 sm:px-10">
          <ScrollReveal
            delay={0.05}
            className="mx-auto flex max-w-5xl flex-col gap-8 rounded-3xl border border-[#003a8c]/15 bg-gradient-to-br from-white via-[#eef3ff] to-[#d6e4ff] p-10 text-center shadow-[0_20px_55px_rgba(15,23,42,0.09)]"
          >
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">
                Gotowy bronić prawdy na pierwszej linii?
              </h2>
              <p className="text-lg text-slate-600">
                Zaloguj się do panelu administracyjnego i rozpocznij weryfikację treści. Testuj funkcjonalności, 
                zarządzaj bazą danych i wykorzystuj zaawansowane narzędzia AI do wykrywania fake news.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-[#003a8c] text-white shadow-[0_20px_50px_rgba(0,58,140,0.5)] hover:bg-[#002e70] text-lg font-semibold px-8 py-4 rounded-xl border-2 border-[#003a8c]/20 transform hover:scale-105 transition-all duration-200"
                asChild
              >
                <Link href="/dashboard">
                  Zaloguj się służbowo
                  <IconArrowRight className="size-6 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#d4213d]/30 bg-white text-[#d4213d] hover:bg-[#fff0f3]"
                asChild
              >
                <Link href="mailto:ops@prompcik.dev">Porozmawiaj z ekspertem</Link>
              </Button>
            </div>
          </ScrollReveal>
        </section>
      </main>

      <footer className="relative z-10 px-6 pb-10 pt-6 text-center text-xs text-slate-500 sm:px-10">
        Tarcza Fact-Check • Hack Yeah 2025 • Rozszerzenie + panel dla ochrony społeczeństwa przed dezinformacją
        <br />
        Wszelkie dane znajdujące się na stronie nie są prawdziwe, a służą wyłącznie celom demonstracyjnym.
      </footer>
    </div>
  );
}
