import React from 'react';
import {
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInspections } from '@/features/inspections/context/InspectionContext';
import { NetworkBanner } from '@/components/NetworkBanner';

export const SettingsScreen: React.FC = () => {
  const router = useRouter();
  const {
    isOnline,
    isSimulatingOffline,
    toggleSimulateOffline,
    resetAllData,
    syncSummary,
  } = useInspections();

  const handleReset = () => {
    Alert.alert(
      'Reset All Local Data',
      'This will clear local drafts, outbox queue, and cached inspections, restoring the mock state from the server. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            Alert.alert('Reset Complete', 'Local data has been reset.');
          },
        },
      ]
    );
  };

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
          <Text style={tw`text-lg font-extrabold text-slate-900`}>
            Settings & Diagnostics
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={tw`p-4 pb-16`}>
        {/* Offline Testing Simulation */}
        <View style={tw`bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm`}>
          <Text style={tw`text-xs font-bold text-slate-500 uppercase tracking-wider mb-3`}>
            Offline Simulation
          </Text>

          <View style={tw`flex-row justify-between items-center mb-2`}>
            <View style={tw`flex-1 mr-3`}>
              <Text style={tw`text-sm font-bold text-slate-900`}>
                Simulate Basement / No Signal
              </Text>
              <Text style={tw`text-xs text-slate-500 mt-0.5 leading-4`}>
                Forces the app to behave as if there is zero network connectivity. Useful for testing outbox queuing and offline checklist filling.
              </Text>
            </View>
            <Switch
              value={isSimulatingOffline}
              onValueChange={toggleSimulateOffline}
              trackColor={{ false: '#cbd5e1', true: '#f59e0b' }}
              thumbColor={isSimulatingOffline ? '#ffffff' : '#ffffff'}
            />
          </View>

          <View style={tw`mt-2 bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex-row items-center`}>
            <View
              style={tw`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'} mr-2`}
            />
            <Text style={tw`text-xs font-medium text-slate-700`}>
              Effective Status: {isOnline ? 'Connected to Office' : 'Operating Offline'}
            </Text>
          </View>
        </View>

        {/* Local Storage Stats */}
        <View style={tw`bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm`}>
          <Text style={tw`text-xs font-bold text-slate-500 uppercase tracking-wider mb-3`}>
            Local Storage & Sync Status
          </Text>

          <View style={tw`flex-row justify-between py-1.5 border-b border-slate-100`}>
            <Text style={tw`text-xs text-slate-600`}>Total Inspections</Text>
            <Text style={tw`text-xs font-bold text-slate-900`}>{syncSummary.total}</Text>
          </View>

          <View style={tw`flex-row justify-between py-1.5 border-b border-slate-100`}>
            <Text style={tw`text-xs text-slate-600`}>To Do (Assigned)</Text>
            <Text style={tw`text-xs font-bold text-slate-700`}>{syncSummary.assigned}</Text>
          </View>

          <View style={tw`flex-row justify-between py-1.5 border-b border-slate-100`}>
            <Text style={tw`text-xs text-slate-600`}>In Progress (Drafts)</Text>
            <Text style={tw`text-xs font-bold text-indigo-700`}>{syncSummary.inProgress}</Text>
          </View>

          <View style={tw`flex-row justify-between py-1.5 border-b border-slate-100`}>
            <Text style={tw`text-xs text-slate-600`}>Outbox (Queued)</Text>
            <Text style={tw`text-xs font-bold text-amber-700`}>{syncSummary.pendingSync}</Text>
          </View>

          <View style={tw`flex-row justify-between py-1.5`}>
            <Text style={tw`text-xs text-slate-600`}>Synced with Office</Text>
            <Text style={tw`text-xs font-bold text-emerald-700`}>{syncSummary.synced}</Text>
          </View>
        </View>

        {/* Offline Architecture Notes */}
        <View style={tw`bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm`}>
          <Text style={tw`text-xs font-bold text-slate-500 uppercase tracking-wider mb-2`}>
            Architecture Guarantees
          </Text>
          <Text style={tw`text-xs text-slate-600 leading-5 mb-2`}>
            • <Text style={tw`font-bold`}>Zero Data Loss:</Text> Every single pass/fail tap and note keystroke is persisted immediately to local device storage.
          </Text>
          <Text style={tw`text-xs text-slate-600 leading-5 mb-2`}>
            • <Text style={tw`font-bold`}>Automatic Transmission:</Text> Outbox items retry automatically when the device recovers network connectivity.
          </Text>
          <Text style={tw`text-xs text-slate-600 leading-5`}>
            • <Text style={tw`font-bold`}>Resilience:</Text> Handles random server 500 errors and 409 idempotency conflicts gracefully.
          </Text>
        </View>

        {/* Reset button */}
        <TouchableOpacity
          onPress={handleReset}
          accessibilityRole="button"
          accessibilityLabel="Reset all data"
          style={tw`bg-rose-50 border border-rose-300 py-3 rounded-xl items-center`}>
          <Text style={tw`text-rose-700 font-bold text-xs`}>
            Reset Local Storage & Seed
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
