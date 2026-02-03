import { View, Modal, Pressable, Platform } from 'react-native';
import { Text } from '@/components/nativewindui/Text';
import { Icon } from '@/components/nativewindui/Icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/lib/useColorScheme';

interface ActionMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (option: string) => void;
}

export function ActionMenuModal({ visible, onClose, onSelect }: ActionMenuModalProps) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();

  const options = [
    { id: 'manual', label: 'Input Manual', icon: 'pencil' },
    { id: 'ocr', label: 'Scan Gambar Bill', icon: 'camera.fill' },
    { id: 'smart', label: 'Smart Text', icon: 'sparkles' },
    { id: 'voice', label: 'Voice Input', icon: 'mic.fill' },
  ];

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Backdrop - Click to close */}
        <Pressable className="absolute inset-0 bg-black/40" onPress={onClose} />
        
        {/* Menu Sheet */}
        <View className="bg-white dark:bg-gray-900 rounded-t-2xl overflow-hidden px-4 pt-4 pb-8" style={{ paddingBottom: Math.max(insets.bottom + 20, 32) }}>
            <View className="items-center mb-4">
                <View className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
            </View>
            
            <Text className="text-center font-bold text-gray-400 text-xs uppercase tracking-widest mb-4">Tambah Pengeluaran</Text>

            <View className="gap-2">
                {options.map((option) => (
                    <Pressable 
                        key={option.id}
                        onPress={() => {
                            onClose();
                            setTimeout(() => onSelect(option.id), 100);
                        }}
                        className="flex-row items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl active:bg-gray-200 dark:active:bg-gray-700"
                    >
                        <View className="w-10 h-10 rounded-full bg-white dark:bg-gray-700 items-center justify-center border border-gray-100 dark:border-gray-600">
                            <Icon name={option.icon} size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
                        </View>
                        <Text className="font-semibold text-lg">{option.label}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
      </View>
    </Modal>
  );
}
