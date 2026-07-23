import type { LegalCatalog } from '../legalCatalog';

export const legal: LegalCatalog = {
  translationNote:
    'Tradução de cortesia. Em caso de divergência, prevalece a versão em português (Brasil).',
  medicalNotice: {
    title: 'Aviso médico e nutricional',
    updated: 'Em vigor a partir de 18 de julho de 2026',
    sections: [
      {
        heading: 'O Leve não é um dispositivo médico e não fornece aconselhamento médico',
        paragraphs: [
          'As informações apresentadas pelo Leve têm finalidade exclusivamente educativa e informativa e não se destinam a diagnosticar, tratar, curar ou prevenir qualquer doença.',
          'O Leve não substitui a consulta, o diagnóstico nem o tratamento realizados por profissionais de saúde habilitados.',
          'Procure sempre a orientação do seu médico ou de outro profissional de saúde qualificado sobre qualquer condição de saúde, utilização de medicamentos (incluindo medicamentos GLP-1) e alterações na sua alimentação ou estilo de vida.',
          'As decisões sobre a sua saúde são da exclusiva responsabilidade do utilizador.',
        ],
      },
      {
        heading: 'Estimativas nutricionais e de algoritmos',
        paragraphs: [
          'Os dados nutricionais, objetivos de calorias, macronutrientes (hidratos de carbono, proteínas, gorduras, fibras), objetivos de água, IMC, composição corporal e intervalos de referência apresentados pelo Leve são estimativas baseadas em algoritmos, calculadas a partir de bases nutricionais públicas (como a Tabela Brasileira de Composição de Alimentos — TACO), fórmulas científicas publicadas (como Mifflin-St Jeor) e intervalos de referência padrão de bioimpedância.',
          'Estes valores são aproximações e podem não refletir o conteúdo nutricional exato nem as necessidades metabólicas individuais. Os valores reais variam consoante a preparação dos alimentos, o tamanho das porções, a fisiologia individual e outros fatores.',
          'A análise de fotografias de refeições, quando disponível, usa inteligência artificial e está sujeita a erros de identificação e de estimativa de porções — verifique sempre os itens antes de guardar.',
        ],
      },
      {
        heading: 'Aviso sobre medicamentos GLP-1',
        paragraphs: [
          'O Leve pode ajudar o utilizador a registar informações relacionadas com o seu tratamento e hábitos, mas não fornece orientação sobre dose, ajuste, horário ou interrupção de medicamentos.',
          'Todos os registos de medicação são introduzidos pelo próprio utilizador e não são monitorizados, validados ou interpretados pelo Leve. A aplicação não oferece supervisão médica e não garante a adesão ao tratamento.',
          'Todas as decisões sobre medicamentos devem ser tomadas com um profissional de saúde habilitado. Não altere o seu regime de medicação sem orientação médica.',
        ],
      },
      {
        heading: 'Diferenças individuais e tolerância',
        paragraphs: [
          'As respostas individuais à alimentação, à hidratação e às mudanças de estilo de vida variam. O consumo excessivo de certos nutrientes (como fibras ou água) pode causar desconforto ou efeitos adversos.',
          'O Leve não garante resultados específicos e não se responsabiliza por decisões tomadas com base nos seus dados ou estimativas. Consulte profissionais qualificados para orientação individualizada.',
        ],
      },
      {
        heading: 'Aviso de emergência',
        paragraphs: [
          'O Leve não se destina a situações de emergência.',
          'Se apresentar sintomas graves, persistentes ou em agravamento, ou acreditar que está a passar por uma emergência médica, procure assistência de imediato. Ligue para o número de emergência local (112 em Portugal; SAMU 192 no Brasil).',
        ],
      },
    ],
  },
  termsOfUse: {
    title: 'Termos de utilização',
    updated: 'Em vigor a partir de 18 de julho de 2026',
    sections: [
      {
        heading: '1. Aceitação',
        paragraphs: [
          'Estes Termos de Utilização regulam a utilização da aplicação Leve (“Leve” ou “aplicação”), disponibilizada por Jorge Brito, Jorge Manoel Brito e Alairton Silva (“nós”). Ao usar o Leve, declara que leu, entendeu e concorda com estes termos e com a Política de Privacidade e o Aviso Médico e Nutricional, que os integram por referência. Se não concordar, não utilize a aplicação.',
        ],
      },
      {
        heading: '2. O serviço',
        paragraphs: [
          'O Leve é um diário pessoal de bem-estar dirigido a quem acompanha tratamentos com medicamentos GLP-1: registo de água, refeições, peso, medidas, doses, sintomas, ciclo, sono, exercícios e consultas, com gráficos, lembretes e relatórios informativos.',
          'O Leve funciona prioritariamente no seu dispositivo: os seus registos ficam armazenados localmente. As funcionalidades opcionais (início de sessão com Apple ou Google e análise de fotografia por inteligência artificial) usam serviços remotos conforme descrito na Política de Privacidade.',
          'O Leve regista e organiza informações; não presta serviços médicos, nutricionais ou farmacêuticos.',
        ],
      },
      {
        heading: '3. Elegibilidade',
        paragraphs: [
          'O Leve destina-se a maiores de 18 anos. Os menores de 18 anos só podem utilizá-lo com o consentimento e o acompanhamento dos responsáveis legais e de profissionais de saúde.',
        ],
      },
      {
        heading: '4. Conta, chaves de acesso e segurança',
        paragraphs: [
          'A utilização do Leve não exige conta. Pode, opcionalmente, ligar uma conta (Apple ou Google) apenas para preencher o seu nome e e-mail no perfil.',
          'As chaves de desbloqueio de parceiros são pessoais e intransmissíveis, podem ser revogadas em caso de utilização indevida e não conferem direito a reembolso ou indemnização.',
          'É responsável por manter a segurança do seu dispositivo e das suas credenciais.',
        ],
      },
      {
        heading: '5. Subscrição Leve Premium',
        paragraphs: [
          'Algumas funcionalidades exigem a subscrição Leve Premium, contratada e cobrada exclusivamente através da App Store (Apple) ou do Google Play, pelos preços apresentados na loja no momento da compra.',
          'A renovação, o cancelamento e eventuais reembolsos seguem as regras e são realizados pelos canais da respetiva loja. O cancelamento interrompe a renovação, mantendo o acesso até ao fim do período já pago.',
          'Podemos alterar o conjunto de funcionalidades incluídas na subscrição, preservando o núcleo do serviço contratado durante o período em vigor.',
        ],
      },
      {
        heading: '6. Utilização aceitável',
        paragraphs: [
          'Concorda em não usar o Leve para fins ilícitos; não tentar contornar mecanismos de segurança, licenciamento ou subscrição; não realizar engenharia inversa fora das hipóteses legalmente previstas; e não sobrecarregar ou interferir com os serviços remotos.',
        ],
      },
      {
        heading: '7. Conteúdo do utilizador',
        paragraphs: [
          'Os dados que introduz no Leve são seus. Ao usar funcionalidades que dependem de processamento remoto (como a análise de fotografia de refeições), autoriza-nos a processar esse conteúdo exclusivamente para prestar a funcionalidade solicitada, conforme a Política de Privacidade.',
        ],
      },
      {
        heading: '8. Isenções de garantia',
        paragraphs: [
          'O Leve é fornecido “tal como está”, sem garantias de disponibilidade ininterrupta, exatidão das estimativas ou adequação a finalidades específicas, na máxima extensão permitida pela lei.',
          'O Aviso Médico e Nutricional integra estes termos: as informações da aplicação são educativas e não substituem profissionais de saúde.',
        ],
      },
      {
        heading: '9. Limitação de responsabilidade',
        paragraphs: [
          'Na máxima extensão permitida pela legislação aplicável, não respondemos por danos indiretos, lucros cessantes ou decisões de saúde tomadas com base nas informações da aplicação. Nada nestes termos exclui ou limita direitos que a legislação de defesa do consumidor do seu país assegure de forma imperativa.',
        ],
      },
      {
        heading: '10. Propriedade intelectual',
        paragraphs: [
          'A aplicação, a sua marca, identidade visual, mascotes, código e conteúdo estão protegidos por direitos de propriedade intelectual e pertencem aos titulares do Leve. Estes termos não lhe transferem qualquer direito de propriedade intelectual, apenas uma licença de utilização pessoal, limitada, revogável e intransmissível.',
        ],
      },
      {
        heading: '11. Rescisão',
        paragraphs: [
          'Pode deixar de usar o Leve a qualquer momento e eliminar os seus dados na própria aplicação. Podemos suspender o acesso às funcionalidades remotas em caso de violação destes termos.',
        ],
      },
      {
        heading: '12. Alterações',
        paragraphs: [
          'Podemos atualizar estes termos para refletir mudanças na aplicação ou na legislação. As alterações relevantes serão comunicadas na aplicação; a data de vigência no topo indica a versão em vigor. A utilização continuada após a entrada em vigor representa concordância.',
        ],
      },
      {
        heading: '13. Lei aplicável e foro',
        paragraphs: [
          'Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do utilizador para as relações de consumo no Brasil. Os utilizadores de outros países mantêm os direitos imperativos garantidos pela legislação local.',
        ],
      },
      {
        heading: '14. Contacto',
        paragraphs: ['Dúvidas sobre estes termos: jdobrito@gmail.com.'],
      },
    ],
  },
  privacyPolicy: {
    title: 'Política de privacidade',
    updated: 'Em vigor a partir de 18 de julho de 2026',
    sections: [
      {
        heading: '1. Quem somos',
        paragraphs: [
          'O Leve é disponibilizado por Jorge Brito, Jorge Manoel Brito e Alairton Silva, responsáveis pelo tratamento dos dados pessoais tratados pela aplicação, nos termos da Lei Geral de Proteção de Dados brasileira (Lei n.º 13.709/2018 — LGPD). Contacto do responsável pelo tratamento e do encarregado da proteção de dados: jdobrito@gmail.com.',
        ],
      },
      {
        heading: '2. O princípio do Leve: os seus dados ficam no seu dispositivo',
        paragraphs: [
          'Os registos que faz no Leve — água, refeições, peso, medidas corporais, doses, sintomas, ciclo menstrual, sono, exercícios, consultas e observações — são armazenados localmente, no seu dispositivo. Por predefinição, nada disto é enviado para os nossos servidores.',
          'Os dados sensíveis de saúde são tratados com base no seu consentimento (art. 11, II, “a”, da LGPD), manifestado ao usar cada funcionalidade.',
        ],
      },
      {
        heading: '3. Integrações de saúde (opcionais)',
        paragraphs: [
          'Se autorizar, o Leve lê dados da aplicação Saúde da Apple (iOS) ou do Health Connect (Android) — como peso, composição corporal, passos, sono e batimentos cardíacos — exclusivamente para apresentar o seu progresso na aplicação. A permissão é controlada pelo sistema operativo e pode ser revogada a qualquer momento nas definições do dispositivo. Estes dados também ficam apenas no seu dispositivo.',
        ],
      },
      {
        heading: '4. Conta e dados recolhidos (opcionais)',
        paragraphs: [
          'Ao ligar uma conta Apple ou Google, recebemos apenas o identificador da conta e, quando autoriza, o nome e o e-mail, usados para preencher o seu perfil. Não recebemos a sua palavra-passe.',
        ],
      },
      {
        heading: '5. Análise de fotografia de refeições (funcionalidade premium)',
        paragraphs: [
          'Ao usar a digitalização de comida, a fotografia que tirar é enviada para o nosso servidor e encaminhada para um fornecedor de inteligência artificial, exclusivamente para identificar os alimentos e estimar as porções. A fotografia não é armazenada nem registada em logs pelo nosso servidor; após a análise, apenas o resultado (lista de alimentos) regressa ao seu dispositivo.',
          'O envio de cada fotografia é uma ação sua e explícita. O fornecedor de IA pode estar localizado no estrangeiro; adotamos salvaguardas contratuais adequadas para as transferências internacionais (art. 33 da LGPD).',
        ],
      },
      {
        heading: '6. Subscrições e chaves de parceiro',
        paragraphs: [
          'A subscrição Leve Premium é processada pela App Store ou pelo Google Play — não recebemos os dados do seu cartão. Recebemos da loja apenas a confirmação do estado da subscrição.',
          'As chaves de parceiro são validadas no nosso servidor, que armazena apenas um resumo criptográfico (hash) da chave, o nome do parceiro e o estado (ativa/revogada).',
        ],
      },
      {
        heading: '7. O que não fazemos',
        paragraphs: [
          'Não vendemos os seus dados. Não usamos os seus dados de saúde para publicidade. Não incluímos rastreadores de anúncios na aplicação.',
        ],
      },
      {
        heading: '8. Partilha com operadores',
        paragraphs: [
          'Para prestar as funcionalidades opcionais, usamos operadores (subcontratantes) que tratam dados em nosso nome e sob contrato: alojamento do servidor do Leve (validação de chaves de parceiro) e fornecedor de IA (análise de fotografia). As lojas de aplicações processam as subscrições de forma independente, de acordo com as suas próprias políticas.',
        ],
      },
      {
        heading: '9. Conservação e eliminação',
        paragraphs: [
          'Os dados locais permanecem no seu dispositivo até os eliminar — o botão “Eliminar os meus dados” apaga todos os registos da aplicação. Desinstalar a aplicação também remove os dados locais.',
          'Não guardamos os seus registos nos nossos servidores: a aplicação não nos envia esses dados.',
        ],
      },
      {
        heading: '10. Os seus direitos (LGPD e leis equivalentes)',
        paragraphs: [
          'Pode exercer, diretamente na aplicação: acesso e portabilidade (“Exportar os meus dados” gera um ficheiro completo em formato aberto), retificação (editando os registos) e eliminação (“Eliminar os meus dados” e eliminação da conta).',
          'Também pode revogar consentimentos (desativando integrações e funcionalidades) e pedir informações adicionais através do e-mail jdobrito@gmail.com. Os titulares no Brasil podem ainda apresentar petições à Autoridade Nacional de Proteção de Dados brasileira (ANPD). Os utilizadores noutras jurisdições (como a União Europeia) têm direitos equivalentes garantidos pelas leis locais, incluindo acesso, retificação, apagamento e portabilidade.',
        ],
      },
      {
        heading: '11. Segurança',
        paragraphs: [
          'Adotamos medidas técnicas proporcionais: armazenamento local no dispositivo, comunicação por canais seguros, chaves de serviços mantidas apenas no servidor e armazenamento das chaves de parceiro apenas como hash.',
        ],
      },
      {
        heading: '12. Crianças e adolescentes',
        paragraphs: [
          'O Leve não se destina a menores de 18 anos sem o consentimento e o acompanhamento dos responsáveis legais.',
        ],
      },
      {
        heading: '13. Alterações desta política',
        paragraphs: [
          'As atualizações relevantes serão comunicadas na aplicação. A data no topo indica a versão em vigor.',
        ],
      },
    ],
  },
};
