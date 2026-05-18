'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { sdk, TicketPurchase } from '@piums/sdk';
import Link from 'next/link';

type CheckInResult = { success: true; purchase: TicketPurchase } | { success: false; error: string };

function formatTime(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
}

export default function CheckInPage() {
  const params = useParams();
  const eventId = params['id'] as string;

  const [eventName, setEventName] = useState('');
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [attendance, setAttendance] = useState<{ paid: number; checkedIn: number } | null>(null);

  useEffect(() => {
    (sdk as any).getTicketEvent(eventId).then((e: any) => setEventName(e.name)).catch(() => {});
    refreshAttendance();
  }, [eventId]);

  async function refreshAttendance() {
    try {
      const att = await (sdk as any).getEventAttendance(eventId);
      setAttendance(att);
    } catch {
      // non-critical
    }
  }

  async function handleValidate(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setValidating(true);
    setResult(null);
    try {
      const purchase = await (sdk as any).checkInTicket(eventId, code.trim().toUpperCase()) as TicketPurchase;
      setResult({ success: true, purchase });
      setCode('');
      refreshAttendance();
    } catch (err: any) {
      let msg = err.message || 'Error al validar';
      try { msg = JSON.parse(msg).error || msg; } catch { /* */ }
      setResult({ success: false, error: msg });
    } finally {
      setValidating(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-lg mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link href="/artist/dashboard/eventos" className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Check-in</h1>
              {eventName && <p className="text-sm text-gray-500">{eventName}</p>}
            </div>
          </div>

          {/* Attendance counter */}
          {attendance && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-gray-900">{attendance.paid}</p>
                <p className="text-xs text-gray-500 mt-0.5">Boletos vendidos</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-indigo-600">{attendance.checkedIn}</p>
                <p className="text-xs text-gray-500 mt-0.5">Asistentes</p>
              </div>
            </div>
          )}

          {/* Scan form */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
            <form onSubmit={handleValidate} className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setResult(null); }}
                placeholder="TKT-2026-000001"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-3 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-widest"
                autoFocus
              />
              <button
                type="submit"
                disabled={validating || !code.trim()}
                className="px-4 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {validating ? '...' : 'Validar'}
              </button>
            </form>
          </div>

          {/* Result */}
          {result && (
            <div className={`rounded-xl p-5 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="font-semibold text-green-800">Boleto valido</span>
                  </div>
                  <div className="space-y-1 text-sm text-green-700">
                    <div><span className="font-medium">Nombre:</span> {result.purchase.buyerName}</div>
                    {(result.purchase.tier as any)?.name && (
                      <div><span className="font-medium">Tipo:</span> {(result.purchase.tier as any).name}</div>
                    )}
                    <div><span className="font-medium">Cantidad:</span> {result.purchase.quantity}</div>
                    <div><span className="font-medium">Codigo:</span> <span className="font-mono">{result.purchase.code}</span></div>
                    {result.purchase.checkedInAt && (
                      <div><span className="font-medium">Hora entrada:</span> {formatTime(result.purchase.checkedInAt)}</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </div>
                  <span className="font-semibold text-red-700">{result.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
