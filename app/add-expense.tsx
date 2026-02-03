import { View, TextInput, ScrollView, Pressable, Platform, KeyboardAvoidingView, Modal } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { useExpenseStore } from '@/store/expenseStore';
import { useSQLiteContext } from 'expo-sqlite';
import { useState, useEffect } from 'react';
import { useRouter, Stack } from 'expo-router';
import { Icon } from '@/components/nativewindui/Icon';
import { CustomWheelPicker } from '@/components/CustomWheelPicker';

const START_YEAR = 2020;
const YEARS = Array.from({ length: 30 }, (_, i) => (START_YEAR + i).toString());
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { useColorScheme } from '@/lib/useColorScheme';

export default function AddExpenseScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { categories, addExpense, fetchCategories } = useExpenseStore();
  const { showActionSheetWithOptions } = useActionSheet();
  const { colorScheme } = useColorScheme();
  
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [date, setDate] = useState(new Date());
  const [expenseName, setExpenseName] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date()); // Temp date for picker
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories(db);
  }, [db]);

  const handleSubmit = async () => {
    if (!amount || amount === '' || !selectedCategory) return;
    
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
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      className="flex-1 bg-background pt-safe"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Custom Header */}
      <View className="flex-row items-center justify-between px-4 py-4">
          <Pressable onPress={() => router.back()} className="p-2">
              <Icon name="arrow.left" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
          </Pressable>

          <Text className="text-lg font-bold">New Expense</Text>

          <Pressable onPress={() => {
              setAmount('0');
              setExpenseName('');
              setSelectedCategory(null);
          }}>
              <Text className="text-sm font-medium text-red-500">Clear</Text>
          </Pressable>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-4" 
        contentContainerStyle={{ paddingBottom: 150 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        
        {/* Large Amount Input */}
        <View className="items-center mb-6">
            <View className="flex-row items-center gap-2 mb-4">
                 <Text className="text-gray-400 text-lg">IDR</Text>
            </View>
            <TextInput
              className="text-6xl font-bold font-sans text-center text-black dark:text-white"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#9CA3AF"
              textAlign="center"
            />
        </View>

        {/* Date Picker Pill */}
        <View className="items-center mb-10">
            <Pressable 
                onPress={() => {
                   setTempDate(date);
                   setShowDatePicker(true);
                }}
                className="flex-row items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700"
            >
                <Icon name="calendar" size={16} color={colorScheme === 'dark' ? 'white' : 'black'} />
                <Text className="ml-2 font-medium">
                    {format(date, 'dd MMM yyyy', { locale: id })}
                </Text>
            </Pressable>
        </View>

        {/* Form Fields */}
        <View className="gap-6">
            
            {/* Expense Name */}
            <View>
                <Text className="text-base font-bold mb-2 ml-1 text-gray-900 dark:text-gray-100">Expense Name</Text>
                <TextInput 
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-4 text-base font-sans text-black dark:text-white"
                    placeholder="e.g. Nasi Goreng"
                    placeholderTextColor="#9CA3AF"
                    value={expenseName}
                    onChangeText={setExpenseName}
                />
            </View>

            {/* Category Picker Trigger */}
            <View>
                <Text className="text-base font-bold mb-2 ml-1 text-gray-900 dark:text-gray-100">Category</Text>
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

      {/* Custom Date Picker Modal */}
      <Modal
        transparent={true}
        visible={showDatePicker}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white dark:bg-gray-900 w-full rounded-[32px] p-6 shadow-xl border border-gray-100 dark:border-gray-800">
            <Text className="text-xl font-bold font-sans text-center mb-6 text-black dark:text-white">Pilih Tanggal</Text>
            
            {/* Context Headers */}
            <View className="flex-row w-full mb-2 justify-center gap-2">
              <Text className="w-[60px] text-center font-medium text-xs font-sans text-gray-500 tracking-widest">TGL</Text>
              <Text className="w-[100px] text-center font-medium text-xs font-sans text-gray-500 tracking-widest">BULAN</Text>
              <Text className="w-[80px] text-center font-medium text-xs font-sans text-gray-500 tracking-widest">TAHUN</Text>
            </View>

            {showDatePicker && (
                <View className="flex-row justify-center items-center h-[180px] gap-2">
                {/* Day Picker */}
                <CustomWheelPicker 
                    key={`day-${tempDate.getMonth()}-${tempDate.getFullYear()}`}
                    data={Array.from({ length: getDaysInMonth(tempDate.getMonth(), tempDate.getFullYear()) }, (_, i) => (i + 1).toString())}
                    selectedIndex={tempDate.getDate() - 1}
                    onValueChange={(i) => {
                        const d = new Date(tempDate);
                        d.setDate(i + 1);
                        setTempDate(d);
                    }}
                    width={60}
                />
                
                {/* Month Picker */}
                <CustomWheelPicker 
                    data={MONTHS}
                    selectedIndex={tempDate.getMonth()}
                    onValueChange={(i) => {
                        const d = new Date(tempDate);
                        const newMonth = i;
                        const maxDays = getDaysInMonth(newMonth, d.getFullYear());
                        const currentDay = d.getDate();
                        // Reset day to 1 to stay in safe range before switching month
                        d.setDate(1); 
                        d.setMonth(newMonth);
                        // Restore day or clamp to max
                        d.setDate(Math.min(currentDay, maxDays));
                        setTempDate(d);
                    }}
                    width={100}
                />

                {/* Year Picker */}
                <CustomWheelPicker 
                    data={YEARS}
                    selectedIndex={tempDate.getFullYear() - START_YEAR}
                    onValueChange={(i) => {
                        const d = new Date(tempDate);
                        const newYear = START_YEAR + i;
                        const currentMonth = d.getMonth();
                        const maxDays = getDaysInMonth(currentMonth, newYear);
                        const currentDay = d.getDate();
                        
                        d.setDate(1);
                        d.setFullYear(newYear);
                        d.setDate(Math.min(currentDay, maxDays));
                        setTempDate(d);
                    }}
                    width={80}
                />
                </View>
            )}

            <View className="flex-row gap-3 mt-6">
              <Pressable 
                 onPress={() => setShowDatePicker(false)}
                 className="flex-1 py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center justify-center"
              >
                 <Text className="font-bold font-sans text-gray-900 dark:text-white">Batal</Text>
              </Pressable>
              <Pressable 
                 onPress={() => {
                    setDate(tempDate);
                    setShowDatePicker(false);
                 }}
                 className="flex-1 py-3.5 rounded-2xl bg-black dark:bg-white items-center justify-center"
              >
                 <Text className="font-bold font-sans text-white dark:text-black">Pilih</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}
