-- ============================================================
-- DANPA MADERAS - Subcontratados / Contratistas
-- Personal subcontratado para tareas específicas (poda, fletes,
-- servicios, etc.). No pasan por asistencias ni liquidaciones.
-- Idempotente.
--
-- Ejecutar en el SQL Editor del proyecto vduqsxnuflbspmbufpdi.
-- ============================================================

-- Contratistas (persona o empresa subcontratada)
CREATE TABLE IF NOT EXISTS public.contratistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono text,
  dni text,
  especialidad text,
  tarifa double precision NOT NULL DEFAULT 0,
  tipo_tarifa text NOT NULL DEFAULT 'por_trabajo' CHECK (tipo_tarifa IN ('por_trabajo', 'por_hora', 'por_dia')),
  activo boolean NOT NULL DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratistas_corredor ON public.contratistas (corredor_id);

-- Trabajos realizados por un contratista (tarea específica con costo)
CREATE TABLE IF NOT EXISTS public.contratista_trabajos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  contratista_id uuid NOT NULL REFERENCES public.contratistas (id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  lugar text,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  costo double precision NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
  fecha_pago date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contratista_trabajos_corredor ON public.contratista_trabajos (corredor_id);
CREATE INDEX IF NOT EXISTS idx_contratista_trabajos_contratista ON public.contratista_trabajos (contratista_id, fecha);

-- RLS: solo el dueño (corredor) accede a sus datos
ALTER TABLE public.contratistas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contratista_trabajos ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['contratistas','contratista_trabajos'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "own_select_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "own_insert_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "own_update_%s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "own_delete_%s" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "own_select_%s" ON public.%I FOR SELECT TO authenticated USING (corredor_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "own_insert_%s" ON public.%I FOR INSERT TO authenticated WITH CHECK (corredor_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "own_update_%s" ON public.%I FOR UPDATE TO authenticated USING (corredor_id = auth.uid()) WITH CHECK (corredor_id = auth.uid())', t, t);
    EXECUTE format('CREATE POLICY "own_delete_%s" ON public.%I FOR DELETE TO authenticated USING (corredor_id = auth.uid())', t, t);
  END LOOP;
END $$;

GRANT ALL ON TABLE public.contratistas TO authenticated, service_role;
GRANT ALL ON TABLE public.contratista_trabajos TO authenticated, service_role;
