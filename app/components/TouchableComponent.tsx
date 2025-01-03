import { GestureResponderEvent, View, ViewStyle } from 'react-native';

interface TouchableComponentProps {
  onTouch?: (x: number, y: number) => void;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export const TouchableComponent: React.FC<TouchableComponentProps> = ({ 
  onTouch, 
  style, 
  children 
}) => {
  const handleTouch = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    if (onTouch) {
      onTouch(locationX, locationY);
    }
  };

  return (
    <View
      style={style}
      onTouchStart={handleTouch}
      onStartShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
    >
      {children}
    </View>
  );
}; 