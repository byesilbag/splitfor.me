import { Platform } from 'react-native';

export const CrossPlatformTouchable: React.FC<Props> = (props) => {
  if (Platform.OS === 'web') {
    return (
      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          props.onTouch?.(x, y);
        }}
        style={props.style}
      >
        {props.children}
      </div>
    );
  }

  return (
    <TouchableComponent
      onTouch={props.onTouch}
      style={props.style}
    >
      {props.children}
    </TouchableComponent>
  );
}; 