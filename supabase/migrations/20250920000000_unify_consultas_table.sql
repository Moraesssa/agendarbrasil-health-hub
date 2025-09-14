-- Ensure only canonical "consultas" table is used
-- Migrate data from legacy tables and remove them

DO $$
BEGIN
  -- Rename capitalized table if present
  IF to_regclass('public."Consultas"') IS NOT NULL THEN
    IF to_regclass('public.consultas') IS NULL THEN
      ALTER TABLE public."Consultas" RENAME TO consultas;
    ELSE
      INSERT INTO public.consultas
      SELECT * FROM public."Consultas"
      ON CONFLICT (id) DO NOTHING;
      DROP TABLE public."Consultas";
    END IF;
  END IF;

  -- Migrate data from english-named table
  IF to_regclass('public.consultations') IS NOT NULL THEN
    INSERT INTO public.consultas
    SELECT * FROM public.consultations
    ON CONFLICT (id) DO NOTHING;
    ALTER TABLE public.consultations RENAME TO consultations_legacy;
  END IF;
END $$;
