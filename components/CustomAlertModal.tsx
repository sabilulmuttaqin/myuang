import React from 'react';
import { Modal, View, Text, Pressable, Platform } from 'react-native';
import { cn } from '@/lib/cn';

export interface AlertButton {
    text: string;
    style?: 'default' | 'cancel' | 'destructive';
    onPress?: () => void;
}

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message?: string;
    buttons?: AlertButton[];
    onClose?: () => void;
}

export function CustomAlertModal({ visible, title, message, buttons = [], onClose }: CustomAlertProps) {
    // If no buttons provided, default to OK
    const actionButtons = buttons.length > 0 ? buttons : [{ text: 'OK', style: 'default', onPress: onClose }];

    return (
        <Modal
            transparent={true}
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View className="flex-1 justify-center items-center bg-black/60 px-8">
                <View className="bg-white dark:bg-gray-900 w-full max-w-[320px] rounded-[28px] p-6 shadow-2xl border border-gray-100 dark:border-gray-800">
                    <Text className="text-xl font-bold font-sans text-center mb-2 text-black dark:text-white">
                        {title}
                    </Text>
                    {message && (
                        <Text className="text-gray-500 dark:text-gray-400 text-center font-sans text-[15px] leading-6 mb-6">
                            {message}
                        </Text>
                    )}

                    <View className={`flex-row gap-3 ${actionButtons.length > 2 ? 'flex-col' : ''}`}>
                        {actionButtons.map((btn, idx) => (
                            <Pressable
                                key={idx}
                                onPress={() => {
                                    if (btn.onPress) btn.onPress();
                                    else if (onClose) onClose();
                                }}
                                className={cn(
                                    "flex-1 py-3.5 rounded-2xl items-center justify-center active:opacity-80",
                                    btn.style === 'destructive' ? "bg-red-50 dark:bg-red-900/30" : 
                                    btn.style === 'cancel' ? "bg-gray-100 dark:bg-gray-800" : 
                                    "bg-black dark:bg-white"
                                )}
                            >
                                <Text className={cn(
                                    "font-bold font-sans text-[15px]",
                                    btn.style === 'destructive' ? "text-red-500 dark:text-red-400" :
                                    btn.style === 'cancel' ? "text-gray-900 dark:text-gray-300" :
                                    "text-white dark:text-black"
                                )}>
                                    {btn.text}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}
