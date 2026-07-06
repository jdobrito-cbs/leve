import { Text, TextProps } from 'react-native';
import { fonts, typeScale } from '../tokens';
import { useTheme } from '../useTheme';

type Variant = keyof typeof typeScale;

const variantFont: Record<Variant, string> = {
  display: fonts.bold,
  title: fonts.semibold,
  body: fonts.regular,
  caption: fonts.regular,
};

const variantSpacing: Record<Variant, number> = {
  display: -0.4,
  title: -0.2,
  body: 0,
  caption: 0.1,
};

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
          fontFamily: variantFont[variant],
          letterSpacing: variantSpacing[variant],
          color: muted ? colors.textMuted : colors.text,
        },
        style,
      ]}
      {...rest}
    />
  );
}
