import { submitInspection, ApiError } from '@/../mockApi';
import { StorageService } from '@/services/storage';
import { networkMonitor } from '@/services/network';
import type { SyncResult, SyncStateCallback } from '../types';

export type { SyncResult, SyncStateCallback };

class SyncEngine {
  private isSyncingInProgress: boolean = false;
  private syncSubscribers: Set<SyncStateCallback> = new Set();
  private autoSyncInterval: ReturnType<typeof setInterval> | null = null;

  init() {
    networkMonitor.addListener((isOnline: boolean) => {
      if (isOnline) {
        this.syncOutbox();
      }
    });

    if (!this.autoSyncInterval) {
      this.autoSyncInterval = setInterval(() => {
        if (networkMonitor.isOnline && !this.isSyncingInProgress) {
          this.syncOutbox();
        }
      }, 30000);
    }
  }

  destroy() {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
    this.syncSubscribers.clear();
  }

  subscribeSyncState(callback: SyncStateCallback): () => void {
    this.syncSubscribers.add(callback);
    callback(this.isSyncingInProgress);
    return () => {
      this.syncSubscribers.delete(callback);
    };
  }

  private setSyncing(syncing: boolean) {
    this.isSyncingInProgress = syncing;
    this.syncSubscribers.forEach((cb) => cb(syncing));
  }

  get isSyncing(): boolean {
    return this.isSyncingInProgress;
  }

  async syncOutbox(): Promise<SyncResult> {
    if (this.isSyncingInProgress) {
      return { total: 0, synced: 0, failed: 0, offline: false, errors: ['Sync already in progress'] };
    }

    if (!networkMonitor.isOnline) {
      return { total: 0, synced: 0, failed: 0, offline: true, errors: ['Device is offline'] };
    }

    this.setSyncing(true);

    const result: SyncResult = { total: 0, synced: 0, failed: 0, offline: false, errors: [] };

    try {
      const outbox = await StorageService.getOutbox();
      const itemsToSync = outbox.filter(
        (item) => item.status === 'pending' || item.status === 'failed'
      );

      result.total = itemsToSync.length;

      if (itemsToSync.length === 0) {
        return result;
      }

      for (const item of itemsToSync) {
        if (!networkMonitor.isOnline) {
          result.offline = true;
          break;
        }

        const inspectionId = item.submission.inspectionId;

        await StorageService.updateOutboxItem(inspectionId, {
          status: 'syncing',
          lastAttemptAt: new Date().toISOString(),
        });

        try {
          const response = await submitInspection(item.submission);
          await StorageService.markAsSynced(inspectionId, response.receivedAt);
          await StorageService.updateOutboxItem(inspectionId, {
            status: 'synced',
            syncedAt: response.receivedAt,
            lastError: undefined,
          });
          result.synced += 1;
        } catch (error: any) {
          const attemptCount = item.attempts + 1;

          if (error instanceof ApiError) {
            if (error.status === 409) {
              const receivedAt = new Date().toISOString();
              await StorageService.markAsSynced(inspectionId, receivedAt);
              await StorageService.updateOutboxItem(inspectionId, {
                status: 'synced',
                syncedAt: receivedAt,
                lastError: undefined,
              });
              result.synced += 1;
              continue;
            }

            if (error.status === 0) {
              await StorageService.updateOutboxItem(inspectionId, {
                status: 'pending',
                attempts: attemptCount,
                lastError: 'Network offline',
              });
              result.failed += 1;
              break;
            }

            if (error.status === 500) {
              await StorageService.updateOutboxItem(inspectionId, {
                status: 'failed',
                attempts: attemptCount,
                lastError: 'Server error (500) - will retry',
              });
              result.failed += 1;
              result.errors.push(`${item.siteName}: Server 500 (will retry)`);
              continue;
            }

            await StorageService.updateOutboxItem(inspectionId, {
              status: 'failed',
              attempts: attemptCount,
              lastError: `API error (${error.status}): ${error.message}`,
            });
            result.failed += 1;
            result.errors.push(`${item.siteName}: ${error.message}`);
          } else {
            await StorageService.updateOutboxItem(inspectionId, {
              status: 'failed',
              attempts: attemptCount,
              lastError: error?.message || 'Sync error',
            });
            result.failed += 1;
          }
        }
      }
    } finally {
      this.setSyncing(false);
    }

    return result;
  }
}

export const syncEngine = new SyncEngine();
