import type { LegalCatalog } from '../legalCatalog';

export const legal: LegalCatalog = {
  translationNote:
    'Courtesy translation. In case of any discrepancy, the Portuguese (Brazil) version prevails.',
  medicalNotice: {
    title: 'Medical and Nutritional Notice',
    updated: 'Effective as of July 18, 2026',
    sections: [
      {
        heading: 'Leve is not a medical device and does not provide medical advice',
        paragraphs: [
          'The information presented by Leve is intended solely for educational and informational purposes and is not intended to diagnose, treat, cure, or prevent any disease.',
          'Leve does not replace consultation, diagnosis, or treatment provided by licensed healthcare professionals.',
          'Always seek the guidance of your physician or another qualified healthcare professional about any health condition, the use of medications (including GLP-1 medications), and changes to your diet or lifestyle.',
          'Decisions about your health are the sole responsibility of the user.',
        ],
      },
      {
        heading: 'Nutritional and algorithm-based estimates',
        paragraphs: [
          'Nutritional data, calorie goals, macronutrients (carbohydrates, proteins, fats, fiber), water goals, BMI, body composition, and reference ranges displayed by Leve are algorithm-based estimates, calculated from public nutritional databases (such as the Tabela Brasileira de Composição de Alimentos — TACO, the Brazilian food composition table), published scientific formulas (such as Mifflin-St Jeor), and standard bioimpedance reference ranges.',
          'These values are approximations and may not reflect the exact nutritional content or individual metabolic needs. Actual values vary with food preparation, portion sizes, individual physiology, and other factors.',
          'Meal photo analysis, when available, uses artificial intelligence and is subject to errors in food identification and portion estimation — always review the items before saving.',
        ],
      },
      {
        heading: 'Notice about GLP-1 medications',
        paragraphs: [
          'Leve can help you log information related to your treatment and habits, but it does not provide guidance on the dose, adjustment, timing, or discontinuation of medications.',
          'All medication entries are made by the user and are not monitored, validated, or interpreted by Leve. The app does not provide medical supervision and does not ensure treatment adherence.',
          'All decisions about medications must be made with a licensed healthcare professional. Do not change your medication regimen without medical guidance.',
        ],
      },
      {
        heading: 'Individual differences and tolerance',
        paragraphs: [
          'Individual responses to diet, hydration, and lifestyle changes vary. Excessive intake of certain nutrients (such as fiber or water) can cause discomfort or adverse effects.',
          'Leve does not guarantee specific results and is not responsible for decisions made based on its data or estimates. Consult qualified professionals for individualized guidance.',
        ],
      },
      {
        heading: 'Emergency notice',
        paragraphs: [
          'Leve is not intended for emergency situations.',
          'If you experience severe, persistent, or worsening symptoms, or believe you are experiencing a medical emergency, seek care immediately. Call your local emergency number (in Brazil, SAMU 192).',
        ],
      },
    ],
  },
  termsOfUse: {
    title: 'Terms of Use',
    updated: 'Effective as of July 18, 2026',
    sections: [
      {
        heading: '1. Acceptance',
        paragraphs: [
          'These Terms of Use govern the use of the Leve application ("Leve" or "the app"), made available by Jorge Brito and Jorge Manoel Reis Brito ("we" or "us"). By using Leve, you declare that you have read, understood, and agree to these terms and to the Privacy Policy and the Medical and Nutritional Notice, which are incorporated into these terms by reference. If you do not agree, do not use the app.',
        ],
      },
      {
        heading: '2. The service',
        paragraphs: [
          'Leve is a personal wellness diary designed for people following treatment with GLP-1 medications: logging of water, meals, weight, measurements, doses, symptoms, cycle, sleep, exercise, and appointments, with charts, reminders, and informational reports.',
          'Leve works primarily on your device: your entries are stored locally. Optional features (account, encrypted backup, photo analysis by artificial intelligence) use remote services as described in the Privacy Policy.',
          'Leve records and organizes information; it does not provide medical, nutritional, or pharmaceutical services.',
        ],
      },
      {
        heading: '3. Eligibility',
        paragraphs: [
          'Leve is intended for people 18 years of age or older. Minors under 18 may use it only with the consent and supervision of their legal guardians and healthcare professionals.',
        ],
      },
      {
        heading: '4. Account, access keys, and security',
        paragraphs: [
          'Using Leve does not require an account. You may optionally connect an account (Apple or Google) to fill in your details and enable backup features.',
          'Partner unlock keys are personal and non-transferable, may be revoked in the event of misuse, and do not create any right to a refund or compensation.',
          'You are responsible for keeping your device and your credentials secure.',
        ],
      },
      {
        heading: '5. Leve Premium subscription',
        paragraphs: [
          'Some features require the Leve Premium subscription, purchased and billed exclusively through the App Store (Apple) or Google Play, at the prices displayed in the store at the time of purchase.',
          'Renewal, cancellation, and any refunds follow the rules of the respective store and are handled through its channels. Cancellation stops the renewal, keeping your access until the end of the period already paid for.',
          'We may change the set of features included in the subscription, preserving the core of the contracted service during the current period.',
        ],
      },
      {
        heading: '6. Acceptable use',
        paragraphs: [
          'You agree not to use Leve for unlawful purposes; not to attempt to circumvent security, licensing, or subscription mechanisms; not to reverse engineer the app outside the cases permitted by law; and not to overload or interfere with the remote services.',
        ],
      },
      {
        heading: '7. User content',
        paragraphs: [
          'The data you enter into Leve is yours. By using features that rely on remote processing (such as meal photo analysis), you authorize us to process that content solely to provide the requested feature, in accordance with the Privacy Policy.',
        ],
      },
      {
        heading: '8. Disclaimer of warranties',
        paragraphs: [
          'Leve is provided "as is," without warranties of uninterrupted availability, accuracy of the estimates, or fitness for a particular purpose, to the maximum extent permitted by law.',
          'The Medical and Nutritional Notice is an integral part of these terms: the app\'s information is educational and does not replace healthcare professionals.',
        ],
      },
      {
        heading: '9. Limitation of liability',
        paragraphs: [
          'To the maximum extent permitted by applicable law, we are not liable for indirect damages, lost profits, or health decisions made based on the app\'s information. Nothing in these terms excludes or limits rights that the consumer protection laws of your country guarantee in a way that cannot be waived.',
        ],
      },
      {
        heading: '10. Intellectual property',
        paragraphs: [
          'The app, its brand, visual identity, mascots, code, and content are protected by intellectual property rights and belong to the owners of Leve. These terms do not transfer any intellectual property rights to you — only a personal, limited, revocable, and non-transferable license to use the app.',
        ],
      },
      {
        heading: '11. Termination',
        paragraphs: [
          'You may stop using Leve at any time and delete your data from within the app. We may suspend access to remote features in the event of a violation of these terms.',
        ],
      },
      {
        heading: '12. Changes',
        paragraphs: [
          'We may update these terms to reflect changes in the app or in the law. Material changes will be announced in the app; the effective date at the top indicates the version in force. Continued use after the effective date constitutes acceptance.',
        ],
      },
      {
        heading: '13. Governing law and venue',
        paragraphs: [
          'These terms are governed by the laws of the Federative Republic of Brazil. For consumer relations in Brazil, the courts of the user\'s domicile are the elected venue. Users in other countries retain the mandatory rights guaranteed by their local laws.',
        ],
      },
      {
        heading: '14. Contact',
        paragraphs: ['Questions about these terms: jdobrito@gmail.com.'],
      },
    ],
  },
  privacyPolicy: {
    title: 'Privacy Policy',
    updated: 'Effective as of July 18, 2026',
    sections: [
      {
        heading: '1. Who we are',
        paragraphs: [
          'Leve is made available by Jorge Brito and Jorge Manoel Reis Brito, the controllers of the personal data processed by the app, under the Lei Geral de Proteção de Dados — the Brazilian General Data Protection Law (Law No. 13,709/2018 — LGPD). Contact for the controllers and the data protection officer: jdobrito@gmail.com.',
        ],
      },
      {
        heading: '2. Leve\'s core principle: your data stays on your device',
        paragraphs: [
          'The entries you make in Leve — water, meals, weight, body measurements, doses, symptoms, menstrual cycle, sleep, exercise, appointments, and notes — are stored locally, on your device. By default, none of this is sent to our servers.',
          'Sensitive health data is processed on the basis of your consent (Article 11, II, "a", of the LGPD), given when you use each feature.',
        ],
      },
      {
        heading: '3. Health integrations (optional)',
        paragraphs: [
          'If you authorize it, Leve reads data from Apple Health (iOS) or Health Connect (Android) — such as weight, body composition, steps, sleep, and heart rate — solely to display your progress in the app. The permission is controlled by the operating system and can be revoked at any time in your device settings. This data also stays only on your device.',
        ],
      },
      {
        heading: '4. Account and data collected (optional)',
        paragraphs: [
          'When you connect an Apple or Google account, we receive only the account identifier and, when you authorize it, your name and email — used to fill in your profile and identify your backup. We do not receive your password.',
          'If you create a backup account, your entries are sent encrypted end to end: the encryption key stays on your device, and we have no technical means of reading the contents of the backup.',
        ],
      },
      {
        heading: '5. Meal photo analysis (premium feature)',
        paragraphs: [
          'When you use food scanning, the photo you take is sent to our server and forwarded to an artificial intelligence provider, solely to identify the foods and estimate portions. The photo is not stored or logged by our server; after the analysis, only the result (the list of foods) returns to your device.',
          'Each photo is sent only through your own explicit action. The AI provider may be located abroad; we adopt appropriate contractual safeguards for international transfers (Article 33 of the LGPD).',
        ],
      },
      {
        heading: '6. Subscriptions and partner keys',
        paragraphs: [
          'The Leve Premium subscription is processed by the App Store or Google Play — we do not receive your card details. From the store, we receive only confirmation of the subscription status.',
          'Partner keys are validated on our server, which stores only a cryptographic digest (hash) of the key, the partner\'s name, and the status (active/revoked).',
        ],
      },
      {
        heading: '7. What we do not do',
        paragraphs: [
          'We do not sell your data. We do not use your health data for advertising. We do not include ad trackers in the app.',
        ],
      },
      {
        heading: '8. Sharing with processors',
        paragraphs: [
          'To provide the optional features, we use processors that handle data on our behalf and under contract: hosting of the Leve server (account, encrypted backup, key validation) and the AI provider (photo analysis). The app stores process subscriptions independently, under their own policies.',
        ],
      },
      {
        heading: '9. Retention and deletion',
        paragraphs: [
          'Local data remains on your device until you delete it — the "Delete my data" button erases all of the app\'s entries. Uninstalling the app also removes the local data.',
          'The encrypted backup and the account data are kept until you delete your account in the app, which removes the backup from our servers.',
        ],
      },
      {
        heading: '10. Your rights (LGPD and equivalent laws)',
        paragraphs: [
          'You can exercise the following directly in the app: access and portability ("Export my data" generates a complete file in an open format), correction (by editing your entries), and deletion ("Delete my data" and account deletion).',
          'You can also withdraw consent (by turning off integrations and features) and request additional information by email at jdobrito@gmail.com. Data subjects in Brazil may also petition the Autoridade Nacional de Proteção de Dados (ANPD), the Brazilian national data protection authority. Users in other jurisdictions (such as the European Union) have equivalent rights guaranteed by local laws, including access, rectification, erasure, and portability.',
        ],
      },
      {
        heading: '11. Security',
        paragraphs: [
          'We adopt proportionate technical measures: local storage on the device, end-to-end encryption for the backup, communication over secure channels, service keys kept only on the server, and partner keys stored only as hashes.',
        ],
      },
      {
        heading: '12. Children and adolescents',
        paragraphs: [
          'Leve is not intended for minors under 18 without the consent and supervision of their legal guardians.',
        ],
      },
      {
        heading: '13. Changes to this policy',
        paragraphs: [
          'Material updates will be announced in the app. The date at the top indicates the version in force.',
        ],
      },
    ],
  },
};
