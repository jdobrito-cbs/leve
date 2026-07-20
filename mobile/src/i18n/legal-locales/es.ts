import type { LegalCatalog } from '../legalCatalog';

export const legal: LegalCatalog = {
  translationNote:
    'Traducción de cortesía. En caso de discrepancia, prevalece la versión en portugués (Brasil).',
  medicalNotice: {
    title: 'Aviso médico y nutricional',
    updated: 'Vigente a partir del 18 de julio de 2026',
    sections: [
      {
        heading: 'Leve no es un dispositivo médico y no proporciona asesoramiento médico',
        paragraphs: [
          'La información presentada por Leve tiene una finalidad exclusivamente educativa e informativa y no está destinada a diagnosticar, tratar, curar ni prevenir ninguna enfermedad.',
          'Leve no sustituye la consulta, el diagnóstico ni el tratamiento realizados por profesionales de la salud habilitados.',
          'Busca siempre la orientación de tu médico o de otro profesional de la salud cualificado sobre cualquier condición de salud, el uso de medicamentos (incluidos los medicamentos GLP-1) y los cambios en tu alimentación o estilo de vida.',
          'Las decisiones sobre tu salud son responsabilidad exclusiva del usuario.',
        ],
      },
      {
        heading: 'Estimaciones nutricionales y de algoritmos',
        paragraphs: [
          'Los datos nutricionales, las metas de calorías, los macronutrientes (carbohidratos, proteínas, grasas, fibra), las metas de agua, el IMC, la composición corporal y los rangos de referencia mostrados por Leve son estimaciones basadas en algoritmos, calculadas a partir de bases nutricionales públicas (como la Tabla Brasileña de Composición de Alimentos — TACO), fórmulas científicas publicadas (como Mifflin-St Jeor) y rangos de referencia estándar de bioimpedancia.',
          'Estos valores son aproximaciones y pueden no reflejar el contenido nutricional exacto ni las necesidades metabólicas individuales. Los valores reales varían según la preparación de los alimentos, el tamaño de las porciones, la fisiología individual y otros factores.',
          'El análisis de fotos de comidas, cuando está disponible, usa inteligencia artificial y está sujeto a errores de identificación y de estimación de porciones — revisa siempre los elementos antes de guardar.',
        ],
      },
      {
        heading: 'Aviso sobre medicamentos GLP-1',
        paragraphs: [
          'Leve puede ayudar al usuario a registrar información relacionada con su tratamiento y sus hábitos, pero no proporciona orientación sobre la dosis, el ajuste, el horario o la interrupción de medicamentos.',
          'Todos los registros de medicación los introduce el propio usuario y no son monitoreados, validados ni interpretados por Leve. La aplicación no ofrece supervisión médica y no garantiza la adherencia al tratamiento.',
          'Todas las decisiones sobre medicamentos deben tomarse con un profesional de la salud habilitado. No modifiques tu régimen de medicación sin orientación médica.',
        ],
      },
      {
        heading: 'Diferencias individuales y tolerancia',
        paragraphs: [
          'Las respuestas individuales a la alimentación, la hidratación y los cambios de estilo de vida varían. El consumo excesivo de ciertos nutrientes (como fibra o agua) puede causar molestias o efectos adversos.',
          'Leve no garantiza resultados específicos y no se responsabiliza por decisiones tomadas con base en sus datos o estimaciones. Consulta a profesionales cualificados para recibir orientación individualizada.',
        ],
      },
      {
        heading: 'Aviso de emergencia',
        paragraphs: [
          'Leve no está destinado a situaciones de emergencia.',
          'Si presentas síntomas graves, persistentes o que empeoran, o crees estar sufriendo una emergencia médica, busca atención de inmediato. Llama a tu número local de emergencias (112 en España; SAMU 192 en Brasil).',
        ],
      },
    ],
  },
  termsOfUse: {
    title: 'Términos de uso',
    updated: 'Vigente a partir del 18 de julio de 2026',
    sections: [
      {
        heading: '1. Aceptación',
        paragraphs: [
          'Estos Términos de Uso regulan la utilización de la aplicación Leve ("Leve" o "aplicación"), puesta a disposición por Jorge Brito y Jorge Manoel Reis Brito ("nosotros"). Al usar Leve, declaras que has leído, entendido y aceptado estos términos, así como la Política de Privacidad y el Aviso Médico y Nutricional, que forman parte de ellos por referencia. Si no estás de acuerdo, no utilices la aplicación.',
        ],
      },
      {
        heading: '2. El servicio',
        paragraphs: [
          'Leve es un diario personal de bienestar dirigido a quienes siguen tratamientos con medicamentos GLP-1: registro de agua, comidas, peso, medidas, dosis, síntomas, ciclo, sueño, ejercicios y consultas, con gráficos, recordatorios e informes informativos.',
          'Leve funciona prioritariamente en tu dispositivo: tus registros se almacenan localmente. Las funciones opcionales (cuenta, copia de seguridad cifrada, análisis de foto mediante inteligencia artificial) usan servicios remotos según se describe en la Política de Privacidad.',
          'Leve registra y organiza información; no presta servicios médicos, nutricionales ni farmacéuticos.',
        ],
      },
      {
        heading: '3. Elegibilidad',
        paragraphs: [
          'Leve está destinado a mayores de 18 años. Los menores de 18 años solo pueden utilizarlo con el consentimiento y el acompañamiento de sus responsables legales y de profesionales de la salud.',
        ],
      },
      {
        heading: '4. Cuenta, claves de acceso y seguridad',
        paragraphs: [
          'El uso de Leve no exige una cuenta. Puedes, opcionalmente, conectar una cuenta (Apple o Google) para completar tus datos y habilitar las funciones de copia de seguridad.',
          'Las claves de desbloqueo de socios son personales e intransferibles, pueden ser revocadas en caso de uso indebido y no generan derecho a reembolso ni a indemnización.',
          'Eres responsable de mantener la seguridad de tu dispositivo y de tus credenciales.',
        ],
      },
      {
        heading: '5. Suscripción Leve Premium',
        paragraphs: [
          'Algunas funciones requieren la suscripción Leve Premium, contratada y cobrada exclusivamente a través de la App Store (Apple) o Google Play, a los precios mostrados en la tienda en el momento de la compra.',
          'La renovación, la cancelación y los eventuales reembolsos siguen las reglas y se realizan a través de los canales de la tienda correspondiente. La cancelación interrumpe la renovación y mantiene el acceso hasta el final del período ya pagado.',
          'Podemos modificar el conjunto de funciones incluidas en la suscripción, preservando el núcleo del servicio contratado durante el período vigente.',
        ],
      },
      {
        heading: '6. Uso aceptable',
        paragraphs: [
          'Aceptas no usar Leve con fines ilícitos; no intentar eludir los mecanismos de seguridad, licenciamiento o suscripción; no realizar ingeniería inversa fuera de los supuestos permitidos por la ley; y no sobrecargar ni interferir en los servicios remotos.',
        ],
      },
      {
        heading: '7. Contenido del usuario',
        paragraphs: [
          'Los datos que introduces en Leve son tuyos. Al usar funciones que dependen de procesamiento remoto (como el análisis de foto de comidas), nos autorizas a procesar ese contenido exclusivamente para prestar la función solicitada, conforme a la Política de Privacidad.',
        ],
      },
      {
        heading: '8. Exención de garantías',
        paragraphs: [
          'Leve se proporciona "tal cual", sin garantías de disponibilidad ininterrumpida, exactitud de las estimaciones o adecuación a fines específicos, en la máxima medida permitida por la ley.',
          'El Aviso Médico y Nutricional forma parte de estos términos: la información de la aplicación es educativa y no sustituye a los profesionales de la salud.',
        ],
      },
      {
        heading: '9. Limitación de responsabilidad',
        paragraphs: [
          'En la máxima medida permitida por la legislación aplicable, no respondemos por daños indirectos, lucro cesante ni decisiones de salud tomadas con base en la información de la aplicación. Nada en estos términos excluye o limita derechos que la legislación de protección del consumidor de tu país garantice de forma irrenunciable.',
        ],
      },
      {
        heading: '10. Propiedad intelectual',
        paragraphs: [
          'La aplicación, su marca, identidad visual, mascotas, código y contenido están protegidos por derechos de propiedad intelectual y pertenecen a los titulares de Leve. Estos términos no te transfieren ningún derecho de propiedad intelectual, solo una licencia de uso personal, limitada, revocable e intransferible.',
        ],
      },
      {
        heading: '11. Rescisión',
        paragraphs: [
          'Puedes dejar de usar Leve en cualquier momento y eliminar tus datos desde la propia aplicación. Podemos suspender el acceso a las funciones remotas en caso de violación de estos términos.',
        ],
      },
      {
        heading: '12. Modificaciones',
        paragraphs: [
          'Podemos actualizar estos términos para reflejar cambios en la aplicación o en la legislación. Los cambios relevantes se comunicarán en la aplicación; la fecha de vigencia en la parte superior indica la versión en vigor. El uso continuado después de la entrada en vigor representa aceptación.',
        ],
      },
      {
        heading: '13. Ley aplicable y jurisdicción',
        paragraphs: [
          'Estos términos se rigen por las leyes de la República Federativa de Brasil. Para las relaciones de consumo en Brasil, queda elegido el fuero del domicilio del usuario. Los usuarios de otros países conservan los derechos imperativos garantizados por la legislación local.',
        ],
      },
      {
        heading: '14. Contacto',
        paragraphs: ['Dudas sobre estos términos: jdobrito@gmail.com.'],
      },
    ],
  },
  privacyPolicy: {
    title: 'Política de privacidad',
    updated: 'Vigente a partir del 18 de julio de 2026',
    sections: [
      {
        heading: '1. Quiénes somos',
        paragraphs: [
          'Leve es puesto a disposición por Jorge Brito y Jorge Manoel Reis Brito, responsables del tratamiento de los datos personales tratados por la aplicación, en los términos de la Ley General de Protección de Datos de Brasil (Ley n.º 13.709/2018 — LGPD). Contacto del responsable y del encargado de protección de datos: jdobrito@gmail.com.',
        ],
      },
      {
        heading: '2. El principio de Leve: tus datos se quedan en tu dispositivo',
        paragraphs: [
          'Los registros que haces en Leve — agua, comidas, peso, medidas corporales, dosis, síntomas, ciclo menstrual, sueño, ejercicios, consultas y observaciones — se almacenan localmente, en tu dispositivo. Por defecto, nada de esto se envía a nuestros servidores.',
          'Los datos sensibles de salud se tratan sobre la base de tu consentimiento (art. 11, II, "a", de la LGPD), manifestado al usar cada función.',
        ],
      },
      {
        heading: '3. Integraciones de salud (opcionales)',
        paragraphs: [
          'Si lo autorizas, Leve lee datos de Apple Salud (iOS) o de Health Connect (Android) — como peso, composición corporal, pasos, sueño y pulsaciones — exclusivamente para mostrar tu progreso en la aplicación. El permiso lo controla el sistema operativo y puede revocarse en cualquier momento en los ajustes del dispositivo. Estos datos también se quedan solo en tu dispositivo.',
        ],
      },
      {
        heading: '4. Cuenta y datos recopilados (opcionales)',
        paragraphs: [
          'Al conectar una cuenta de Apple o Google, recibimos solo el identificador de la cuenta y, cuando lo autorizas, el nombre y el correo electrónico — usados para completar tu perfil e identificar tu copia de seguridad. No recibimos tu contraseña.',
          'Si creas una cuenta de copia de seguridad, tus registros se envían cifrados de extremo a extremo: la clave de cifrado se queda en tu dispositivo y no tenemos medios técnicos para leer el contenido de la copia de seguridad.',
        ],
      },
      {
        heading: '5. Análisis de foto de comidas (función premium)',
        paragraphs: [
          'Al usar el escaneo de comida, la foto que tomas se envía a nuestro servidor y se remite a un proveedor de inteligencia artificial, exclusivamente para identificar los alimentos y estimar las porciones. Nuestro servidor no almacena la foto ni la registra en logs; tras el análisis, solo el resultado (la lista de alimentos) vuelve a tu dispositivo.',
          'El envío de cada foto es una acción tuya y explícita. El proveedor de IA puede estar ubicado en el extranjero; adoptamos salvaguardias contractuales adecuadas para las transferencias internacionales (art. 33 de la LGPD).',
        ],
      },
      {
        heading: '6. Suscripciones y claves de socio',
        paragraphs: [
          'La suscripción Leve Premium la procesa la App Store o Google Play — no recibimos los datos de tu tarjeta. De la tienda recibimos solo la confirmación del estado de la suscripción.',
          'Las claves de socio se validan en nuestro servidor, que almacena solo un resumen criptográfico (hash) de la clave, el nombre del socio y el estado (activa/revocada).',
        ],
      },
      {
        heading: '7. Lo que no hacemos',
        paragraphs: [
          'No vendemos tus datos. No usamos tus datos de salud para publicidad. No incluimos rastreadores de anuncios en la aplicación.',
        ],
      },
      {
        heading: '8. Compartición con encargados del tratamiento',
        paragraphs: [
          'Para prestar las funciones opcionales, usamos encargados que tratan datos en nuestro nombre y bajo contrato: el alojamiento del servidor de Leve (cuenta, copia de seguridad cifrada, validación de claves) y el proveedor de IA (análisis de foto). Las tiendas de aplicaciones procesan las suscripciones de forma independiente, conforme a sus propias políticas.',
        ],
      },
      {
        heading: '9. Retención y eliminación',
        paragraphs: [
          'Los datos locales permanecen en tu dispositivo hasta que los elimines — el botón "Eliminar mis datos" borra todos los registros de la aplicación. Desinstalar la aplicación también elimina los datos locales.',
          'La copia de seguridad cifrada y los datos de la cuenta se conservan hasta que elimines la cuenta en la aplicación, lo que elimina la copia de seguridad de nuestros servidores.',
        ],
      },
      {
        heading: '10. Tus derechos (LGPD y leyes equivalentes)',
        paragraphs: [
          'Puedes ejercer, directamente desde la aplicación: acceso y portabilidad ("Exportar mis datos" genera un archivo completo en formato abierto), corrección (editando los registros) y eliminación ("Eliminar mis datos" y la eliminación de la cuenta).',
          'También puedes revocar consentimientos (desactivando integraciones y funciones) y solicitar información adicional por el correo jdobrito@gmail.com. Los titulares en Brasil pueden además presentar peticiones ante la Autoridad Nacional de Protección de Datos de Brasil (ANPD). Los usuarios de otras jurisdicciones (como la Unión Europea) tienen derechos equivalentes garantizados por las leyes locales, incluidos el acceso, la rectificación, la supresión y la portabilidad.',
        ],
      },
      {
        heading: '11. Seguridad',
        paragraphs: [
          'Adoptamos medidas técnicas proporcionales: almacenamiento local en el dispositivo, cifrado de extremo a extremo en la copia de seguridad, comunicación por canales seguros, claves de servicios mantenidas solo en el servidor y almacenamiento de las claves de socio únicamente como hash.',
        ],
      },
      {
        heading: '12. Niños y adolescentes',
        paragraphs: [
          'Leve no está destinado a menores de 18 años sin el consentimiento y el acompañamiento de sus responsables legales.',
        ],
      },
      {
        heading: '13. Modificaciones de esta política',
        paragraphs: [
          'Las actualizaciones relevantes se comunicarán en la aplicación. La fecha en la parte superior indica la versión vigente.',
        ],
      },
    ],
  },
};
