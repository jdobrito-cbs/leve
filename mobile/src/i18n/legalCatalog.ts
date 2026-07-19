/**
 * Documentos legais por idioma. O pt-BR (legal-pt-BR.ts) é a versão que
 * prevalece juridicamente; as traduções em ./legal-locales são cortesia e
 * carregam um aviso dizendo isso (translationNote). Idioma sem tradução
 * (ou build antiga) cai no pt-BR.
 */
import { getActiveLanguage, type LanguageCode } from './engine';
import { medicalNotice, privacyPolicy, termsOfUse, type LegalDoc } from './legal-pt-BR';

export interface LegalCatalog {
  medicalNotice: LegalDoc;
  termsOfUse: LegalDoc;
  privacyPolicy: LegalDoc;
  /** Presente só nas traduções: "cortesia; prevalece o português (Brasil)". */
  translationNote?: string;
}

const ptBR: LegalCatalog = { medicalNotice, termsOfUse, privacyPolicy };

function load(code: LanguageCode): LegalCatalog | null {
  try {
    switch (code) {
      case 'pt-BR':
        return ptBR;
      case 'pt-PT':
        return (require('./legal-locales/pt-PT') as { legal: LegalCatalog }).legal;
      case 'en-US':
        return (require('./legal-locales/en-US') as { legal: LegalCatalog }).legal;
      case 'en-GB':
        return (require('./legal-locales/en-GB') as { legal: LegalCatalog }).legal;
      case 'es':
        return (require('./legal-locales/es') as { legal: LegalCatalog }).legal;
      case 'fr':
        return (require('./legal-locales/fr') as { legal: LegalCatalog }).legal;
      case 'de':
        return (require('./legal-locales/de') as { legal: LegalCatalog }).legal;
      case 'ja':
        return (require('./legal-locales/ja') as { legal: LegalCatalog }).legal;
      case 'zh-CN':
        return (require('./legal-locales/zh-CN') as { legal: LegalCatalog }).legal;
      case 'ar':
        return (require('./legal-locales/ar') as { legal: LegalCatalog }).legal;
      case 'he':
        return (require('./legal-locales/he') as { legal: LegalCatalog }).legal;
      case 'hi':
        return (require('./legal-locales/hi') as { legal: LegalCatalog }).legal;
    }
  } catch {
    return null;
  }
}

export function getLegalCatalog(): LegalCatalog {
  return load(getActiveLanguage()) ?? ptBR;
}
