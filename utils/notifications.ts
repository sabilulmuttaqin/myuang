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

export async function scheduleDailyReminder() {
  // Cancel existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();
  
  // Schedule daily reminder at 8 PM
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
  // Only send reminder if user hasn't added expense today
  return !hasExpenseToday;
}
