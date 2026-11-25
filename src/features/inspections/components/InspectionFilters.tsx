import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import tw from 'twrnc';
import type { FilterTab } from '../types';

interface InspectionFiltersProps {
  selectedTab: FilterTab;
  onSelectTab: (tab: FilterTab) => void;
  counts: {
    all: number;
    actionNeeded: number;
    queued: number;
    synced: number;
  };
}

export const InspectionFilters: React.FC<InspectionFiltersProps> = ({
  selectedTab,
  onSelectTab,
  counts,
}) => {
  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: counts.all },
    { key: 'action_needed', label: 'To Do', count: counts.actionNeeded },
    { key: 'queued', label: 'Queued', count: counts.queued },
    { key: 'synced', label: 'Completed', count: counts.synced },
  ];

  return (
    <View style={tw`border-b border-slate-200 bg-white`}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={tw`px-4 py-2 flex-row gap-2`}>
        {tabs.map((tab) => {
          const isSelected = selectedTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => onSelectTab(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${tab.label} (${tab.count})`}
              style={tw`px-3.5 py-1.5 rounded-full flex-row items-center ${
                isSelected ? 'bg-slate-900' : 'bg-slate-100'
              }`}>
              <Text
                style={tw`text-xs font-semibold ${
                  isSelected ? 'text-white' : 'text-slate-600'
                }`}>
                {tab.label}
              </Text>
              <View
                style={tw`ml-1.5 px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-slate-700' : 'bg-slate-200'
                }`}>
                <Text
                  style={tw`text-[10px] font-bold ${
                    isSelected ? 'text-white' : 'text-slate-700'
                  }`}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
