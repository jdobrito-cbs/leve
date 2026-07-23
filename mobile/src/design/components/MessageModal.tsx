import { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { strings } from '@/i18n/pt-BR';
import { dismissMessage, getMessage, subscribeMessage } from '../messageSignal';
import { fonts, spacing } from '../tokens';
import { useTheme } from '../useTheme';
import { AppText } from './AppText';
import { Button } from './Button';

export function MessageModal() {
  const { colors } = useTheme();
  const [msg, setMsg] = useState(() => getMessage());

  useEffect(() => subscribeMessage(() => setMsg(getMessage())), []);

  return (
    <Modal
      visible={msg != null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissMessage}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.45)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.lg,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 420,
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.lg,
            gap: spacing.xs,
            alignItems: 'center',
          }}
        >
          <AppText
            style={{
              fontFamily: fonts.semibold,
              fontSize: 18,
              color: colors.text,
              textAlign: 'center',
            }}
          >
            {msg?.title ?? ''}
          </AppText>
          {msg?.detail ? (
            <AppText variant="caption" muted style={{ textAlign: 'center' }}>
              {msg.detail}
            </AppText>
          ) : null}
          <View style={{ width: '100%', marginTop: spacing.md }}>
            <Button label={strings.common.confirm} onPress={dismissMessage} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
