import { getRealm } from './realm';
import { FallbackStorage } from './fallbackStorage';
import type { Inspection, DraftInspection, ChecklistItem, DraftItemState } from '@/features/inspections/types';
import type { OutboxItem } from '@/features/outbox/types';

const UPDATE_MODE_MODIFIED: any = 'modified';

export const StorageService = {
  // Inspections Cache
  async getCachedInspections(): Promise<Inspection[]> {
    const realm = await getRealm();
    if (realm) {
      const records = realm.objects<any>('Inspection');
      return records.map((r) => ({
        id: r.id,
        siteName: r.siteName,
        address: r.address,
        scheduledAt: r.scheduledAt,
        checklist: r.checklist.map((c: ChecklistItem) => ({ id: c.id, text: c.text })),
      }));
    }
    const data = await FallbackStorage.getItem('@sitecheck/inspections_cache');
    return data ? JSON.parse(data) : [];
  },

  async setCachedInspections(inspections: Inspection[]): Promise<void> {
    const realm = await getRealm();
    if (realm) {
      realm.write(() => {
        for (const item of inspections) {
          realm.create('Inspection', item, UPDATE_MODE_MODIFIED);
        }
      });
      return;
    }
    await FallbackStorage.setItem('@sitecheck/inspections_cache', JSON.stringify(inspections));
  },

  // Drafts
  async getAllDrafts(): Promise<Record<string, DraftInspection>> {
    const realm = await getRealm();
    if (realm) {
      const records = realm.objects<any>('DraftInspection');
      const drafts: Record<string, DraftInspection> = {};
      for (const r of records) {
        const items: Record<string, DraftItemState> = {};
        for (const item of r.items) {
          items[item.itemId] = {
            result: item.result,
            note: item.note,
            updatedAt: item.updatedAt,
          };
        }
        drafts[r.inspectionId] = {
          inspectionId: r.inspectionId,
          lastSavedAt: r.lastSavedAt,
          items,
        };
      }
      return drafts;
    }
    const data = await FallbackStorage.getItem('@sitecheck/drafts_v1');
    return data ? JSON.parse(data) : {};
  },

  async getDraft(inspectionId: string): Promise<DraftInspection | null> {
    const drafts = await this.getAllDrafts();
    return drafts[inspectionId] || null;
  },

  async saveDraft(draft: DraftInspection): Promise<void> {
    const realm = await getRealm();
    if (realm) {
      realm.write(() => {
        const itemsList = Object.entries(draft.items).map(([itemId, val]) => ({
          itemId,
          result: val.result ?? null,
          note: val.note ?? null,
          updatedAt: val.updatedAt,
        }));
        realm.create(
          'DraftInspection',
          {
            inspectionId: draft.inspectionId,
            lastSavedAt: draft.lastSavedAt,
            items: itemsList,
          },
          UPDATE_MODE_MODIFIED
        );
      });
      return;
    }
    const drafts = await this.getAllDrafts();
    drafts[draft.inspectionId] = draft;
    await FallbackStorage.setItem('@sitecheck/drafts_v1', JSON.stringify(drafts));
  },

  async deleteDraft(inspectionId: string): Promise<void> {
    const realm = await getRealm();
    if (realm) {
      realm.write(() => {
        const obj = realm.objectForPrimaryKey('DraftInspection', inspectionId);
        if (obj) realm.delete(obj);
      });
      return;
    }
    const drafts = await this.getAllDrafts();
    if (drafts[inspectionId]) {
      delete drafts[inspectionId];
      await FallbackStorage.setItem('@sitecheck/drafts_v1', JSON.stringify(drafts));
    }
  },

  // Outbox Queue
  async getOutbox(): Promise<OutboxItem[]> {
    const realm = await getRealm();
    if (realm) {
      const records = realm.objects<any>('OutboxItem');
      return records.map((r) => ({
        siteName: r.siteName,
        address: r.address,
        status: r.status,
        attempts: r.attempts,
        queuedAt: r.queuedAt,
        lastAttemptAt: r.lastAttemptAt ?? undefined,
        lastError: r.lastError ?? undefined,
        syncedAt: r.syncedAt ?? undefined,
        submission: {
          inspectionId: r.inspectionId,
          completedAt: r.completedAt,
          results: r.results.map((res: any) => ({
            itemId: res.itemId,
            result: res.result,
            note: res.note ?? undefined,
          })),
        },
      }));
    }
    const data = await FallbackStorage.getItem('@sitecheck/outbox_v1');
    return data ? JSON.parse(data) : [];
  },

  async addToOutbox(item: OutboxItem): Promise<void> {
    const realm = await getRealm();
    if (realm) {
      realm.write(() => {
        realm.create(
          'OutboxItem',
          {
            inspectionId: item.submission.inspectionId,
            siteName: item.siteName,
            address: item.address,
            completedAt: item.submission.completedAt,
            status: item.status,
            attempts: item.attempts,
            queuedAt: item.queuedAt,
            lastAttemptAt: item.lastAttemptAt ?? null,
            lastError: item.lastError ?? null,
            syncedAt: item.syncedAt ?? null,
            results: item.submission.results.map((r) => ({
              itemId: r.itemId,
              result: r.result,
              note: r.note ?? null,
            })),
          },
          UPDATE_MODE_MODIFIED
        );
      });
      return;
    }
    const outbox = await this.getOutbox();
    const existingIndex = outbox.findIndex(
      (entry) => entry.submission.inspectionId === item.submission.inspectionId
    );
    if (existingIndex >= 0) outbox[existingIndex] = item;
    else outbox.push(item);
    await FallbackStorage.setItem('@sitecheck/outbox_v1', JSON.stringify(outbox));
  },

  async updateOutboxItem(inspectionId: string, updates: Partial<OutboxItem>): Promise<void> {
    const realm = await getRealm();
    if (realm) {
      realm.write(() => {
        const obj = realm.objectForPrimaryKey<any>('OutboxItem', inspectionId);
        if (obj) {
          if (updates.status !== undefined) obj.status = updates.status;
          if (updates.attempts !== undefined) obj.attempts = updates.attempts;
          if (updates.lastAttemptAt !== undefined) obj.lastAttemptAt = updates.lastAttemptAt;
          if (updates.lastError !== undefined) obj.lastError = updates.lastError;
          if (updates.syncedAt !== undefined) obj.syncedAt = updates.syncedAt;
        }
      });
      return;
    }
    const outbox = await this.getOutbox();
    const idx = outbox.findIndex((entry) => entry.submission.inspectionId === inspectionId);
    if (idx >= 0) {
      outbox[idx] = { ...outbox[idx], ...updates };
      await FallbackStorage.setItem('@sitecheck/outbox_v1', JSON.stringify(outbox));
    }
  },

  // Synced Records
  async getSyncedRecords(): Promise<Record<string, { receivedAt: string }>> {
    const realm = await getRealm();
    if (realm) {
      const records = realm.objects<any>('SyncedRecord');
      const synced: Record<string, { receivedAt: string }> = {};
      for (const r of records) synced[r.inspectionId] = { receivedAt: r.receivedAt };
      return synced;
    }
    const data = await FallbackStorage.getItem('@sitecheck/synced_v1');
    return data ? JSON.parse(data) : {};
  },

  async markAsSynced(inspectionId: string, receivedAt: string): Promise<void> {
    const realm = await getRealm();
    if (realm) {
      realm.write(() => {
        realm.create('SyncedRecord', { inspectionId, receivedAt }, UPDATE_MODE_MODIFIED);
      });
      return;
    }
    const records = await this.getSyncedRecords();
    records[inspectionId] = { receivedAt };
    await FallbackStorage.setItem('@sitecheck/synced_v1', JSON.stringify(records));
  },

  // Settings
  async getSimulateOffline(): Promise<boolean> {
    const realm = await getRealm();
    if (realm) {
      const setting = realm.objectForPrimaryKey<any>('AppSetting', 'simulate_offline');
      return setting ? setting.value === 'true' : false;
    }
    const val = await FallbackStorage.getItem('@sitecheck/simulate_offline');
    return val === 'true';
  },

  async setSimulateOffline(simulate: boolean): Promise<void> {
    const val = simulate ? 'true' : 'false';
    const realm = await getRealm();
    if (realm) {
      realm.write(() => {
        realm.create('AppSetting', { key: 'simulate_offline', value: val }, UPDATE_MODE_MODIFIED);
      });
      return;
    }
    await FallbackStorage.setItem('@sitecheck/simulate_offline', val);
  },

  async getLastFetchTime(): Promise<string | null> {
    const realm = await getRealm();
    if (realm) {
      const setting = realm.objectForPrimaryKey<any>('AppSetting', 'last_fetch_time');
      return setting ? setting.value : null;
    }
    return await FallbackStorage.getItem('@sitecheck/last_fetch_time');
  },

  async setLastFetchTime(isoTime: string): Promise<void> {
    const realm = await getRealm();
    if (realm) {
      realm.write(() => {
        realm.create('AppSetting', { key: 'last_fetch_time', value: isoTime }, UPDATE_MODE_MODIFIED);
      });
      return;
    }
    await FallbackStorage.setItem('@sitecheck/last_fetch_time', isoTime);
  },

  // Clear all data
  async clearAll(): Promise<void> {
    const realm = await getRealm();
    if (realm) {
      realm.write(() => realm.deleteAll());
    }
    FallbackStorage.clearMemory();
    await FallbackStorage.multiRemove([
      '@sitecheck/inspections_cache',
      '@sitecheck/drafts_v1',
      '@sitecheck/outbox_v1',
      '@sitecheck/synced_v1',
      '@sitecheck/simulate_offline',
      '@sitecheck/last_fetch_time',
    ]);
  },
};
