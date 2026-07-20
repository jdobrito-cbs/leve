import { ReactNode, useState } from 'react';
import { View } from 'react-native';

export function FitChart({ children }: { children: (width: number) => ReactNode }) {
  const [width, setWidth] = useState(0);
  return (
    <View
      style={{ width: '100%', overflow: 'hidden' }}
      onLayout={(e) => setWidth(Math.floor(e.nativeEvent.layout.width))}
    >
      {width > 0 ? children(width) : null}
    </View>
  );
}
