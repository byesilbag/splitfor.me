import { CrossPlatformTouchable } from '../components/CrossPlatformTouchable';

export const YourScreen: React.FC = () => {
  const handleTouch = (x: number, y: number) => {
    console.log(`Touched at position: ${x}, ${y}`);
    // Your touch handling logic here
  };

  return (
    <CrossPlatformTouchable
      onTouch={handleTouch}
      style={styles.container}
    >
      {/* Your content */}
    </CrossPlatformTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // ... other styles
  },
}); 