import React, { useRef, useEffect } from 'react';
import { View, Text, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

interface Props {
  data: string[];
  selectedIndex: number;
  onValueChange: (index: number) => void;
  width?: number | string;
}

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 3;
const CONTAINER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export function CustomWheelPicker({ data, selectedIndex, onValueChange, width = 60 }: Props) {
  const flatListRef = useRef<FlatList>(null);

  // Scroll to initial position
  useEffect(() => {
    if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: selectedIndex, animated: false });
    }
  }, []);

  // Handle snapping manually to ensure we land on an item
  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    
    // Clamp index
    const safeIndex = Math.max(0, Math.min(index, data.length - 1));
    
    if (safeIndex !== selectedIndex) {
      onValueChange(safeIndex);
    }
  };

  return (
    <View style={{ height: CONTAINER_HEIGHT, width, overflow: 'hidden' }}>
        {/* Selection Highlight */}
        <View 
            className="absolute w-full border-t border-b border-gray-200 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/30 pointer-events-none z-0"
            style={{ 
                height: ITEM_HEIGHT, 
                top: ITEM_HEIGHT,
            }} 
        />
        
        <FlatList
            ref={flatListRef}
            data={data}
            keyExtractor={(_, i) => i.toString()}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            contentContainerStyle={{ 
                paddingVertical: ITEM_HEIGHT
            }}
            getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
            })}
            initialScrollIndex={selectedIndex}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            renderItem={({ item, index }) => {
                const isSelected = index === selectedIndex;
                return (
                    <View style={{ height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center' }}>
                        <Text className={`font-sans text-lg ${isSelected ? 'font-bold text-black dark:text-white scale-110' : 'text-gray-400 text-base'}`}>
                            {item}
                        </Text>
                    </View>
                );
            }}
        />
    </View>
  );
}
