import { ReactNode, useState } from 'react';
import { View } from 'react-native';

/**
 * Mede a largura real disponível e entrega ao gráfico — os charts calculam
 * largura pela tela e vazam do card sem isso.
 */
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
