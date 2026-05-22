import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { headers } from "next/headers";
import { Calendar, Users, DollarSign, ArrowRight, Check } from "lucide-react";

const DISCIPLINES_MARQUEE = [
  "Músico", "Fotógrafo", "DJ", "Diseñador gráfico", "Videógrafo",
  "Maquillador", "Tatuador", "Performer", "Ilustrador", "Animador",
  "Músico", "Fotógrafo", "DJ", "Diseñador gráfico", "Videógrafo",
  "Maquillador", "Tatuador", "Performer", "Ilustrador", "Animador",
];

const STATS = [
  { value: "500+", label: "Artistas activos" },
  { value: "2,400+", label: "Reservas completadas" },
  { value: "$280", label: "Ingreso promedio USD" },
];

const FEATURES = [
  {
    Icon: Calendar,
    title: "Agenda propia",
    desc: "Controla tu disponibilidad, acepta o rechaza reservas. Tu tiempo, tus reglas.",
  },
  {
    Icon: Users,
    title: "Clientes que te buscan",
    desc: "Tu perfil aparece en búsquedas reales. Los clientes llegan a ti.",
  },
  {
    Icon: DollarSign,
    title: "Cobra en USD",
    desc: "Pagos seguros y directos al completar cada servicio. Sin intermediarios.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Crea tu perfil",
    desc: "Sube tu portafolio, define servicios y precios. Listo en minutos, sin costo de entrada.",
  },
  {
    num: "02",
    title: "Recibe reservas",
    desc: "Los clientes te descubren, eligen fecha y pagan. Tú solo confirmas.",
  },
  {
    num: "03",
    title: "Cobra puntual",
    desc: "El pago se libera al completar el servicio. En USD, sin sorpresas.",
  },
];

const PERKS = [
  "Sin contrato de exclusividad",
  "Perfil público desde el primer día",
  "Pagos en USD protegidos",
  "Soporte en español",
];

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3001";
  const hostname = host.split(":")[0];
  const CLIENT_APP_URL = process.env.NEXT_PUBLIC_CLIENT_URL || `http://${hostname}:3000`;

  return (
    <>
      <div
        className="flex min-h-[100dvh] flex-col"
        style={{ background: "#0a0a0a", color: "#fafafa", fontFamily: "var(--font-geist-sans)" }}
      >
        {/* Navbar */}
        <nav
          className="relative z-20 flex items-center justify-between px-6 md:px-10 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Image
            src="/logo-white.png"
            alt="Piums for Artists"
            width={90}
            height={28}
            className="h-7 w-auto"
            priority
          />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium transition-colors"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register/artist"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#FF6B35" }}
            >
              Empezar gratis
            </Link>
          </div>
        </nav>

        <main className="relative flex flex-1 flex-col items-center overflow-hidden">
          {/* Hero radial glow */}
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-full max-w-[1000px]"
            style={{
              background:
                "radial-gradient(ellipse at 50% -10%, rgba(255,107,53,0.14) 0%, transparent 65%)",
            }}
          />

          {/* Hero */}
          <section className="relative z-10 flex flex-col items-center px-6 pt-20 pb-14 text-center max-w-4xl w-full">
            <div
              className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide"
              style={{
                borderColor: "rgba(255,107,53,0.25)",
                background: "rgba(255,107,53,0.07)",
                color: "#FF6B35",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ background: "#FF6B35" }}
              />
              Para artistas creativos de Guatemala
            </div>

            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.04]"
              style={{ letterSpacing: "-0.03em" }}
            >
              Tu talento.
              <br />
              <span style={{ color: "#FF6B35" }}>Tu precio.</span>
              <br />
              Tu agenda.
            </h1>

            <p
              className="mt-7 max-w-md text-base md:text-lg leading-relaxed"
              style={{ color: "rgba(255,255,255,0.42)" }}
            >
              La plataforma donde músicos, fotógrafos, DJs y diseñadores
              de Guatemala gestionan reservas y cobran en USD.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/register/artist"
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background: "#FF6B35",
                  boxShadow: "0 0 32px rgba(255,107,53,0.32)",
                }}
              >
                Crear mi perfil — gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold transition-all hover:border-white/20"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                Ya tengo cuenta
              </Link>
            </div>

            {/* Perks row */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {PERKS.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 text-xs"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  <Check className="h-3 w-3 shrink-0" style={{ color: "#FF6B35" }} />
                  {p}
                </span>
              ))}
            </div>
          </section>

          {/* Marquee */}
          <div
            className="relative z-10 w-full overflow-hidden py-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div className="animate-marquee gap-3">
              {DISCIPLINES_MARQUEE.map((d, i) => (
                <span
                  key={i}
                  className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium mr-3"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.38)",
                    background: "rgba(255,255,255,0.025)",
                  }}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 w-full max-w-2xl px-6 mx-auto mt-20">
            <div
              className="grid grid-cols-3 rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className="flex flex-col items-center py-8 px-4 text-center"
                  style={{
                    background: "#111",
                    borderRight: i < STATS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}
                >
                  <span
                    className="text-3xl md:text-4xl font-bold"
                    style={{ color: "#FF6B35" }}
                  >
                    {stat.value}
                  </span>
                  <span
                    className="mt-1.5 text-xs leading-snug"
                    style={{ color: "rgba(255,255,255,0.32)" }}
                  >
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="relative z-10 mt-24 w-full max-w-3xl px-6 mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-2xl md:text-3xl font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                Todo lo que necesitas para crecer
              </h2>
              <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                Herramientas hechas para que el artista se enfoque en crear, no en administrar
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {FEATURES.map(({ Icon, title, desc }) => (
                <div
                  key={title}
                  className="rounded-2xl p-6 transition-all"
                  style={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: "rgba(255,107,53,0.1)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#FF6B35" }} />
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div className="relative z-10 mt-24 w-full max-w-3xl px-6 mx-auto">
            <div className="text-center mb-14">
              <h2
                className="text-2xl md:text-3xl font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                Empieza en 3 pasos
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {STEPS.map((s) => (
                <div key={s.num} className="flex flex-col gap-3">
                  <span
                    className="font-mono text-5xl font-bold"
                    style={{ color: "rgba(255,107,53,0.2)", fontFamily: "var(--font-geist-mono)" }}
                  >
                    {s.num}
                  </span>
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA block */}
          <div className="relative z-10 mt-20 mb-16 w-full max-w-3xl px-6 mx-auto">
            <div
              className="rounded-2xl p-12 flex flex-col items-center gap-5 text-center relative overflow-hidden"
              style={{ background: "#111", border: "1px solid rgba(255,107,53,0.18)" }}
            >
              {/* Inner glow */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.08) 0%, transparent 65%)",
                }}
              />
              <h2
                className="relative text-2xl md:text-3xl font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                ¿Listo para crecer?
              </h2>
              <p className="relative text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                Únete a los artistas guatemaltecos que ya gestionan su negocio con Piums.
              </p>
              <Link
                href="/register/artist"
                className="relative inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background: "#FF6B35",
                  boxShadow: "0 0 32px rgba(255,107,53,0.32)",
                }}
              >
                Unirme ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>

        {/* Client crosslink */}
        <div
          className="px-6 md:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "#080808",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.28)" }}>
            ¿Buscas talento para tu próximo evento o proyecto?
          </span>
          <a
            href={CLIENT_APP_URL}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-all hover:border-white/20"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Explorar artistas en Piums
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <Footer />
    </>
  );
}
