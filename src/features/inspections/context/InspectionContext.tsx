import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import type {
  Inspection,
  InspectionWithState,
  DraftInspection,
  OutboxItem,
  InspectionContextType,
} from '../types';
import { StorageService } from '@/services/storage';
import { networkMonitor } from '@/services/network';
import { syncEngine, SyncResult } from '@/features/outbox/services/syncService';
import { InspectionService } from '../services/inspectionService';

const InspectionContext = createContext<InspectionContextType | null>(null);

export const InspectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rawInspections, setRawInspections] = useState<Inspection[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftInspection>>({});
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [syncedRecords, setSyncedRecords] = useState<Record<string, { receivedAt: string }>>({});
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSimulatingOffline, setIsSimulatingOffline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const loadLocalState = useCallback(async () => {
    const [cached, localDrafts, localOutbox, synced, offlineSim, lastFetch] = await Promise.all([
      StorageService.getCachedInspections(),
      StorageService.getAllDrafts(),
      StorageService.getOutbox(),
      StorageService.getSyncedRecords(),
      StorageService.getSimulateOffline(),
      StorageService.getLastFetchTime(),
    ]);

    setRawInspections(cached);
    setDrafts(localDrafts);
    setOutbox(localOutbox);
    setSyncedRecords(synced);
    setIsSimulatingOffline(offlineSim);
    setLastFetchedAt(lastFetch);
  }, []);

  const refreshInspections = useCallback(async () => {
    setIsLoading(true);
    try {
      const { inspections: data } = await InspectionService.fetchInspections();
      setRawInspections(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let unsubscribeSync: (() => void) | null = null;
    let unsubscribeNetwork: (() => void) | null = null;

    async function init() {
      await networkMonitor.init();
      syncEngine.init();

      unsubscribeNetwork = networkMonitor.addListener((online) => {
        setIsOnline(online);
        setIsSimulatingOffline(networkMonitor.isOfflineSimulated);
      });

      unsubscribeSync = syncEngine.subscribeSyncState(async (syncing) => {
        setIsSyncing(syncing);
        if (!syncing) {
          const [freshOutbox, freshSynced] = await Promise.all([
            StorageService.getOutbox(),
            StorageService.getSyncedRecords(),
          ]);
          setOutbox(freshOutbox);
          setSyncedRecords(freshSynced);
        }
      });

      await loadLocalState();
      await refreshInspections();
    }

    init();

    return () => {
      if (unsubscribeSync) unsubscribeSync();
      if (unsubscribeNetwork) unsubscribeNetwork();
    };
  }, [loadLocalState, refreshInspections]);

  const saveAnswer = useCallback(
    async (
      inspectionId: string,
      itemId: string,
      result: 'PASS' | 'FAIL' | 'NA',
      note?: string
    ) => {
      const existingDraft = drafts[inspectionId] || {
        inspectionId,
        items: {},
        lastSavedAt: new Date().toISOString(),
      };
      const existingItem = existingDraft.items[itemId] || { updatedAt: new Date().toISOString() };

      const updatedDraft: DraftInspection = {
        ...existingDraft,
        lastSavedAt: new Date().toISOString(),
        items: {
          ...existingDraft.items,
          [itemId]: {
            ...existingItem,
            result,
            note: note !== undefined ? note : existingItem.note,
            updatedAt: new Date().toISOString(),
          },
        },
      };

      setDrafts((prev) => ({ ...prev, [inspectionId]: updatedDraft }));
      await StorageService.saveDraft(updatedDraft);
    },
    [drafts]
  );

  const saveNote = useCallback(
    async (inspectionId: string, itemId: string, note: string) => {
      const existingDraft = drafts[inspectionId] || {
        inspectionId,
        items: {},
        lastSavedAt: new Date().toISOString(),
      };
      const existingItem = existingDraft.items[itemId] || {
        result: undefined,
        updatedAt: new Date().toISOString(),
      };

      const updatedDraft: DraftInspection = {
        ...existingDraft,
        lastSavedAt: new Date().toISOString(),
        items: {
          ...existingDraft.items,
          [itemId]: { ...existingItem, note, updatedAt: new Date().toISOString() },
        },
      };

      setDrafts((prev) => ({ ...prev, [inspectionId]: updatedDraft }));
      await StorageService.saveDraft(updatedDraft);
    },
    [drafts]
  );

  const submitInspectionReport = useCallback(
    async (inspectionId: string) => {
      const inspection = rawInspections.find((i) => i.id === inspectionId);
      if (!inspection) {
        return { success: false, syncedImmediately: false, error: 'Inspection not found' };
      }

      const { submission, error } = InspectionService.validateAndBuildSubmission(
        inspection,
        drafts[inspectionId]
      );

      if (error || !submission) {
        return { success: false, syncedImmediately: false, error: error || 'Submission invalid' };
      }

      const outboxItem: OutboxItem = {
        submission,
        siteName: inspection.siteName,
        address: inspection.address,
        status: 'pending',
        attempts: 0,
        queuedAt: new Date().toISOString(),
      };

      await StorageService.addToOutbox(outboxItem);
      const updatedOutbox = await StorageService.getOutbox();
      setOutbox(updatedOutbox);

      if (networkMonitor.isOnline) {
        await syncEngine.syncOutbox();
        const [freshOutbox, freshSynced] = await Promise.all([
          StorageService.getOutbox(),
          StorageService.getSyncedRecords(),
        ]);
        setOutbox(freshOutbox);
        setSyncedRecords(freshSynced);
        const wasSynced = Boolean(freshSynced[inspectionId]);
        return {
          success: true,
          syncedImmediately: wasSynced,
          error: wasSynced ? undefined : 'Saved locally. Will retry transmission to office.',
        };
      }

      return {
        success: true,
        syncedImmediately: false,
        error: 'Saved offline. Will transmit automatically once connection is detected.',
      };
    },
    [rawInspections, drafts]
  );

  const syncNow = useCallback(async (): Promise<SyncResult> => {
    const result = await syncEngine.syncOutbox();
    const [freshOutbox, freshSynced] = await Promise.all([
      StorageService.getOutbox(),
      StorageService.getSyncedRecords(),
    ]);
    setOutbox(freshOutbox);
    setSyncedRecords(freshSynced);
    return result;
  }, []);

  const toggleSimulateOffline = useCallback(async () => {
    const nextVal = !isSimulatingOffline;
    await networkMonitor.setSimulateOffline(nextVal);
    setIsSimulatingOffline(nextVal);
    setIsOnline(networkMonitor.isOnline);
  }, [isSimulatingOffline]);

  const resetAllData = useCallback(async () => {
    await StorageService.clearAll();
    await networkMonitor.setSimulateOffline(false);
    setDrafts({});
    setOutbox([]);
    setSyncedRecords({});
    setIsSimulatingOffline(false);
    await refreshInspections();
  }, [refreshInspections]);

  const inspections: InspectionWithState[] = useMemo(() => {
    return InspectionService.mergeInspectionState(
      rawInspections,
      drafts,
      outbox,
      syncedRecords
    );
  }, [rawInspections, drafts, outbox, syncedRecords]);

  const syncSummary = useMemo(() => {
    return InspectionService.calculateSummary(inspections);
  }, [inspections]);

  return (
    <InspectionContext.Provider
      value={{
        inspections,
        outbox,
        isOnline,
        isSimulatingOffline,
        isSyncing,
        isLoading,
        lastFetchedAt,
        syncSummary,
        refreshInspections,
        saveAnswer,
        saveNote,
        submitInspectionReport,
        syncNow,
        toggleSimulateOffline,
        resetAllData,
      }}>
      {children}
    </InspectionContext.Provider>
  );
};

export function useInspections(): InspectionContextType {
  const context = useContext(InspectionContext);
  if (!context) {
    throw new Error('useInspections must be used within an InspectionProvider');
  }
  return context;
}
