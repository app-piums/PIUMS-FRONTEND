'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@piums/sdk';
import { toast } from '@/lib/toast';
import type { BookingCollaborator } from '@piums/sdk';
import InviteCollaboratorModal from './InviteCollaboratorModal';

const STATUS_STYLES: Record<string, string> = {
  INVITED: 'bg-yellow-100 text-yellow-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const STATUS_LABELS: Record<string, string> = {
  INVITED: 'Pendiente',
  ACCEPTED: 'Aceptó',
  REJECTED: 'Rechazó',
  CANCELLED: 'Cancelado',
};

interface Props {
  bookingId: string;
  isLeadArtist: boolean;
}

export default function CollaborationPanel({ bookingId, isLeadArtist }: Props) {
  const [collaborators, setCollaborators] = useState<BookingCollaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  const load = async () => {
    try {
      const { collaborators: data } = await sdk.getBookingCollaborators(bookingId);
      setCollaborators(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [bookingId]);

  const handleCancel = async (artistId: string) => {
    try {
      await sdk.cancelCollaborator(bookingId, artistId);
      load();
    } catch (err: any) {
      toast.error('No se pudo cancelar al colaborador. Intenta de nuevo.');
    }
  };

  const acceptedCount = collaborators.filter(c => c.status === 'ACCEPTED').length;

  return (
    <div className="mt-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">Equipo colaborador</p>
        {isLeadArtist && (
          <button
            onClick={() => setShowInvite(true)}
            className="text-xs text-[#FF6B35] font-medium hover:underline flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Invitar artista
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-xs text-gray-400">Cargando...</p>
      ) : collaborators.length === 0 ? (
        <p className="text-xs text-gray-400 italic">Sin colaboradores aún.</p>
      ) : (
        <div className="space-y-2">
          {collaborators.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-purple-200 flex items-center justify-center text-xs font-bold text-purple-700">
                  {(c.artistName ?? c.artistId).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-800">{c.artistName ?? c.artistId}</p>
                  {c.role && <p className="text-[10px] text-gray-500">{c.role}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[c.status]}`}>
                  {STATUS_LABELS[c.status]}
                </span>
                {isLeadArtist && c.status !== 'CANCELLED' && c.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleCancel(c.artistId)}
                    className="text-gray-400 hover:text-red-500 transition"
                    title="Cancelar invitación"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isLeadArtist && acceptedCount > 0 && (
        <a
          href={`/chat/grupo?bookingId=${bookingId}`}
          className="mt-3 flex items-center gap-2 text-xs font-medium text-purple-600 hover:text-purple-800 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
          Abrir chat de coordinación
        </a>
      )}

      {showInvite && (
        <InviteCollaboratorModal
          bookingId={bookingId}
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); load(); }}
        />
      )}
    </div>
  );
}
