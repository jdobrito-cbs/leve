import { PropsWithChildren } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { strings } from '@/i18n/pt-BR';
import { radius, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { Button } from './Button';

interface Props {
  visible: boolean;
  /** OK: confirma e fecha. */
  onConfirm: () => void;
  /** Toque fora / voltar: fecha sem confirmar. */
  onCancel: () => void;
}

/** Folha inferior para seletores (réguas, rolagens) com botão OK. */
export function PickerSheet({ visible, onConfirm, onCancel, children }: PropsWithChildren<Props>) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable
        accessibilityLabel={strings.common.cancel}
        style={{ flex: 1, backgroundColor: 'rgba(2, 8, 23, 0.5)' }}
        onPress={onCancel}
      />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          padding: spacing.md,
          paddingBottom: spacing.lg,
          gap: spacing.md,
        }}
      >
        {children}
        <Button label={strings.common.confirm} onPress={onConfirm} />
      </View>
    </Modal>
  );
}
