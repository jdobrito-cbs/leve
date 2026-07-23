-- Remove o backup e as contas de e-mail/senha: os dados do usuario passam a ser
-- apenas locais no aparelho. Ordem respeita as chaves estrangeiras.
DROP TABLE IF EXISTS "Backup";
DROP TABLE IF EXISTS "Consent";
DROP TABLE IF EXISTS "RefreshToken";
DROP TABLE IF EXISTS "User";
