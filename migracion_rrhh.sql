-- ============================================================
-- DANPA MADERAS - Recursos Humanos
-- Empleados, asistencias, licencias/vacaciones y liquidaciones
-- de sueldo. Idempotente.
--
-- Ejecutar en el SQL Editor del proyecto vduqsxnuflbspmbufpdi.
-- ============================================================

-- Empleados
CREATE TABLE IF NOT EXISTS public.empleados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  nombre text NOT NULL,
  telefono text,
  dni text,
  direccion text,
  puesto text,
  salario double precision NOT NULL DEFAULT 0,
  fecha_ingreso date,
  tipo_liquidacion text NOT NULL DEFAULT 'fijo' CHECK (tipo_liquidacion IN ('fijo', 'por_hora')),
  activo boolean NOT NULL DEFAULT true,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_empleados_corredor ON public.empleados (corredor_id);

-- Asistencias (registro diario)
CREATE TABLE IF NOT EXISTS public.asistencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  empleado_id uuid NOT NULL REFERENCES public.empleados (id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  hora_entrada time,
  hora_salida time,
  estado text NOT NULL DEFAULT 'presente' CHECK (estado IN ('presente', 'ausente', 'licencia', 'media_jornada')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asistencias_corredor ON public.asistencias (corredor_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_empleado ON public.asistencias (empleado_id, fecha);
CREATE UNIQUE INDEX IF NOT EXISTS idx_asistencias_unico ON public.asistencias (corredor_id, empleado_id, fecha);

-- Licencias / vacaciones
CREATE TABLE IF NOT EXISTS public.licencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  empleado_id uuid NOT NULL REFERENCES public.empleados (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('vacaciones', 'enfermedad', 'licencia', 'justificada', 'otro')),
  fecha_desde date NOT NULL,
  fecha_hasta date NOT NULL,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobada', 'rechazada')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_licencias_corredor ON public.licencias (corredor_id);
CREATE INDEX IF NOT EXISTS idx_licencias_empleado ON public.licencias (empleado_id);

-- Liquidaciones de sueldo
CREATE TABLE IF NOT EXISTS public.liquidaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  empleado_id uuid NOT NULL REFERENCES public.empleados (id) ON DELETE CASCADE,
  periodo text NOT NULL,
  monto double precision NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagado')),
  fecha_pago date,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_liquidaciones_corredor ON public.liquidaciones (corredor_id);
CREATE INDEX IF NOT EXISTS idx_liquidaciones_empleado ON public.liquidaciones (empleado_id, periodo);

-- RLS: solo el dueño (corredor) accede a sus datos
ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liquidaciones ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['empleados','asistencias','licencias','liquidaciones'] LOOP
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

GRANT ALL ON TABLE public.empleados TO authenticated, service_role;
GRANT ALL ON TABLE public.asistencias TO authenticated, service_role;
GRANT ALL ON TABLE public.licencias TO authenticated, service_role;
GRANT ALL ON TABLE public.liquidaciones TO authenticated, service_role;
