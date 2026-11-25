import { NetworkBanner } from '@/components/NetworkBanner';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { ChecklistItemRow } from '../components/ChecklistItemRow';
import { InspectionProgressBar } from '../components/InspectionProgressBar';
import { StatusBadge } from '../components/StatusBadge';
import { useInspectionDetail } from '../hooks/useInspectionDetail';

export const InspectionDetailScreen: React.FC = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    inspection,
    checklist,
    draftItems,
    isReadOnly,
    isSubmitting,
    validation,
    submissionFeedback,
    handleAnswer,
    handleNoteChange,
    handleSubmit,
    dismissFeedback,
  } = useInspectionDetail(id);

  if (!inspection) {
    return (
      <SafeAreaView style={tw`flex-1 bg-slate-100 justify-center items-center p-4`}>
        <Text style={tw`text-base font-bold text-slate-800 mb-2`}>Inspection not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={tw`bg-slate-900 px-4 py-2 rounded-lg`}>
          <Text style={tw`text-white font-medium text-xs`}>Back to List</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-100`}>
      <NetworkBanner />

      {/* Header Bar */}
      <View style={tw`bg-white px-4 py-3 border-b border-slate-200`}>
        <View style={tw`flex-row justify-between items-center mb-2`}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to inspections"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={tw`w-9 h-9 rounded-full bg-slate-100 border border-slate-200 items-center justify-center active:bg-slate-200`}>
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>
          <StatusBadge status={inspection.status} size="sm" />
        </View>

        <Text style={tw`text-lg font-bold text-slate-900 mb-0.5`}>
          {inspection.siteName}
        </Text>
        <Text style={tw`text-xs text-slate-500 mb-3`}>{inspection.address}</Text>

        {/* Progress Bar */}
        <InspectionProgressBar progress={inspection.progress} />
      </View>

      {/* Checklist items list */}
      <ScrollView
        contentContainerStyle={tw`p-4 pb-28`}
        showsVerticalScrollIndicator={false}>
        {isReadOnly && (
          <View style={tw`bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4`}>
            <Text style={tw`text-emerald-800 font-bold text-xs mb-0.5`}>
              ✓ Inspection Submitted
            </Text>
            <Text style={tw`text-emerald-700 text-[11px]`}>
              {inspection.status === 'synced'
                ? `Received by office at ${new Date(inspection.syncedAt || '').toLocaleTimeString()}`
                : 'Safely recorded on device. Queued for transmission to office.'}
            </Text>
          </View>
        )}

        <Text style={tw`text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 px-1`}>
          Safety Checklist ({checklist.length} items)
        </Text>

        {checklist.map((item, index) => (
          <ChecklistItemRow
            key={item.id}
            item={item}
            itemNumber={index + 1}
            draftState={draftItems[item.id]}
            readOnly={isReadOnly}
            onSelectResult={(result) => handleAnswer(item.id, result)}
            onUpdateNote={(note) => handleNoteChange(item.id, note)}
          />
        ))}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      {!isReadOnly && (
        <View style={tw`absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg`}>
          {validation.errors.length > 0 && (
            <View style={tw`mb-2 bg-amber-50 border border-amber-200 rounded-lg p-2`}>
              {validation.errors.map((err, idx) => (
                <Text key={idx} style={tw`text-[11px] text-amber-800 font-medium`}>
                  • {err}
                </Text>
              ))}
            </View>
          )}

          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Save draft and exit"
              style={tw`flex-1 py-3 bg-slate-100 rounded-xl border border-slate-300 items-center`}>
              <Text style={tw`text-xs font-bold text-slate-700`}>Save & Exit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!validation.isValid || isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Submit inspection report"
              style={tw`flex-2 py-3 rounded-xl items-center flex-row justify-center shadow-sm ${validation.isValid && !isSubmitting ? 'bg-emerald-600' : 'bg-slate-300'
                }`}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" style={tw`mr-2`} />
              ) : null}
              <Text style={tw`text-xs font-bold text-white`}>
                {isSubmitting ? 'Recording...' : 'Submit Inspection'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Submission Feedback Modal */}
      <Modal
        visible={Boolean(submissionFeedback?.visible)}
        transparent
        animationType="fade"
        onRequestClose={dismissFeedback}>
        <View style={tw`flex-1 bg-black/50 justify-center items-center p-6`}>
          <View style={tw`bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl`}>
            <View style={tw`w-12 h-12 rounded-full ${submissionFeedback?.syncedImmediately ? 'bg-emerald-100' : 'bg-amber-100'
              } items-center justify-center self-center mb-3`}>
              <Text style={tw`text-2xl`}>
                {submissionFeedback?.syncedImmediately ? '✓' : '📦'}
              </Text>
            </View>

            <Text style={tw`text-base font-bold text-slate-900 text-center mb-1`}>
              {submissionFeedback?.syncedImmediately
                ? 'Inspection Transmitted!'
                : 'Saved Offline Safely'}
            </Text>

            <Text style={tw`text-xs text-slate-600 text-center mb-5 leading-5`}>
              {submissionFeedback?.syncedImmediately
                ? 'Your inspection checklist was successfully sent and recorded by the office.'
                : 'Your inspection is safely stored on this device. It will automatically upload to the office as soon as network is detected.'}
            </Text>

            <TouchableOpacity
              onPress={() => {
                dismissFeedback();
                router.back();
              }}
              style={tw`bg-slate-900 py-3 rounded-xl items-center`}>
              <Text style={tw`text-white font-bold text-xs`}>Back to Inspections</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
