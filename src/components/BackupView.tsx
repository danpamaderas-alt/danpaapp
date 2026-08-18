import { useCallback, useRef, useState } from 'react';
import { crearBackup, restaurarBackup, nombreArchivoBackup, TABLAS_BACKUP, type ResultadoImport } from '../lib/backup';
import { getErrorMessage } from '../lib/format';
import {
  Download,
  Upload,
  Loader2,
  AlertCircle,
  ShieldCheck,
  FileJson,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface BackupViewProps {
  corredorId: string;
}

export default function BackupView({ corredorId }: BackupViewProps) {
  const [exportando, setExportando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoImport | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const exportar = useCallback(async () => {
    setExportando(true);
    setError(null);
    setExito(null);
    setResultado(null);
    try {
      const backup = await crearBackup(corredorId);
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivoBackup();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      const total = TABLAS_BACKUP.reduce((acc, t) => acc + ((backup[t] as unknown[] | undefined)?.length || 0), 0);
      setExito(`Backup generado correctamente (${total} registros).`);
    } catch (err) {
      setError(getErrorMessage(err, 'Error al generar el backup.'));
    } finally {
      setExportando(false);
    }
  }, [corredorId]);

  const manejarArchivo = useCallback(
    async (file: File) => {
      setImportando(true);
      setError(null);
      setExito(null);
      setResultado(null);
      try {
        const texto = await file.text();
        const parsed = JSON.parse(texto) as Record<string, unknown[]>;
        if (!parsed._meta) throw new Error('El archivo no parece un backup de Servicios Integrales.');
        if (!window.confirm('Esto actualizará los datos con el contenido del backup. ¿Continuar?')) return;
        const res = await restaurarBackup(corredorId, parsed);
        setResultado(res);
        setExito(`Importación finalizada: ${res.filas} registros actualizados.`);
      } catch (err) {
        setError(getErrorMessage(err, 'No se pudo importar el archivo.'));
      } finally {
        setImportando(false);
        if (inputRef.current) inputRef.current.value = '';
      }
    },
    [corredorId]
  );

  return (
    <div className="flex-1 p-4 sm:p-8 max-w-[1440px] mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[var(--text)] tracking-tight">Backup de Datos</h2>
        <p className="text-[var(--text2)] mt-1">Exportá e importá todos tus datos como archivo JSON.</p>
      </div>

      {error && (
        <div className="bg-[var(--danger-soft)] text-[var(--danger-deep)] p-4 rounded-xl flex items-start gap-4 mb-6">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      {exito && (
        <div className="bg-[var(--primary-soft)] text-[var(--primary-deep)] p-4 rounded-xl flex items-start gap-4 mb-6">
          <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">{exito}</p>
            {resultado && resultado.errores.length > 0 && (
              <ul className="mt-2 space-y-1 text-[var(--danger-deep)]">
                {resultado.errores.map((e, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          <div className="p-2 bg-[var(--primary-soft)] rounded-lg w-fit mb-4">
            <Download className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text)]">Exportar</h3>
          <p className="text-sm text-[var(--text2)] mt-1 mb-6">
            Descargá una copia en JSON con movimientos, podas, agenda, visitas, clientes, pedidos y productos.
          </p>
          <button
            onClick={exportar}
            disabled={exportando}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] text-white font-medium rounded-lg hover:bg-[var(--primary-deep)] transition-colors disabled:opacity-60"
          >
            {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileJson className="w-4 h-4" />}
            {exportando ? 'Generando...' : 'Exportar backup'}
          </button>
        </div>

        <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
          <div className="p-2 bg-[var(--amber-soft2)] rounded-lg w-fit mb-4">
            <Upload className="w-5 h-5 text-[var(--amber-text2)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text)]">Importar</h3>
          <p className="text-sm text-[var(--text2)] mt-1 mb-6">
            Restaurá desde un backup: se actualizan los registros existentes y se agregan los que falten.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) manejarArchivo(f);
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={importando}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--amber-text2)] text-white font-medium rounded-lg hover:opacity-90 transition-colors disabled:opacity-60"
          >
            {importando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importando ? 'Importando...' : 'Elegir archivo de backup'}
          </button>
        </div>
      </div>

      <div className="bg-[var(--primary-soft)]/50 border border-[var(--primary)]/30 rounded-xl p-5 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[var(--primary)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--text)]">
          Todo se guarda también en la base de Supabase. El backup es una copia extra en tu máquina: guardala en un
          lugar seguro (nube o pendrive) e importala solo si perdés datos.
        </p>
      </div>
    </div>
  );
}