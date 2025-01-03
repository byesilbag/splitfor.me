import { TouchHandler } from './components/TouchHandler';

export const YourComponent = () => {
  const handleTouch = (x: number, y: number) => {
    // Your touch handling logic here
    console.log(`Touch at: ${x}, ${y}`);
  };

  return (
    <TouchHandler onTouch={handleTouch}>
      {/* Your content */}
    </TouchHandler>
  );
}; 