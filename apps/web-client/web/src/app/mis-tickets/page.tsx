'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { sdk, TicketPurchase } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

const TicketIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDIENTE:   { label: 'Pendiente',   className: 'bg-yellow-100 text-yellow-700' },
  PAGADO:      { label: 'Pagado',      className: 'bg-green-100 text-green-700' },
  USADO:       { label: 'Usado',       className: 'bg-gray-100 text-gray-500' },
  REEMBOLSADO: { label: 'Reembolsado', className: 'bg-blue-100 text-blue-600' },
  EXPIRADO:    { label: 'Expirado',    className: 'bg-red-100 text-red-500' },
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('es-CR', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function QRDisplay({ code }: { code: string }) {
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    import('qrcode').then(({ default: QRCode }) => {
      QRCode.toDataURL(code, { width: 140, margin: 1 }).then(setQrUrl).catch(() => {});
    });
  }, [code]);

  if (!qrUrl) return <div className="w-32 h-32 bg-gray-100 animate-pulse rounded" />;
  return <img src={qrUrl} alt="QR" className="w-32 h-32" />;
}

function TicketCard({ purchase }: { purchase: TicketPurchase }) {
  const [showQr, setShowQr] = useState(false);
  const status = STATUS_LABELS[purchase.status] ?? { label: purchase.status, className: 'bg-gray-100 text-gray-600' };
  const isPaid = purchase.status === 'PAGADO' || purchase.status === 'USADO';

  const eventName = (purchase.ticketEvent as any)?.name || 'Evento';
  const eventDate = (purchase.ticketEvent as any)?.eventDate;
  const venue = (purchase.ticketEvent as any)?.venue;
  const tierName = (purchase.tier as any)?.name || '';

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight">{eventName}</h3>
          {venue && <p className="text-xs text-gray-500 mt-0.5">{venue}</p>}
          {eventDate && <p className="text-xs text-gray-400 mt-0.5">{formatDate(eventDate)}</p>}
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="text-xs text-gray-500 space-y-0.5 mb-3">
        {tierName && <div>Tipo: <span className="text-gray-700">{tierName}</span></div>}
        <div>Cantidad: <span className="text-gray-700">{purchase.quantity}</span></div>
        <div>Total: <span className="text-gray-700 font-medium">{purchase.totalCents === 0 ? 'Gratis' : `$${(purchase.totalCents / 100).toFixed(2)}`}</span></div>
        <div className="font-mono">Codigo: <span className="text-gray-900">{purchase.code}</span></div>
      </div>

      {isPaid && (
        <div>
          <button
            onClick={() => setShowQr(v => !v)}
            className="text-xs text-indigo-600 hover:underline"
          >
            {showQr ? 'Ocultar QR' : 'Mostrar QR'}
          </button>
          {showQr && (
            <div className="mt-3 flex flex-col items-center">
              <QRDisplay code={purchase.code} />
              <p className="text-xs font-mono text-gray-400 mt-1">{purchase.code}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MisTicketsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [purchases, setPurchases] = useState<TicketPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/mis-tickets');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (sdk as any).getMyTicketPurchases()
      .then((res: TicketPurchase[]) => setPurchases(res))
      .catch(() => setPurchases([]))
      .finally(() => setLoading(false));
  }, [user]);

  const upcoming = purchases.filter(p => p.status === 'PAGADO');
  const past = purchases.filter(p => p.status !== 'PAGADO');

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <TicketIcon />
          <h1 className="text-2xl font-bold text-gray-900">Mis Boletos</h1>
        </div>

        {purchases.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="flex justify-center mb-3"><TicketIcon /></div>
            <p className="text-lg">No tienes boletos aun</p>
            <Link href="/tickets" className="mt-3 inline-block text-sm text-indigo-600 hover:underline">
              Explorar eventos
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section className="mb-8">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Proximos</h2>
                <div className="space-y-3">
                  {upcoming.map(p => <TicketCard key={p.id} purchase={p} />)}
                </div>
              </section>
            )}
            {past.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Historial</h2>
                <div className="space-y-3">
                  {past.map(p => <TicketCard key={p.id} purchase={p} />)}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
