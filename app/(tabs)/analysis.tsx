import { View, ScrollView, Pressable, Dimensions, Alert } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { useExpenseStore } from '@/store/expenseStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState, useMemo } from 'react';
import { Icon } from '@/components/nativewindui/Icon';
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

export default function AnalysisScreen() {
  const db = useSQLiteContext();
  const { transactions, fetchRecentTransactions, deleteTransaction } = useExpenseStore();
  const [filterType, setFilterType] = useState<'month' | 'week' | 'all'>('month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchRecentTransactions(db);
  }, [db]);

  const filteredData = useMemo(() => {
      const now = new Date();
      let start = startOfMonth(now);
      let end = endOfMonth(now);

      if (filterType === 'week') {
          start = subDays(now, 7);
          end = now;
      } else if (filterType === 'all') {
          start = new Date(0);
      }

      return transactions.filter(t => {
          const tDate = parseISO(t.date);
          const inRange = filterType === 'all' || isWithinInterval(tDate, { start, end });
          const inCategory = selectedCategory ? t.category_name === selectedCategory : true;
          return inRange && inCategory;
      });
  }, [transactions, filterType, selectedCategory]);

  const totalFiltered = filteredData.reduce((acc, curr) => acc + curr.amount, 0);

  const categoryBreakdown = useMemo(() => {
      const stats: Record<string, number> = {};
      filteredData.forEach(t => {
          const key = t.category_name || 'Lainnya';
          stats[key] = (stats[key] || 0) + t.amount;
      });
      return Object.entries(stats)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);
  }, [filteredData]);

  const handleDeleteTransaction = (transactionId: number, transactionNote: string) => {
    Alert.alert(
      'Hapus Transaksi',
      `Yakin ingin menghapus transaksi "${transactionNote}"?`,
      [
        {
          text: 'Batal',
          style: 'cancel'
        },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await deleteTransaction(db, transactionId);
          }
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-background pt-safe">
      {/* Sticky Filter Bar */}
      <View className="px-4 py-4 border-b border-gray-100 bg-background z-10">
          <Text variant="title2" className="font-bold mb-4">Analytic</Text>
          <View className="flex-row gap-2">
              {(['month', 'week', 'all'] as const).map(type => (
                  <Pressable 
                    key={type}
                    onPress={() => setFilterType(type)}
                    className={`px-6 py-2 rounded-full border ${
                        filterType === type ? 'bg-black border-black dark:bg-white dark:border-white' : 'bg-transparent border-gray-300'
                    }`}
                  >
                        <Text className={`font-medium ${
                             filterType === type ? 'text-white dark:text-black' : 'text-gray-500'
                        }`}>
                            {type === 'month' ? 'This Month' : type === 'week' ? '7 Days' : 'All'}
                        </Text>
                  </Pressable>
              ))}
          </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20, paddingTop: 20 }}>
          
          {/* Total Expense Card */}
          <View className="items-center mb-10">
              <Text className="text-gray-500 font-medium mb-2 uppercase tracking-widest text-xs">Total Spending</Text>
              <Text className="text-5xl font-bold tracking-tighter">Rp {totalFiltered.toLocaleString('id-ID')}</Text>
          </View>

          {/* Breakdown List (Monochrome) */}
          <View className="mb-6">
              <Text variant="title3" className="font-bold mb-4">Breakdown</Text>
              {categoryBreakdown.map((item, index) => (
                  <View key={item.name} className="mb-6">
                      <View className="flex-row justify-between mb-2 items-end">
                          <Text className="font-bold text-lg">{item.name}</Text>
                          <View className="items-end">
                              <Text className="font-bold text-lg">Rp {item.total.toLocaleString('id-ID')}</Text>
                              <Text className="text-gray-400 text-xs">{((item.total / (totalFiltered || 1)) * 100).toFixed(1)}%</Text>
                          </View>
                      </View>
                      {/* Black Progress Bar */}
                      <View className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <View 
                            className="h-full bg-black dark:bg-white rounded-full" 
                            style={{ width: `${(item.total / (totalFiltered || 1)) * 100}%` }} 
                          />
                      </View>
                  </View>
              ))}
              {categoryBreakdown.length === 0 && (
                  <Text className="text-gray-400 text-center py-10">No expenses found for this period.</Text>
              )}
          </View>

          {/* All Transactions List */}
          <View className="mb-6">
              <Text variant="title3" className="font-bold mb-4">All Transactions</Text>
              {filteredData.length === 0 ? (
                  <Text className="text-gray-400 text-center py-10">No transactions found.</Text>
              ) : (
                  filteredData.map((transaction) => (
                      <View 
                          key={transaction.id} 
                          className="px-5 py-4 flex-row items-center gap-4 bg-white dark:bg-gray-900 rounded-[24px] shadow-sm border border-gray-100 dark:border-gray-800 mb-3"
                      >
                          {/* Emoji Circle */}
                          <View className="w-12 h-12 rounded-full items-center justify-center bg-gray-50 dark:bg-gray-800">
                              {transaction.category_icon?.replace('emoji:', '') ? (
                                  <Text className="text-xl">{transaction.category_icon.replace('emoji:', '')}</Text>
                              ) : (
                                 <Icon name="circle.fill" size={24} color="gray" />
                              )}
                          </View>

                          {/* Transaction Info */}
                          <View className="flex-1">
                              <Text className="font-bold text-base mb-0.5">{transaction.note || 'No note'}</Text>
                              <Text className="text-gray-500 text-xs">{transaction.category_name}</Text>
                              <Text className="text-gray-400 text-xs mt-1">{format(parseISO(transaction.date), 'dd MMM yyyy', { locale: id })}</Text>
                          </View>

                          {/* Amount & Delete */}
                          <View className="items-end gap-2">
                              <Text className="font-bold text-base">-Rp {transaction.amount.toLocaleString('id-ID')}</Text>
                              
                              {/* Delete Button */}
                              <Pressable 
                                  onPress={() => handleDeleteTransaction(transaction.id, transaction.note || 'transaksi ini')}
                                  className="p-1"
                              >
                                  <Icon name="trash" size={14} color="#EF4444" />
                              </Pressable>
                          </View>
                      </View>
                  ))
              )}
          </View>
      </ScrollView>
    </View>
  );
}
