import { useState, useCallback } from 'react';
import { useInspections } from '@/features/inspections/context/InspectionContext';

export function useOutbox() {
  const { outbox, isOnline, isSyncing, syncNow, toggleSimulateOffline } = useInspections();
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleSyncAll = useCallback(async () => {
    if (isSyncing) return;
    setSyncFeedback(null);
    const result = await syncNow();

    if (result.offline) {
      setSyncFeedback('Device is offline. Connect to the network or disable simulation to sync.');
    } else if (result.synced > 0) {
      setSyncFeedback(`Successfully transmitted ${result.synced} inspection${result.synced > 1 ? 's' : ''} to office!`);
    } else if (result.errors.length > 0) {
      setSyncFeedback(result.errors.join(', '));
    } else {
      setSyncFeedback('All inspections are already up to date.');
    }
  }, [isSyncing, syncNow]);

  const pendingItems = outbox.filter((o) => o.status === 'pending' || o.status === 'failed');
  const syncedItems = outbox.filter((o) => o.status === 'synced');

  return {
    outbox,
    pendingItems,
    syncedItems,
    isOnline,
    isSyncing,
    syncFeedback,
    handleSyncAll,
    toggleSimulateOffline,
  };
}
