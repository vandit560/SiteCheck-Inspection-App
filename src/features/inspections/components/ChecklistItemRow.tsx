import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import tw from 'twrnc';
import type { ChecklistItem, DraftItemState } from '../types';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  itemNumber: number;
  draftState?: DraftItemState;
  readOnly?: boolean;
  onSelectResult: (result: 'PASS' | 'FAIL' | 'NA') => void;
  onUpdateNote: (note: string) => void;
}

export const ChecklistItemRow: React.FC<ChecklistItemRowProps> = ({
  item,
  itemNumber,
  draftState,
  readOnly = false,
  onSelectResult,
  onUpdateNote,
}) => {
  const result = draftState?.result;
  const note = draftState?.note ?? '';
  const [showOptionalNote, setShowOptionalNote] = useState(Boolean(note && result !== 'FAIL'));

  const isFail = result === 'FAIL';
  const isMissingFailNote = isFail && !note.trim();

  return (
    <View
      style={tw`bg-white rounded-xl p-4 mb-3 border ${
        isMissingFailNote ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
      } shadow-sm`}>
      {/* Item title & sequence number */}
      <View style={tw`flex-row items-start mb-3`}>
        <View
          style={tw`w-6 h-6 rounded-full bg-slate-100 items-center justify-center mr-2.5 mt-0.5`}>
          <Text style={tw`text-xs font-bold text-slate-700`}>{itemNumber}</Text>
        </View>
        <Text style={tw`flex-1 text-sm font-semibold text-slate-800 leading-5`}>
          {item.text}
        </Text>
      </View>

      {/* Action Buttons: PASS, FAIL, NA */}
      <View style={tw`flex-row gap-2 mb-2`}>
        {/* PASS */}
        <TouchableOpacity
          disabled={readOnly}
          onPress={() => onSelectResult('PASS')}
          accessibilityRole="button"
          accessibilityLabel={`Mark item ${itemNumber} as Pass`}
          style={tw`flex-1 py-2.5 rounded-lg border items-center ${
            result === 'PASS'
              ? 'bg-emerald-600 border-emerald-600 shadow-sm'
              : 'bg-white border-slate-300'
          }`}>
          <Text
            style={tw`text-xs font-bold ${
              result === 'PASS' ? 'text-white' : 'text-slate-700'
            }`}>
            PASS
          </Text>
        </TouchableOpacity>

        {/* FAIL */}
        <TouchableOpacity
          disabled={readOnly}
          onPress={() => onSelectResult('FAIL')}
          accessibilityRole="button"
          accessibilityLabel={`Mark item ${itemNumber} as Fail`}
          style={tw`flex-1 py-2.5 rounded-lg border items-center ${
            result === 'FAIL'
              ? 'bg-rose-600 border-rose-600 shadow-sm'
              : 'bg-white border-slate-300'
          }`}>
          <Text
            style={tw`text-xs font-bold ${
              result === 'FAIL' ? 'text-white' : 'text-slate-700'
            }`}>
            FAIL
          </Text>
        </TouchableOpacity>

        {/* NA */}
        <TouchableOpacity
          disabled={readOnly}
          onPress={() => onSelectResult('NA')}
          accessibilityRole="button"
          accessibilityLabel={`Mark item ${itemNumber} as Not Applicable`}
          style={tw`flex-1 py-2.5 rounded-lg border items-center ${
            result === 'NA'
              ? 'bg-slate-700 border-slate-700 shadow-sm'
              : 'bg-white border-slate-300'
          }`}>
          <Text
            style={tw`text-xs font-bold ${
              result === 'NA' ? 'text-white' : 'text-slate-700'
            }`}>
            N/A
          </Text>
        </TouchableOpacity>
      </View>

      {/* Note input for FAIL (Required) */}
      {isFail && (
        <View style={tw`mt-2 pt-2 border-t border-slate-100`}>
          <View style={tw`flex-row justify-between items-center mb-1`}>
            <Text style={tw`text-xs font-bold text-rose-700`}>
              Failure Reason * <Text style={tw`font-normal text-rose-500`}>(Required)</Text>
            </Text>
            {isMissingFailNote && (
              <Text style={tw`text-[10px] text-rose-600 font-medium`}>Must not be empty</Text>
            )}
          </View>
          <TextInput
            editable={!readOnly}
            multiline
            numberOfLines={2}
            value={note}
            onChangeText={onUpdateNote}
            placeholder="Describe the safety violation or hazard observed..."
            placeholderTextColor="#94a3b8"
            style={tw`border ${
              isMissingFailNote ? 'border-rose-400 bg-rose-50/50' : 'border-slate-300 bg-slate-50'
            } rounded-lg p-2.5 text-xs text-slate-800 min-h-16`}
          />
        </View>
      )}

      {/* Optional Note for PASS or NA */}
      {!isFail && (result === 'PASS' || result === 'NA') && (
        <View style={tw`mt-1`}>
          {showOptionalNote ? (
            <View style={tw`pt-2 border-t border-slate-100`}>
              <View style={tw`flex-row justify-between items-center mb-1`}>
                <Text style={tw`text-xs text-slate-600 font-medium`}>Observation note (optional):</Text>
                {!readOnly && (
                  <TouchableOpacity onPress={() => setShowOptionalNote(false)}>
                    <Text style={tw`text-[10px] text-slate-400`}>Hide</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                editable={!readOnly}
                multiline
                numberOfLines={2}
                value={note}
                onChangeText={onUpdateNote}
                placeholder="Optional notes or details..."
                placeholderTextColor="#94a3b8"
                style={tw`border border-slate-300 bg-slate-50 rounded-lg p-2 text-xs text-slate-800`}
              />
            </View>
          ) : !readOnly ? (
            <TouchableOpacity
              onPress={() => setShowOptionalNote(true)}
              style={tw`self-start py-1`}>
              <Text style={tw`text-[11px] text-blue-600 font-medium`}>+ Add note</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
};
