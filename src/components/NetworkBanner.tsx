import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import tw from 'twrnc';
import { useInspections } from '@/features/inspections/context/InspectionContext';
import { useRouter } from 'expo-router';

export const NetworkBanner: React.FC = () => {
  const { isOnline, isSimulatingOffline, isSyncing, outbox, syncNow, toggleSimulateOffline } =
    useInspections();
  const router = useRouter();

  const pendingCount = outbox.filter(
    (item) => item.status === 'pending' || item.status === 'failed'
  ).length;

  const handleSyncPress = async () => {
    if (!isSyncing) {
      await syncNow();
    }
  };

  // If online and no pending items and not simulating offline, render sleek mini bar
  if (isOnline && pendingCount === 0 && !isSimulatingOffline) {
    return (
      <View style={tw`bg-emerald-600 px-4 py-1.5 flex-row items-center justify-between`}>
        <View style={tw`flex-row items-center`}>
          <View style={tw`w-2 h-2 rounded-full bg-emerald-200 mr-2`} />
          <Text style={tw`text-white text-xs font-medium`}>Connected to Office</Text>
        </View>
        <TouchableOpacity
          onPress={toggleSimulateOffline}
          accessibilityRole="button"
          accessibilityLabel="Simulate basement offline mode"
          style={tw`bg-emerald-700/60 px-2 py-0.5 rounded`}>
          <Text style={tw`text-emerald-100 text-[10px]`}>Test Offline</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Offline or has pending items
  const bgColor = !isOnline ? 'bg-amber-600' : 'bg-blue-600';

  return (
    <View style={tw`${bgColor} px-4 py-2 flex-row items-center justify-between shadow-sm`}>
      <View style={tw`flex-1 mr-2`}>
        <View style={tw`flex-row items-center`}>
          <View
            style={tw`w-2.5 h-2.5 rounded-full ${!isOnline ? 'bg-amber-200' : 'bg-blue-200'} mr-2`}
          />
          <Text style={tw`text-white font-bold text-xs`}>
            {!isOnline
              ? isSimulatingOffline
                ? 'Basement Mode (Simulated Offline)'
                : 'Working Offline'
              : 'Connected'}
          </Text>
        </View>
        <Text style={tw`text-white/90 text-[11px] mt-0.5`}>
          {pendingCount > 0
            ? `${pendingCount} completed inspection${pendingCount > 1 ? 's' : ''} queued locally`
            : 'All recordings are saved safely on this device'}
        </Text>
      </View>

      <View style={tw`flex-row items-center gap-1.5`}>
        {pendingCount > 0 && (
          <TouchableOpacity
            onPress={() => router.push('/outbox')}
            accessibilityRole="button"
            accessibilityLabel="View Outbox"
            style={tw`bg-black/20 px-2 py-1 rounded`}>
            <Text style={tw`text-white text-[11px] font-semibold`}>Outbox</Text>
          </TouchableOpacity>
        )}

        {isOnline ? (
          <TouchableOpacity
            onPress={handleSyncPress}
            disabled={isSyncing}
            accessibilityRole="button"
            accessibilityLabel="Sync Now"
            style={tw`bg-white px-2.5 py-1 rounded flex-row items-center shadow-sm`}>
            {isSyncing ? (
              <ActivityIndicator size="small" color="#2563EB" style={tw`mr-1`} />
            ) : null}
            <Text style={tw`text-blue-700 font-bold text-xs`}>
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={toggleSimulateOffline}
            accessibilityRole="button"
            accessibilityLabel="Go Online"
            style={tw`bg-black/20 px-2 py-1 rounded`}>
            <Text style={tw`text-white text-[11px] font-medium`}>
              {isSimulatingOffline ? 'Go Online' : 'Offline'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
