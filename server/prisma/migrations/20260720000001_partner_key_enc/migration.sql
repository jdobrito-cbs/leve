-- Chave completa cifrada (AES-GCM, chave derivada do ADMIN_TOKEN) para o dono
-- poder rever o código no painel. Registros antigos ficam sem (null).

-- AlterTable
ALTER TABLE "PartnerKey" ADD COLUMN "keyEnc" TEXT;
