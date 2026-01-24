import { View, ScrollView, Switch,  Alert, Pressable } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { ThemeToggle } from '@/components/nativewindui/ThemeToggle';
import { useColorScheme } from '@/lib/useColorScheme';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestPermissions, scheduleDailyReminder, cancelDailyReminder } from '@/utils/notifications';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function SettingsScreen() {
  const { colorScheme } = useColorScheme();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReminderSetting();
  }, []);

  const loadReminderSetting = async () => {
    const enabled = await AsyncStorage.getItem('dailyReminderEnabled');
    setReminderEnabled(enabled === 'true');
  };

  const exportDb = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // @ts-ignore
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

  const handleReminderToggle = async (value: boolean) => {
    setLoading(true);
    try {
      if (value) {
        // Request permission first
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          Alert.alert('Permission Required', 'Please enable notifications in your device settings.');
          setLoading(false);
          return;
        }
        
        // Schedule notification
        await scheduleDailyReminder();
        await AsyncStorage.setItem('dailyReminderEnabled', 'true');
        setReminderEnabled(true);
      } else {
        // Cancel notification
        await cancelDailyReminder();
        await AsyncStorage.setItem('dailyReminderEnabled', 'false');
        setReminderEnabled(false);
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      Alert.alert('Error', 'Failed to update reminder setting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-background pt-8 px-4">
      {/* Title */}
      <View className="mb-8 ml-2">
          <Text variant="largeTitle" className="font-bold">Settings</Text>
      </View>

      {/* Appearance Section */}
      <View className="mb-8">
        <Text variant="title3" className="font-semibold mb-4 ml-2">Preferences</Text>
        <View className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-800 p-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
                    <Icon name={colorScheme === 'dark' ? 'moon.fill' : 'sun.max.fill'} size={20} color={colorScheme === 'dark' ? '#white' : 'black'} />
                </View>
                <Text className="font-medium text-lg pt-1">Dark Mode</Text>
            </View>
            <ThemeToggle />
        </View>
      </View>

      {/* Notifications Section */}
      <View className="mb-8">
        <Text variant="title3" className="font-semibold mb-4 ml-2">Notifications</Text>
        <View className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-800 p-4 flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
                    <Icon name="bell.fill" size={20} color="black" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-lg">Daily Reminder</Text>
                  <Text className="text-gray-500 text-xs">Reminds you at 8 PM if no expense added</Text>
                </View>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleReminderToggle}
              disabled={loading}
            />
        </View>
      </View>

      {/* Data Section */}
      <View className="mb-8">
        <Text variant="title3" className="font-semibold mb-4 ml-2">Data</Text>
        <Pressable 
          onPress={exportDb}
          className="bg-white dark:bg-gray-900 rounded-[20px] shadow-sm border border-gray-100 dark:border-gray-800 p-4 flex-row items-center justify-between"
        >
            <View className="flex-1 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 items-center justify-center">
                    <Icon name="square.and.arrow.up" size={20} color="black" />
                </View>
                <View className="flex-1">
                  <Text className="font-medium text-lg">Backup / Export Database</Text>
                  <Text className="text-gray-500 text-xs">Save your data to a safe place</Text>
                </View>
            </View>
            <Icon name="chevron.right" size={16} color="gray" />
        </Pressable>
      </View>

      <View className="items-center mt-auto mb-10">
        <Text className="text-gray-400 text-sm">MyUang v1.0.0</Text>
      </View>
    </ScrollView>
  );
}
