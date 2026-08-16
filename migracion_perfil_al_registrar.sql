-- ============================================================
-- DANPA MADERAS - Perfiles de usuario (regístrate y no te bloquea)
--
-- 1) Crea el trigger que arma la fila en "usuarios" automáticamente
--    cada vez que se registra una cuenta (idempotente).
--    IMPORTANTE (Fase 1): el trigger NO confía en
--    raw_user_meta_data->>'perfil' (campo editable por el usuario,
--    permitía auto-registrarse como admin). Siempre crea 'corredor'.
--    El perfil real lo asigna admin_crear_usuario() en
--    migracion_seguridad_fase1.sql (SECURITY DEFINER con whitelist).
-- 2) Backfill: crea las filas de "usuarios" que faltan para las
--    cuentas ya existentes en auth.users (siempre 'corredor').
-- 3) Deja todos los perfiles activos (solo si necesitás reactivar).
--
-- Ejecutalo completo en el SQL Editor del proyecto
-- vduqsxnuflbspmbufpdi. Se puede re-ejecutar sin daño.
-- ============================================================

-- 1) Trigger de creación automática de perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, perfil, activo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(COALESCE(NEW.email, ''), '@', 1)),
    'corredor',
    true
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Backfill: perfiles faltantes para cuentas ya existentes
INSERT INTO public.usuarios (id, email, nombre, perfil, activo)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'nombre', split_part(COALESCE(u.email, ''), '@', 1)),
  'corredor',
  true
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.usuarios p WHERE p.id = u.id
);

-- 3) (Opcional) Reactivar todos los perfiles que estén desactivados
-- UPDATE public.usuarios SET activo = true WHERE activo = false;