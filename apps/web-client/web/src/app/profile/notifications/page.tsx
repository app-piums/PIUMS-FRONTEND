'use client';

import React, { useEffect, useState } from 'react';
import { useUnsavedChangesPrompt } from '@/hooks/useUnsavedChangesPrompt';
import { toast } from '@/lib/toast';

interface ChannelSettings {
  email: boolean;
  sms: boolean;
  push: boolean;
}

const DEFAULT_SETTINGS: ChannelSettings = { email: true, sms: false, push: true };

const CHANNELS: { id: keyof ChannelSettings; label: string; description: string }[] = [
  { id: 'email', label: 'Email', description: 'Confirmaciones, recordatorios y novedades por correo electrónico' },
  { id: 'sms', label: 'SMS', description: 'Mensajes de texto para alertas importantes de reservas' },
  { id: 'push', label: 'Push', description: 'Notificaciones en tiempo real en tu dispositivo' },
];

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2 ${
        checked ? 'bg-[#FF6B35]' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

type NotificationsTabProps = {
  onDirtyChange?: (isDirty: boolean) => void;
};

export default function NotificationsTab(props: NotificationsTabProps = {}) {
  const { onDirtyChange } = props;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialSettings, setInitialSettings] = useState<ChannelSettings>(DEFAULT_SETTINGS);
  const [settings, setSettings] = useState<ChannelSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    fetch('/api/users/me/notifications-settings', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const loaded: ChannelSettings = {
            email: data.email ?? data.emailNotifications ?? DEFAULT_SETTINGS.email,
            sms: data.sms ?? data.smsNotifications ?? DEFAULT_SETTINGS.sms,
            push: data.push ?? data.pushNotifications ?? DEFAULT_SETTINGS.push,
          };
          setSettings(loaded);
          setInitialSettings(loaded);
        }
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const handleToggle = (channel: keyof ChannelSettings) => {
    setSettings(prev => ({ ...prev, [channel]: !prev[channel] }));
  };

  const hasUnsavedChanges =
    settings.email !== initialSettings.email ||
    settings.sms !== initialSettings.sms ||
    settings.push !== initialSettings.push;

  const handleSave = async () => {
    if (!hasUnsavedChanges) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users/me/notifications-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          emailNotifications: settings.email,
          smsNotifications: settings.sms,
          pushNotifications: settings.push,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.message || 'Error al actualizar la configuración');
        return;
      }
      setInitialSettings({ ...settings });
      toast.success('Preferencias guardadas correctamente');
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast.error('Error al actualizar la configuración');
    } finally {
      setLoading(false);
    }
  };

  useUnsavedChangesPrompt(hasUnsavedChanges);

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
        <p className="text-sm text-gray-600 mt-1">
          Administra cómo quieres recibir notificaciones
        </p>
      </div>

      {fetching ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4 max-w-xl">
          {CHANNELS.map(ch => (
            <div key={ch.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200">
              <div className="flex-1 min-w-0 pr-4">
                <p className="text-sm font-semibold text-gray-900">{ch.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{ch.description}</p>
              </div>
              <ToggleSwitch
                checked={settings[ch.id]}
                onChange={() => handleToggle(ch.id)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-orange-50 border-l-4 border-[#FF6B35] p-4 rounded-r-lg max-w-xl">
        <p className="text-sm text-orange-800">
          Las notificaciones importantes de seguridad y cuenta siempre se envían por email, independientemente de esta configuración.
        </p>
      </div>

      <div className="mt-8 flex justify-end max-w-xl">
        <button
          onClick={handleSave}
          disabled={loading || !hasUnsavedChanges || fetching}
          className="px-6 py-2.5 bg-[#FF6B35] text-white text-sm font-semibold rounded-lg hover:bg-[#e55f00] transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Preferencias'}
        </button>
      </div>
    </div>
  );
}
