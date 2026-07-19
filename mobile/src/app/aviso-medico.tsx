import { LegalDocScreen } from '@/features/legal/LegalDocScreen';
import { medicalNotice } from '@/i18n/legal-pt-BR';

export default function MedicalNoticePage() {
  return <LegalDocScreen doc={medicalNotice} />;
}
