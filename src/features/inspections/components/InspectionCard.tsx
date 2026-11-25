import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { useRouter } from 'expo-router';
import type { InspectionWithState } from '../types';
import { StatusBadge } from './StatusBadge';
import { InspectionProgressBar } from './InspectionProgressBar';

interface InspectionCardProps {
  inspection: InspectionWithState;
}

function formatScheduleTime(isoString: string): { label: string; isPast: boolean } {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return { label: `Today, ${timeStr}`, isPast: date < now };
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return { label: `Yesterday, ${timeStr}`, isPast: true };
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return { label: `Tomorrow, ${timeStr}`, isPast: false };
    }

    return {
      label: `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`,
      isPast: date < now,
    };
  } catch {
    return { label: isoString, isPast: false };
  }
}

export const InspectionCard: React.FC<InspectionCardProps> = ({ inspection }) => {
  const router = useRouter();
  const schedule = formatScheduleTime(inspection.scheduledAt);

  const handlePress = () => {
    router.push({
      pathname: '/inspection/[id]',
      params: { id: inspection.id },
    });
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Open inspection for ${inspection.siteName}`}
      style={tw`bg-white rounded-xl p-4 mb-3 border border-slate-200 shadow-sm active:bg-slate-50`}>
      {/* Top Header: Schedule & Status */}
      <View style={tw`flex-row justify-between items-center mb-2`}>
        <View style={tw`flex-row items-center`}>
          <Text
            style={tw`text-xs font-semibold ${
              schedule.isPast && inspection.status !== 'synced'
                ? 'text-rose-600'
                : 'text-slate-500'
            }`}>
            {schedule.label}
          </Text>
        </View>
        <StatusBadge status={inspection.status} size="sm" />
      </View>

      {/* Site Name & Address */}
      <Text style={tw`text-base font-bold text-slate-900 mb-1`}>
        {inspection.siteName}
      </Text>
      <Text style={tw`text-xs text-slate-500 mb-3`} numberOfLines={2}>
        {inspection.address}
      </Text>

      {/* Progress */}
      <View style={tw`pt-2 border-t border-slate-100`}>
        <InspectionProgressBar progress={inspection.progress} />
      </View>

      {/* Sync Failure or Warning */}
      {inspection.status === 'sync_failed' && (
        <View style={tw`mt-2.5 bg-rose-50 border border-rose-200 rounded p-2`}>
          <Text style={tw`text-rose-700 text-[11px]`}>
            {inspection.lastError || 'Sync failed. Will retry automatically.'}
          </Text>
        </View>
      )}

      {/* Missing notes warning */}
      {inspection.progress.hasIncompleteFails && inspection.status !== 'synced' && (
        <View style={tw`mt-2 bg-amber-50 border border-amber-200 rounded p-1.5`}>
          <Text style={tw`text-amber-800 text-[11px] font-medium`}>
            * Note required for failed checklist item
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
