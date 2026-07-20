export interface LegalSection { heading?: string; paragraphs: string[] }
export interface LegalDoc { title: string; updated: string; sections: LegalSection[] }

export const medicalNotice: LegalDoc = {
  "title": "Aviso médico e nutricional",
  "updated": "Vigente a partir de 18 de julho de 2026",
  "sections": [
    {
      "heading": "O Leve não é um dispositivo médico e não fornece aconselhamento médico",
      "paragraphs": [
        "As informações apresentadas pelo Leve têm finalidade exclusivamente educacional e informativa e não se destinam a diagnosticar, tratar, curar ou prevenir qualquer doença.",
        "O Leve não substitui a consulta, o diagnóstico nem o tratamento realizados por profissionais de saúde habilitados.",
        "Procure sempre orientação do seu médico ou de outro profissional de saúde qualificado sobre qualquer condição de saúde, uso de medicamentos (incluindo medicamentos GLP-1) e mudanças na sua alimentação ou estilo de vida.",
        "As decisões sobre a sua saúde são de responsabilidade exclusiva do usuário."
      ]
    },
    {
      "heading": "Estimativas nutricionais e de algoritmos",
      "paragraphs": [
        "Dados nutricionais, metas de calorias, macronutrientes (carboidratos, proteínas, gorduras, fibras), metas de água, IMC, composição corporal e faixas de referência exibidos pelo Leve são estimativas baseadas em algoritmos, calculadas a partir de bases nutricionais públicas (como a Tabela Brasileira de Composição de Alimentos — TACO), fórmulas científicas publicadas (como Mifflin-St Jeor) e faixas de referência padrão de bioimpedância.",
        "Esses valores são aproximações e podem não refletir o conteúdo nutricional exato nem as necessidades metabólicas individuais. Os valores reais variam conforme o preparo dos alimentos, o tamanho das porções, a fisiologia individual e outros fatores.",
        "A análise de fotos de refeições, quando disponível, usa inteligência artificial e está sujeita a erros de identificação e de estimativa de porções — confira sempre os itens antes de salvar."
      ]
    },
    {
      "heading": "Aviso sobre medicamentos GLP-1",
      "paragraphs": [
        "O Leve pode ajudar o usuário a registrar informações relacionadas ao seu tratamento e hábitos, mas não fornece orientação sobre dose, ajuste, horário ou interrupção de medicamentos.",
        "Todos os registros de medicação são inseridos pelo próprio usuário e não são monitorados, validados ou interpretados pelo Leve. O aplicativo não oferece supervisão médica e não garante adesão ao tratamento.",
        "Todas as decisões sobre medicamentos devem ser tomadas com um profissional de saúde habilitado. Não altere o seu regime de medicação sem orientação médica."
      ]
    },
    {
      "heading": "Diferenças individuais e tolerância",
      "paragraphs": [
        "As respostas individuais à alimentação, hidratação e mudanças de estilo de vida variam. O consumo excessivo de certos nutrientes (como fibras ou água) pode causar desconforto ou efeitos adversos.",
        "O Leve não garante resultados específicos e não se responsabiliza por decisões tomadas com base em seus dados ou estimativas. Consulte profissionais qualificados para orientação individualizada."
      ]
    },
    {
      "heading": "Aviso de emergência",
      "paragraphs": [
        "O Leve não se destina a situações de emergência.",
        "Se você apresentar sintomas graves, persistentes ou em piora, ou acreditar estar passando por uma emergência médica, procure atendimento imediatamente. No Brasil, ligue para o SAMU (192)."
      ]
    }
  ]
};

