import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface ReminderTime {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    return false;
  }
  
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  
  return true;
}

// Schedule a single reminder at specific time
export async function scheduleReminderAtTime(hour: number, minute: number, id: string) {
  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: "Jangan lupa catat pengeluaran! 📝",
      body: "Sudah catat pengeluaran hari ini?",
      data: { type: 'daily-reminder', id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      repeats: true,
    },
  });
}

// Cancel a specific reminder by ID
export async function cancelReminderById(id: string) {
  await Notifications.cancelScheduledNotificationAsync(id);
}

// Schedule multiple reminders (cancel all first, then schedule enabled ones)
export async function scheduleMultipleReminders(times: ReminderTime[]) {
  // Cancel all existing
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  // Schedule only enabled ones
  for (const time of times) {
    if (time.enabled) {
      await scheduleReminderAtTime(time.hour, time.minute, time.id);
    }
  }
}

// Cancel all reminders
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Legacy functions for backward compatibility
export async function scheduleDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Jangan lupa catat pengeluaran! 📝",
      body: "Sudah catat pengeluaran hari ini?",
      data: { type: 'daily-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
      repeats: true,
    },
  });
}

export async function cancelDailyReminder() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Check if user has added expense today
export async function shouldSendReminder(hasExpenseToday: boolean): Promise<boolean> {
  return !hasExpenseToday;
}
