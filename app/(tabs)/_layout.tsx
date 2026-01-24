import { Tabs } from 'expo-router';
import { View, Pressable, Platform, Alert } from 'react-native';
import { Icon } from '@/components/nativewindui/Icon';
import { useColorScheme } from '@/lib/useColorScheme';
import { COLORS } from '@/theme/colors';
import { router } from 'expo-router';
import { useActionSheet } from '@expo/react-native-action-sheet';
import { SmartTextModal } from '@/components/SmartTextModal';
import { OCRModal } from '@/components/OCRModal';
import { SplitBillModal } from '@/components/SplitBillModal';
import { useNetworkStatus } from '@/utils/network';
import { useState } from 'react';

export default function TabLayout() {
  const { colors, colorScheme } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const { isOnline } = useNetworkStatus();
  const [smartTextVisible, setSmartTextVisible] = useState(false);
  const [ocrVisible, setOCRVisible] = useState(false);
  const [splitBillVisible, setSplitBillVisible] = useState(false);

  const handleFabPress = () => {
    const options = ['Input Manual', 'Scan Gambar Bill', 'Smart Text', 'Split Bill', 'Batal'];
    const destructiveButtonIndex = -1; // No destructive option
    const cancelButtonIndex = 4;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        containerStyle: {
            backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff',
        },
        textStyle: {
            color: colorScheme === 'dark' ? '#ffffff' : '#000000',
        },
        title: 'Tambah Pengeluaran',
        message: 'Pilih metode input yang diinginkan',
      },
      (selectedIndex) => {
        switch (selectedIndex) {
          case 0: // Input Manual
             router.push('/add-expense');
             break;
          case 1: // Scan OCR
             if (!isOnline) {
               Alert.alert('Offline', 'Fitur OCR memerlukan koneksi internet.');
               return;
             }
             setOCRVisible(true);
             break;
          case 2: // Smart Text
             if (!isOnline) {
               Alert.alert('Offline', 'Fitur Smart Text memerlukan koneksi internet.');
               return;
             }
             setSmartTextVisible(true);
             break;
          case 3: // Split Bill
             setSplitBillVisible(true);
             break;
          case cancelButtonIndex:
            // Canceled
            break;
        }
      }
    );
  };

  return (
    <View className="flex-1">
      <Tabs
          screenOptions={{
              headerShown: false,
              tabBarStyle: {
                  backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
                  borderTopWidth: 0, 
                  elevation: 0,
                  height: 60,
                  paddingBottom: 8,
                  paddingTop: 8,
              },
              tabBarActiveTintColor: Platform.OS === 'ios' ? COLORS.light.primary : 'black', 
              tabBarInactiveTintColor: '#9ca3af',
              tabBarShowLabel: false,
          }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => <Icon name={focused ? "house.fill" : "house"} size={26} color={color} />,
          }}
        />
        
        <Tabs.Screen
          name="analysis"
          options={{
            title: 'Laporan',
            tabBarIcon: ({ color, focused }) => <Icon name="chart.pie.fill" size={26} color={color} />,
          }}
        />

        <Tabs.Screen
          name="add"
          options={{
            href: null, // Hide from tab bar
          }}
        />

        <Tabs.Screen
          name="budget"
          options={{
            title: 'Budget', 
            tabBarIcon: ({ color }) => <Icon name="banknote" size={26} color={color} />,
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => <Icon name={focused ? "gearshape.fill" : "gearshape"} size={26} color={color} />,
          }}
        />

      </Tabs>

      {/* Floating Action Button (Bottom Right) */}
      <View className="absolute bottom-20 right-4" pointerEvents="box-none">
          <Pressable 
            onPress={handleFabPress}
            className="w-14 h-14 rounded-full bg-black dark:bg-white items-center justify-center active:scale-95"
          >
              <Icon name="plus" size={24} color={colorScheme === 'dark' ? 'black' : 'white'} />
          </Pressable>
      </View>

      {/* Smart Text Modal */}
      <SmartTextModal 
        visible={smartTextVisible}
        onClose={() => setSmartTextVisible(false)}
      />

      {/* OCR Modal */}
      <OCRModal 
        visible={ocrVisible}
        onClose={() => setOCRVisible(false)}
      />

      {/* Split Bill Modal */}
      <SplitBillModal 
        visible={splitBillVisible}
        onClose={() => setSplitBillVisible(false)}
      />
    </View>
  );
}
