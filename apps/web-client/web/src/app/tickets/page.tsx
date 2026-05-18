'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { sdk, TicketEvent } from '@piums/sdk';

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
);

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CR', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });
}

function minPrice(event: TicketEvent): number {
  if (!event.tiers || event.tiers.length === 0) return 0;
  return Math.min(...event.tiers.map(t => t.priceCents));
}

function EventCard({ event }: { event: TicketEvent }) {
  const price = minPrice(event);
  return (
    <Link href={`/tickets/${event.id}`} className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-44 bg-gray-100 overflow-hidden">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <TicketIcon />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-base leading-tight line-clamp-2 mb-2">{event.name}</h3>
        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-1">
          <CalendarIcon />
          <span>{formatDate(event.eventDate)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-3">
          <MapPinIcon />
          <span className="truncate">{event.venue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {price === 0 ? 'Gratis' : `Desde $${(price / 100).toFixed(2)}`}
          </span>
          <span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
            Ver boletos
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function TicketsPage() {
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const LIMIT = 12;

  useEffect(() => {
    setLoading(true);
    (sdk as any).listTicketEvents({ page, limit: LIMIT })
      .then((res: any) => {
        setEvents(res.events || []);
        setTotal(res.total || 0);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-500 mt-1">Descubre conciertos, fiestas y festivales cerca de ti</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <TicketIcon />
            <p className="mt-3 text-lg">No hay eventos disponibles por el momento</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {events.map(event => <EventCard key={event.id} event={event} />)}
            </div>
            {total > LIMIT && (
              <div className="flex justify-center items-center gap-3 mt-10">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-500">Pagina {page} de {Math.ceil(total / LIMIT)}</span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(total / LIMIT)}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 disabled:opacity-40 hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
