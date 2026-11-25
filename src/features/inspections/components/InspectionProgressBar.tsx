import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';
import type { ChecklistProgress } from '../types';

interface InspectionProgressBarProps {
  progress: ChecklistProgress;
  showLabels?: boolean;
}

export const InspectionProgressBar: React.FC<InspectionProgressBarProps> = ({
  progress,
  showLabels = true,
}) => {
  const { answered, total, passCount, failCount, naCount } = progress;
  const percent = total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0;
  const hasBreakdown = passCount + failCount + naCount > 0;

  return (
    <View style={tw`w-full`}>
      {showLabels && (
        <View style={tw`flex-row justify-between items-center mb-1.5`}>
          <Text style={tw`text-xs text-slate-600 font-medium`}>
            {answered} of {total} items checked ({percent}%)
          </Text>
          <View style={tw`flex-row items-center gap-2`}>
            {passCount > 0 && (
              <Text style={tw`text-[11px] text-emerald-700 font-semibold`}>
                {passCount} Pass
              </Text>
            )}
            {failCount > 0 && (
              <Text style={tw`text-[11px] text-rose-700 font-semibold`}>
                {failCount} Fail
              </Text>
            )}
            {naCount > 0 && (
              <Text style={tw`text-[11px] text-slate-500`}>
                {naCount} N/A
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Progress Track */}
      <View style={tw`h-2.5 bg-slate-200 rounded-full overflow-hidden w-full flex-row`}>
        {hasBreakdown ? (
          <>
            {failCount > 0 && (
              <View
                style={[
                  tw`h-2.5 bg-rose-500`,
                  { width: `${(failCount / total) * 100}%` },
                ]}
              />
            )}
            {passCount > 0 && (
              <View
                style={[
                  tw`h-2.5 bg-emerald-500`,
                  { width: `${(passCount / total) * 100}%` },
                ]}
              />
            )}
            {naCount > 0 && (
              <View
                style={[
                  tw`h-2.5 bg-slate-400`,
                  { width: `${(naCount / total) * 100}%` },
                ]}
              />
            )}
          </>
        ) : (
          percent > 0 && (
            <View
              style={[
                tw`h-2.5 bg-emerald-500`,
                { width: `${percent}%` },
              ]}
            />
          )
        )}
      </View>
    </View>
  );
};
