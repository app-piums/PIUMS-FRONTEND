'use client';

import { useState, useRef } from 'react';
import { sdk } from '@piums/sdk';

const ROLES = ['Violinista', 'Guitarrista', 'Baterista', 'Bajista', 'Pianista', 'DJ', 'Fotógrafo', 'Videógrafo', 'Iluminación', 'Otro'];

interface ArtistResult {
  id: string;
  authUserId?: string;
  nombre?: string;
  displayName?: string;
  name?: string;
  imagenPerfil?: string;
  categoria?: string;
}

interface Props {
  bookingId: string;
  onClose: () => void;
  onInvited: () => void;
}

export default function InviteCollaboratorModal({ bookingId, onClose, onInvited }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArtistResult[]>([]);
  const [selected, setSelected] = useState<ArtistResult | null>(null);
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [notes, setNotes] = useState('');
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSearch = (value: string) => {
    setQuery(value);
    setSelected(null);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.length < 2) { setResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/search/artists?q=${encodeURIComponent(value)}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.artists ?? data.data ?? []);
        }
      } catch {
        // silent
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSubmit = async () => {
    if (!selected) { setError('Selecciona un artista'); return; }
    const finalRole = role === 'Otro' ? customRole : role;
    setSubmitting(true);
    setError('');
    try {
      await sdk.inviteCollaborator(bookingId, {
        artistId: selected.authUserId ?? selected.id,
        role: finalRole || undefined,
        notes: notes || undefined,
      });
      onInvited();
    } catch (err: any) {
      setError(err.message || 'Error enviando invitación');
    } finally {
      setSubmitting(false);
    }
  };

  const artistName = (a: ArtistResult) => a.displayName ?? a.nombre ?? a.name ?? a.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Invitar colaborador</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Artist search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Buscar artista</label>
            {selected ? (
              <div className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">
                    {artistName(selected).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{artistName(selected)}</p>
                    {selected.categoria && <p className="text-[10px] text-gray-500">{selected.categoria}</p>}
                  </div>
                </div>
                <button onClick={() => { setSelected(null); setQuery(''); }} className="text-xs text-gray-400 hover:text-red-500">Cambiar</button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder="Nombre del artista..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
                />
                {(results.length > 0 || searching) && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searching ? (
                      <p className="text-xs text-gray-400 px-3 py-2">Buscando...</p>
                    ) : results.map(a => (
                      <button
                        key={a.id}
                        onClick={() => { setSelected(a); setResults([]); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 text-sm"
                      >
                        <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600 shrink-0">
                          {artistName(a).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{artistName(a)}</p>
                          {a.categoria && <p className="text-[10px] text-gray-500">{a.categoria}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rol (opcional)</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
            >
              <option value="">Sin especificar</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {role === 'Otro' && (
              <input
                type="text"
                value={customRole}
                onChange={e => setCustomRole(e.target.value)}
                placeholder="Escribe el rol..."
                className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
              />
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Detalles del evento, horario, instrucciones..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 resize-none"
            />
          </div>

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selected}
            className="flex-1 bg-[#FF6B35] text-white text-sm font-medium py-2.5 rounded-xl hover:bg-orange-600 transition disabled:opacity-50"
          >
            {submitting ? 'Enviando...' : 'Enviar invitación'}
          </button>
        </div>
      </div>
    </div>
  );
}
