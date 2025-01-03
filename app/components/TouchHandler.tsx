import React from 'react';
import { View, GestureResponderEvent, StyleSheet, Platform } from 'react-native';

interface TouchHandlerProps {
  onTouch: (x: number, y: number) => void;
  children: React.ReactNode;
}

export const TouchHandler: React.FC<TouchHandlerProps> = ({ onTouch, children }) => {
  const handleTouch = (event: GestureResponderEvent) => {
    if (Platform.OS === 'web') {
      // Web touch handling
      const touch = event.nativeEvent.touches?.[0];
      if (touch) {
        onTouch(touch.pageX, touch.pageY);
      }
    } else {
      // Native touch handling
      const { locationX, locationY } = event.nativeEvent;
      onTouch(locationX, locationY);
    }
  };

  return (
    <View
      style={styles.container}
      onTouchStart={handleTouch}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 