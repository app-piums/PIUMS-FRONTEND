"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SmokeyBackground } from "@/components/ui/smokey-background";

type Step = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>('form');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStep('sent');
    } catch {
      setError("No se pudo enviar el correo. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative w-screen h-screen bg-gray-950 overflow-hidden">
      <SmokeyBackground color="#FF6B35" backdropBlurAmount="sm" />

      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-sm my-auto">
          <div className="p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl">

            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Image src="/logo-white.png" alt="PIUMS" width={48} height={48} className="h-12 w-auto" priority unoptimized />
              </div>
            </div>

            {step === 'form' ? (
              <>
                <div>
                  <h1 className="text-2xl font-bold text-white">¿Olvidaste tu contraseña?</h1>
                  <p className="mt-1 text-sm text-white/60">
                    Ingresa tu correo y te enviaremos un enlace de recuperación.
                  </p>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-xl bg-red-500/20 border border-red-400/30 px-4 py-3">
                    <svg className="h-4 w-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="relative z-0">
                    <input
                      type="email"
                      id="fp_email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder=" "
                      className="peer block py-2.5 px-0 w-full text-sm text-white bg-transparent border-0 border-b-2 border-white/40 appearance-none focus:outline-none focus:ring-0 focus:border-[#FF6B35] transition-colors"
                    />
                    <label
                      htmlFor="fp_email"
                      className="absolute text-sm text-white/60 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6 peer-focus:text-[#FF6B35]"
                    >
                      Correo electrónico
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#FF6B35] hover:bg-[#e05e00] rounded-xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/50 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.99]"
                  >
                    {loading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Enviando...
                      </>
                    ) : "Enviar enlace de recuperación"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
                  <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold text-white">Revisa tu correo</h1>
                <p className="mt-2 text-sm text-white/60">
                  Si <span className="font-medium text-white/80">{email}</span> está registrado,
                  recibirás un enlace para restablecer tu contraseña.
                </p>
                <p className="mt-3 text-xs text-white/30">¿No lo ves? Revisa tu carpeta de spam.</p>
              </div>
            )}

            <div className="text-center pt-1">
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al inicio de sesión
              </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
