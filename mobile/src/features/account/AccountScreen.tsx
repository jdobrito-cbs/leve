import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { AppText, Button, Card, Input, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { useTheme } from '@/design/useTheme';
import { useAccount } from '@/features/account/useAccount';
import { strings } from '@/i18n/pt-BR';
import { isAccountConfigured } from '@/services/api/client';

function ConsentCheck({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onToggle}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          borderWidth: 2,
          borderColor: colors.primary,
          backgroundColor: checked ? colors.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {checked ? <Check color={colors.onPrimary} size={14} strokeWidth={3} /> : null}
      </View>
      <AppText variant="caption" style={{ flex: 1 }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function AccountScreen() {
  const { colors } = useTheme();
  const account = useAccount();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const [backupConsent, setBackupConsent] = useState(true);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  if (!isAccountConfigured()) {
    return (
      <Screen>
        <AppText variant="display">{strings.account.section}</AppText>
        <AppText muted>{strings.account.offline}</AppText>
        <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const canSubmit = email.includes('@') && password.length >= 8 && terms && !account.busy;

  return (
    <Screen>
      <AppText variant="display">{strings.account.section}</AppText>
      {account.busy ? <ActivityIndicator /> : null}
      {account.error ? (
        <AppText variant="caption" style={{ color: colors.danger }}>
          {account.error}
        </AppText>
      ) : null}
      {account.notice ? (
        <AppText variant="caption" style={{ color: colors.success }}>
          {account.notice}
        </AppText>
      ) : null}

      {account.email ? (
        <Card style={{ gap: spacing.md }}>
          <AppText variant="caption" muted>
            {strings.account.loggedInAs}
          </AppText>
          <AppText variant="title">{account.email}</AppText>
          <Button
            label={strings.account.backupNow}
            onPress={() => account.backupNow(strings.account.backupDone)}
            disabled={account.busy}
          />
          <Button
            label={strings.account.restore}
            variant="secondary"
            onPress={() => {
              if (!confirmRestore) return setConfirmRestore(true);
              setConfirmRestore(false);
              account.restore(strings.account.restoreDone);
            }}
            disabled={account.busy}
          />
          {confirmRestore ? (
            <AppText variant="caption" muted>
              {strings.account.restoreConfirm}
            </AppText>
          ) : null}
          <AppText variant="caption" muted>
            {strings.account.e2eNote}
          </AppText>
          <Button label={strings.account.logout} variant="secondary" onPress={account.logout} />
          <Button
            label={strings.account.deleteAccount}
            variant="secondary"
            onPress={() => {
              if (!confirmDelete) return setConfirmDelete(true);
              if (deletePassword) {
                setConfirmDelete(false);
                account.deleteAccount(deletePassword);
              }
            }}
            disabled={account.busy}
          />
          {confirmDelete ? (
            <View style={{ gap: spacing.sm }}>
              <AppText variant="caption" style={{ color: colors.danger }}>
                {strings.account.deleteConfirm}
              </AppText>
              <Input
                label={strings.account.passwordLabel}
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
              />
            </View>
          ) : null}
        </Card>
      ) : (
        <Card style={{ gap: spacing.md }}>
          <AppText variant="caption" muted>
            {strings.account.statusLocal}
          </AppText>
          <Input
            label={strings.account.emailLabel}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label={strings.account.passwordLabel}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <ConsentCheck
            checked={terms}
            label={strings.account.termsLabel}
            onToggle={() => setTerms((v) => !v)}
          />
          <ConsentCheck
            checked={backupConsent}
            label={strings.account.backupConsentLabel}
            onToggle={() => setBackupConsent((v) => !v)}
          />
          <Button
            label={strings.account.register}
            onPress={() => account.register(email, password, backupConsent)}
            disabled={!canSubmit}
          />
          <Button
            label={strings.account.login}
            variant="secondary"
            onPress={() => account.login(email, password)}
            disabled={!email.includes('@') || password.length === 0 || account.busy}
          />
          <AppText variant="caption" muted>
            {strings.account.e2eNote}
          </AppText>
        </Card>
      )}
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
