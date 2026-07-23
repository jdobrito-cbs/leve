import type { LegalCatalog } from '../legalCatalog';

export const legal: LegalCatalog = {
  translationNote:
    'Höflichkeitsübersetzung. Bei Abweichungen ist die portugiesische Fassung (Brasilien) maßgeblich.',
  medicalNotice: {
    title: 'Medizinischer und ernährungsbezogener Hinweis',
    updated: 'Gültig ab 18. Juli 2026',
    sections: [
      {
        heading: 'Leve ist kein Medizinprodukt und bietet keine medizinische Beratung',
        paragraphs: [
          'Die von Leve bereitgestellten Informationen dienen ausschließlich Bildungs- und Informationszwecken und sind nicht dazu bestimmt, Krankheiten zu diagnostizieren, zu behandeln, zu heilen oder ihnen vorzubeugen.',
          'Leve ersetzt weder die Konsultation noch die Diagnose oder die Behandlung durch qualifizierte Angehörige der Gesundheitsberufe.',
          'Holen Sie stets den Rat Ihres Arztes oder einer anderen qualifizierten Gesundheitsfachkraft zu jeder gesundheitlichen Beschwerde, zur Einnahme von Medikamenten (einschließlich GLP-1-Medikamenten) und zu Änderungen Ihrer Ernährung oder Ihrer Lebensweise ein.',
          'Entscheidungen über Ihre Gesundheit liegen in der alleinigen Verantwortung des Nutzers.',
        ],
      },
      {
        heading: 'Nährwert- und Algorithmus-Schätzungen',
        paragraphs: [
          'Die von Leve angezeigten Nährwertdaten, Kalorienziele, Makronährstoffe (Kohlenhydrate, Proteine, Fette, Ballaststoffe), Wasserziele, der BMI, die Körperzusammensetzung und die Referenzbereiche sind algorithmusbasierte Schätzungen, berechnet aus öffentlichen Nährwertdatenbanken (wie der brasilianischen Lebensmittel-Nährwerttabelle — Tabela Brasileira de Composição de Alimentos, TACO), veröffentlichten wissenschaftlichen Formeln (wie Mifflin-St Jeor) und Standard-Referenzbereichen der Bioimpedanz.',
          'Diese Werte sind Näherungswerte und geben möglicherweise weder den genauen Nährstoffgehalt noch den individuellen Stoffwechselbedarf wieder. Die tatsächlichen Werte variieren je nach Zubereitung der Lebensmittel, Portionsgröße, individueller Physiologie und weiteren Faktoren.',
          'Die Analyse von Mahlzeitenfotos nutzt, sofern verfügbar, künstliche Intelligenz und kann Fehler bei der Erkennung und bei der Portionsschätzung enthalten — prüfen Sie die Einträge stets, bevor Sie sie speichern.',
        ],
      },
      {
        heading: 'Hinweis zu GLP-1-Medikamenten',
        paragraphs: [
          'Leve kann den Nutzer dabei unterstützen, Informationen zu seiner Behandlung und seinen Gewohnheiten zu erfassen, gibt jedoch keine Empfehlungen zu Dosis, Anpassung, Einnahmezeitpunkt oder Absetzen von Medikamenten.',
          'Alle Medikamenteneinträge werden vom Nutzer selbst eingegeben und von Leve weder überwacht noch validiert oder interpretiert. Die App bietet keine medizinische Überwachung und gewährleistet keine Therapietreue.',
          'Alle Entscheidungen über Medikamente müssen gemeinsam mit einer qualifizierten Gesundheitsfachkraft getroffen werden. Ändern Sie Ihr Medikationsschema nicht ohne ärztliche Anweisung.',
        ],
      },
      {
        heading: 'Individuelle Unterschiede und Verträglichkeit',
        paragraphs: [
          'Die individuellen Reaktionen auf Ernährung, Flüssigkeitszufuhr und Änderungen der Lebensweise sind unterschiedlich. Der übermäßige Konsum bestimmter Nährstoffe (wie Ballaststoffe oder Wasser) kann Beschwerden oder unerwünschte Wirkungen verursachen.',
          'Leve garantiert keine bestimmten Ergebnisse und übernimmt keine Verantwortung für Entscheidungen, die auf Grundlage seiner Daten oder Schätzungen getroffen werden. Wenden Sie sich für eine individuelle Beratung an qualifizierte Fachkräfte.',
        ],
      },
      {
        heading: 'Hinweis für Notfälle',
        paragraphs: [
          'Leve ist nicht für Notfallsituationen bestimmt.',
          'Wenn Sie schwere, anhaltende oder sich verschlimmernde Symptome haben oder glauben, dass bei Ihnen ein medizinischer Notfall vorliegt, suchen Sie sofort medizinische Hilfe auf. Rufen Sie Ihre örtliche Notrufnummer an (112 in Deutschland; SAMU 192 in Brasilien).',
        ],
      },
    ],
  },
  termsOfUse: {
    title: 'Nutzungsbedingungen',
    updated: 'Gültig ab 18. Juli 2026',
    sections: [
      {
        heading: '1. Zustimmung',
        paragraphs: [
          'Diese Nutzungsbedingungen regeln die Nutzung der App Leve („Leve“ oder „App“), bereitgestellt von Jorge Brito, Jorge Manoel Brito und Alairton Silva („wir“). Mit der Nutzung von Leve erklären Sie, dass Sie diese Bedingungen sowie die Datenschutzerklärung und den Medizinischen und ernährungsbezogenen Hinweis, die durch Verweis Bestandteil dieser Bedingungen sind, gelesen und verstanden haben und ihnen zustimmen. Wenn Sie nicht zustimmen, nutzen Sie die App nicht.',
        ],
      },
      {
        heading: '2. Der Dienst',
        paragraphs: [
          'Leve ist ein persönliches Wohlbefindens-Tagebuch für Menschen, die eine Behandlung mit GLP-1-Medikamenten begleiten: Erfassung von Wasser, Mahlzeiten, Gewicht, Körpermaßen, Dosen, Symptomen, Zyklus, Schlaf, Training und Arztterminen, mit Diagrammen, Erinnerungen und informativen Berichten.',
          'Leve funktioniert vorrangig auf Ihrem Gerät: Ihre Einträge werden lokal gespeichert. Optionale Funktionen (Anmeldung mit Apple oder Google und Fotoanalyse durch künstliche Intelligenz) nutzen entfernte Dienste, wie in der Datenschutzerklärung beschrieben.',
          'Leve erfasst und organisiert Informationen; es erbringt keine medizinischen, ernährungsbezogenen oder pharmazeutischen Dienstleistungen.',
        ],
      },
      {
        heading: '3. Nutzungsberechtigung',
        paragraphs: [
          'Leve richtet sich an Personen ab 18 Jahren. Minderjährige unter 18 Jahren dürfen die App nur mit Einwilligung und unter Begleitung ihrer gesetzlichen Vertreter und von Angehörigen der Gesundheitsberufe nutzen.',
        ],
      },
      {
        heading: '4. Konto, Zugangsschlüssel und Sicherheit',
        paragraphs: [
          'Die Nutzung von Leve erfordert kein Konto. Sie können optional ein Konto (Apple oder Google) verbinden, nur um Ihren Namen und Ihre E-Mail-Adresse im Profil auszufüllen.',
          'Partner-Freischaltschlüssel sind persönlich und nicht übertragbar, können bei missbräuchlicher Nutzung widerrufen werden und begründen keinen Anspruch auf Erstattung oder Entschädigung.',
          'Sie sind dafür verantwortlich, die Sicherheit Ihres Geräts und Ihrer Zugangsdaten zu gewährleisten.',
        ],
      },
      {
        heading: '5. Abonnement Leve Premium',
        paragraphs: [
          'Einige Funktionen erfordern das Abonnement Leve Premium, das ausschließlich über den App Store (Apple) oder Google Play abgeschlossen und abgerechnet wird, zu den im Store zum Zeitpunkt des Kaufs angezeigten Preisen.',
          'Verlängerung, Kündigung und etwaige Erstattungen richten sich nach den Regeln des jeweiligen Stores und erfolgen über dessen Kanäle. Die Kündigung beendet die Verlängerung; der Zugang bleibt bis zum Ende des bereits bezahlten Zeitraums bestehen.',
          'Wir können den im Abonnement enthaltenen Funktionsumfang ändern, wobei der Kern des gebuchten Dienstes während des laufenden Zeitraums erhalten bleibt.',
        ],
      },
      {
        heading: '6. Zulässige Nutzung',
        paragraphs: [
          'Sie verpflichten sich, Leve nicht für rechtswidrige Zwecke zu nutzen, nicht zu versuchen, Sicherheits-, Lizenzierungs- oder Abonnementmechanismen zu umgehen, kein Reverse Engineering außerhalb der gesetzlich zulässigen Fälle durchzuführen und die entfernten Dienste nicht zu überlasten oder zu stören.',
        ],
      },
      {
        heading: '7. Nutzerinhalte',
        paragraphs: [
          'Die Daten, die Sie in Leve eingeben, gehören Ihnen. Wenn Sie Funktionen nutzen, die auf entfernter Verarbeitung beruhen (wie die Fotoanalyse von Mahlzeiten), gestatten Sie uns, diese Inhalte ausschließlich zur Erbringung der angeforderten Funktion zu verarbeiten, gemäß der Datenschutzerklärung.',
        ],
      },
      {
        heading: '8. Gewährleistungsausschluss',
        paragraphs: [
          'Leve wird „wie besehen“ bereitgestellt, ohne Garantien für ununterbrochene Verfügbarkeit, Genauigkeit der Schätzungen oder Eignung für bestimmte Zwecke, soweit gesetzlich zulässig.',
          'Der Medizinische und ernährungsbezogene Hinweis ist Bestandteil dieser Bedingungen: Die Informationen der App dienen Bildungszwecken und ersetzen keine Angehörigen der Gesundheitsberufe.',
        ],
      },
      {
        heading: '9. Haftungsbeschränkung',
        paragraphs: [
          'Soweit nach anwendbarem Recht zulässig, haften wir nicht für mittelbare Schäden, entgangenen Gewinn oder Gesundheitsentscheidungen, die auf Grundlage der Informationen der App getroffen werden. Nichts in diesen Bedingungen schließt Rechte aus oder schränkt Rechte ein, die Ihnen das Verbraucherschutzrecht Ihres Landes unabdingbar gewährt.',
        ],
      },
      {
        heading: '10. Geistiges Eigentum',
        paragraphs: [
          'Die App, ihre Marke, ihr Erscheinungsbild, ihre Maskottchen, ihr Code und ihre Inhalte sind durch Rechte des geistigen Eigentums geschützt und gehören den Inhabern von Leve. Diese Bedingungen übertragen Ihnen keinerlei Rechte des geistigen Eigentums, sondern nur eine persönliche, beschränkte, widerrufliche und nicht übertragbare Nutzungslizenz.',
        ],
      },
      {
        heading: '11. Beendigung',
        paragraphs: [
          'Sie können die Nutzung von Leve jederzeit beenden und Ihre Daten direkt in der App löschen. Wir können den Zugang zu entfernten Funktionen aussetzen, wenn gegen diese Bedingungen verstoßen wird.',
        ],
      },
      {
        heading: '12. Änderungen',
        paragraphs: [
          'Wir können diese Bedingungen aktualisieren, um Änderungen der App oder der Gesetzgebung abzubilden. Wesentliche Änderungen werden in der App mitgeteilt; das Gültigkeitsdatum oben gibt die geltende Fassung an. Die fortgesetzte Nutzung nach dem Inkrafttreten gilt als Zustimmung.',
        ],
      },
      {
        heading: '13. Anwendbares Recht und Gerichtsstand',
        paragraphs: [
          'Diese Bedingungen unterliegen den Gesetzen der Föderativen Republik Brasilien. Für Verbraucherverhältnisse in Brasilien ist der Gerichtsstand des Wohnsitzes des Nutzers vereinbart. Nutzer in anderen Ländern behalten die zwingenden Rechte, die ihnen das örtliche Recht gewährt.',
        ],
      },
      {
        heading: '14. Kontakt',
        paragraphs: ['Fragen zu diesen Bedingungen: jdobrito@gmail.com.'],
      },
    ],
  },
  privacyPolicy: {
    title: 'Datenschutzerklärung',
    updated: 'Gültig ab 18. Juli 2026',
    sections: [
      {
        heading: '1. Wer wir sind',
        paragraphs: [
          'Leve wird von Jorge Brito, Jorge Manoel Brito und Alairton Silva bereitgestellt, den Verantwortlichen für die von der App verarbeiteten personenbezogenen Daten im Sinne des brasilianischen Datenschutzgesetzes (Lei Geral de Proteção de Dados, Gesetz Nr. 13.709/2018 — LGPD). Kontakt des Verantwortlichen und des Datenschutzbeauftragten: jdobrito@gmail.com.',
        ],
      },
      {
        heading: '2. Das Prinzip von Leve: Ihre Daten bleiben auf Ihrem Gerät',
        paragraphs: [
          'Die Einträge, die Sie in Leve vornehmen — Wasser, Mahlzeiten, Gewicht, Körpermaße, Dosen, Symptome, Menstruationszyklus, Schlaf, Training, Arzttermine und Beobachtungen — werden lokal auf Ihrem Gerät gespeichert. Standardmäßig wird nichts davon an unsere Server übertragen.',
          'Sensible Gesundheitsdaten werden auf Grundlage Ihrer Einwilligung verarbeitet (Art. 11 II „a“ des brasilianischen Datenschutzgesetzes — LGPD), die Sie bei der Nutzung der jeweiligen Funktion erklären.',
        ],
      },
      {
        heading: '3. Gesundheitsintegrationen (optional)',
        paragraphs: [
          'Wenn Sie es erlauben, liest Leve Daten aus Apple Health (iOS) oder Health Connect (Android) — etwa Gewicht, Körperzusammensetzung, Schritte, Schlaf und Herzfrequenz — ausschließlich, um Ihren Fortschritt in der App anzuzeigen. Die Berechtigung wird vom Betriebssystem verwaltet und kann jederzeit in den Geräteeinstellungen widerrufen werden. Auch diese Daten bleiben nur auf Ihrem Gerät.',
        ],
      },
      {
        heading: '4. Konto und erhobene Daten (optional)',
        paragraphs: [
          'Wenn Sie ein Apple- oder Google-Konto verbinden, erhalten wir nur die Kontokennung und, sofern Sie es erlauben, Name und E-Mail-Adresse, verwendet, um Ihr Profil auszufüllen. Ihr Passwort erhalten wir nicht.',
        ],
      },
      {
        heading: '5. Fotoanalyse von Mahlzeiten (Premium-Funktion)',
        paragraphs: [
          'Wenn Sie das Essen-Scannen nutzen, wird das von Ihnen aufgenommene Foto an unseren Server übertragen und an einen Anbieter künstlicher Intelligenz weitergeleitet — ausschließlich, um die Lebensmittel zu erkennen und Portionen zu schätzen. Das Foto wird von unserem Server weder gespeichert noch protokolliert; nach der Analyse kehrt nur das Ergebnis (die Liste der Lebensmittel) auf Ihr Gerät zurück.',
          'Die Übertragung jedes Fotos ist eine ausdrückliche Handlung Ihrerseits. Der KI-Anbieter kann sich im Ausland befinden; wir treffen angemessene vertragliche Schutzvorkehrungen für internationale Datenübermittlungen (Art. 33 des brasilianischen Datenschutzgesetzes — LGPD).',
        ],
      },
      {
        heading: '6. Abonnements und Partnerschlüssel',
        paragraphs: [
          'Das Abonnement Leve Premium wird über den App Store oder Google Play abgewickelt — wir erhalten keine Daten Ihrer Karte. Vom Store erhalten wir nur die Bestätigung des Abonnementstatus.',
          'Partnerschlüssel werden auf unserem Server geprüft, der nur eine kryptografische Prüfsumme (Hash) des Schlüssels, den Namen des Partners und den Status (aktiv/widerrufen) speichert.',
        ],
      },
      {
        heading: '7. Was wir nicht tun',
        paragraphs: [
          'Wir verkaufen Ihre Daten nicht. Wir verwenden Ihre Gesundheitsdaten nicht für Werbung. Wir binden keine Werbe-Tracker in die App ein.',
        ],
      },
      {
        heading: '8. Weitergabe an Auftragsverarbeiter',
        paragraphs: [
          'Zur Bereitstellung der optionalen Funktionen nutzen wir Auftragsverarbeiter, die Daten in unserem Auftrag und auf Vertragsbasis verarbeiten: das Hosting des Leve-Servers (Prüfung der Partnerschlüssel) und den KI-Anbieter (Fotoanalyse). Die App-Stores verarbeiten die Abonnements eigenständig nach ihren eigenen Richtlinien.',
        ],
      },
      {
        heading: '9. Aufbewahrung und Löschung',
        paragraphs: [
          'Lokale Daten verbleiben auf Ihrem Gerät, bis Sie sie löschen — die Schaltfläche „Meine Daten löschen“ entfernt alle Einträge der App. Auch das Deinstallieren der App entfernt die lokalen Daten.',
          'Wir speichern Ihre Einträge nicht auf unseren Servern: Die App sendet uns diese Daten nicht.',
        ],
      },
      {
        heading: '10. Ihre Rechte (LGPD und gleichwertige Gesetze)',
        paragraphs: [
          'Sie können direkt in der App ausüben: Auskunft und Datenübertragbarkeit („Meine Daten exportieren“ erzeugt eine vollständige Datei in offenem Format), Berichtigung (durch Bearbeiten der Einträge) und Löschung („Meine Daten löschen“ und Löschung des Kontos).',
          'Sie können außerdem Einwilligungen widerrufen (indem Sie Integrationen und Funktionen deaktivieren) und weitere Informationen per E-Mail an jdobrito@gmail.com anfordern. Betroffene Personen in Brasilien können sich zudem mit einer Eingabe an die brasilianische Datenschutzbehörde (Autoridade Nacional de Proteção de Dados — ANPD) wenden. Nutzer in anderen Rechtsordnungen (wie der Europäischen Union) haben gleichwertige, durch die örtlichen Gesetze garantierte Rechte, einschließlich Auskunft, Berichtigung, Löschung und Datenübertragbarkeit.',
        ],
      },
      {
        heading: '11. Sicherheit',
        paragraphs: [
          'Wir treffen verhältnismäßige technische Maßnahmen: lokale Speicherung auf dem Gerät, Kommunikation über sichere Kanäle, Dienstschlüssel, die nur auf dem Server aufbewahrt werden, und Speicherung von Partnerschlüsseln ausschließlich als Hash.',
        ],
      },
      {
        heading: '12. Kinder und Jugendliche',
        paragraphs: [
          'Leve ist nicht für Minderjährige unter 18 Jahren ohne Einwilligung und Begleitung der gesetzlichen Vertreter bestimmt.',
        ],
      },
      {
        heading: '13. Änderungen dieser Erklärung',
        paragraphs: [
          'Wesentliche Aktualisierungen werden in der App mitgeteilt. Das Datum oben gibt die geltende Fassung an.',
        ],
      },
    ],
  },
};
