import type { LegalCatalog } from '../legalCatalog';

export const legal: LegalCatalog = {
  translationNote:
    'Traduction de courtoisie. En cas de divergence, la version en portugais (Brésil) prévaut.',
  medicalNotice: {
    title: 'Avis médical et nutritionnel',
    updated: 'En vigueur à compter du 18 juillet 2026',
    sections: [
      {
        heading: 'Leve n\'est pas un dispositif médical et ne fournit pas de conseils médicaux',
        paragraphs: [
          'Les informations présentées par Leve ont une finalité exclusivement éducative et informative et ne sont pas destinées à diagnostiquer, traiter, guérir ou prévenir une quelconque maladie.',
          'Leve ne remplace pas la consultation, le diagnostic ni le traitement réalisés par des professionnels de santé habilités.',
          'Demandez toujours conseil à votre médecin ou à un autre professionnel de santé qualifié pour toute condition de santé, l\'utilisation de médicaments (y compris les médicaments GLP-1) et les changements dans votre alimentation ou votre mode de vie.',
          'Les décisions concernant votre santé relèvent de la responsabilité exclusive de l\'utilisateur.',
        ],
      },
      {
        heading: 'Estimations nutritionnelles et algorithmiques',
        paragraphs: [
          'Les données nutritionnelles, les objectifs de calories, les macronutriments (glucides, protéines, lipides, fibres), les objectifs d\'eau, l\'IMC, la composition corporelle et les plages de référence affichés par Leve sont des estimations basées sur des algorithmes, calculées à partir de bases nutritionnelles publiques (comme la table brésilienne de composition des aliments — TACO), de formules scientifiques publiées (comme Mifflin-St Jeor) et de plages de référence standard de bio-impédance.',
          'Ces valeurs sont des approximations et peuvent ne pas refléter le contenu nutritionnel exact ni les besoins métaboliques individuels. Les valeurs réelles varient selon la préparation des aliments, la taille des portions, la physiologie individuelle et d\'autres facteurs.',
          'L\'analyse des photos de repas, lorsqu\'elle est disponible, utilise l\'intelligence artificielle et est sujette à des erreurs d\'identification et d\'estimation des portions — vérifiez toujours les éléments avant d\'enregistrer.',
        ],
      },
      {
        heading: 'Avis concernant les médicaments GLP-1',
        paragraphs: [
          'Leve peut aider l\'utilisateur à enregistrer des informations liées à son traitement et à ses habitudes, mais ne fournit aucune indication sur la dose, l\'ajustement, l\'horaire ou l\'arrêt des médicaments.',
          'Tous les enregistrements de médication sont saisis par l\'utilisateur lui-même et ne sont ni surveillés, ni validés, ni interprétés par Leve. L\'application n\'offre pas de supervision médicale et ne garantit pas l\'observance du traitement.',
          'Toutes les décisions concernant les médicaments doivent être prises avec un professionnel de santé habilité. Ne modifiez pas votre régime de médication sans avis médical.',
        ],
      },
      {
        heading: 'Différences individuelles et tolérance',
        paragraphs: [
          'Les réponses individuelles à l\'alimentation, à l\'hydratation et aux changements de mode de vie varient. La consommation excessive de certains nutriments (comme les fibres ou l\'eau) peut provoquer un inconfort ou des effets indésirables.',
          'Leve ne garantit pas de résultats spécifiques et n\'assume aucune responsabilité pour les décisions prises sur la base de ses données ou estimations. Consultez des professionnels qualifiés pour des conseils individualisés.',
        ],
      },
      {
        heading: 'Avis d\'urgence',
        paragraphs: [
          'Leve n\'est pas destiné aux situations d\'urgence.',
          'Si vous présentez des symptômes graves, persistants ou qui s\'aggravent, ou si vous pensez être en situation d\'urgence médicale, consultez immédiatement. Appelez votre numéro d\'urgence local (15/112 en France ; SAMU 192 au Brésil).',
        ],
      },
    ],
  },
  termsOfUse: {
    title: 'Conditions d\'utilisation',
    updated: 'En vigueur à compter du 18 juillet 2026',
    sections: [
      {
        heading: '1. Acceptation',
        paragraphs: [
          'Les présentes Conditions d\'utilisation régissent l\'utilisation de l\'application Leve (« Leve » ou « application »), mise à disposition par Jorge Brito et Jorge Manoel Reis Brito (« nous »). En utilisant Leve, vous déclarez avoir lu, compris et accepté ces conditions ainsi que la Politique de confidentialité et l\'Avis médical et nutritionnel, qui en font partie intégrante par référence. Si vous n\'êtes pas d\'accord, n\'utilisez pas l\'application.',
        ],
      },
      {
        heading: '2. Le service',
        paragraphs: [
          'Leve est un journal personnel de bien-être destiné aux personnes qui suivent des traitements par médicaments GLP-1 : enregistrement de l\'eau, des repas, du poids, des mesures, des doses, des symptômes, du cycle, du sommeil, des exercices et des rendez-vous médicaux, avec graphiques, rappels et rapports informatifs.',
          'Leve fonctionne en priorité sur votre appareil : vos enregistrements sont stockés localement. Les fonctionnalités optionnelles (compte, sauvegarde chiffrée, analyse de photo par intelligence artificielle) utilisent des services distants comme décrit dans la Politique de confidentialité.',
          'Leve enregistre et organise des informations ; il ne fournit pas de services médicaux, nutritionnels ou pharmaceutiques.',
        ],
      },
      {
        heading: '3. Éligibilité',
        paragraphs: [
          'Leve est destiné aux personnes de 18 ans ou plus. Les mineurs de moins de 18 ans ne peuvent l\'utiliser qu\'avec le consentement et l\'accompagnement de leurs représentants légaux et de professionnels de santé.',
        ],
      },
      {
        heading: '4. Compte, clés d\'accès et sécurité',
        paragraphs: [
          'L\'utilisation de Leve n\'exige pas de compte. Vous pouvez, si vous le souhaitez, connecter un compte (Apple ou Google) pour renseigner vos données et activer les fonctionnalités de sauvegarde.',
          'Les clés de déblocage de partenaires sont personnelles et incessibles, peuvent être révoquées en cas d\'usage abusif et n\'ouvrent droit à aucun remboursement ni indemnisation.',
          'Vous êtes responsable de la sécurité de votre appareil et de vos identifiants.',
        ],
      },
      {
        heading: '5. Abonnement Leve Premium',
        paragraphs: [
          'Certaines fonctionnalités exigent l\'abonnement Leve Premium, souscrit et facturé exclusivement via l\'App Store (Apple) ou Google Play, aux prix affichés dans la boutique au moment de l\'achat.',
          'Le renouvellement, l\'annulation et les éventuels remboursements suivent les règles de la boutique concernée et s\'effectuent par ses canaux. L\'annulation interrompt le renouvellement, l\'accès étant maintenu jusqu\'à la fin de la période déjà payée.',
          'Nous pouvons modifier l\'ensemble des fonctionnalités incluses dans l\'abonnement, en préservant le cœur du service souscrit pendant la période en cours.',
        ],
      },
      {
        heading: '6. Utilisation acceptable',
        paragraphs: [
          'Vous vous engagez à ne pas utiliser Leve à des fins illicites ; à ne pas tenter de contourner les mécanismes de sécurité, de licence ou d\'abonnement ; à ne pas pratiquer d\'ingénierie inverse en dehors des cas prévus par la loi ; et à ne pas surcharger ni perturber les services distants.',
        ],
      },
      {
        heading: '7. Contenu de l\'utilisateur',
        paragraphs: [
          'Les données que vous saisissez dans Leve vous appartiennent. En utilisant des fonctionnalités qui dépendent d\'un traitement à distance (comme l\'analyse de photo de repas), vous nous autorisez à traiter ce contenu exclusivement pour fournir la fonctionnalité demandée, conformément à la Politique de confidentialité.',
        ],
      },
      {
        heading: '8. Exclusions de garantie',
        paragraphs: [
          'Leve est fourni « en l\'état », sans garantie de disponibilité ininterrompue, d\'exactitude des estimations ou d\'adéquation à des finalités spécifiques, dans toute la mesure permise par la loi.',
          'L\'Avis médical et nutritionnel fait partie intégrante des présentes conditions : les informations de l\'application sont éducatives et ne remplacent pas les professionnels de santé.',
        ],
      },
      {
        heading: '9. Limitation de responsabilité',
        paragraphs: [
          'Dans toute la mesure permise par la législation applicable, nous ne répondons pas des dommages indirects, des manques à gagner ni des décisions de santé prises sur la base des informations de l\'application. Rien dans les présentes conditions n\'exclut ni ne limite les droits que la législation de protection des consommateurs de votre pays garantit de manière impérative.',
        ],
      },
      {
        heading: '10. Propriété intellectuelle',
        paragraphs: [
          'L\'application, sa marque, son identité visuelle, ses mascottes, son code et son contenu sont protégés par des droits de propriété intellectuelle et appartiennent aux titulaires de Leve. Les présentes conditions ne vous transfèrent aucun droit de propriété intellectuelle, seulement une licence d\'utilisation personnelle, limitée, révocable et incessible.',
        ],
      },
      {
        heading: '11. Résiliation',
        paragraphs: [
          'Vous pouvez cesser d\'utiliser Leve à tout moment et supprimer vos données depuis l\'application elle-même. Nous pouvons suspendre l\'accès aux fonctionnalités distantes en cas de violation des présentes conditions.',
        ],
      },
      {
        heading: '12. Modifications',
        paragraphs: [
          'Nous pouvons mettre à jour ces conditions pour refléter des changements dans l\'application ou la législation. Les modifications importantes seront communiquées dans l\'application ; la date d\'entrée en vigueur indiquée en haut identifie la version applicable. La poursuite de l\'utilisation après l\'entrée en vigueur vaut acceptation.',
        ],
      },
      {
        heading: '13. Droit applicable et juridiction',
        paragraphs: [
          'Les présentes conditions sont régies par les lois de la République fédérative du Brésil. Pour les relations de consommation au Brésil, la juridiction compétente est celle du domicile de l\'utilisateur. Les utilisateurs d\'autres pays conservent les droits impératifs garantis par la législation locale.',
        ],
      },
      {
        heading: '14. Contact',
        paragraphs: ['Pour toute question concernant ces conditions : jdobrito@gmail.com.'],
      },
    ],
  },
  privacyPolicy: {
    title: 'Politique de confidentialité',
    updated: 'En vigueur à compter du 18 juillet 2026',
    sections: [
      {
        heading: '1. Qui sommes-nous',
        paragraphs: [
          'Leve est mis à disposition par Jorge Brito et Jorge Manoel Reis Brito, responsables du traitement des données personnelles traitées par l\'application, au sens de la loi générale brésilienne sur la protection des données (loi nº 13.709/2018 — LGPD). Contact du responsable du traitement et du délégué à la protection des données : jdobrito@gmail.com.',
        ],
      },
      {
        heading: '2. Le principe de Leve : vos données restent sur votre appareil',
        paragraphs: [
          'Les enregistrements que vous effectuez dans Leve — eau, repas, poids, mesures corporelles, doses, symptômes, cycle menstruel, sommeil, exercices, rendez-vous médicaux et observations — sont stockés localement, sur votre appareil. Par défaut, rien de tout cela n\'est envoyé à nos serveurs.',
          'Les données sensibles de santé sont traitées sur la base de votre consentement (art. 11, II, « a », de la LGPD), exprimé lors de l\'utilisation de chaque fonctionnalité.',
        ],
      },
      {
        heading: '3. Intégrations santé (optionnelles)',
        paragraphs: [
          'Si vous l\'autorisez, Leve lit des données d\'Apple Santé (iOS) ou de Health Connect (Android) — comme le poids, la composition corporelle, les pas, le sommeil et la fréquence cardiaque — exclusivement pour afficher votre progression dans l\'application. La permission est contrôlée par le système d\'exploitation et peut être révoquée à tout moment dans les réglages de l\'appareil. Ces données restent, elles aussi, uniquement sur votre appareil.',
        ],
      },
      {
        heading: '4. Compte et données collectées (optionnels)',
        paragraphs: [
          'Lorsque vous connectez un compte Apple ou Google, nous recevons uniquement l\'identifiant du compte et, si vous l\'autorisez, votre nom et votre e-mail — utilisés pour renseigner votre profil et identifier votre sauvegarde. Nous ne recevons pas votre mot de passe.',
          'Si vous créez un compte de sauvegarde, vos enregistrements sont envoyés chiffrés de bout en bout : la clé de chiffrement reste sur votre appareil et nous n\'avons aucun moyen technique de lire le contenu de la sauvegarde.',
        ],
      },
      {
        heading: '5. Analyse de photo de repas (fonctionnalité premium)',
        paragraphs: [
          'Lorsque vous utilisez le scan des aliments, la photo que vous prenez est envoyée à notre serveur puis transmise à un fournisseur d\'intelligence artificielle, exclusivement pour identifier les aliments et estimer les portions. La photo n\'est ni stockée ni consignée dans des journaux par notre serveur ; après l\'analyse, seul le résultat (liste d\'aliments) revient sur votre appareil.',
          'L\'envoi de chaque photo est une action explicite de votre part. Le fournisseur d\'IA peut être situé à l\'étranger ; nous adoptons des garanties contractuelles appropriées pour les transferts internationaux (art. 33 de la LGPD).',
        ],
      },
      {
        heading: '6. Abonnements et clés de partenaire',
        paragraphs: [
          'L\'abonnement Leve Premium est traité par l\'App Store ou Google Play — nous ne recevons pas les données de votre carte. Nous recevons de la boutique uniquement la confirmation de l\'état de l\'abonnement.',
          'Les clés de partenaire sont validées sur notre serveur, qui stocke uniquement une empreinte cryptographique (hash) de la clé, le nom du partenaire et l\'état (active/révoquée).',
        ],
      },
      {
        heading: '7. Ce que nous ne faisons pas',
        paragraphs: [
          'Nous ne vendons pas vos données. Nous n\'utilisons pas vos données de santé à des fins publicitaires. Nous n\'incluons pas de traceurs publicitaires dans l\'application.',
        ],
      },
      {
        heading: '8. Partage avec des sous-traitants',
        paragraphs: [
          'Pour fournir les fonctionnalités optionnelles, nous faisons appel à des sous-traitants qui traitent les données en notre nom et sous contrat : hébergement du serveur de Leve (compte, sauvegarde chiffrée, validation des clés) et fournisseur d\'IA (analyse de photo). Les boutiques d\'applications traitent les abonnements de manière indépendante, conformément à leurs propres politiques.',
        ],
      },
      {
        heading: '9. Conservation et suppression',
        paragraphs: [
          'Les données locales restent sur votre appareil jusqu\'à ce que vous les supprimiez — le bouton « Supprimer mes données » efface tous les enregistrements de l\'application. Désinstaller l\'application supprime également les données locales.',
          'La sauvegarde chiffrée et les données du compte sont conservées jusqu\'à ce que vous supprimiez le compte dans l\'application, ce qui retire la sauvegarde de nos serveurs.',
        ],
      },
      {
        heading: '10. Vos droits (LGPD et lois équivalentes)',
        paragraphs: [
          'Vous pouvez exercer, directement depuis l\'application : l\'accès et la portabilité (« Exporter mes données » génère un fichier complet dans un format ouvert), la rectification (en modifiant les enregistrements) et l\'effacement (« Supprimer mes données » et suppression du compte).',
          'Vous pouvez également révoquer vos consentements (en désactivant les intégrations et fonctionnalités) et demander des informations supplémentaires par e-mail à jdobrito@gmail.com. Les personnes concernées au Brésil peuvent en outre adresser une réclamation à l\'autorité nationale brésilienne de protection des données (ANPD). Les utilisateurs d\'autres juridictions (comme l\'Union européenne) disposent de droits équivalents garantis par les lois locales, y compris l\'accès, la rectification, l\'effacement et la portabilité.',
        ],
      },
      {
        heading: '11. Sécurité',
        paragraphs: [
          'Nous adoptons des mesures techniques proportionnées : stockage local sur l\'appareil, chiffrement de bout en bout de la sauvegarde, communication par des canaux sécurisés, clés de services conservées uniquement sur le serveur et stockage des clés de partenaire uniquement sous forme de hash.',
        ],
      },
      {
        heading: '12. Enfants et adolescents',
        paragraphs: [
          'Leve n\'est pas destiné aux mineurs de moins de 18 ans sans le consentement et l\'accompagnement de leurs représentants légaux.',
        ],
      },
      {
        heading: '13. Modifications de cette politique',
        paragraphs: [
          'Les mises à jour importantes seront communiquées dans l\'application. La date indiquée en haut identifie la version en vigueur.',
        ],
      },
    ],
  },
};
