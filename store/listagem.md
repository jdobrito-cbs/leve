# Leve — textos para as lojas (prontos para colar)

Enquadramento obrigatório em TODO texto: o Leve **registra e organiza**, não trata nem
aconselha dose. Sem promessa de emagrecimento. Nomes de medicamentos só na forma genérica
(semaglutida, tirzepatida) — nunca marcas (Ozempic, Wegovy, Mounjaro).

---

## App Store (Apple)

**Nome** (máx. 30 caracteres) — 21:
```
Leve: diário de saúde
```

**Subtítulo** (máx. 30 caracteres) — 29:
```
Peso, água, refeições e doses
```

**Texto promocional** (máx. 170 caracteres) — editável depois sem nova revisão:
```
Organize sua rotina de tratamento GLP-1 num lugar só: água, refeições com a tabela TACO, peso, doses e saúde do relógio — com tudo guardado no seu aparelho.
```

**Palavras-chave** (máx. 100 caracteres, separadas por vírgula, sem espaços) — 99:
```
glp-1,semaglutida,tirzepatida,peso,calorias,taco,agua,medicacao,diario,saude,hidratacao,sono
```

**Categoria:** Saúde e fitness (primária) · Estilo de vida (secundária)

---

## Google Play (depois)

**Descrição curta** (máx. 80 caracteres) — 72:
```
Diário para tratamento GLP-1: peso, refeições, água, doses e saúde.
```

---

## Descrição longa (App Store e Play — máx. 4000)

```
O Leve é o diário de saúde de quem faz tratamento com GLP-1 (semaglutida, tirzepatida e afins) — feito para o Brasil e disponível em 12 idiomas.

REGISTRE SEM ESFORÇO
• Água com meta ajustada ao seu peso, botões rápidos e lembretes nos horários que você escolher
• Refeições pela tabela brasileira TACO e por bases oficiais (IBGE) — calorias e macros de centenas de alimentos e bebidas locais — ou identificando o prato por uma foto
• Doses de medicação com rodízio do local de aplicação (pontos do abdômen, coxas e braços) e próxima dose calculada
• Peso, sintomas, ciclo menstrual, academia e remédios do dia a dia

ACOMPANHE DE VERDADE
• Conecte ao Apple Saúde ou ao Health Connect e receba sono, frequência cardíaca, passos e a composição corporal da sua balança (gordura, massa muscular, água corporal e mais)
• Box "Dados corporais" e relatório em PDF com faixas de referência
• Lembretes inteligentes: hora de dormir e "bom dia com um copo d'água" a partir do seu sono, e um aviso para levantar quando você fica muito tempo parado
• Observações que dão contexto — informativas, nunca um diagnóstico

SEUS DADOS SÃO SEUS
• Funciona offline; nada sai do aparelho sem você pedir
• Backup opcional criptografado de ponta a ponta — nem nosso servidor consegue ler
• Exporte ou apague tudo quando quiser (LGPD)
• Escolha entre sistema métrico e imperial, e entre 12 idiomas

O Leve registra e organiza. Ele NÃO substitui orientação médica: decisões sobre dose, ajuste e tratamento são sempre do seu médico. Valores nutricionais e de composição corporal são estimativas informativas.

Leve Premium (assinatura opcional) desbloqueia a análise de foto, a saúde conectada, o controle de medicamentos, a academia, o ciclo e o relatório corporal. A assinatura renova automaticamente; gerencie ou cancele nas configurações da sua conta na loja.
```

---

## Assinaturas (metadados no App Store Connect)

Grupo: **Leve Premium**

| Produto | Product ID | Duração | Nome de exibição (PT-BR) | Descrição |
|---|---|---|---|---|
| Mensal | `leve.premium.monthly` | 1 mês | Leve Premium (mensal) | Acesso completo ao Leve, renovado todo mês. |
| Anual | `leve.premium.annual` | 1 ano | Leve Premium (anual) | Acesso completo ao Leve por 12 meses, com o melhor preço. |

---

## Notas para o Revisor (App Review Information → Notes)

```
O Leve é um diário pessoal para quem faz tratamento com medicamentos GLP-1 sob acompanhamento médico. O app REGISTRA e ORGANIZA informações (água, refeições, peso, doses, sintomas, dados de saúde); NÃO fornece diagnóstico, não recomenda nem calcula dose e não faz promessa de emagrecimento. Avisos nesse sentido aparecem no onboarding e nas telas de medicação.

HealthKit: usado apenas com permissão explícita e SOMENTE LEITURA, para exibir sono, frequência cardíaca, passos e composição corporal no progresso do usuário. Nenhum dado de saúde é usado para publicidade nem compartilhado.

Recursos Premium: para testar sem compra, use a chave de parceiro abaixo em Perfil → Assinatura → "Tenho uma chave":
CHAVE: [gerar em www.levemobile.com.br/painel e colar aqui antes de enviar]

Compras: assinaturas auto-renováveis (mensal/anual) via App Store; a restauração de compra está disponível na tela de assinatura.

Exclusão de conta: Perfil → Conta e privacidade → Excluir meus dados.
```

---

## App Privacy (respostas do formulário) — resumo

- **Dados de saúde e condicionamento físico:** coletados; ficam no aparelho; backup E2E. Uso: funcionalidade do app. **Não** ligados à identidade para rastreio, **não** usados para anúncios.
- **Identificadores/Contato (e-mail, nome):** só se o usuário criar conta/login; uso: funcionalidade do app. Sem rastreamento.
- **Rastreamento (tracking):** **Não**. O app não rastreia nem usa dados para publicidade de terceiros.
- **Dados vinculados ao usuário:** somente o mínimo da conta opcional; o backup é opaco (cifrado no aparelho).
