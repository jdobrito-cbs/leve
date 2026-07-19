import { router } from 'expo-router';
import { View } from 'react-native';
import { AppText, Button, Card, Screen } from '@/design/components';
import { spacing } from '@/design/tokens';
import type { LegalDoc } from '@/i18n/legal-pt-BR';
import { strings } from '@/i18n/pt-BR';

/** Leitor dos documentos legais (aviso médico, termos, política). */
export function LegalDocScreen({ doc }: { doc: LegalDoc }) {
  return (
    <Screen>
      <AppText variant="display">{doc.title}</AppText>
      <AppText variant="caption" muted>
        {doc.updated}
      </AppText>
      <Card style={{ gap: spacing.md }}>
        {doc.sections.map((section, i) => (
          <View key={i} style={{ gap: spacing.sm }}>
            {section.heading ? <AppText variant="title">{section.heading}</AppText> : null}
            {section.paragraphs.map((p, j) => (
              <AppText key={j} style={{ lineHeight: 22 }}>
                {p}
              </AppText>
            ))}
          </View>
        ))}
      </Card>
      <Button label={strings.common.close} variant="secondary" onPress={() => router.back()} />
    </Screen>
  );
}
