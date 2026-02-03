import { View, FlatList, Pressable, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/nativewindui/Text';
import { useExpenseStore, Transaction } from '@/store/expenseStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { Icon } from '@/components/nativewindui/Icon';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColorScheme } from '@/lib/useColorScheme';

export default function AnalysisScreen() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const { transactions, fetchRecentTransactions, deleteTransaction } = useExpenseStore();
  
  // Date range state
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d;
  });
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    fetchRecentTransactions(db);
  }, [db]);

  // Filter logic with date range
  const filteredData = useMemo(() => {
    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      return isWithinInterval(tDate, { 
        start: startOfDay(startDate), 
        end: endOfDay(endDate) 
      });
    });
  }, [startDate, endDate, transactions]);

  const totalFiltered = useMemo(() => {
    return filteredData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [filteredData]);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; icon: string }>();
    filteredData.forEach(t => {
      const name = t.category_name || 'Uncategorized';
      const icon = t.category_icon || '';
      const current = map.get(name) || { total: 0, icon };
      map.set(name, { total: current.total + t.amount, icon: current.icon || icon });
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, total: data.total, icon: data.icon }))
      .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  const handleDeleteTransaction = useCallback(async (id: number, note: string) => {
    Alert.alert(
      "Hapus Transaksi",
      `Yakin ingin menghapus transaksi "${note}"?`,
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            await deleteTransaction(db, id);
            fetchRecentTransactions(db);
          }
        }
      ]
    );
  }, [db, deleteTransaction, fetchRecentTransactions]);

  const renderTransaction = useCallback(({ item }: { item: Transaction }) => (
    <View 
      className="px-5 py-4 flex-row items-center gap-4 bg-white dark:bg-gray-900 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 mb-3 mx-5"
    >
      {/* Emoji Circle */}
      <View className="w-12 h-12 rounded-full items-center justify-center bg-gray-50 dark:bg-gray-800">
        {item.category_icon?.startsWith('emoji:') ? (
          <Text className="text-xl">{item.category_icon.replace('emoji:', '')}</Text>
        ) : (
          <Icon name="circle.fill" size={24} color="gray" />
        )}
      </View>

      {/* Transaction Info */}
      <View className="flex-1">
        <Text className="font-bold text-[17px] mb-0.5">{item.note || 'No note'}</Text>
        <Text className="text-gray-500 text-[16px]">{item.category_name}</Text>
        <Text className="text-gray-400 text-[14px] mt-1">{format(parseISO(item.date), 'dd MMM yyyy', { locale: id })}</Text>
      </View>

      {/* Amount & Delete */}
      <View className="items-end gap-2">
        <Text className="font-bold text-[18px]">-Rp {item.amount.toLocaleString('id-ID')}</Text>
        
        {/* Delete Button */}
        <Pressable 
          onPress={() => handleDeleteTransaction(item.id, item.note || 'transaksi ini')}
          className="p-1"
        >
          <Icon name="trash" size={18} color="#EF4444" />
        </Pressable>
      </View>
    </View>
  ), [handleDeleteTransaction]);

  const ListHeader = useMemo(() => (
    <View className="px-5 pt-5 pb-2">
      {/* Total */}


      {/* Breakdown Cards */}
      <View className="mb-6">
        <Text variant="title3" className="font-bold mb-4">Breakdown</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row -mx-5 px-5" contentContainerStyle={{ paddingRight: 20 }}>
          {categoryBreakdown.map((item) => (
            <View key={item.name} className="mr-3">
              {/* Main Category Card */}
              <View 
                className="w-28 h-32 p-3 rounded-t-[24px] flex-col items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 border-b-0 shadow-sm"
              >
                {/* Emoji - smaller */}
                <View className="flex-1 items-center justify-center">
                  {item.icon?.startsWith('emoji:') ? (
                    <Text className="text-3xl">{item.icon.replace('emoji:', '')}</Text>
                  ) : (
                    <Icon name="circle.fill" size={28} color="gray" />
                  )}
                </View>
                
                {/* Info */}
                <View className="w-full items-center">
                  <Text className="text-gray-500 dark:text-gray-400 text-sm mb-0.5" numberOfLines={1}>{item.name}</Text>
                  <Text className="text-gray-900 dark:text-white text-base font-bold">Rp {(item.total / 1000).toFixed(0)}k</Text>
                </View>
              </View>
              
              {/* Percentage Card - attached below */}
              <View className="w-28 py-2 rounded-b-[24px] bg-black dark:bg-white items-center justify-center">
                <Text className="text-white dark:text-black font-bold text-sm">{((item.total / (totalFiltered || 1)) * 100).toFixed(0)}%</Text>
              </View>
            </View>
          ))}
        </ScrollView>
        {categoryBreakdown.length === 0 && (
          <Text className="text-gray-400 text-center py-10">No expenses found for this period.</Text>
        )}
      </View>

      {/* All Transactions Header */}
      <Text variant="title3" className="font-bold mb-4">All Transactions</Text>
    </View>
  ), [categoryBreakdown, totalFiltered, filteredData.length]);
  
  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header with Date Range */}
      <View className="px-4 py-4 border-b dark:border-gray-800 border-gray-200 bg-background z-10">
        <Text className="text-2xl font-bold mb-4">Analytic</Text>
        
        {/* Date Range Picker - Pill Style */}
        <View className="flex-row items-center justify-center gap-3">
          <Pressable 
            onPress={() => setShowStartPicker(true)}
            className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <Icon name="calendar" size={16} color={colorScheme === 'dark' ? 'white' : 'black'} />
            <Text className="ml-2 font-medium">{format(startDate, 'dd MMM yyyy', { locale: id })}</Text>
          </Pressable>

          <Text className="text-gray-400">—</Text>

          <Pressable 
            onPress={() => setShowEndPicker(true)}
            className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <Icon name="calendar" size={16} color={colorScheme === 'dark' ? 'white' : 'black'} />
            <Text className="ml-2 font-medium">{format(endDate, 'dd MMM yyyy', { locale: id })}</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        ListHeaderComponent={() => ListHeader}
        ListEmptyComponent={() => (
          <View className="px-5">
            <Text className="text-gray-400 text-center py-10">No transactions found.</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}
    </View>
  );
}
