import { NetworkBanner } from '@/components/NetworkBanner';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { InspectionCard } from '../components/InspectionCard';
import { InspectionFilters } from '../components/InspectionFilters';
import { useInspectionList } from '../hooks/useInspectionList';
import type { InspectionWithState } from '../types';

export const InspectionListScreen: React.FC = () => {
  const router = useRouter();
  const {
    inspections,
    isLoading,
    isRefreshing,
    selectedTab,
    setSelectedTab,
    searchQuery,
    setSearchQuery,
    counts,
    onRefresh,
  } = useInspectionList();

  return (
    <SafeAreaView style={tw`flex-1 bg-slate-100`}>
      {/* Network & Offline Status Banner */}
      <NetworkBanner />

      {/* Main Top Header */}
      <View style={tw`bg-white px-4 pt-3 pb-3 border-b border-slate-200`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <View>
            <Text style={tw`text-xs font-semibold uppercase tracking-wider text-slate-500`}>
              Field Safety Inspector
            </Text>
            <Text style={tw`text-xl font-extrabold text-slate-900`}>
              SiteCheck
            </Text>
          </View>
          <View style={tw`flex-row items-center gap-2`}>
            <TouchableOpacity
              onPress={() => router.push('/outbox')}
              accessibilityRole="button"
              accessibilityLabel="Outbox"
              style={tw`bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300 flex-row items-center`}>
              <Text style={tw`text-xs font-bold text-slate-800`}>Outbox</Text>
              {counts.queued > 0 && (
                <View style={tw`ml-1.5 bg-amber-500 px-1.5 py-0.2 rounded-full`}>
                  <Text style={tw`text-[10px] text-white font-bold`}>{counts.queued}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Settings and simulator"
              style={tw`bg-slate-100 p-2 rounded-lg border border-slate-300 items-center justify-center`}>
              <Ionicons name="settings-outline" size={17} color="#334155" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={tw`bg-slate-100 rounded-lg px-3 py-2 border border-slate-200 flex-row items-center`}>
          <Ionicons name="search" size={15} color="#94a3b8" style={tw`mr-2`} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by site name or location..."
            placeholderTextColor="#94a3b8"
            style={tw`flex-1 text-xs text-slate-800 py-0`}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <InspectionFilters
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        counts={counts}
      />

      {/* Inspection List */}
      {isLoading && !isRefreshing ? (
        <View style={tw`flex-1 justify-center items-center p-6`}>
          <ActivityIndicator size="large" color="#0f172a" />
          <Text style={tw`text-xs text-slate-500 mt-3 font-medium`}>
            Loading assigned inspections...
          </Text>
        </View>
      ) : (
        <FlatList<InspectionWithState>
          data={inspections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <InspectionCard inspection={item} />}
          contentContainerStyle={tw`p-4 pb-12`}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#0f172a"
            />
          }
          ListEmptyComponent={
            <View style={tw`py-12 items-center justify-center`}>
              <Text style={tw`text-3xl mb-2`}>📋</Text>
              <Text style={tw`text-base font-bold text-slate-700 mb-1`}>
                No inspections found
              </Text>
              <Text style={tw`text-xs text-slate-500 text-center px-8`}>
                {searchQuery
                  ? `No matches for "${searchQuery}". Clear your search query.`
                  : 'All inspections in this filter are up to date.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};
