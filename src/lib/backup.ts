import { supabase } from './supabase';
import { getErrorMessage } from './format';

const TABLAS_POR_CORREDOR = [
  'movimientos',
  'movimientos_opciones',
  'podas',
  'agenda',
  'visitas',
  'cliente_notas',
  'clientes',
  'pedidos',
  'pedido_items',
];

const TABLAS_GLOBALES = ['productos'];

type Backup = Record<string, unknown>;

export function nombreArchivoBackup(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `danpa_backup_${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.json`;
}

async function leerSubset(tabla: string, corredorId?: string): Promise<unknown[]> {
  const cliente = supabase as any;
  let q = cliente.from(tabla).select('*');
  if (corredorId) q = q.eq('corredor_id', corredorId);
  const { data, error } = await q;
  if (error) throw new Error(getErrorMessage(error, `Error al leer ${tabla}.`));
  return (data as unknown[]) || [];
}

async function escribirTabla(tabla: string, filas: unknown[]): Promise<void> {
  const cliente = supabase as any;
  const { error } =
    tabla === 'movimientos_opciones'
      ? await cliente.from(tabla).upsert(filas, { onConflict: 'corredor_id,tipo,valor' })
      : await cliente.from(tabla).upsert(filas, { onConflict: 'id' });
  if (error) throw new Error(getErrorMessage(error));
}

export async function crearBackup(corredorId: string): Promise<Backup> {
  const backup: Backup = {};

  for (const tabla of TABLAS_POR_CORREDOR) {
    backup[tabla] = await leerSubset(tabla, corredorId);
  }
  for (const tabla of TABLAS_GLOBALES) {
    backup[tabla] = await leerSubset(tabla);
  }

  backup._meta = {
    version: 1,
    fecha: new Date().toISOString(),
    corredor_id: corredorId,
    app: 'danpa-maderas',
  };

  return backup;
}

export type ResultadoImport = { filas: number; errores: string[] };

export async function restaurarBackup(corredorId: string, contenido: Backup): Promise<ResultadoImport> {
  const errores: string[] = [];
  let filas = 0;

  for (const tabla of TABLAS_POR_CORREDOR) {
    const filasTabla = (contenido[tabla] as Array<Record<string, unknown>>) || [];
    if (filasTabla.length === 0) continue;

    const normalizadas = filasTabla.map((f) => ({ ...f, corredor_id: corredorId }));
    try {
      await escribirTabla(tabla, normalizadas);
      filas += normalizadas.length;
    } catch (e) {
      errores.push(`${tabla}: ${getErrorMessage(e)}`);
    }
  }

  const productos = (contenido['productos'] as Array<Record<string, unknown>>) || [];
  if (productos.length > 0) {
    try {
      await escribirTabla('productos', productos);
      filas += productos.length;
    } catch (e) {
      errores.push(`productos: ${getErrorMessage(e)}`);
    }
  }

  return { filas, errores };
}

export const TABLAS_BACKUP = TABLAS_POR_CORREDOR.concat(TABLAS_GLOBALES);