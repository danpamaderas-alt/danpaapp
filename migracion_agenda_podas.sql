-- ============================================================
-- DANPA MADERAS - Agenda (contrataciones y pliegos) + Podas
-- Idempotente. Ejecutar en el SQL Editor del proyecto vduqsxnuflbspmbufpdi.
-- ============================================================

-- Agenda: contrataciones y pliegos agendados
CREATE TABLE IF NOT EXISTS public.agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('contratacion', 'pliego')),
  titulo text NOT NULL,
  organismo text,
  monto double precision NOT NULL DEFAULT 0,
  fecha date,
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'presentado', 'adjudicado', 'perdido', 'vencido')),
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agenda_corredor ON public.agenda (corredor_id);
CREATE INDEX IF NOT EXISTS idx_agenda_fecha ON public.agenda (fecha);

-- Podas: cantidad de arboles, trabajo realizado y fecha
CREATE TABLE IF NOT EXISTS public.podas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corredor_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  cantidad_arboles integer NOT NULL DEFAULT 0,
  detalle text NOT NULL,
  lugar text,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_podas_corredor ON public.podas (corredor_id);
CREATE INDEX IF NOT EXISTS idx_podas_fecha ON public.podas (fecha);