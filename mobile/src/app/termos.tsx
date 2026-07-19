import { LegalDocScreen } from '@/features/legal/LegalDocScreen';
import { termsOfUse } from '@/i18n/legal-pt-BR';

export default function TermsPage() {
  return <LegalDocScreen doc={termsOfUse} />;
}
