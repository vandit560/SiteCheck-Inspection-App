import { NetworkBanner } from '@/components/NetworkBanner';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { OutboxItemCard } from '../components/OutboxItemCard';
import { useOutbox } from '../hooks/useOutbox';
import type { OutboxItem } from '../types';

export const OutboxScreen: React.FC = () => {
  const router = useRouter();
  const {
    outbox,
    pendingItems,
    isOnline,
    isSyncing,
    syncFeedback,
    handleSyncAll,
  } = useOutbox();

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-100`}>
      <NetworkBanner />

      {/* Header */}
      <View style={tw`bg-white px-4 py-3.5 border-b border-slate-200 flex-row items-center`}>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Back to inspections"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={tw`w-9 h-9 rounded-full bg-slate-100 border border-slate-200 items-center justify-center mr-3 active:bg-slate-200`}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <View style={tw`flex-1`}>
          <Text style={tw`text-lg font-extrabold text-slate-900`}>Sync Outbox</Text>
          <Text style={tw`text-xs text-slate-500 mt-0.5`} numberOfLines={1}>
            {pendingItems.length > 0
              ? `${pendingItems.length} inspection${pendingItems.length > 1 ? 's' : ''} waiting to upload to the office`
              : 'All completed inspections have been synced'}
          </Text>
        </View>
      </View>

      {/* Feedback banner if triggered */}
      {syncFeedback && (
        <View style={tw`m-4 mb-0 bg-blue-50 border border-blue-200 rounded-xl p-3`}>
          <Text style={tw`text-xs text-blue-900 font-medium`}>{syncFeedback}</Text>
        </View>
      )}

      {/* Outbox List */}
      <FlatList<OutboxItem>
        data={outbox}
        keyExtractor={(item) => item.submission.inspectionId}
        renderItem={({ item }) => <OutboxItemCard item={item} />}
        contentContainerStyle={tw`p-4 pb-28`}
        ListEmptyComponent={
          <View style={tw`py-16 items-center justify-center`}>
            <Text style={tw`text-4xl mb-2`}>🎉</Text>
            <Text style={tw`text-base font-bold text-slate-700 mb-1`}>
              Outbox is empty
            </Text>
            <Text style={tw`text-xs text-slate-500 text-center px-8 leading-5`}>
              When you complete an inspection without network, it will be safely queued here and transmitted automatically once connectivity is detected.
            </Text>
          </View>
        }
      />

      {/* Bottom Sync Action Bar */}
      {pendingItems.length > 0 && (
        <View style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg`}>
          <TouchableOpacity
            onPress={handleSyncAll}
            disabled={isSyncing}
            accessibilityRole="button"
            accessibilityLabel="Sync all inspections"
            style={tw`py-3 rounded-xl items-center flex-row justify-center ${isOnline ? 'bg-blue-600' : 'bg-slate-400'
              }`}>
            {isSyncing ? (
              <ActivityIndicator size="small" color="#ffffff" style={tw`mr-2`} />
            ) : null}
            <Text style={tw`text-white font-bold text-xs`}>
              {isSyncing
                ? 'Uploading to Office...'
                : !isOnline
                  ? 'Offline - Waiting for Connection'
                  : `Upload ${pendingItems.length} Report${pendingItems.length > 1 ? 's' : ''} Now`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};
