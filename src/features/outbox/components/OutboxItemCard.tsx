import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import type { OutboxItem } from '../types';

interface OutboxItemCardProps {
  item: OutboxItem;
}

export const OutboxItemCard: React.FC<OutboxItemCardProps> = ({ item }) => {
  const { submission, siteName, address, status, attempts, lastError, syncedAt } = item;
  const failCount = submission.results.filter((r) => r.result === 'FAIL').length;
  const passCount = submission.results.filter((r) => r.result === 'PASS').length;

  let badgeBg = 'bg-amber-100';
  let badgeText = 'text-amber-800';
  let statusLabel = 'Queued Locally';

  if (status === 'synced') {
    badgeBg = 'bg-emerald-100';
    badgeText = 'text-emerald-800';
    statusLabel = 'Transmitted';
  } else if (status === 'syncing') {
    badgeBg = 'bg-blue-100';
    badgeText = 'text-blue-800';
    statusLabel = 'Transmitting...';
  } else if (status === 'failed') {
    badgeBg = 'bg-rose-100';
    badgeText = 'text-rose-800';
    statusLabel = `Retry Pending (${attempts})`;
  }

  return (
    <View style={tw`bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm`}>
      <View style={tw`flex-row justify-between items-center mb-1.5`}>
        <Text style={tw`text-xs font-semibold text-slate-500`}>
          Completed {new Date(submission.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <View style={tw`${badgeBg} px-2.5 py-0.5 rounded-full`}>
          <Text style={tw`${badgeText} text-[11px] font-bold`}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={tw`text-base font-bold text-slate-900 mb-0.5`}>{siteName}</Text>
      <Text style={tw`text-xs text-slate-500 mb-2.5`}>{address}</Text>

      <View style={tw`flex-row items-center gap-3 pt-2 border-t border-slate-100`}>
        <Text style={tw`text-xs text-slate-600`}>
          {submission.results.length} items checked
        </Text>
        <Text style={tw`text-xs text-emerald-700 font-semibold`}>
          {passCount} Pass
        </Text>
        {failCount > 0 && (
          <Text style={tw`text-xs text-rose-700 font-semibold`}>
            {failCount} Fail
          </Text>
        )}
      </View>

      {lastError && status !== 'synced' && (
        <View style={tw`mt-2 bg-rose-50 border border-rose-200 rounded p-2`}>
          <Text style={tw`text-rose-700 text-[11px]`}>⚠️ {lastError}</Text>
        </View>
      )}

      {syncedAt && (
        <View style={tw`mt-2 bg-emerald-50 border border-emerald-200 rounded p-2`}>
          <Text style={tw`text-emerald-700 text-[11px]`}>
            ✓ Received at {new Date(syncedAt).toLocaleTimeString()}
          </Text>
        </View>
      )}
    </View>
  );
};
