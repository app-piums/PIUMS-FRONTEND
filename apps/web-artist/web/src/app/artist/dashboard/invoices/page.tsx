"use client";

import { useEffect, useState } from "react";
import { PageHelpButton } from '@/components/PageHelpButton';
import { DashboardSidebar } from "@/components/artist/DashboardSidebar";
import { sdk, Booking } from "@piums/sdk";
import { generateBookingReceipt } from "@/lib/generateReceipt";

type InvoiceStatus = "pagada" | "pendiente";

interface Invoice {
  id: string;
  number: string;
  client: string;
  service: string;
  amount: number;
  currency: string;
  date: string;
  rawBooking: Booking;
  status: InvoiceStatus;
}

function toInvoice(b: Booking): Invoice {
  const ps = b.paymentStatus?.toUpperCase() ?? '';
  const status: InvoiceStatus = (ps === 'PAID' || ps === 'COMPLETED') ? 'pagada' : 'pendiente';
  return {
    id: b.id,
    number: b.code ?? b.id.slice(0, 8).toUpperCase(),
    client: (b as any).clientName ?? 'Cliente',
    service: b.serviceName ?? 'Servicio',
    amount: (b.totalPrice ?? 0) / 100,
    currency: b.currency ?? 'USD',
    date: (b.scheduledDate ?? b.startAt ?? '').slice(0, 10),
    rawBooking: b,
    status,
  };
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  pagada:    { label: "Pagada",    className: "bg-green-100 text-green-700" },
  pendiente: { label: "Pendiente", className: "bg-yellow-100 text-yellow-700" },
};

const FILTER_TABS: { key: "todas" | InvoiceStatus; label: string }[] = [
  { key: "todas",    label: "Todas" },
  { key: "pagada",   label: "Pagadas" },
  { key: "pendiente", label: "Pendientes" },
];

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"todas" | InvoiceStatus>("todas");

  useEffect(() => {
    sdk
      .listBookings({ status: 'COMPLETED', limit: 100, sortBy: 'scheduledDate', sortOrder: 'desc' })
      .then(res => setInvoices((res.bookings ?? []).map(toInvoice)))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    activeFilter === "todas"
      ? invoices
      : invoices.filter(inv => inv.status === activeFilter);

  const totalAmount = filtered.reduce((acc, inv) => acc + inv.amount, 0);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar />
      <PageHelpButton tourId="artistInvoicesTour" />
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pt-20 sm:p-6 lg:p-8 lg:pt-8 max-w-5xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
              <p className="text-sm text-gray-500 mt-1">Historial de facturación de tus reservas completadas</p>
            </div>
          </div>

          {/* Summary strip */}
          {!loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {(["todas", "pagada", "pendiente"] as const).map(key => {
                const count =
                  key === "todas"
                    ? invoices.length
                    : invoices.filter(i => i.status === key).length;
                const colors: Record<string, string> = {
                  todas: "text-gray-700",
                  pagada: "text-green-600",
                  pendiente: "text-yellow-600",
                };
                const labels: Record<string, string> = {
                  todas: "Total",
                  pagada: "Pagadas",
                  pendiente: "Pendientes",
                };
                return (
                  <div key={key} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center">
                    <p className={`text-2xl font-bold ${colors[key]}`}>{count}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{labels[key]}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 mb-4 gap-1">
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`whitespace-nowrap shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeFilter === tab.key
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Invoices list */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="divide-y divide-gray-100">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 px-4 sm:px-6 py-4 animate-pulse">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                      <div className="h-4 bg-gray-100 rounded w-1/2" />
                      <div className="h-3 bg-gray-100 rounded w-1/3" />
                    </div>
                    <div className="h-5 bg-gray-100 rounded w-16 self-center" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                {invoices.length === 0
                  ? "Aun no tienes reservas completadas."
                  : `No hay facturas con estado "${activeFilter}".`}
              </div>
            ) : (
              <>
                <div className="divide-y divide-gray-100">
                  {filtered.map(inv => {
                    const statusCfg = STATUS_CONFIG[inv.status];
                    return (
                      <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 py-4">
                        {/* Left info */}
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-9 w-9 shrink-0 rounded-lg bg-orange-50 flex items-center justify-center">
                            <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-gray-400">{inv.number}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusCfg.className}`}>
                                {statusCfg.label}
                              </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">{inv.client}</p>
                            <p className="text-xs text-gray-500 truncate">{inv.service}</p>
                          </div>
                        </div>
                        {/* Right: amount + date + actions */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0 shrink-0">
                          <div className="text-right">
                            <p className="text-base font-bold text-gray-900">
                              ${inv.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-400">{inv.date}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                              title="Ver recibo"
                              onClick={() => generateBookingReceipt({
                                bookingId: inv.id,
                                bookingCode: inv.number,
                                status: inv.status === 'pagada' ? 'completed' : 'pending',
                                serviceName: inv.service,
                                artistName: inv.rawBooking.artistName ?? 'Artista',
                                clientName: inv.client,
                                scheduledDate: inv.rawBooking.scheduledDate ?? inv.rawBooking.startAt,
                                totalPrice: inv.rawBooking.totalPrice ?? 0,
                                currency: inv.currency,
                              }, 'preview')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors"
                              title="Descargar PDF"
                              onClick={() => generateBookingReceipt({
                                bookingId: inv.id,
                                bookingCode: inv.number,
                                status: inv.status === 'pagada' ? 'completed' : 'pending',
                                serviceName: inv.service,
                                artistName: inv.rawBooking.artistName ?? 'Artista',
                                clientName: inv.client,
                                scheduledDate: inv.rawBooking.scheduledDate ?? inv.rawBooking.startAt,
                                totalPrice: inv.rawBooking.totalPrice ?? 0,
                                currency: inv.currency,
                              })}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Footer total */}
                <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm text-gray-500">{filtered.length} factura{filtered.length !== 1 ? "s" : ""}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    Total: ${totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
