import * as FileSystem from 'expo-file-system/legacy';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { AppText, Button, Card, Screen } from '@/design/components';
import { spacing, fonts } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { db } from '@/db/client';
import { exportAllData, wipeAllData } from '@/features/backup/exportData';
import { getCloudAccount, type CloudAccount } from '@/services/cloudAccount';
import { strings } from '@/i18n/pt-BR';

export function AccountPrivacyScreen() {
  const { colors } = useTheme();
  const [account, setAccount] = useState<CloudAccount | null>(null);
  const [exported, setExported] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getCloudAccount(db)
        .then(setAccount)
        .catch(() => setAccount(null));
    }, []),
  );

  async function exportData() {
    const data = await exportAllData(db);
    const path = `${FileSystem.cacheDirectory}leve-meus-dados.json`;
    await FileSystem.writeAsStringAsync(path, JSON.stringify(data, null, 2));
    setExported(true);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
    }
  }

  async function deleteData() {
    if (!confirmWipe) return setConfirmWipe(true);
    await wipeAllData(db);
    router.replace('/onboarding' as never);
  }

  return (
    <Screen>
      <AppText variant="display">{strings.accountPrivacy.title}</AppText>

      <Card style={{ gap: spacing.sm }}>
        <AppText variant="caption" muted>
          {strings.accountPrivacy.accountSection}
        </AppText>
        {account ? (
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
            <AppText style={{ flex: 1 }}>
              {account.provider === 'apple'
                ? strings.accountPrivacy.appleId
                : strings.accountPrivacy.googleAccount}
            </AppText>
            <AppText style={{ fontFamily: fonts.semibold }}>
              {account.email ?? account.name ?? '—'}
            </AppText>
          </View>
        ) : (
          <AppText muted>{strings.accountPrivacy.noAccount}</AppText>
        )}
      </Card>

      <Card style={{ gap: spacing.md }}>
        <Button label={strings.profile.exportData} variant="secondary" onPress={exportData} />
        <AppText variant="caption" muted>
          {exported ? strings.profile.exported : strings.profile.exportHint}
        </AppText>
        <Button label={strings.profile.deleteData} variant="secondary" onPress={deleteData} />
        {confirmWipe ? (
          <AppText variant="caption" style={{ color: colors.danger }}>
            {strings.profile.deleteDataConfirm}
          </AppText>
        ) : null}
        <Button
          label={strings.accountPrivacy.backup}
          variant="secondary"
          onPress={() => router.push('/conta' as never)}
        />
      </Card>

      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
