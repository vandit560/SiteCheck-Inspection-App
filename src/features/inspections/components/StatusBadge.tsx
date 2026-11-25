import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import type { InspectionStatus } from '../types';

interface StatusBadgeProps {
  status: InspectionStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSm = size === 'sm';
  const paddingStyle = isSm ? 'px-2 py-0.5' : 'px-2.5 py-1';
  const textStyle = isSm ? 'text-[11px]' : 'text-xs';

  switch (status) {
    case 'synced':
      return (
        <View style={tw`bg-emerald-100 rounded-full flex-row items-center ${paddingStyle}`}>
          <View style={tw`w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5`} />
          <Text style={tw`text-emerald-800 font-medium ${textStyle}`}>Synced</Text>
        </View>
      );
    case 'pending_sync':
      return (
        <View style={tw`bg-amber-100 rounded-full flex-row items-center ${paddingStyle}`}>
          <View style={tw`w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5`} />
          <Text style={tw`text-amber-800 font-medium ${textStyle}`}>Queued Offline</Text>
        </View>
      );
    case 'syncing':
      return (
        <View style={tw`bg-blue-100 rounded-full flex-row items-center ${paddingStyle}`}>
          <View style={tw`w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5`} />
          <Text style={tw`text-blue-800 font-medium ${textStyle}`}>Syncing...</Text>
        </View>
      );
    case 'sync_failed':
      return (
        <View style={tw`bg-rose-100 rounded-full flex-row items-center ${paddingStyle}`}>
          <View style={tw`w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5`} />
          <Text style={tw`text-rose-800 font-medium ${textStyle}`}>Retry Queued</Text>
        </View>
      );
    case 'in_progress':
      return (
        <View style={tw`bg-indigo-100 rounded-full flex-row items-center ${paddingStyle}`}>
          <View style={tw`w-1.5 h-1.5 rounded-full bg-indigo-600 mr-1.5`} />
          <Text style={tw`text-indigo-800 font-medium ${textStyle}`}>In Progress</Text>
        </View>
      );
    case 'assigned':
    default:
      return (
        <View style={tw`bg-slate-100 rounded-full flex-row items-center ${paddingStyle}`}>
          <View style={tw`w-1.5 h-1.5 rounded-full bg-slate-500 mr-1.5`} />
          <Text style={tw`text-slate-700 font-medium ${textStyle}`}>Assigned</Text>
        </View>
      );
  }
};
