import { useState, useMemo, useCallback } from 'react';
import { useInspections } from '../context/InspectionContext';
import type { FilterTab } from '../types';

export function useInspectionList() {
  const { inspections, isLoading, isOnline, refreshInspections, syncSummary } = useInspections();
  const [selectedTab, setSelectedTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tab counts
  const counts = useMemo(() => {
    let actionNeeded = 0;
    let queued = 0;
    let synced = 0;

    for (const item of inspections) {
      if (item.status === 'synced') {
        synced += 1;
      } else if (
        item.status === 'pending_sync' ||
        item.status === 'syncing' ||
        item.status === 'sync_failed'
      ) {
        queued += 1;
      } else {
        actionNeeded += 1;
      }
    }

    return {
      all: inspections.length,
      actionNeeded,
      queued,
      synced,
    };
  }, [inspections]);

  // Filtered and searched inspections
  const filteredInspections = useMemo(() => {
    return inspections.filter((item) => {
      // Tab filter
      if (selectedTab === 'action_needed') {
        if (item.status === 'synced' || item.status === 'pending_sync' || item.status === 'syncing') {
          return false;
        }
      } else if (selectedTab === 'queued') {
        if (
          item.status !== 'pending_sync' &&
          item.status !== 'syncing' &&
          item.status !== 'sync_failed'
        ) {
          return false;
        }
      } else if (selectedTab === 'synced') {
        if (item.status !== 'synced') {
          return false;
        }
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.siteName.toLowerCase().includes(q);
        const matchesAddress = item.address.toLowerCase().includes(q);
        return matchesName || matchesAddress;
      }

      return true;
    });
  }, [inspections, selectedTab, searchQuery]);

  // Handle pull to refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshInspections();
    setIsRefreshing(false);
  }, [refreshInspections]);

  return {
    inspections: filteredInspections,
    totalCount: inspections.length,
    isLoading,
    isRefreshing,
    isOnline,
    selectedTab,
    setSelectedTab,
    searchQuery,
    setSearchQuery,
    counts,
    syncSummary,
    onRefresh,
  };
}
