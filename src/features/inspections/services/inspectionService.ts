import { getAssignedInspections, ApiError } from '@/../mockApi';
import { StorageService } from '@/services/storage';
import { networkMonitor } from '@/services/network';
import type { OutboxItem } from '@/features/outbox/types';
import type {
  Inspection,
  DraftInspection,
  ChecklistProgress,
  Submission,
  InspectionWithState,
  InspectionStatus,
  ChecklistItem,
  DraftItemState,
} from '../types';

export const InspectionService = {
  async fetchInspections(): Promise<{
    inspections: Inspection[];
    fromCache: boolean;
    error?: string;
  }> {
    if (!networkMonitor.isOnline) {
      const cached = await StorageService.getCachedInspections();
      return { inspections: cached, fromCache: true };
    }

    let lastErr: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const data = await getAssignedInspections();
        await StorageService.setCachedInspections(data);
        await StorageService.setLastFetchTime(new Date().toISOString());
        return { inspections: data, fromCache: false };
      } catch (err) {
        lastErr = err;
        if (err instanceof ApiError && err.status === 500) {
          await new Promise((res) => setTimeout(res, 350));
        } else {
          break;
        }
      }
    }

    const cached = await StorageService.getCachedInspections();
    return {
      inspections: cached,
      fromCache: true,
      error: lastErr?.message || 'Failed to fetch inspections from server',
    };
  },

  calculateProgress(
    inspection: Inspection,
    draft?: DraftInspection,
    isSynced?: boolean
  ): ChecklistProgress {
    const checklist = inspection.checklist || [];
    const total = checklist.length;

    let answered = 0;
    let passCount = 0;
    let failCount = 0;
    let naCount = 0;
    let hasIncompleteFails = false;

    if (draft && draft.items) {
      for (const item of checklist) {
        const itemDraft = draft.items[item.id];
        if (itemDraft && itemDraft.result) {
          answered += 1;
          if (itemDraft.result === 'PASS') passCount += 1;
          else if (itemDraft.result === 'FAIL') {
            failCount += 1;
            if (!itemDraft.note || !itemDraft.note.trim()) {
              hasIncompleteFails = true;
            }
          } else if (itemDraft.result === 'NA') naCount += 1;
        }
      }
    }

    if (isSynced) {
      return {
        answered: total,
        total,
        passCount: passCount || total,
        failCount,
        naCount,
        hasIncompleteFails: false,
        isComplete: true,
      };
    }

    return {
      answered,
      total,
      passCount,
      failCount,
      naCount,
      hasIncompleteFails,
      isComplete: answered === total && !hasIncompleteFails,
    };
  },

  validateAndBuildSubmission(
    inspection: Inspection,
    draft?: DraftInspection
  ): { submission?: Submission; error?: string } {
    if (!draft) {
      return { error: 'No answers recorded' };
    }

    const checklist: ChecklistItem[] = inspection.checklist;
    const incomplete = checklist.some((c: ChecklistItem) => !draft.items[c.id]?.result);
    if (incomplete) {
      return { error: 'Please answer all checklist items before submitting.' };
    }

    const missingFailNote = checklist.some((c: ChecklistItem) => {
      const item = draft.items[c.id];
      return item.result === 'FAIL' && !item.note?.trim();
    });

    if (missingFailNote) {
      return { error: 'A note is required for every failed item.' };
    }

    const submission: Submission = {
      inspectionId: inspection.id,
      completedAt: new Date().toISOString(),
      results: checklist.map((c: ChecklistItem) => ({
        itemId: c.id,
        result: draft.items[c.id].result!,
        note: draft.items[c.id].note?.trim() || undefined,
      })),
    };

    return { submission };
  },

  mergeInspectionState(
    rawInspections: Inspection[],
    drafts: Record<string, DraftInspection>,
    outbox: OutboxItem[],
    syncedRecords: Record<string, { receivedAt: string }>
  ): InspectionWithState[] {
    return rawInspections.map((inspection) => {
      const draft = drafts[inspection.id];
      const syncedRecord = syncedRecords[inspection.id];
      const outboxEntry = outbox.find((o) => o.submission.inspectionId === inspection.id);

      let status: InspectionStatus = 'assigned';
      let completedAt: string | undefined = undefined;
      let syncedAt: string | undefined = undefined;
      let lastError: string | undefined = undefined;

      if (syncedRecord) {
        status = 'synced';
        syncedAt = syncedRecord.receivedAt;
        completedAt = outboxEntry?.submission.completedAt || syncedRecord.receivedAt;
      } else if (outboxEntry) {
        completedAt = outboxEntry.submission.completedAt;
        lastError = outboxEntry.lastError;
        if (outboxEntry.status === 'syncing') status = 'syncing';
        else if (outboxEntry.status === 'synced') {
          status = 'synced';
          syncedAt = outboxEntry.syncedAt;
        } else if (outboxEntry.status === 'failed') status = 'sync_failed';
        else status = 'pending_sync';
      } else if (draft && draft.items) {
        const hasAnswers = Object.values(draft.items).some(
          (i: DraftItemState) => Boolean(i.result)
        );
        if (hasAnswers) status = 'in_progress';
      }

      const progress = this.calculateProgress(inspection, draft, status === 'synced');

      return {
        ...inspection,
        status,
        draft,
        completedAt,
        syncedAt,
        lastError,
        progress,
      };
    });
  },

  calculateSummary(inspections: InspectionWithState[]) {
    let assigned = 0;
    let inProgress = 0;
    let pendingSync = 0;
    let synced = 0;

    for (const insp of inspections) {
      if (insp.status === 'synced') synced += 1;
      else if (
        insp.status === 'pending_sync' ||
        insp.status === 'sync_failed' ||
        insp.status === 'syncing'
      )
        pendingSync += 1;
      else if (insp.status === 'in_progress') inProgress += 1;
      else assigned += 1;
    }

    return { total: inspections.length, assigned, inProgress, pendingSync, synced };
  },
};
