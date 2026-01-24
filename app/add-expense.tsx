import { View, TextInput, ScrollView, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { useExpenseStore } from '@/store/expenseStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { Icon } from '@/components/nativewindui/Icon';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useActionSheet } from '@expo/react-native-action-sheet';

export default function AddExpenseScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { categories, addExpense, fetchCategories } = useExpenseStore();
  const { showActionSheetWithOptions } = useActionSheet();
  
  const [amount, setAmount] = useState('0');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  const [expenseName, setExpenseName] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories(db);
  }, [db]);

  const handleSubmit = async () => {
    if (!amount || amount === '0' || !selectedCategory) return;
    
    setLoading(true);
    try {
      await addExpense(db, {
        amount: parseFloat(amount.replace(/[^0-9.]/g, '')),
        category_id: selectedCategory,
        date: date.toISOString(),
        note: expenseName || 'No note'
      });
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = () => {
    const options = [...categories.map(c => `${c.icon.replace('emoji:', '')}  ${c.name}`), 'Cancel'];
    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions({
        options,
        cancelButtonIndex,
        title: 'Select Category'
    }, (selectedIndex) => {
        if (selectedIndex !== undefined && selectedIndex !== cancelButtonIndex) {
            setSelectedCategory(categories[selectedIndex].id);
        }
    });
  };

  const selectedCategoryObj = categories.find(c => c.id === selectedCategory);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-background pt-safe">
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
          <Pressable onPress={() => router.back()} className="p-2">
              <Icon name="arrow.left" size={24} color="black" />
          </Pressable>

          <Text className="text-lg font-semibold">New Expense</Text>

          <Pressable onPress={() => {
              setAmount('0');
              setExpenseName('');
              setSelectedCategory(null);
          }}>
              <Text className="text-sm font-medium text-red-500">Clear</Text>
          </Pressable>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" contentContainerStyle={{ paddingBottom: 50 }}>
        
        {/* Large Amount Input */}
        <View className="items-center mb-6">
            <View className="flex-row items-center gap-2 mb-4">
                 <Text className="text-gray-400 text-lg">IDR</Text>
            </View>
            <TextInput
              className="text-6xl font-bold text-center w-full"
              style={{ textAlign: 'center' }}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#D1D5DB"
            />
        </View>

        {/* Date Picker Pill */}
        <View className="items-center mb-10">
            <Pressable 
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
            >
                <Icon name="calendar" size={16} color="black" />
                <Text className="ml-2 font-medium">
                    {format(date, 'dd MMM yyyy', { locale: id })}
                </Text>
            </Pressable>
        </View>

        {/* Form Fields */}
        <View className="gap-6">
            
            {/* Expense Name */}
            <View>
                <Text className="text-base font-semibold mb-2 ml-1 text-gray-900 dark:text-gray-100">Expense Name</Text>
                <TextInput 
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 text-base"
                    placeholder="e.g. Nasi Goreng"
                    value={expenseName}
                    onChangeText={setExpenseName}
                />
            </View>

            {/* Category Picker Trigger */}
            <View>
                <Text className="text-base font-semibold mb-2 ml-1 text-gray-900 dark:text-gray-100">Category</Text>
                <Pressable 
                    onPress={handleCategoryPress}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 flex-row justify-between items-center active:bg-gray-100 dark:active:bg-gray-800"
                >
                    <View className="flex-row items-center gap-3">
                         {selectedCategoryObj ? (
                             <>
                                <Text className="text-xl">{selectedCategoryObj.icon.replace('emoji:', '')}</Text>
                                <Text className="text-base font-medium">{selectedCategoryObj.name}</Text>
                             </>
                         ) : (
                             <Text className="text-gray-400 text-base">Select Category</Text>
                         )}
                    </View>
                    <Icon name="chevron.down" size={20} color="gray" />
                </Pressable>
            </View>

        </View>

        {/* Submit Button */}
        <Pressable 
            onPress={handleSubmit}
            className="bg-black dark:bg-white w-full py-4 rounded-full items-center justify-center mt-10 mb-10 shadow-sm"
        >
             <Text className="text-white dark:text-black font-bold text-lg">Save Expense</Text>
        </Pressable>

      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
            }}
        />
      )}

    </KeyboardAvoidingView>
  );
}
