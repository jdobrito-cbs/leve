import { Text, TextProps } from 'react-native';
import { typeScale } from '../tokens';
import { useTheme } from '../useTheme';

type Variant = keyof typeof typeScale;

interface Props extends TextProps {
  variant?: Variant;
  muted?: boolean;
}

export function AppText({ variant = 'body', muted, style, ...rest }: Props) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        {
          fontSize: typeScale[variant],
          fontWeight: variant === 'display' || variant === 'title' ? '600' : '400',
          color: muted ? colors.textMuted : colors.text,
        },
        style,
      ]}
      {...rest}
    />
  );
}
