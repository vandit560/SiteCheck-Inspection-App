import type { Submission } from '@/features/inspections/types';

export interface OutboxItem {
  submission: Submission;
  siteName: string;
  address: string;
  status: 'pending' | 'syncing' | 'failed' | 'synced';
  attempts: number;
  queuedAt: string;
  lastAttemptAt?: string;
  lastError?: string;
  syncedAt?: string;
}

export interface SyncResult {
  total: number;
  synced: number;
  failed: number;
  offline: boolean;
  errors: string[];
}

export type SyncStateCallback = (isSyncing: boolean) => void;
