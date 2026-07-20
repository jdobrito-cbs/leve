import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { AppText, Button, Card, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import { strings } from '@/i18n/pt-BR';

/** Ícone do app (broto sobre gradiente azul), igual ao da tela inicial. */
function AppLogo({ size = 96 }: { size?: number }) {
  const glyph = size * 0.62;
  const offset = (size - glyph) / 2;
  const scale = glyph / 24;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="logo" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2563EB" />
          <Stop offset="1" stopColor="#60A5FA" />
        </LinearGradient>
      </Defs>
      <Rect width={size} height={size} rx={size * 0.22} fill="url(#logo)" />
      <Path
        d="M14 9.536V7a4 4 0 0 1 4-4h1.5a.5.5 0 0 1 .5.5V5a4 4 0 0 1-4 4 4 4 0 0 0-4 4c0 2 1 3 1 5a5 5 0 0 1-1 3M4 9a5 5 0 0 1 8 4 5 5 0 0 1-8-4M5 21h14"
        stroke="#FFFFFF"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        transform={`translate(${offset} ${offset}) scale(${scale})`}
      />
    </Svg>
  );
}

/** Domínio oficial do Leve — site, painel de parceiros e serviços de IA. */
const SITE_URL = 'https://levemobile.com.br';

export function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '1.0';
  return (
    <Screen>
      <AppText variant="display">{strings.about.title}</AppText>
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
        <AppLogo />
        <AppText variant="title" style={{ fontSize: 22 }}>
          {strings.appName}
        </AppText>
        <AppText variant="caption" muted>
          {strings.about.version} {version}
        </AppText>
      </View>
      <Card style={{ gap: spacing.sm }}>
        <Button
          label={strings.about.website}
          variant="secondary"
          onPress={() => WebBrowser.openBrowserAsync(SITE_URL).catch(() => undefined)}
        />
        <AppText variant="caption" muted style={{ textAlign: 'center' }}>
          levemobile.com.br
        </AppText>
        <Button
          label={strings.about.privacyPolicy}
          variant="secondary"
          onPress={() => router.push('/politica-privacidade' as never)}
        />
        <Button
          label={strings.about.terms}
          variant="secondary"
          onPress={() => router.push('/termos' as never)}
        />
        <Button
          label={strings.about.medicalNotice}
          variant="secondary"
          onPress={() => router.push('/aviso-medico' as never)}
        />
      </Card>
      <AppText variant="caption" muted style={{ textAlign: 'center' }}>
        {strings.about.copyright}
      </AppText>
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
