import { View, ScrollView, Switch, Alert, Pressable, Modal, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { ThemeToggle } from '@/components/nativewindui/ThemeToggle';
import { useColorScheme } from '@/lib/useColorScheme';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestPermissions, scheduleMultipleReminders, ReminderTime, cancelAllReminders } from '@/utils/notifications';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSQLiteContext } from 'expo-sqlite';
import { useExpenseStore } from '@/store/expenseStore';
import DateTimePicker from '@react-native-community/datetimepicker';

const REMINDER_STORAGE_KEY = 'reminderTimes';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  const { fetchRecentTransactions, fetchCategories } = useExpenseStore();
  
  const [reminderTimes, setReminderTimes] = useState<ReminderTime[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReminderTimes();
  }, []);

  const loadReminderTimes = async () => {
    try {
      const stored = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
      if (stored) {
        setReminderTimes(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading reminder times:', e);
    }
  };

  const saveReminderTimes = async (times: ReminderTime[]) => {
    try {
      await AsyncStorage.setItem(REMINDER_STORAGE_KEY, JSON.stringify(times));
      setReminderTimes(times);
      
      // Check if any are enabled
      const hasEnabled = times.some(t => t.enabled);
      if (hasEnabled) {
        const hasPermission = await requestPermissions();
        if (hasPermission) {
          await scheduleMultipleReminders(times);
        }
      } else {
        await cancelAllReminders();
      }
    } catch (e) {
      console.error('Error saving reminder times:', e);
    }
  };

  const addReminderTime = () => {
    setSelectedTime(new Date());
    setShowTimePicker(true);
  };

  const handleTimeConfirm = (event: any, date?: Date) => {
    setShowTimePicker(false);
    if (date) {
      const newReminder: ReminderTime = {
        id: `reminder-${Date.now()}`,
        hour: date.getHours(),
        minute: date.getMinutes(),
        enabled: true,
      };
      saveReminderTimes([...reminderTimes, newReminder]);
    }
  };

  const toggleReminder = (id: string) => {
    const updated = reminderTimes.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    );
    saveReminderTimes(updated);
  };

  const deleteReminder = (id: string) => {
    const updated = reminderTimes.filter(r => r.id !== id);
    saveReminderTimes(updated);
  };

  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const exportDb = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      const dbDir = FileSystem.documentDirectory + 'SQLite';
      const dbPath = dbDir + '/myuang_clean.db';
      
      const fileInfo = await FileSystem.getInfoAsync(dbPath);
      
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Database file not found');
        return;
      }

      await Sharing.shareAsync(dbPath, {
        dialogTitle: 'Backup MyUang Database',
        UTI: 'public.database',
        mimeType: 'application/x-sqlite3',
      });

    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export database');
    }
  };

  const importDb = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const pickedFile = result.assets[0];
      
      // Confirm overwrite
      Alert.alert(
        'Import Database',
        'Ini akan MENGGANTI SEMUA data yang ada dengan data dari file backup. Lanjutkan?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Import',
            style: 'destructive',
            onPress: async () => {
              try {
                setLoading(true);
                
                const dbDir = FileSystem.documentDirectory + 'SQLite';
                const dbPath = dbDir + '/myuang_clean.db';

                // Copy the picked file to database location
                await FileSystem.copyAsync({
                  from: pickedFile.uri,
                  to: dbPath,
                });

                // Reload data from new database
                await fetchCategories(db);
                await fetchRecentTransactions(db);

                Alert.alert(
                  'Sukses',
                  'Database berhasil diimport!',
                  [{ text: 'OK' }]
                );

              } catch (err) {
                console.error('Import error:', err);
                Alert.alert('Error', 'Gagal import database');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 py-4 border-b border-gray-100 dark:border-gray-800 bg-background z-10">
          <Text className="text-2xl font-bold mb-4">Settings</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 }}>
      {/* Appearance Section */}
      <View className="mb-8">
        <Text variant="title3" className="font-semibold mb-4 ml-2">Preferences</Text>
        <View className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-800 p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
                <View className="w-12 h-12 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
                    <Icon name={colorScheme === 'dark' ? 'moon.fill' : 'sun.max.fill'} size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
                </View>
                <Text className="font-medium text-lg pt-1">Dark Mode</Text>
            </View>
            <ThemeToggle />
        </View>
      </View>

      {/* Notifications Section */}
      <View className="mb-8">
        <View className="flex-row justify-between items-center mb-4 ml-2">
          <Text variant="title3" className="font-semibold">Reminders</Text>
          <Pressable 
            onPress={addReminderTime} 
            className="bg-black dark:bg-white px-4 py-2 rounded-full"
          >
            <Text className="font-medium text-sm text-white dark:text-black">Add</Text>
          </Pressable>
        </View>
        
        <View className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          {reminderTimes.length === 0 ? (
            <View className="p-4 items-center">
              <Text className="text-gray-400 text-sm">Belum ada reminder. Tap + untuk menambahkan.</Text>
            </View>
          ) : (
            reminderTimes.map((reminder, index) => (
              <View 
                key={reminder.id} 
                className={`p-4 flex-row items-center justify-between ${
                  index < reminderTimes.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
                    <Icon name="bell.fill" size={18} color={reminder.enabled ? (colorScheme === 'dark' ? 'white' : 'black') : '#9CA3AF'} />
                  </View>
                  <Text className={`text-xl font-bold ${reminder.enabled ? '' : 'text-gray-400'}`}>
                    {formatTime(reminder.hour, reminder.minute)}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  <Pressable onPress={() => deleteReminder(reminder.id)} hitSlop={10}>
                    <Icon name="trash" size={18} color="#EF4444" />
                  </Pressable>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => toggleReminder(reminder.id)}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Data Section */}
      <View className="mb-8">
        <Text variant="title3" className="font-semibold mb-4 ml-2">Data</Text>
        
        {/* Export */}
        <Pressable 
          onPress={exportDb}
          className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-800 p-4 flex-row items-center justify-between mb-3"
        >
            <View className="flex-1 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
                    <Icon name="square.and.arrow.up" size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-lg">Export Database</Text>
                  <Text className="text-gray-500 text-xs">Backup data ke file</Text>
                </View>
            </View>
            <Icon name="chevron.right" size={16} color="gray" />
        </Pressable>

        {/* Import */}
        <Pressable 
          onPress={importDb}
          disabled={loading}
          className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-800 p-4 flex-row items-center justify-between"
        >
            <View className="flex-1 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
                    <Icon name="square.and.arrow.down" size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-lg">Import Database</Text>
                  <Text className="text-gray-500 text-xs">Restore data dari backup</Text>
                </View>
            </View>
            <Icon name="chevron.right" size={16} color="gray" />
        </Pressable>
      </View>

      <View className="items-center mt-auto mb-10">
        <Text className="text-gray-400 text-sm">MyUang v2.0.0</Text>
      </View>
    </ScrollView>

    {/* Time Picker Modal */}
    {showTimePicker && (
      <DateTimePicker
        value={selectedTime}
        mode="time"
        is24Hour={true}
        display="spinner"
        onChange={handleTimeConfirm}
      />
    )}
    </View>
  );
}
