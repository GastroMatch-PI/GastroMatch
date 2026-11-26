-- =====================================================================
-- GastroMatch - v2.2.0: autoridade (role) do usuário no Spring Security
-- Para bancos JÁ criados com a v2.0.0/v2.1.0 (ex.: o Supabase do time).
-- Quem cria o banco do zero com a v2.0.0 atual já tem esta coluna.
-- Pode ser executado mais de uma vez: não apaga nada e não duplica nada.
-- =====================================================================

ALTER TABLE usuario ADD COLUMN IF NOT EXISTS role VARCHAR(10) NOT NULL DEFAULT 'USER';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_usuario_role') THEN
    ALTER TABLE usuario ADD CONSTRAINT chk_usuario_role CHECK (role IN ('USER','ADMIN'));
  END IF;
END;
$$;
