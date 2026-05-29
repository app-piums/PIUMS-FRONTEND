'use client';

import React, { useState, useEffect } from 'react';
import { DashboardSidebar } from '@/components/artist/DashboardSidebar';
import { toast } from '@/lib/toast';
import { sdk, TicketEvent, TicketTier, CreateTicketEventPayload, CreateTicketTierPayload, TicketEventStatus } from '@piums/sdk';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  BORRADOR:   { label: 'Borrador',   className: 'bg-gray-100 text-gray-500' },
  PUBLICADO:  { label: 'Publicado',  className: 'bg-green-100 text-green-700' },
  AGOTADO:    { label: 'Agotado',    className: 'bg-orange-100 text-orange-700' },
  CANCELADO:  { label: 'Cancelado',  className: 'bg-red-100 text-red-600' },
  FINALIZADO: { label: 'Finalizado', className: 'bg-blue-100 text-blue-600' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-CR', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ── Create/Edit event modal ────────────────────────────────────────────────────
function EventModal({ event, onClose, onSaved }: {
  event?: TicketEvent;
  onClose: () => void;
  onSaved: (e: TicketEvent) => void;
}) {
  const [form, setForm] = useState({
    name: event?.name || '',
    description: event?.description || '',
    venue: event?.venue || '',
    address: event?.address || '',
    eventDate: event?.eventDate ? event.eventDate.slice(0, 16) : '',
    doorsOpen: event?.doorsOpen ? event.doorsOpen.slice(0, 16) : '',
    imageUrl: event?.imageUrl || '',
    maxCapacity: event?.maxCapacity ?? 100,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: CreateTicketEventPayload = {
        name: form.name,
        description: form.description || undefined,
        venue: form.venue,
        address: form.address,
        eventDate: form.eventDate,
        doorsOpen: form.doorsOpen || undefined,
        imageUrl: form.imageUrl || undefined,
        maxCapacity: Number(form.maxCapacity),
      };
      const saved = event
        ? await (sdk as any).updateTicketEvent(event.id, payload)
        : await (sdk as any).createTicketEvent(payload);
      onSaved(saved);
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{event ? 'Editar evento' : 'Nuevo evento'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {[
            { label: 'Nombre del evento *', field: 'name', required: true },
            { label: 'Lugar / Venue *', field: 'venue', required: true },
            { label: 'Direccion *', field: 'address', required: true },
            { label: 'URL imagen', field: 'imageUrl' },
          ].map(({ label, field, required }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="text"
                value={(form as any)[field]}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                required={required}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora *</label>
              <input
                type="datetime-local"
                value={form.eventDate}
                onChange={e => setForm(f => ({ ...f, eventDate: e.target.value }))}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apertura puertas</label>
              <input
                type="datetime-local"
                value={form.doorsOpen}
                onChange={e => setForm(f => ({ ...f, doorsOpen: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad maxima *</label>
            <input
              type="number"
              min={1}
              value={form.maxCapacity}
              onChange={e => setForm(f => ({ ...f, maxCapacity: parseInt(e.target.value) || 1 }))}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add tier modal ─────────────────────────────────────────────────────────────
function AddTierModal({ eventId, onClose, onAdded }: {
  eventId: string;
  onClose: () => void;
  onAdded: (t: TicketTier) => void;
}) {
  const [form, setForm] = useState({ name: '', description: '', priceCents: '', currency: 'USD', totalQty: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: CreateTicketTierPayload = {
        name: form.name,
        description: form.description || undefined,
        priceCents: Math.round(parseFloat(form.priceCents) * 100),
        currency: form.currency,
        totalQty: parseInt(form.totalQty),
      };
      const tier = await (sdk as any).addTicketTier(eventId, payload);
      onAdded(tier);
    } catch (err: any) {
      setError(err.message || 'Error al agregar tier');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Agregar tipo de entrada</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
            <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($) *</label>
              <input type="number" min="0" step="0.01" value={form.priceCents} onChange={e => setForm(f => ({ ...f, priceCents: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
              <input type="number" min="1" value={form.totalQty} onChange={e => setForm(f => ({ ...f, totalQty: e.target.value }))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event row ─────────────────────────────────────────────────────────────────
function EventRow({ event, onEdit, onPublish, onAddTier }: {
  event: TicketEvent;
  onEdit: () => void;
  onPublish: () => void;
  onAddTier: () => void;
}) {
  const status = STATUS_LABELS[event.status] ?? { label: event.status, className: 'bg-gray-100 text-gray-500' };
  const sold = event.tiers?.reduce((s, t) => s + t.soldQty, 0) || 0;
  const total = event.tiers?.reduce((s, t) => s + t.totalQty, 0) || 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{event.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{event.venue} — {formatDate(event.eventDate)}</p>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Tiers */}
      {event.tiers && event.tiers.length > 0 ? (
        <div className="mb-3 space-y-1">
          {event.tiers.map(t => (
            <div key={t.id} className="flex items-center justify-between text-xs text-gray-600">
              <span>{t.name}</span>
              <span>{t.soldQty}/{t.totalQty} vendidos — ${(t.priceCents / 100).toFixed(2)}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 mb-3">Sin tipos de entrada</p>
      )}

      <div className="text-xs text-gray-500 mb-3">
        Ventas totales: {sold}/{total}
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={onEdit} className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          Editar
        </button>
        <button onClick={onAddTier} className="px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          Agregar tipo
        </button>
        {event.status === 'BORRADOR' && (
          <button onClick={onPublish} className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700">
            Publicar
          </button>
        )}
        {(event.status === 'PUBLICADO' || event.status === 'AGOTADO') && (
          <Link
            href={`/artist/dashboard/eventos/${event.id}/check-in`}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Check-in
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EventosPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editEvent, setEditEvent] = useState<TicketEvent | undefined>();
  const [addTierEvent, setAddTierEvent] = useState<string | undefined>();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    (sdk as any).getMyTicketEvents()
      .then((res: TicketEvent[]) => setEvents(res))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [user]);

  function handleSaved(event: TicketEvent) {
    setEvents(evs => {
      const idx = evs.findIndex(e => e.id === event.id);
      if (idx >= 0) { const next = [...evs]; next[idx] = event; return next; }
      return [event, ...evs];
    });
    setShowCreate(false);
    setEditEvent(undefined);
  }

  async function handlePublish(event: TicketEvent) {
    try {
      const updated = await (sdk as any).updateTicketEvent(event.id, { status: 'PUBLICADO' as TicketEventStatus });
      handleSaved(updated);
    } catch (err: any) {
      toast.error('No se pudo publicar el evento. Intenta de nuevo.');
    }
  }

  function handleTierAdded(tier: TicketTier) {
    setEvents(evs => evs.map(e => {
      if (e.id !== addTierEvent) return e;
      return { ...e, tiers: [...(e.tiers || []), tier] };
    }));
    setAddTierEvent(undefined);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      <main className="flex-1 lg:ml-64 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Mis Eventos</h1>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Nuevo evento
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 animate-pulse h-32" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No has creado ningun evento</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-sm text-indigo-600 hover:underline">
                Crear tu primer evento
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(event => (
                <EventRow
                  key={event.id}
                  event={event}
                  onEdit={() => setEditEvent(event)}
                  onPublish={() => handlePublish(event)}
                  onAddTier={() => setAddTierEvent(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {(showCreate || editEvent) && (
        <EventModal
          event={editEvent}
          onClose={() => { setShowCreate(false); setEditEvent(undefined); }}
          onSaved={handleSaved}
        />
      )}

      {addTierEvent && (
        <AddTierModal
          eventId={addTierEvent}
          onClose={() => setAddTierEvent(undefined)}
          onAdded={handleTierAdded}
        />
      )}
    </div>
  );
}
