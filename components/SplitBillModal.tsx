import { View, TextInput, Modal, Pressable, Alert } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { useState } from 'react';
import { useExpenseStore } from '@/store/expenseStore';
import { useSQLiteContext } from 'expo-sqlite';

interface SplitBillModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SplitBillModal({ visible, onClose }: SplitBillModalProps) {
  const [totalAmount, setTotalAmount] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('2');
  const [myShare, setMyShare] = useState('1');
  const [expenseName, setExpenseName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
  const { categories, addExpense } = useExpenseStore();
  const db = useSQLiteContext();

  const calculateMyPortion = () => {
    const total = parseFloat(totalAmount) || 0;
    const people = parseInt(numberOfPeople) || 1;
    const share = parseInt(myShare) || 0;
    
    if (people === 0 || share === 0) return 0;
    
    const portionPerPerson = total / people;
    return portionPerPerson * share;
  };

  const handleSplit = async () => {
    if (!totalAmount || !expenseName || !selectedCategoryId) {
      Alert.alert('Lengkapi Data', 'Isi semua field yang diperlukan');
      return;
    }

    const myPortion = calculateMyPortion();
    
    if (myPortion <= 0) {
      Alert.alert('Invalid', 'Jumlah tidak valid');
      return;
    }

    try {
      await addExpense(db, {
        amount: myPortion,
        category_id: selectedCategoryId,
        date: new Date().toISOString(),
        note: `${expenseName} (Split ${numberOfPeople} orang, bagian saya: ${myShare})`
      });

      Alert.alert(
        'Berhasil!', 
        `Bagian kamu: Rp ${myPortion.toLocaleString('id-ID')}\n(Total: Rp ${parseFloat(totalAmount).toLocaleString('id-ID')} / ${numberOfPeople} orang)`
      );
      
      // Reset
      setTotalAmount('');
      setNumberOfPeople('2');
      setMyShare('1');
      setExpenseName('');
      setSelectedCategoryId(null);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Gagal menambahkan expense');
    }
  };

  const myPortion = calculateMyPortion();

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white dark:bg-gray-900 rounded-t-[32px] p-6 pb-10">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl font-bold">Split Bill</Text>
            <Pressable onPress={onClose} className="p-2 bg-gray-100 rounded-full dark:bg-gray-800">
              <Icon name="xmark" size={16} color="gray" />
            </Pressable>
          </View>

          {/* Info */}
          <View className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl mb-4">
            <Text className="text-sm text-blue-900 dark:text-blue-100 mb-1">
              💡 Split bill untuk pengeluaran bersama
            </Text>
            <Text className="text-xs text-blue-700 dark:text-blue-300">
              Hanya bagian kamu yang akan ditambahkan ke expense
            </Text>
          </View>

          {/* Expense Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2">Nama Pengeluaran</Text>
            <TextInput
              value={expenseName}
              onChangeText={setExpenseName}
              placeholder="e.g., Makan di Resto"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 text-base"
            />
          </View>

          {/* Total Amount */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2">Total Tagihan</Text>
            <TextInput
              value={totalAmount}
              onChangeText={setTotalAmount}
              placeholder="150000"
              keyboardType="numeric"
              placeholderTextColor="#9CA3AF"
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 text-base"
            />
          </View>

          {/* Split Config */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium mb-2">Jumlah Orang</Text>
              <TextInput
                value={numberOfPeople}
                onChangeText={setNumberOfPeople}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 text-base text-center"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium mb-2">Bagian Saya</Text>
              <TextInput
                value={myShare}
                onChangeText={setMyShare}
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
                className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 text-base text-center"
              />
            </View>
          </View>

          {/* Category Picker */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2">Kategori</Text>
            <View className="flex-row flex-wrap gap-2">
              {categories.slice(0, 6).map(cat => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedCategoryId === cat.id 
                      ? 'bg-black dark:bg-white border-black dark:border-white' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <Text className={selectedCategoryId === cat.id ? 'text-white dark:text-black' : ''}>
                    {cat.icon.replace('emoji:', '')} {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Calculation Result */}
          {myPortion > 0 && (
            <View className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl mb-4">
              <Text className="text-sm text-green-900 dark:text-green-100 mb-1">
                💰 Bagian Kamu:
              </Text>
              <Text className="text-2xl font-bold text-green-700 dark:text-green-300">
                Rp {myPortion.toLocaleString('id-ID')}
              </Text>
              <Text className="text-xs text-green-600 dark:text-green-400 mt-1">
                (Rp {(parseFloat(totalAmount) / parseInt(numberOfPeople || '1')).toLocaleString('id-ID')} × {myShare} orang)
              </Text>
            </View>
          )}

          {/* Button */}
          <Pressable 
            onPress={handleSplit}
            disabled={!totalAmount || !expenseName || !selectedCategoryId}
            className={`w-full py-4 rounded-full items-center justify-center ${
              !totalAmount ||!expenseName || !selectedCategoryId ? 'bg-gray-200 dark:bg-gray-700' : 'bg-black dark:bg-white'
            }`}
          >
            <Text className={`font-bold text-lg ${
              !totalAmount || !expenseName || !selectedCategoryId ? 'text-gray-400' : 'text-white dark:text-black'
            }`}>
              Tambah Bagian Saya
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
