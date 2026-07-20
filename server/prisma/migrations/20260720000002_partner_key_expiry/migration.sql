-- Validade opcional das chaves de parceiro (null = sem validade).
-- Vencida → a validação recusa e o app volta ao plano gratuito na reverificação.

-- AlterTable
ALTER TABLE "PartnerKey" ADD COLUMN "expiresAt" TIMESTAMP(3);
