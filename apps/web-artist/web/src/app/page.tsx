import Image from "next/image";
import Link from "next/link";
import { PiumsCinematicFooter } from "@/components/ui/motion-footer";
import { RevealObserver } from "@/components/RevealObserver";
import { HeroPiums } from "@/components/ui/shape-landing-hero";
import { headers } from "next/headers";
import {
  Calendar, Users, DollarSign, ArrowRight, Check,
  MessageCircle, BarChart3, TrendingUp,
} from "lucide-react";

const DISCIPLINES_MARQUEE = [
  "Cantante solista", "Fotógrafo de bodas", "Maestro de ceremonia", "Videógrafo", "Banda musical",
  "TikToker", "Mariachi", "Fotógrafo de eventos", "Animador", "Creador de contenido",
  "Trio musical", "Marimba", "YouTuber", "Director audiovisual", "Influencer",
  "Cantante solista", "Fotógrafo de bodas", "Maestro de ceremonia", "Videógrafo", "Banda musical",
  "TikToker", "Mariachi", "Fotógrafo de eventos", "Animador", "Creador de contenido",
  "Trio musical", "Marimba", "YouTuber", "Director audiovisual", "Influencer",
];

const STATS = [
  { value: "500+",   label: "Artistas activos"    },
  { value: "2,400+", label: "Reservas completadas"},
  { value: "$280",   label: "Ingreso promedio / mes" },
];

const FEATURES = [
  { Icon: Calendar,       title: "Tu tiempo, tus reglas",  desc: "Acepta o rechaza reservas con un toque. Sin explicaciones, sin compromisos forzados.", color: "#A855F7" },
  { Icon: Users,          title: "Clientes que te buscan", desc: "Tu perfil trabaja 24/7. Los clientes llegan solos — tú solo confirmas.",              color: "#14B8A6" },
  { Icon: DollarSign,     title: "Cobra en USD estables",  desc: "Sin volatilidad, sin sorpresas. Pago directo a tu cuenta al completar el servicio.",   color: "#10B981" },
  { Icon: MessageCircle,  title: "Tú y tu cliente",        desc: "Chat directo para coordinar detalles. Sin intermediarios ni comisiones ocultas.",       color: "#3B82F6" },
];

const STEPS = [
  { num: "1", title: "Crea tu perfil",   desc: "Sube tu portafolio, define servicios y precios. Listo en minutos, sin costo de entrada." },
  { num: "2", title: "Recibe reservas",  desc: "Los clientes te descubren, eligen fecha y pagan. Tú solo confirmas." },
  { num: "3", title: "Cobra puntual",    desc: "El pago se libera al completar el servicio. A tu cuenta, en 48 horas." },
];

const PERKS = [
  "Sé tu propio jefe",
  "18% de comisión, sin cuota mensual",
  "Tu precio, tus reglas",
  "Sin exclusividad",
];

const MINI_CHART = [0.35, 0.5, 0.45, 0.65, 0.7, 0.85, 1.0];

const PREVIEW_BOOKINGS = [
  { name: "Sesión fotográfica", price: "$200", date: "Sáb 24 mayo", color: "#14B8A6" },
  { name: "DJ — Evento corp.",  price: "$400", date: "Vie 30 mayo", color: "#A855F7" },
];

const PROFILE_SERVICES = [
  { name: "Sesión de retratos",  price: "$150" },
  { name: "Cobertura de boda",   price: "$400" },
];

