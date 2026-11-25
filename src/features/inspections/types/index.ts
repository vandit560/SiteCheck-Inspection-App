import type { ChecklistItem, Inspection, ItemResult, Submission } from '@/../mockApi';
import type { OutboxItem, SyncResult } from '@/features/outbox/types';

export type { ChecklistItem, Inspection, ItemResult, Submission, OutboxItem, SyncResult };

export type InspectionStatus =
  | 'assigned'
  | 'in_progress'
  | 'pending_sync'
  | 'syncing'
  | 'synced'
  | 'sync_failed';

export interface DraftItemState {
  result?: 'PASS' | 'FAIL' | 'NA';
  note?: string;
  updatedAt: string;
}

export interface DraftInspection {
  inspectionId: string;
  items: Record<string, DraftItemState>;
  lastSavedAt: string;
}

export interface ChecklistProgress {
  answered: number;
  total: number;
  passCount: number;
  failCount: number;
  naCount: number;
  hasIncompleteFails: boolean;
  isComplete: boolean;
}

export interface InspectionWithState extends Inspection {
  status: InspectionStatus;
  draft?: DraftInspection;
  completedAt?: string;
  syncedAt?: string;
  lastError?: string;
  progress: ChecklistProgress;
}

export type FilterTab = 'all' | 'action_needed' | 'queued' | 'synced';

export interface SyncSummary {
  total: number;
  assigned: number;
  inProgress: number;
  pendingSync: number;
  synced: number;
}

export interface InspectionContextType {
  inspections: InspectionWithState[];
  outbox: OutboxItem[];
  isOnline: boolean;
  isSimulatingOffline: boolean;
  isSyncing: boolean;
  isLoading: boolean;
  lastFetchedAt: string | null;
  syncSummary: SyncSummary;
  refreshInspections: () => Promise<void>;
  saveAnswer: (
    inspectionId: string,
    itemId: string,
    result: 'PASS' | 'FAIL' | 'NA',
    note?: string
  ) => Promise<void>;
  saveNote: (inspectionId: string, itemId: string, note: string) => Promise<void>;
  submitInspectionReport: (
    inspectionId: string
  ) => Promise<{ success: boolean; syncedImmediately: boolean; error?: string }>;
  syncNow: () => Promise<SyncResult>;
  toggleSimulateOffline: () => Promise<void>;
  resetAllData: () => Promise<void>;
}
