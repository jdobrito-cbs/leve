import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { db } from '@/db/client';
import { getSetting, setSetting } from '@/db/settingsRepo';
import { getHealthProvider } from '@/services/health/HealthProvider';
import { importMetrics, importWeights, importWorkouts } from '@/services/health/healthSync';
import { showMessage } from '@/design/messageSignal';
import { strings } from '@/i18n/pt-BR';

function notifySynced(count: number): void {
  showMessage(
    strings.health.syncedTitle,
    strings.health.syncedCount.replace('{count}', String(count)),
  );
}

interface HealthSettings {
  connected: boolean;
}

export function useHealthConnection() {
  const provider = useMemo(() => getHealthProvider(), []);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [connected, setConnected] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastImported, setLastImported] = useState<number | null>(null);

  const load = useCallback(async () => {
    setAvailable(await provider.isAvailable());
    const settings = await getSetting<HealthSettings>(db, 'health');
    setConnected(settings?.connected ?? false);
    setLoading(false);
  }, [provider]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const connect = useCallback(async () => {
    const granted = await provider.requestPermissions();
    if (granted) {
      await setSetting(db, 'health', { connected: true });
      setConnected(true);
    }
    return granted;
  }, [provider]);

  const disconnect = useCallback(async () => {
    await setSetting(db, 'health', { connected: false });
    setConnected(false);
    setLastImported(null);
  }, []);

  const importNow = useCallback(async () => {
    setImporting(true);
    try {
      await provider.requestPermissions();
      const count = (await importWeights(db, provider)) + (await importMetrics(db, provider));
      setLastImported(count);
      notifySynced(count);
      return count;
    } finally {
      setImporting(false);
    }
  }, [provider]);

  const syncWorkouts = useCallback(async () => {
    setImporting(true);
    try {
      await provider.requestPermissions();
      const count = await importWorkouts(db, provider);
      notifySynced(count);
      return count;
    } finally {
      setImporting(false);
    }
  }, [provider]);

  return {
    loading,
    available,
    connected,
    connect,
    disconnect,
    importNow,
    syncWorkouts,
    importing,
    lastImported,
  };
}
