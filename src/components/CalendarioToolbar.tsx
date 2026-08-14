import { ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar, Grid3x3, List } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type VistaCalendario = 'dia' | 'semana' | 'mes' | 'anio' | 'agenda';

const VISTAS: { id: VistaCalendario; label: string; Icon: LucideIcon }[] = [
  { id: 'dia', label: 'Día', Icon: CalendarDays },
  { id: 'semana', label: 'Semana', Icon: CalendarRange },
  { id: 'mes', label: 'Mes', Icon: Calendar },
  { id: 'anio', label: 'Año', Icon: Grid3x3 },
  { id: 'agenda', label: 'Agenda', Icon: List },
];

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const inicioSemana = (d: Date) => {
  const x = new Date(d);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};

interface CalendarioToolbarProps {
  fecha: Date;
  vista: VistaCalendario;
  onCambiar: (d: Date) => void;
  onCambiarVista?: (v: VistaCalendario) => void;
}

export default function CalendarioToolbar({ fecha, vista, onCambiar, onCambiarVista }: CalendarioToolbarProps) {
  const etiqueta = (() => {
    switch (vista) {
      case 'dia':
        return capitalizar(
          fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        );
      case 'semana': {
        const lunes = inicioSemana(fecha);
        const domingo = new Date(lunes);
        domingo.setDate(domingo.getDate() + 6);
        const ms = (d: Date) => d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
        const md = (d: Date) => d.toLocaleDateString('es-AR', { month: 'short' });
        if (ms(lunes) === ms(domingo)) return `${lunes.getDate()} – ${domingo.getDate()} de ${ms(lunes)}`;
        return `${lunes.getDate()} ${md(lunes)} – ${domingo.getDate()} ${md(domingo)} ${domingo.getFullYear()}`;
      }
      case 'mes':
        return capitalizar(fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }));
      case 'anio':
        return String(fecha.getFullYear());
      default:
        return 'Agenda';
    }
  })();

  const cambiar = (dir: 1 | -1) => {
    const d = new Date(fecha);
    if (vista === 'mes') d.setMonth(d.getMonth() + dir);
    else if (vista === 'anio') d.setFullYear(d.getFullYear() + dir);
    else if (vista === 'dia') d.setDate(d.getDate() + dir);
    else if (vista === 'semana') d.setDate(d.getDate() + 7 * dir);
    else d.setDate(d.getDate() + 30 * dir);
    onCambiar(d);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      {onCambiarVista && (
        <div className="flex bg-[var(--field)] border border-[var(--border)] rounded-lg p-1 overflow-x-auto">
          {VISTAS.map((v) => (
            <button
              key={v.id}
              onClick={() => onCambiarVista(v.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                vista === v.id ? 'bg-[var(--primary)] text-white' : 'text-[var(--text2)] hover:text-[var(--text)]'
              }`}
            >
              <v.Icon className="w-4 h-4" />
              {v.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => cambiar(-1)}
          className="p-2 text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] rounded-lg transition-colors"
          title="Anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => onCambiar(new Date())}
          className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text)] hover:bg-[var(--blue-header)] transition-colors"
        >
          Hoy
        </button>
        <button
          onClick={() => cambiar(1)}
          className="p-2 text-[var(--text2)] hover:text-[var(--text)] hover:bg-[var(--blue-header)] rounded-lg transition-colors"
          title="Siguiente"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <span className="text-sm sm:text-base font-semibold text-[var(--text)]">{etiqueta}</span>
    </div>
  );
}