export const termsOfUse: LegalDoc = {
  "title": "Termos de uso",
  "updated": "Vigente a partir de 18 de julho de 2026",
  "sections": [
    {
      "heading": "1. Aceitação",
      "paragraphs": [
        "Estes Termos de Uso regulam a utilização do aplicativo Leve (\"Leve\" ou \"aplicativo\"), disponibilizado por Jorge Brito e Jorge Manoel Reis Brito (\"nós\"). Ao usar o Leve, você declara que leu, entendeu e concorda com estes termos e com a Política de Privacidade e o Aviso Médico e Nutricional, que os integram por referência. Se não concordar, não utilize o aplicativo."
      ]
    },
    {
      "heading": "2. O serviço",
      "paragraphs": [
        "O Leve é um diário pessoal de bem-estar voltado a quem acompanha tratamentos com medicamentos GLP-1: registro de água, refeições, peso, medidas, doses, sintomas, ciclo, sono, exercícios e consultas, com gráficos, lembretes e relatórios informativos.",
        "O Leve funciona prioritariamente no seu aparelho: os seus registros ficam armazenados localmente. Recursos opcionais (conta, backup cifrado, análise de foto por inteligência artificial) usam serviços remotos conforme descrito na Política de Privacidade.",
        "O Leve registra e organiza informações; não presta serviços médicos, nutricionais ou farmacêuticos."
      ]
    },
    {
      "heading": "3. Elegibilidade",
      "paragraphs": [
        "O Leve destina-se a maiores de 18 anos. Menores de 18 anos somente podem utilizá-lo com consentimento e acompanhamento dos responsáveis legais e de profissionais de saúde."
      ]
    },
    {
      "heading": "4. Conta, chaves de acesso e segurança",
      "paragraphs": [
        "O uso do Leve não exige conta. Você pode, opcionalmente, conectar uma conta (Apple ou Google) para preencher seus dados e habilitar recursos de backup.",
        "Chaves de desbloqueio de parceiros são pessoais e intransferíveis, podem ser revogadas em caso de uso indevido e não geram direito a reembolso ou indenização.",
        "Você é responsável por manter a segurança do seu aparelho e das suas credenciais."
      ]
    },
    {
      "heading": "5. Assinatura Leve Premium",
      "paragraphs": [
        "Alguns recursos exigem a assinatura Leve Premium, contratada e cobrada exclusivamente pela App Store (Apple) ou Google Play, nos preços exibidos na loja no momento da compra.",
        "A renovação, o cancelamento e eventuais reembolsos seguem as regras e são realizados pelos canais da respectiva loja. O cancelamento interrompe a renovação, mantendo o acesso até o fim do período já pago.",
        "Podemos alterar o conjunto de recursos incluídos na assinatura, preservando o núcleo do serviço contratado durante o período vigente."
      ]
    },
    {
      "heading": "6. Uso aceitável",
      "paragraphs": [
        "Você concorda em não usar o Leve para fins ilícitos; não tentar burlar mecanismos de segurança, licenciamento ou assinatura; não realizar engenharia reversa fora das hipóteses legais; e não sobrecarregar ou interferir nos serviços remotos."
      ]
    },
    {
      "heading": "7. Conteúdo do usuário",
      "paragraphs": [
        "Os dados que você insere no Leve são seus. Ao usar recursos que dependem de processamento remoto (como a análise de foto de refeições), você nos autoriza a processar aquele conteúdo exclusivamente para prestar o recurso solicitado, conforme a Política de Privacidade."
      ]
    },
    {
      "heading": "8. Isenções de garantia",
      "paragraphs": [
        "O Leve é fornecido \"no estado em que se encontra\", sem garantias de disponibilidade ininterrupta, exatidão das estimativas ou adequação a finalidades específicas, na máxima extensão permitida pela lei.",
        "O Aviso Médico e Nutricional integra estes termos: as informações do aplicativo são educacionais e não substituem profissionais de saúde."
      ]
    },
    {
      "heading": "9. Limitação de responsabilidade",
      "paragraphs": [
        "Na máxima extensão permitida pela legislação aplicável, não respondemos por danos indiretos, lucros cessantes ou decisões de saúde tomadas com base nas informações do aplicativo. Nada nestes termos exclui ou limita direitos que a legislação de proteção do consumidor do seu país assegure de forma inafastável."
      ]
    },
    {
      "heading": "10. Propriedade intelectual",
      "paragraphs": [
        "O aplicativo, sua marca, identidade visual, mascotes, código e conteúdo são protegidos por direitos de propriedade intelectual e pertencem aos titulares do Leve. Estes termos não transferem qualquer direito de propriedade intelectual a você, apenas uma licença de uso pessoal, limitada, revogável e intransferível."
      ]
    },
    {
      "heading": "11. Rescisão",
      "paragraphs": [
        "Você pode parar de usar o Leve a qualquer momento e excluir seus dados pelo próprio aplicativo. Podemos suspender o acesso a recursos remotos em caso de violação destes termos."
      ]
    },
    {
      "heading": "12. Alterações",
      "paragraphs": [
        "Podemos atualizar estes termos para refletir mudanças no aplicativo ou na legislação. Alterações relevantes serão comunicadas no aplicativo; a data de vigência no topo indica a versão em vigor. O uso continuado após a vigência representa concordância."
      ]
    },
    {
      "heading": "13. Lei aplicável e foro",
      "paragraphs": [
        "Estes termos são regidos pelas leis da República Federativa do Brasil. Fica eleito o foro do domicílio do usuário para relações de consumo no Brasil. Usuários de outros países mantêm os direitos imperativos garantidos pela legislação local."
      ]
    },
    {
      "heading": "14. Contato",
      "paragraphs": [
        "Dúvidas sobre estes termos: jdobrito@gmail.com."
      ]
    }
  ]
};