const PROFILE_TAGS = ["Bodas", "Eventos", "Retratos", "Corporativo"];

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3001";
  const hostname = host.split(":")[0];
  const CLIENT_APP_URL = process.env.NEXT_PUBLIC_CLIENT_URL || `http://${hostname}:3000`;

  return (
    <>
      <div
        className="flex min-h-[100dvh] flex-col"
        style={{ background: "#080808", color: "#fafafa", fontFamily: "var(--font-geist-sans)" }}
      >
        {/* Ambient glows */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div style={{
            position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
            width: "120%", height: "60%",
            background: "radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.10) 0%, transparent 65%)",
          }} />
          <div style={{
            position: "absolute", bottom: "10%", left: "-10%", width: "50%", height: "50%",
            background: "radial-gradient(ellipse, rgba(168,85,247,0.04) 0%, transparent 60%)",
          }} />
        </div>

        {/* Navbar */}
        <nav
          className="relative z-20 flex items-center justify-between px-6 md:px-12 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
        >
          <Image src="/logo-white.png" alt="Piums for Artists" width={100} height={30} className="h-7 w-auto" priority />
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-sm font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>
              Iniciar sesión
            </Link>
            <Link
              href="/register/artist"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
              style={{ background: "#FF6B35" }}
            >
              Empezar gratis
            </Link>
          </div>
        </nav>

        <main className="relative z-10 flex flex-1 flex-col items-center overflow-hidden">
          <RevealObserver />

          {/* ── Hero ──────────────────────────────────────────────── */}
          <HeroPiums
            badge="Para artistas creativos de Guatemala"
            headline={
              <>
                Tu talento.
                <br />
                <span style={{
                  background: "linear-gradient(90deg, #FF6B35 0%, #F59E0B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  Tu negocio.
                </span>
              </>
            }
            subtitle="Gestiona reservas, cobra en USD y crece tu negocio creativo en Guatemala. 18% de comisión, sin cuota mensual."
            ctaPrimary={{ label: "Crear mi perfil gratis", href: "/register/artist" }}
            ctaSecondary={{ label: "Ya tengo cuenta", href: "/login" }}
            perks={PERKS}
          />

          {/* ── Earnings dashboard preview ────────────────────────── */}
          <div className="w-full max-w-sm mx-auto px-6 mt-10 mb-12 reveal">
            <div className="rounded-2xl p-5 overflow-hidden" style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Ingresos este mes</p>
                  <p className="text-3xl font-bold tracking-tight">
                    $840
                    <span className="text-base font-normal ml-1" style={{ color: "rgba(255,255,255,0.35)" }}>USD</span>
                  </p>
                </div>
                <span
                  className="text-xs rounded-full px-2.5 py-1 font-medium flex items-center gap-1"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#10B981" }}
                >
                  <TrendingUp className="h-3 w-3" />
                  +18%
                </span>
              </div>

              <div className="flex items-end gap-0.5 h-12 mb-4">
                {MINI_CHART.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm"
                    style={{
                      height: `${h * 100}%`,
                      background: i === MINI_CHART.length - 1
                        ? "#FF6B35"
                        : `rgba(255,107,53,${0.12 + h * 0.18})`,
                    }}
                  />
                ))}
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 }} />

              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.28)" }}>Próximas reservas</p>
              <div className="space-y-1.5">
                {PREVIEW_BOOKINGS.map((b) => (
                  <div key={b.name} className="flex items-center gap-2.5 py-2 px-3 rounded-xl" style={{ background: "#1a1a1a" }}>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: b.color }} />
                    <span className="text-xs flex-1" style={{ color: "rgba(255,255,255,0.75)" }}>{b.name}</span>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold" style={{ color: "#FF6B35" }}>{b.price}</p>
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>{b.date}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 14, paddingTop: 12 }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Completadas este mes</span>
                  <div className="flex items-center gap-1.5">
                    <BarChart3 className="h-3 w-3" style={{ color: "rgba(255,107,53,0.5)" }} />
                    <span className="text-xs font-semibold" style={{ color: "#FF6B35" }}>6 servicios</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
              Datos de ejemplo de un artista real en Piums
            </p>
          </div>

          {/* ── Marquee ───────────────────────────────────────────── */}
          <div
            className="w-full overflow-hidden py-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="animate-marquee gap-3">
              {DISCIPLINES_MARQUEE.map((d, i) => (
                <span
                  key={i}
                  className="shrink-0 rounded-full px-4 py-1.5 text-xs font-medium mr-3"
                  style={{ border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.02)" }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* ── Stats ─────────────────────────────────────────────── */}
          <div className="w-full max-w-3xl mx-auto px-6 md:px-12 mt-24 reveal">
            <div className="grid grid-cols-3 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className="flex flex-col items-center py-9 px-4 text-center"
                  style={{ background: "#0f0f0f", borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
                >
                  <span className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "#FF6B35" }}>{s.value}</span>
                  <span className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{s.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
              3x el salario promedio guatemalteco
            </p>
          </div>

          {/* ── Manifesto band ────────────────────────────────────── */}
          <div className="w-full max-w-2xl mx-auto px-6 md:px-12 mt-28 text-center reveal">
            <p className="text-3xl md:text-4xl font-bold leading-tight mb-3" style={{ letterSpacing: "-0.025em" }}>
              No eres un freelancer.
            </p>
            <p
              className="text-3xl md:text-4xl font-bold leading-tight mb-6"
              style={{
                letterSpacing: "-0.025em",
                background: "linear-gradient(90deg, #FF6B35 0%, #F59E0B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Eres un negocio.
            </p>
            <p className="text-sm leading-relaxed max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.35)" }}>
              Herramientas que otros pagan miles. Gratis para artistas guatemaltecos en Piums.
            </p>
          </div>

          {/* ── Features 2×2 ──────────────────────────────────────── */}
          <div className="w-full max-w-3xl mx-auto px-6 md:px-12 mt-20">
            <div className="text-center mb-14 reveal">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
                Tu negocio, a tu medida
              </h2>
              <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                Enfócate en crear. Piums maneja lo demás.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {FEATURES.map(({ Icon, title, desc, color }, i) => (
                <div
                  key={title}
                  className={`rounded-2xl p-6 flex flex-col gap-3 reveal reveal-d${i + 1}`}
                  style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Tu perfil público — Squarespace-style split section ── */}
          <div className="w-full max-w-5xl mx-auto px-6 md:px-12 mt-32">
            <div className="flex flex-col lg:flex-row gap-14 lg:gap-20 lg:items-center">

              {/* Left: text */}
              <div className="flex-1 flex flex-col reveal">
                <p
                  className="text-xs font-medium uppercase mb-4"
                  style={{ color: "#FF6B35", letterSpacing: "0.08em" }}
                >
                  Tu vitrina pública
                </p>
                <h2 className="text-2xl md:text-3xl font-bold mb-5" style={{ letterSpacing: "-0.02em" }}>
                  Tu perfil trabaja
                  <br />
                  mientras tú creas
                </h2>
                <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Cada cliente que te busca ve tu portafolio, servicios y reseñas
                  en tiempo real. Tu perfil es tu negocio, abierto 24/7.
                </p>
                <div className="flex flex-col gap-3.5">
                  {[
                    "Badge de artista verificado visible",
                    "Portafolio con tus mejores trabajos",
                    "Servicios con precios definidos por ti",
                    "Reseñas reales de clientes satisfechos",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FF6B35" }} />
                      <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{item}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/register/artist"
                  className="mt-10 self-start inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#FF6B35" }}
                >
                  Crear mi perfil
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {/* Right: mock profile card */}
              <div className="lg:w-[280px] shrink-0 reveal reveal-d2">
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "#0f0f0f", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {/* Cover */}
                  <div className="h-24 relative" style={{ background: "linear-gradient(135deg, #134E4A 0%, #0F766E 100%)" }}>
                    <div
                      className="absolute -bottom-5 left-4 flex items-center justify-center rounded-full text-sm font-bold"
                      style={{ width: 44, height: 44, background: "#0f0f0f", border: "2px solid #14B8A6", color: "#14B8A6" }}
                    >
                      CM
                    </div>
                    <div
                      className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium"
                      style={{ background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.8)" }}
                    >
                      <span style={{ color: "#10B981" }}>●</span> Verificado
                    </div>
                  </div>

                  <div className="px-4 pt-8 pb-4">
                    <p className="font-semibold text-sm">Carlos Martínez</p>
                    <div className="flex items-center gap-1.5 mt-0.5 mb-1">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Fotógrafo · Guatemala</span>
                    </div>
                    <div className="flex items-center gap-1 mb-4">
                      <span className="text-xs font-medium" style={{ color: "#F59E0B" }}>★★★★★</span>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.32)" }}>4.9 · 47 reseñas</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {PROFILE_TAGS.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs rounded-full px-2.5 py-0.5"
                          style={{ border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.38)" }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Services */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12, marginBottom: 14 }}>
                      {PROFILE_SERVICES.map((s) => (
                        <div key={s.name} className="flex items-center justify-between py-1.5">
                          <span className="text-xs" style={{ color: "rgba(255,255,255,0.62)" }}>{s.name}</span>
                          <span className="text-xs font-semibold" style={{ color: "#FF6B35" }}>{s.price}</span>
                        </div>
                      ))}
                    </div>

                    <div
                      className="w-full text-center py-2.5 rounded-xl text-xs font-semibold text-white"
                      style={{ background: "#FF6B35" }}
                    >
                      Reservar ahora
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
                  Así ve tu perfil un cliente potencial
                </p>
              </div>
            </div>
          </div>

          {/* ── Potencial de ingresos ─────────────────────────────── */}
          <div className="w-full max-w-3xl mx-auto px-6 md:px-12 mt-20 reveal">
            <div
              className="rounded-2xl p-8 relative overflow-hidden"
              style={{ background: "#0f0f0f", border: "1px solid rgba(255,107,53,0.12)" }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 0% 50%, rgba(255,107,53,0.06) 0%, transparent 60%)" }}
              />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 justify-between">
                <div>
                  <p className="text-xs mb-2 uppercase" style={{ color: "rgba(255,107,53,0.7)", letterSpacing: "0.08em" }}>
                    Potencial de ingresos
                  </p>
                  <p className="text-base" style={{ color: "rgba(255,255,255,0.55)" }}>
                    Si cobras{" "}
                    <span className="font-semibold" style={{ color: "#fafafa" }}>$200 por servicio</span>
                    {" "}y recibes{" "}
                    <span className="font-semibold" style={{ color: "#fafafa" }}>5 reservas al mes</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-4xl font-bold tracking-tight" style={{ color: "#FF6B35" }}>$1,000</p>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>USD / mes</p>
                  <p className="text-xs mt-2 font-medium" style={{ color: "rgba(255,107,53,0.55)" }}>
                    3× el salario promedio en Guatemala
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── Testimonial ───────────────────────────────────────── */}
          <div className="w-full max-w-2xl mx-auto px-6 md:px-12 mt-20 reveal">
            <div
              className="rounded-2xl p-8 md:p-10 relative overflow-hidden"
              style={{ background: "#0f0f0f", border: "1px solid rgba(255,107,53,0.1)" }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 0% 0%, rgba(255,107,53,0.04) 0%, transparent 55%)" }}
              />
              <p
                className="absolute top-5 left-7 text-7xl font-serif leading-none select-none"
                style={{ color: "rgba(255,107,53,0.1)", lineHeight: 1 }}
                aria-hidden="true"
              >
                &ldquo;
              </p>
              <div className="relative pt-8">
                <p className="text-base md:text-lg leading-relaxed mb-7" style={{ color: "rgba(255,255,255,0.72)" }}>
                  Antes hacía cotizaciones por WhatsApp y esperaba semanas. Ahora el 70% de mis clientes llegan solos y cobro el doble.
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-full text-sm font-bold shrink-0"
                    style={{ width: 40, height: 40, background: "linear-gradient(135deg, #134E4A 0%, #0F766E 100%)", color: "#14B8A6", border: "1.5px solid rgba(20,184,166,0.3)" }}
                  >
                    MG
                  </div>
                  <div>
                    <p className="text-sm font-semibold">María García</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.38)" }}>Fotógrafa · Ciudad de Guatemala · desde 2024</span>
                    </div>
                  </div>
                  <div className="ml-auto shrink-0 flex items-center gap-1">
                    <span className="text-xs font-medium" style={{ color: "#F59E0B" }}>★ 4.9</span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>· 34 reseñas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Cómo funciona — vertical timeline ─────────────────── */}
          <div className="w-full max-w-2xl mx-auto px-6 md:px-12 mt-32">
            <div className="text-center mb-16 reveal">
              <h2 className="text-2xl md:text-3xl font-bold" style={{ letterSpacing: "-0.02em" }}>
                Tu negocio, en 3 pasos
              </h2>
            </div>
            <div className="relative">
              <div
                className="hidden sm:block absolute"
                style={{
                  left: 19, top: 44,
                  width: 1, height: "calc(100% - 88px)",
                  background: "linear-gradient(to bottom, rgba(255,107,53,0.35), rgba(255,107,53,0.03))",
                }}
              />
              <div className="flex flex-col gap-11">
                {STEPS.map((s, i) => (
                  <div key={s.num} className={`flex gap-6 items-start reveal reveal-d${i + 1}`}>
                    <div
                      className="flex items-center justify-center rounded-full shrink-0 font-bold text-sm z-10"
                      style={{
                        width: 40, height: 40,
                        background: i === 0 ? "#FF6B35" : "#111",
                        border: `1px solid ${i === 0 ? "transparent" : "rgba(255,107,53,0.25)"}`,
                        color: i === 0 ? "white" : "#FF6B35",
                      }}
                    >
                      {s.num}
                    </div>
                    <div className="pt-2.5">
                      <h3 className="font-semibold text-base mb-1.5">{s.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── CTA ───────────────────────────────────────────────── */}
          <div className="w-full max-w-4xl mx-auto px-6 md:px-12 mt-24 mb-20 reveal">
            <div
              className="rounded-3xl p-14 md:p-20 flex flex-col items-center text-center relative overflow-hidden"
              style={{ background: "#0f0f0f", border: "1px solid rgba(255,107,53,0.15)" }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(ellipse at 50% -20%, rgba(255,107,53,0.12) 0%, transparent 60%)" }}
              />
              <h2 className="relative text-2xl md:text-4xl font-bold mb-4" style={{ letterSpacing: "-0.02em" }}>
                ¿Listo para crecer?
              </h2>
              <p className="relative text-sm mb-9 max-w-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Únete a los artistas guatemaltecos que ya gestionan su negocio con Piums.
              </p>
              <Link
                href="/register/artist"
                className="relative inline-flex items-center gap-2 rounded-full px-9 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "#FF6B35", boxShadow: "0 0 48px rgba(255,107,53,0.35)" }}
              >
                Crear mi perfil gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>

      </div>
      <PiumsCinematicFooter
        heading="¿Listo para crecer tu negocio creativo?"
        ctaPrimary={{ label: "Crear mi perfil gratis", href: "/register/artist" }}
        ctaSecondary={{ label: "Ya tengo cuenta", href: "/login" }}
        appIosHref={process.env.NEXT_PUBLIC_ARTIST_APP_IOS || "#"}
        appAndroidHref={process.env.NEXT_PUBLIC_ARTIST_APP_ANDROID || "#"}
        crosslinkHref={CLIENT_APP_URL}
        crosslinkLabel="Buscar artistas en Piums"
      />
    </>
  );
}
