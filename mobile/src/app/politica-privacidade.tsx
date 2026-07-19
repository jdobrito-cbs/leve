import { LegalDocScreen } from '@/features/legal/LegalDocScreen';
import { privacyPolicy } from '@/i18n/legal-pt-BR';

export default function PrivacyPolicyPage() {
  return <LegalDocScreen doc={privacyPolicy} />;
}
