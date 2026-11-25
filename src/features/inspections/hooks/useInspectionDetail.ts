import { useState, useMemo, useCallback } from 'react';
import { useInspections } from '../context/InspectionContext';
import type { InspectionWithState, DraftItemState } from '../types';

export function useInspectionDetail(id: string | undefined) {
  const {
    inspections,
    saveAnswer,
    saveNote,
    submitInspectionReport,
    isOnline,
    isSyncing,
  } = useInspections();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    visible: boolean;
    success: boolean;
    syncedImmediately: boolean;
    message: string;
  } | null>(null);

  // Find target inspection
  const inspection: InspectionWithState | undefined = useMemo(() => {
    if (!id) return undefined;
    return inspections.find((i) => i.id === id);
  }, [inspections, id]);

  const draft = inspection?.draft;
  const isReadOnly = inspection?.status === 'synced' || inspection?.status === 'pending_sync';

  // Validation checks
  const validation = useMemo(() => {
    if (!inspection) {
      return { isValid: false, unansweredCount: 0, missingFailNotesCount: 0, errors: [] };
    }

    const items = inspection.checklist || [];
    const draftItems = draft?.items || {};

    let unansweredCount = 0;
    let missingFailNotesCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      const state = draftItems[item.id];
      if (!state || !state.result) {
        unansweredCount += 1;
      } else if (state.result === 'FAIL' && (!state.note || !state.note.trim())) {
        missingFailNotesCount += 1;
      }
    }

    if (unansweredCount > 0) {
      errors.push(`${unansweredCount} item${unansweredCount > 1 ? 's' : ''} not answered yet.`);
    }

    if (missingFailNotesCount > 0) {
      errors.push(
        `Note missing for ${missingFailNotesCount} failed item${
          missingFailNotesCount > 1 ? 's' : ''
        }.`
      );
    }

    return {
      isValid: unansweredCount === 0 && missingFailNotesCount === 0,
      unansweredCount,
      missingFailNotesCount,
      errors,
    };
  }, [inspection, draft]);

  // Handle answering an item
  const handleAnswer = useCallback(
    async (itemId: string, result: 'PASS' | 'FAIL' | 'NA') => {
      if (!id || isReadOnly) return;
      await saveAnswer(id, itemId, result);
    },
    [id, isReadOnly, saveAnswer]
  );

  // Handle updating an item's note
  const handleNoteChange = useCallback(
    async (itemId: string, note: string) => {
      if (!id || isReadOnly) return;
      await saveNote(id, itemId, note);
    },
    [id, isReadOnly, saveNote]
  );

  // Handle submission
  const handleSubmit = useCallback(async () => {
    if (!id || !validation.isValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await submitInspectionReport(id);

      setSubmissionFeedback({
        visible: true,
        success: result.success,
        syncedImmediately: result.syncedImmediately,
        message: result.error || 'Inspection completed successfully!',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [id, validation.isValid, isSubmitting, submitInspectionReport]);

  const dismissFeedback = useCallback(() => {
    setSubmissionFeedback(null);
  }, []);

  return {
    inspection,
    checklist: inspection?.checklist || [],
    draftItems: (draft?.items || {}) as Record<string, DraftItemState>,
    isReadOnly,
    isOnline,
    isSyncing,
    isSubmitting,
    validation,
    submissionFeedback,
    handleAnswer,
    handleNoteChange,
    handleSubmit,
    dismissFeedback,
  };
}