export const privacyPolicy: LegalDoc = {
  "title": "Política de privacidade",
  "updated": "Vigente a partir de 18 de julho de 2026",
  "sections": [
    {
      "heading": "1. Quem somos",
      "paragraphs": [
        "O Leve é disponibilizado por Jorge Brito e Jorge Manoel Reis Brito, controladores dos dados pessoais tratados pelo aplicativo, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD). Contato do controlador e do encarregado: jdobrito@gmail.com."
      ]
    },
    {
      "heading": "2. O princípio do Leve: seus dados ficam no seu aparelho",
      "paragraphs": [
        "Os registros que você faz no Leve — água, refeições, peso, medidas corporais, doses, sintomas, ciclo menstrual, sono, exercícios, consultas e observações — são armazenados localmente, no seu aparelho. Por padrão, nada disso é enviado aos nossos servidores.",
        "Dados sensíveis de saúde são tratados com base no seu consentimento (art. 11, II, \"a\", da LGPD), manifestado ao usar cada recurso."
      ]
    },
    {
      "heading": "3. Integrações de saúde (opcionais)",
      "paragraphs": [
        "Se você autorizar, o Leve lê dados do Apple Saúde (iOS) ou do Health Connect (Android) — como peso, composição corporal, passos, sono e batimentos — exclusivamente para exibir seu progresso no aplicativo. A permissão é controlada pelo sistema operacional e pode ser revogada a qualquer momento nos ajustes do aparelho. Esses dados também ficam apenas no seu aparelho."
      ]
    },
    {
      "heading": "4. Conta e dados coletados (opcionais)",
      "paragraphs": [
        "Ao conectar uma conta Apple ou Google, recebemos apenas o identificador da conta e, quando você autoriza, nome e e-mail — usados para preencher seu perfil e identificar seu backup. Não recebemos sua senha.",
        "Se você criar uma conta de backup, seus registros são enviados cifrados de ponta a ponta: a chave de cifragem fica no seu aparelho e não temos meios técnicos de ler o conteúdo do backup."
      ]
    },
    {
      "heading": "5. Análise de foto de refeições (recurso premium)",
      "paragraphs": [
        "Ao usar o escaneamento de comida, a foto que você tirar é enviada ao nosso servidor e encaminhada a um provedor de inteligência artificial, exclusivamente para identificar os alimentos e estimar porções. A foto não é armazenada nem registrada em logs pelo nosso servidor; após a análise, apenas o resultado (lista de alimentos) retorna ao seu aparelho.",
        "O envio de cada foto é uma ação sua e explícita. O provedor de IA pode estar localizado no exterior; adotamos salvaguardas contratuais adequadas para transferências internacionais (art. 33 da LGPD)."
      ]
    },
    {
      "heading": "6. Assinaturas e chaves de parceiro",
      "paragraphs": [
        "A assinatura Leve Premium é processada pela App Store ou pelo Google Play — não recebemos dados do seu cartão. Recebemos da loja apenas a confirmação do estado da assinatura.",
        "Chaves de parceiro são validadas no nosso servidor, que armazena apenas um resumo criptográfico (hash) da chave, o nome do parceiro e o estado (ativa/revogada)."
      ]
    },
    {
      "heading": "7. O que não fazemos",
      "paragraphs": [
        "Não vendemos seus dados. Não usamos seus dados de saúde para publicidade. Não incluímos rastreadores de anúncios no aplicativo."
      ]
    },
    {
      "heading": "8. Compartilhamento com operadores",
      "paragraphs": [
        "Para prestar os recursos opcionais, usamos operadores que tratam dados em nosso nome e sob contrato: hospedagem do servidor do Leve (conta, backup cifrado, validação de chaves) e provedor de IA (análise de foto). As lojas de aplicativos processam as assinaturas de forma independente, conforme suas próprias políticas."
      ]
    },
    {
      "heading": "9. Retenção e exclusão",
      "paragraphs": [
        "Dados locais permanecem no seu aparelho até você os excluir — o botão \"Excluir meus dados\" apaga todos os registros do aplicativo. Desinstalar o aplicativo também remove os dados locais.",
        "O backup cifrado e os dados da conta são mantidos até você excluir a conta no aplicativo, o que remove o backup dos nossos servidores."
      ]
    },
    {
      "heading": "10. Seus direitos (LGPD e leis equivalentes)",
      "paragraphs": [
        "Você pode exercer, diretamente pelo aplicativo: acesso e portabilidade (\"Exportar meus dados\" gera um arquivo completo em formato aberto), correção (editando os registros) e eliminação (\"Excluir meus dados\" e exclusão da conta).",
        "Também pode revogar consentimentos (desativando integrações e recursos) e solicitar informações adicionais pelo e-mail jdobrito@gmail.com. Titulares no Brasil podem ainda peticionar à Autoridade Nacional de Proteção de Dados (ANPD). Usuários em outras jurisdições (como a União Europeia) têm direitos equivalentes garantidos pelas leis locais, incluindo acesso, retificação, apagamento e portabilidade."
      ]
    },
    {
      "heading": "11. Segurança",
      "paragraphs": [
        "Adotamos medidas técnicas proporcionais: armazenamento local no aparelho, cifragem de ponta a ponta no backup, comunicação por canais seguros, chaves de serviços mantidas apenas no servidor e armazenamento de chaves de parceiro apenas como hash."
      ]
    },
    {
      "heading": "12. Crianças e adolescentes",
      "paragraphs": [
        "O Leve não se destina a menores de 18 anos sem consentimento e acompanhamento dos responsáveis legais."
      ]
    },
    {
      "heading": "13. Alterações desta política",
      "paragraphs": [
        "Atualizações relevantes serão comunicadas no aplicativo. A data no topo indica a versão vigente."
      ]
    }
  ]
};
