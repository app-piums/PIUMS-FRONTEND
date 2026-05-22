import Image from "next/image";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import {
  Camera, Music, Disc3, Palette, Video, Sparkles,
  ShieldCheck, DollarSign, Clock, ArrowRight, Check,
} from "lucide-react";

const ARTIST_APP_URL = process.env.NEXT_PUBLIC_ARTIST_URL || "http://127.0.0.1:3001";

const CATEGORIES = [
  {
    Icon: Camera,
    name: "Fotografía",
    desc: "Bodas, eventos, retratos",
    href: "/artists?category=FOTOGRAFIA",
  },
  {
    Icon: Music,
    name: "Música",
    desc: "Bandas, cantantes, tríos",
    href: "/artists?category=MUSICA",
  },
  {
    Icon: Disc3,
    name: "DJ",
    desc: "Fiestas, bodas, corporativos",
    href: "/artists?category=DJ",
  },
  {
    Icon: Palette,
    name: "Diseño gráfico",
    desc: "Branding, identidad visual",
    href: "/artists?category=DISENO_GRAFICO",
  },
  {
    Icon: Video,
    name: "Video",
    desc: "Bodas, publicidad, docs",
    href: "/artists?category=VIDEO",
  },
  {
    Icon: Sparkles,
    name: "Arte & Performance",
    desc: "Performers, pintores, escénicas",
    href: "/artists?category=ARTE_PERFORMANCE",
  },
];

const MARQUEE_TAGS = [
  "Fotografía", "Música en vivo", "DJ Set", "Branding", "Video bodas",
  "Retrato", "Performance", "Ilustración", "Animación", "Diseño web",
  "Fotografía", "Música en vivo", "DJ Set", "Branding", "Video bodas",
  "Retrato", "Performance", "Ilustración", "Animación", "Diseño web",
];

const TRUST = [
  {
    Icon: ShieldCheck,
    title: "Artistas verificados",
    desc: "Cada perfil es revisado antes de publicarse. Sin perfiles falsos.",
  },
  {
    Icon: DollarSign,
    title: "Pagos seguros en USD",
    desc: "Tu dinero queda protegido hasta que el artista entregue el servicio.",
  },
  {
    Icon: Clock,
    title: "Reserva en minutos",
    desc: "Elige, agenda y paga. Todo desde la plataforma, sin llamadas.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Explora artistas",
    desc: "Filtra por categoría, ciudad y precio. Ve portafolios reales antes de decidir.",
  },
  {
    num: "02",
    title: "Reserva con un clic",
    desc: "Elige fecha y servicio. El pago en USD queda protegido hasta que confirmen.",
  },
  {
    num: "03",
    title: "Disfruta el resultado",
    desc: "El artista se presenta, entrega su trabajo y tú dejas una reseña.",
  },
];

const PERKS = [
  "Sin comisiones ocultas",
  "Artistas verificados",
  "Soporte en español",
  "Reembolso garantizado",
];

export default function Home() {
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
            alt="Piums"
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
              href="/register"
              className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#FF6B35" }}
            >
              Registrarse gratis
            </Link>
          </div>
        </nav>

        <main className="relative flex flex-1 flex-col items-center overflow-hidden">
          {/* Hero radial glow */}
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-full max-w-[1000px]"
            style={{
              background:
                "radial-gradient(ellipse at 50% -5%, rgba(255,107,53,0.12) 0%, transparent 65%)",
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
              Economía Naranja — Guatemala
            </div>

            <h1
              className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.04]"
              style={{ letterSpacing: "-0.03em" }}
            >
              El talento creativo
              <br />
              de Guatemala,
              <br />
              <span style={{ color: "#FF6B35" }}>a tu alcance</span>
            </h1>

            <p
              className="mt-7 max-w-md text-base md:text-lg leading-relaxed"
              style={{ color: "rgba(255,255,255,0.42)" }}
            >
              Contrata artistas verificados para tu boda, evento, empresa
              o proyecto personal. Todo en USD, todo con garantía.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                href="/artists"
                className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background: "#FF6B35",
                  boxShadow: "0 0 32px rgba(255,107,53,0.32)",
                }}
              >
                Explorar artistas
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-semibold transition-all hover:border-white/20"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                Crear cuenta gratis
              </Link>
            </div>

            {/* Perks */}
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
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="animate-marquee gap-3">
              {MARQUEE_TAGS.map((tag, i) => (
                <span
                  key={i}
                  className="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium mr-3"
                  style={{
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.38)",
                    background: "rgba(255,255,255,0.025)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div className="relative z-10 mt-24 w-full max-w-4xl px-6 mx-auto">
            <div className="text-center mb-12">
              <h2
                className="text-2xl md:text-3xl font-bold"
                style={{ letterSpacing: "-0.02em" }}
              >
                Explora por categoría
              </h2>
              <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                Encuentra el artista perfecto para cada ocasión
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map(({ Icon, name, desc, href }) => (
                <Link
                  key={name}
                  href={href}
                  className="group flex flex-col gap-4 rounded-2xl p-5 transition-all"
                  style={{
                    background: "#111",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-xl transition-colors"
                    style={{ background: "rgba(255,107,53,0.1)" }}
                  >
                    <Icon className="h-5 w-5" style={{ color: "#FF6B35" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-6 flex justify-center">
              <Link
                href="/artists"
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition-all hover:border-white/20"
                style={{
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                Ver todos los artistas
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Trust */}
          <div className="relative z-10 mt-24 w-full max-w-3xl px-6 mx-auto">
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-2xl overflow-hidden"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {TRUST.map(({ Icon, title, desc }, i) => (
                <div
                  key={title}
                  className="flex flex-col gap-3 p-7"
                  style={{
                    background: "#111",
                    borderRight:
                      i < TRUST.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}
                >
                  <Icon className="h-5 w-5" style={{ color: "#FF6B35" }} />
                  <p className="font-semibold text-sm">{title}</p>
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
                De la idea al resultado en 3 pasos
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
              {STEPS.map((s) => (
                <div key={s.num} className="flex flex-col gap-3">
                  <span
                    className="font-mono text-5xl font-bold"
                    style={{
                      color: "rgba(255,107,53,0.2)",
                      fontFamily: "var(--font-geist-mono)",
                    }}
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
              className="rounded-2xl p-12 flex flex-col sm:flex-row items-center justify-between gap-8 relative overflow-hidden"
              style={{ background: "#111", border: "1px solid rgba(255,107,53,0.18)" }}
            >
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 0%, rgba(255,107,53,0.07) 0%, transparent 65%)",
                }}
              />
              <div className="relative">
                <h2
                  className="text-xl md:text-2xl font-bold"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  ¿Listo para tu primer proyecto?
                </h2>
                <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Crea tu cuenta y reserva tu primer artista hoy.
                </p>
              </div>
              <Link
                href="/register"
                className="relative shrink-0 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{
                  background: "#FF6B35",
                  boxShadow: "0 0 32px rgba(255,107,53,0.32)",
                }}
              >
                Empezar ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </main>

        {/* Artist crosslink */}
        <div
          className="px-6 md:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.05)",
            background: "#080808",
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.28)" }}>
            ¿Eres artista? Ofrece tus servicios en Piums
          </span>
          <a
            href={`${ARTIST_APP_URL}/register/artist`}
            className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium transition-all hover:border-white/20"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.45)",
            }}
          >
            Ir a Piums for Artists
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
      <Footer />
    </>
  );
}
