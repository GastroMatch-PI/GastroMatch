-- =====================================================================
-- GastroMatch - v2.1.0: posição do restaurante no mapa
-- Para bancos JÁ criados com a v2.0.0 (ex.: o Supabase do time).
-- Quem cria o banco do zero com a v2.0.0 atual já tem estas colunas.
-- Pode ser executado mais de uma vez: não apaga nada e não duplica nada.
-- =====================================================================

ALTER TABLE restaurante ADD COLUMN IF NOT EXISTS latitude  DOUBLE PRECISION NULL;
ALTER TABLE restaurante ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_restaurante_latitude') THEN
    ALTER TABLE restaurante ADD CONSTRAINT chk_restaurante_latitude  CHECK (latitude  BETWEEN -90  AND 90);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_restaurante_longitude') THEN
    ALTER TABLE restaurante ADD CONSTRAINT chk_restaurante_longitude CHECK (longitude BETWEEN -180 AND 180);
  END IF;
  -- As duas coordenadas juntas ou nenhuma.
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_restaurante_posicao') THEN
    ALTER TABLE restaurante ADD CONSTRAINT chk_restaurante_posicao CHECK ((latitude IS NULL) = (longitude IS NULL));
  END IF;
END;
$$;
